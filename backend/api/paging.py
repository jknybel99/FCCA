from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body, Form
from fastapi import WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from database import SessionLocal
import crud, models
import asyncio
from auth.utils import verify_token
import subprocess
import threading
import time
import os
import tempfile
import json
import math
from datetime import datetime, timedelta
from typing import List, Optional

router = APIRouter(tags=["paging"])

# FastAPI DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Global state for paging system
paging_state = {
    "is_recording": False,
    "is_live_streaming": False,
    "current_process": None,
    "active_connections": set(),
    "recording_file": None,
    "raw_recording_file": None,
    "audio_level": 0,
    "audio_monitor_process": None
}

# Global variable for live streaming process
live_stream_process = None

def test_audio_format(device_id: str, format_spec: dict) -> bool:
    """Test if device supports specific audio format"""
    try:
        if device_id.startswith('alsa_'):
            # Convert alsa_X_Y format to hw:X,Y
            parts = device_id.split('_')
            if len(parts) >= 3:
                device_spec = f"hw:{parts[1]},{parts[2]}"
            else:
                device_spec = device_id
        else:
            device_spec = device_id
        
        cmd = [
            'arecord', '-D', device_spec,
            '-f', format_spec['format'],
            '-r', str(format_spec['rate']),
            '-c', str(format_spec['channels']),
            '-d', '0.1',  # Test for 0.1 seconds
            '/dev/null'
        ]
        
        result = subprocess.run(cmd, capture_output=True, timeout=3)
        return result.returncode == 0
    except Exception as e:
        print(f"Format test failed for {device_id}: {e}")
        return False

def get_device_capabilities(device_id: str) -> dict:
    """Probe device for supported formats, sample rates, and channels"""
    capabilities = {
        "sample_rates": [],
        "bit_depths": [],
        "channels": [],
        "formats": []
    }
    
    # Test common sample rates
    test_rates = [8000, 11025, 16000, 22050, 44100, 48000, 96000, 192000]
    # Test common formats
    test_formats = ["S16_LE", "S24_LE", "S32_LE"]
    # Test channel configurations
    test_channels = [1, 2]
    
    for rate in test_rates:
        for fmt in test_formats:
            for channels in test_channels:
                format_spec = {
                    "rate": rate,
                    "format": fmt,
                    "channels": channels
                }
                if test_audio_format(device_id, format_spec):
                    if rate not in capabilities["sample_rates"]:
                        capabilities["sample_rates"].append(rate)
                    if fmt not in capabilities["formats"]:
                        capabilities["formats"].append(fmt)
                    if channels not in capabilities["channels"]:
                        capabilities["channels"].append(channels)
                    # Map format to bit depth
                    if fmt == "S16_LE" and 16 not in capabilities["bit_depths"]:
                        capabilities["bit_depths"].append(16)
                    elif fmt == "S24_LE" and 24 not in capabilities["bit_depths"]:
                        capabilities["bit_depths"].append(24)
                    elif fmt == "S32_LE" and 32 not in capabilities["bit_depths"]:
                        capabilities["bit_depths"].append(32)
    
    # Sort for consistent output
    capabilities["sample_rates"].sort()
    capabilities["bit_depths"].sort()
    capabilities["channels"].sort()
    
    return capabilities

@router.websocket("/ptt-stream")
async def websocket_push_to_talk_stream(websocket: WebSocket):
    """WebSocket endpoint to accept client-side mic audio (WebM/Opus) and play on server output.

    Expected client to send binary WebM/Opus chunks (e.g., MediaRecorder with mimeType 'audio/webm;codecs=opus').
    JWT token must be provided as a 'token' query parameter.
    """
    # Authenticate
    token = websocket.query_params.get("token")
    if not token or verify_token(token) is None:
        # Cannot accept first; close with policy violation
        await websocket.close(code=4401)
        return

    # Accept connection
    await websocket.accept()

    # Determine server output device from settings
    db = SessionLocal()
    try:
        from api.audio import get_audio_settings_from_db
        audio_settings = get_audio_settings_from_db(db)
    except Exception:
        audio_settings = {}
    finally:
        db.close()

    output_device = audio_settings.get('output', 'default') or 'default'

    # Build playback pipeline depending on OS
    import platform
    system_name = platform.system()
    if system_name == 'Windows':
        # Use ffplay on Windows to play to default output device
        # Read from stdin using '-' and let ffplay decode webm/opus
        ffmpeg_cmd = [
            'ffplay',
            '-nodisp',
            '-autoexit',
            '-loglevel', 'error',
            '-i', '-',
        ]
    else:
        # Linux: route to PulseAudio/ALSA as before
        ffmpeg_cmd = [
            'ffmpeg',
            '-fflags', 'nobuffer',
            '-flags', 'low_delay',
            '-use_wallclock_as_timestamps', '1',
            '-f', 'webm',
            '-i', 'pipe:0',
        ]
        # Route to PulseAudio default or specified sink
        # For ALSA devices specified as 'alsa_card_*', map to hw:card,device
        pa_output = 'default'
        alsa_output = None
        if isinstance(output_device, str) and output_device.startswith('alsa_card_'):
            parts = output_device.split('_')
            if len(parts) >= 5:
                # format: alsa_card_<card>_device_<dev>
                card = parts[2]
                dev = parts[4]
                alsa_output = f"hw:{card},{dev}"
        # Assemble output section
        if alsa_output:
            ffmpeg_cmd += ['-f', 'alsa', '-ac', '1', '-ar', '48000', alsa_output, '-y']
        else:
            ffmpeg_cmd += ['-f', 'pulse', '-ac', '1', '-ar', '48000', pa_output, '-y']

    process = None
    try:
        process = subprocess.Popen(
            ffmpeg_cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        # Update state
        paging_state["is_live_streaming"] = True
        paging_state["current_process"] = process

        # Optionally start audio level monitoring (best-effort)
        try:
            start_audio_level_monitoring('default')
        except Exception:
            pass

        # Receive binary frames and write to ffmpeg stdin
        while True:
            try:
                message = await websocket.receive()
                if 'bytes' in message and message['bytes'] is not None:
                    chunk = message['bytes']
                elif 'text' in message and message['text'] is not None:
                    # Ignore text keepalives
                    continue
                else:
                    continue

                if process and process.stdin:
                    try:
                        process.stdin.write(chunk)
                        process.stdin.flush()
                    except BrokenPipeError:
                        break
            except WebSocketDisconnect:
                break
            except Exception:
                break

    finally:
        # Cleanup
        try:
            stop_audio_level_monitoring()
        except Exception:
            pass
        paging_state["is_live_streaming"] = False
        if process:
            try:
                if process.stdin:
                    try:
                        process.stdin.close()
                    except Exception:
                        pass
                process.terminate()
                process.wait(timeout=2)
            except Exception:
                try:
                    process.kill()
                except Exception:
                    pass

@router.get("/input-devices")
def get_audio_input_devices():
    """Get list of available audio input devices with enhanced detection"""
    devices = []
    
    # Try PulseAudio first (more user-friendly names)
    try:
        result = subprocess.run(['pactl', 'list', 'sources'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            current_source = {}
            for line in result.stdout.split('\n'):
                line = line.strip()
                if line.startswith('Source #'):
                    if current_source and current_source.get('name') and '.monitor' not in current_source.get('name', ''):
                        devices.append({
                            'id': current_source['name'],
                            'name': current_source.get('description', current_source['name']),
                            'type': 'pulseaudio'
                        })
                    current_source = {}
                elif line.startswith('Name: '):
                    current_source['name'] = line.split('Name: ', 1)[1]
                elif line.startswith('Description: '):
                    current_source['description'] = line.split('Description: ', 1)[1]
            
            # Don't forget the last source
            if current_source and current_source.get('name') and '.monitor' not in current_source.get('name', ''):
                devices.append({
                    'id': current_source['name'],
                    'name': current_source.get('description', current_source['name']),
                    'type': 'pulseaudio'
                })
    except Exception as e:
        print(f"PulseAudio input detection failed: {e}")
    
    # Fallback to ALSA if PulseAudio fails or no devices found
    if not devices:
        try:
            result = subprocess.run(['arecord', '-l'], capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                for line in result.stdout.split('\n'):
                    if 'card' in line and 'device' in line:
                        # Parse ALSA card/device info more carefully
                        import re
                        match = re.search(r'card (\d+):.*?\[([^\]]+)\].*?device (\d+):.*?\[([^\]]+)\]', line)
                        if match:
                            card_num = match.group(1)
                            card_name = match.group(2)
                            device_num = match.group(3)
                            device_name = match.group(4)
                            
                            devices.append({
                                'id': f"hw:{card_num},{device_num}",
                                'name': f"{card_name} - {device_name}",
                                'type': 'alsa',
                                'card': card_num,
                                'device': device_num
                            })
        except Exception as e:
            print(f"ALSA input detection failed: {e}")
    
    # Add default device if no devices found
    if not devices:
        devices.append({
            'id': 'default',
            'name': 'Default Input Device',
            'type': 'default'
        })
    
    return devices

@router.get("/input-devices/{device_id}/capabilities")
def get_input_device_capabilities(device_id: str):
    """Get capabilities for a specific input device"""
    try:
        capabilities = get_device_capabilities(device_id)
        
        # Add recommended settings based on capabilities
        recommended = {}
        if capabilities["sample_rates"]:
            # Prefer 48kHz for professional audio, fallback to 44.1kHz
            if 48000 in capabilities["sample_rates"]:
                recommended["sample_rate"] = 48000
            elif 44100 in capabilities["sample_rates"]:
                recommended["sample_rate"] = 44100
            else:
                recommended["sample_rate"] = max(capabilities["sample_rates"])
        
        if capabilities["bit_depths"]:
            # Prefer 24-bit for quality, fallback to 16-bit
            if 24 in capabilities["bit_depths"]:
                recommended["bit_depth"] = 24
            else:
                recommended["bit_depth"] = max(capabilities["bit_depths"])
        
        if capabilities["channels"]:
            # Prefer mono for paging to reduce bandwidth
            recommended["channels"] = 1 if 1 in capabilities["channels"] else min(capabilities["channels"])
        
        return {
            "device_id": device_id,
            "capabilities": capabilities,
            "recommended": recommended,
            "status": "available" if capabilities["sample_rates"] else "unavailable"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting device capabilities: {str(e)}")

@router.get("/announcements")
def get_announcement_history(db: Session = Depends(get_db), limit: int = 20):
    """Get list of previously recorded announcements"""
    try:
        # Get announcements from database (stored as Sound records with type 'announcement')
        announcements = db.query(models.Sound).filter(
            models.Sound.type == 'announcement'
        ).order_by(models.Sound.created_at.desc()).limit(limit).all()
        
        result = []
        for announcement in announcements:
            # Guard against missing/invalid file paths
            file_path = getattr(announcement, 'file_path', None)
            if isinstance(file_path, str) and file_path and os.path.exists(file_path):
                try:
                    file_size = os.path.getsize(file_path)
                except Exception:
                    file_size = None
                result.append({
                    'id': announcement.id,
                    'name': announcement.name,
                    'description': announcement.description or '',
                    'created_at': announcement.created_at.isoformat() if announcement.created_at else datetime.now().isoformat(),
                    'file_path': file_path,
                    'duration': announcement.duration,
                    'file_size': file_size,
                    'tags': announcement.tags
                })
        
        return {
            'announcements': result,
            'total_count': len(result)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting announcements: {str(e)}")

@router.post("/announcements/{announcement_id}/play")
def play_announcement(announcement_id: int, db: Session = Depends(get_db)):
    """Play a specific announcement (any Sound ID) with pre-announcement bell."""
    try:
        # Relaxed: allow any sound ID (not only type == 'announcement')
        announcement = db.query(models.Sound).filter(models.Sound.id == announcement_id).first()
        
        if not announcement:
            raise HTTPException(status_code=404, detail="Announcement not found")
        
        if not announcement.file_path or not os.path.exists(announcement.file_path):
            raise HTTPException(status_code=404, detail="Announcement file not found")
        
        # Get pre-announcement sound duration for proper timing
        pre_sound_duration = get_pre_announcement_duration(db)
        
        # Play pre-announcement sound first
        print(f"Playing pre-announcement sound, duration: {pre_sound_duration}")
        play_pre_announcement_sound(db)
        
        # Wait for pre-announcement to finish (with small buffer)
        if pre_sound_duration > 0:
            wait_time = pre_sound_duration + 0.3
            print(f"Waiting {wait_time} seconds for pre-announcement to finish")
            time.sleep(wait_time)
        else:
            print("No pre-announcement duration found, using default delay")
            time.sleep(0.8)  # Longer default delay
        
        # Play the announcement using direct audio playback (avoid stop_all_audio conflict)
        print(f"Now playing announcement: {announcement.file_path}")
        result = play_recorded_announcement(announcement.file_path)
        
        return {
            "message": f"Playing announcement: {announcement.name}",
            "announcement_id": announcement_id,
            "pre_sound_duration": pre_sound_duration,
            "playback_result": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error playing announcement: {str(e)}")

def validate_device_settings(device_settings: dict) -> bool:
    """Validate that device supports the requested settings"""
    try:
        device_id = device_settings.get('device_id', 'default')
        print(f"Validating device settings for {device_id}: {device_settings}")
        
        # For now, be lenient with validation
        # Just check if we have the required fields
        required_fields = ['device_id', 'sample_rate', 'bit_depth', 'channels']
        for field in required_fields:
            if field not in device_settings:
                print(f"Missing required field: {field}")
                return False
                
        # Try to get capabilities, but don't fail if we can't
        try:
            capabilities = get_device_capabilities(device_id)
            print(f"Device capabilities: {capabilities}")
            
            # Check if requested settings are supported
            requested_rate = device_settings.get('sample_rate', 44100)
            requested_channels = device_settings.get('channels', 1)
            requested_bit_depth = device_settings.get('bit_depth', 16)
            
            sample_rates = capabilities.get('sample_rates', [requested_rate])
            channels = capabilities.get('channels', [requested_channels])
            bit_depths = capabilities.get('bit_depths', [requested_bit_depth])
            
            if requested_rate not in sample_rates:
                print(f"Warning: Sample rate {requested_rate} not in supported rates {sample_rates}")
            if requested_channels not in channels:
                print(f"Warning: Channels {requested_channels} not in supported channels {channels}")
            if requested_bit_depth not in bit_depths:
                print(f"Warning: Bit depth {requested_bit_depth} not in supported bit depths {bit_depths}")
                
        except Exception as e:
            print(f"Warning: Could not validate device capabilities: {e}")
        
        return True
    except Exception as e:
        print(f"Validation error: {e}")
        return False

def test_device_availability(device_id: str) -> bool:
    """Test if device is currently available for recording"""
    try:
        print(f"Testing device availability for {device_id}")
        
        # Skip testing for default device to avoid false negatives
        if device_id == 'default':
            print("Using default device, skipping availability test")
            return True
            
        # Quick test with minimal recording
        format_spec = {"rate": 44100, "format": "S16_LE", "channels": 1}
        is_available = test_audio_format(device_id, format_spec)
        print(f"Device {device_id} available: {is_available}")
        return is_available
    except Exception as e:
        print(f"Device availability test failed for {device_id}: {e}")
        # Be lenient - assume device is available if test fails
        return True

class RecordingRequest(BaseModel):
    device_settings: Optional[dict] = None
    duration: Optional[int] = None
    play_bell: bool = False

@router.post("/start-recording")
def start_recording(
    request: RecordingRequest = Body(...),
    db: Session = Depends(get_db)
):
    """Start recording from specified input device with validated settings"""
    try:
        # Clean up any stale processes
        if paging_state.get("is_recording", False):
            current_process = paging_state.get("current_process")
            if current_process and current_process.poll() is not None:
                # Process has already finished
                paging_state["is_recording"] = False
                paging_state["current_process"] = None
                paging_state["recording_file"] = None
            else:
                raise HTTPException(status_code=400, detail="Paging system already active")
        
        device_settings = request.device_settings or {}
        duration = request.duration
        play_bell = request.play_bell
        
        # Set default values if not provided
        device_settings.setdefault("device_id", "default")
        device_settings.setdefault("sample_rate", 44100)
        device_settings.setdefault("bit_depth", 16)
        device_settings.setdefault("channels", 1)
        
        # Validate device settings
        try:
            validate_device_settings(device_settings)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        # Test device availability
        if not test_device_availability(device_settings["device_id"]):
            raise HTTPException(status_code=400, detail=f"Device {device_settings['device_id']} is not available")
        
        # Play pre-announcement sound first if requested
        if play_bell:
            play_pre_announcement_sound(db)
        
        # Create temporary file for recording
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        recording_file = f"static/recordings/page_{timestamp}.wav"
        os.makedirs("static/recordings", exist_ok=True)
        
        # Ensure recordings directory exists
        os.makedirs(os.path.dirname(recording_file), exist_ok=True)

        # Use ffmpeg to record audio directly to WAV
        input_device = device_settings["device_id"]

        # Choose input format based on device_id
        # If ALSA-style device like 'hw:0,0' is provided, use ALSA. Otherwise default to PulseAudio.
        if isinstance(input_device, str) and input_device.startswith('hw:'):
            input_format = 'alsa'
            input_spec = input_device
        else:
            input_format = 'pulse'
            input_spec = input_device

        print(f"Recording input format: {input_format}, device: {input_spec}")

        ffmpeg_cmd = [
            'ffmpeg',
            '-f', input_format,
            '-i', input_spec,
            '-t', str(duration) if duration else '3600', # Max 1 hour recording
            '-acodec', 'pcm_s16le', # WAV format
            '-ar', str(device_settings["sample_rate"]),
            '-ac', str(device_settings["channels"]),
            recording_file,
            '-y'
        ]

        print(f"Starting recording with command: {' '.join(ffmpeg_cmd)}")

        try:
            process = subprocess.Popen(ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to start recording: {str(e)}")
        
        # Verify process started successfully
        time.sleep(0.5)  # Give it a moment to fail
        if process.poll() is not None:
            _, stderr = process.communicate()
            error_msg = stderr.decode('utf-8').strip()
            raise HTTPException(status_code=500, detail=f"Recording process failed to start: {error_msg}")
        
        # Start audio level monitoring for the input device
        print(f"Starting audio level monitoring for recording device: {input_device}")
        start_audio_level_monitoring(input_device)
        
        # Update state
        paging_state["is_recording"] = True
        paging_state["current_process"] = process
        paging_state["recording_file"] = recording_file
        paging_state["recording_start_time"] = time.time()
        
        return {
            "message": "Recording started",
            "recording_file": recording_file,
            "duration": duration,
            "settings": {
                "device_id": device_settings["device_id"],
                "sample_rate": device_settings["sample_rate"],
                "bit_depth": device_settings["bit_depth"],
                "channels": device_settings["channels"]
            }
        }
        
    except Exception as e:
        # Clean up if anything goes wrong
        if 'process' in locals() and process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=2)
            except:
                process.kill()
        
        # Re-raise the exception
        if not isinstance(e, HTTPException):
            raise HTTPException(status_code=500, detail=f"Error starting recording: {str(e)}")
        raise

class StopRecordingRequest(BaseModel):
    name: Optional[str] = None

@router.post("/stop-recording")
def stop_recording(
    request: StopRecordingRequest = Body(None),
    db: Session = Depends(get_db)
):
    """Stop current recording and save to database"""
    if not paging_state["is_recording"]:
        raise HTTPException(status_code=400, detail="No active recording")
    
    print("Stopping recording...")
    name = request.name if request and hasattr(request, 'name') else None
    recording_file = paging_state.get("recording_file")
    process = paging_state.get("current_process")
    
    try:
        # Kill the recording process
        if process:
            print(f"Terminating process {process.pid}")
            try:
                process.terminate()
                process.wait(timeout=3)
            except subprocess.TimeoutExpired:
                print("Process didn't terminate, killing...")
                process.kill()
                process.wait()
            except Exception as e:
                print(f"Error stopping process: {e}")
        
        # Stop audio level monitoring
        stop_audio_level_monitoring()
        
        try:
            subprocess.run(['pkill', '-f', 'ffmpeg.*pulse'], 
                         stdout=subprocess.DEVNULL, 
                         stderr=subprocess.DEVNULL)
        except Exception as e:
            print(f"Error killing audio processes: {e}")

        # Update state
        paging_state["is_recording"] = False
        paging_state["is_live_streaming"] = False  # Also stop live streaming
        paging_state["current_process"] = None
        
        # Save to database as announcement
        if recording_file and os.path.exists(recording_file):
            # Get file duration
            duration = get_audio_duration(recording_file)
            
            # Create sound record with current timestamp
            current_time = datetime.now()
            announcement_name = name or f"Announcement {current_time.strftime('%Y-%m-%d %H:%M')}"
            announcement = models.Sound(
                name=announcement_name,
                description="Recorded announcement",
                file_path=recording_file,
                duration=duration,
                type="announcement",
                tags="paging,announcement,recorded",
                created_at=current_time,
                updated_at=current_time
            )
            db.add(announcement)
            db.commit()
            db.refresh(announcement)
            
            return {
                "message": "Recording stopped and saved",
                "recording_file": recording_file,
                "announcement_id": announcement.id,
                "name": announcement.name
            }
        
        return {"message": "Recording stopped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error stopping recording: {str(e)}")

@router.post("/start-live-stream")
def start_live_stream(input_device: str = "default", db: Session = Depends(get_db)):
    """Start live audio streaming from input to output"""
    if paging_state["is_recording"] or paging_state["is_live_streaming"]:
        raise HTTPException(status_code=400, detail="Paging system already active")
    
    # Play pre-announcement sound first
    play_pre_announcement_sound(db)
    
    # Get audio output device from settings
    from api.audio import get_audio_settings_from_db
    audio_settings = get_audio_settings_from_db(db)
    output_device = audio_settings.get('output', 'default')
    
    # Build live streaming command using ffmpeg
    if input_device.startswith('alsa_'):
        input_spec = f"hw:{input_device.split('_')[1]},{input_device.split('_')[2]}"
    else:
        input_spec = input_device
    
    if output_device.startswith('alsa_card_'):
        parts = output_device.split('_')
        if len(parts) >= 4:
            card = parts[2]
            device = parts[4]
            output_spec = f"hw:{card},{device}"
        else:
            output_spec = "default"
    else:
        output_spec = "default"
    
    cmd = [
        'ffmpeg', '-f', 'alsa', '-i', input_spec,
        '-f', 'alsa', '-ac', '2', '-ar', '44100',
        output_spec, '-y'
    ]
    
    try:
        process = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        paging_state["is_live_streaming"] = True
        paging_state["current_process"] = process
        
        return {"message": "Live streaming started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting live stream: {str(e)}")

@router.post("/stop-live-stream")
async def stop_live_stream():
    """Stop live audio streaming"""
    global live_stream_process
    
    if live_stream_process is None:
        # Still do cleanup even if no tracked process
        try:
            subprocess.run(["pkill", "-9", "-f", "ffmpeg.*pulse.*pulse"], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            subprocess.run(["pkill", "-9", "-f", "aplay"], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            subprocess.run(["pkill", "-9", "-f", "arecord"], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except:
            pass
        return {"message": "No live stream was active, but cleanup performed"}
    
    try:
        live_stream_process.terminate()
        live_stream_process.wait(timeout=3)
    except subprocess.TimeoutExpired:
        live_stream_process.kill()
        live_stream_process.wait(timeout=2)
    except Exception as e:
        print(f"Error stopping live stream: {e}")
    finally:
        live_stream_process = None
    
    # Additional cleanup
    try:
        subprocess.run(["pkill", "-9", "-f", "ffmpeg.*pulse.*pulse"], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run(["pkill", "-9", "-f", "aplay"], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run(["pkill", "-9", "-f", "arecord"], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except:
        pass
    
    return {"message": "Live stream stopped successfully"}

# Upload a browser-recorded announcement
@router.post("/upload-recording")
async def upload_recording(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Accept a recording uploaded from the browser and save it as an announcement.

    Expects an audio file (e.g., webm/opus or wav). We'll store to static/recordings,
    convert to wav if needed, compute duration, and register in DB as an announcement.
    """
    try:
        # Prepare paths
        os.makedirs("static/recordings", exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        original_ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".webm"
        temp_path = os.path.join("static/recordings", f"upload_{timestamp}{original_ext}")
        final_wav_path = os.path.join("static/recordings", f"page_{timestamp}.wav")

        # Save uploaded file to temp path
        with open(temp_path, "wb") as out:
            contents = await file.read()
            out.write(contents)

        # If already wav, move; else convert to wav using ffmpeg
        try:
            if original_ext == ".wav":
                os.replace(temp_path, final_wav_path)
            else:
                cmd = [
                    'ffmpeg', '-y',
                    '-i', temp_path,
                    '-acodec', 'pcm_s16le',
                    '-ar', '44100',
                    '-ac', '1',
                    final_wav_path
                ]
                proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                if proc.returncode != 0 or not os.path.exists(final_wav_path):
                    stderr = (proc.stderr or '').strip()
                    raise HTTPException(status_code=500, detail=f"Failed to transcode recording: {stderr}")
                # Cleanup temp
                try:
                    os.remove(temp_path)
                except Exception:
                    pass
        except Exception as e:
            # Best effort cleanup
            try:
                os.remove(temp_path)
            except Exception:
                pass
            raise HTTPException(status_code=500, detail=f"Error processing recording: {str(e)}")

        # Compute duration
        duration = get_audio_duration(final_wav_path)

        # Insert into DB as announcement
        now = datetime.now()
        announcement = models.Sound(
            name=name or f"Announcement {now.strftime('%Y-%m-%d %H:%M')}",
            description="Recorded announcement (browser upload)",
            file_path=final_wav_path,
            duration=duration,
            type="announcement",
            tags="paging,announcement,upload",
            created_at=now,
            updated_at=now
        )
        db.add(announcement)
        db.commit()
        db.refresh(announcement)

        return {
            "message": "Recording uploaded and saved",
            "announcement_id": announcement.id,
            "file_path": final_wav_path,
            "duration": duration
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading recording: {str(e)}")

@router.post("/push-to-talk-start")
def push_to_talk_start(db: Session = Depends(get_db)):
    """Start push-to-talk session (plays bell sound)"""
    try:
        # Play pre-announcement sound using the dedicated function
        play_pre_announcement_sound(db)
        
        return {
            "message": "Push-to-talk session started", 
            "bell_played": True,
            "bell_duration": 2.0
        }
    except Exception as e:
        print(f"Error starting push-to-talk: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start push-to-talk: {str(e)}")

class DeviceSettings(BaseModel):
    device_id: str = "default"
    sample_rate: int = 48000
    bit_depth: int = 16
    channels: int = 1

@router.post("/push-to-talk-stream")
def push_to_talk_stream(device_settings: DeviceSettings = Body(...), db: Session = Depends(get_db)):
    """Start push-to-talk audio streaming with device settings"""
    global live_stream_process
    
    if live_stream_process is not None:
        raise HTTPException(status_code=400, detail="Audio stream is already active")
        
    # Convert Pydantic model to dict
    device_settings = device_settings.dict()
    
    try:
        device_id = device_settings.get("device_id", "default")
        sample_rate = device_settings.get("sample_rate", 48000)
        bit_depth = device_settings.get("bit_depth", 16)
        channels = device_settings.get("channels", 1)
        
        # Convert PulseAudio device names to ALSA format if needed
        input_device = device_id
        if device_id.startswith("alsa_input."):
            # Use PulseAudio device directly
            input_device = device_id
        elif device_id.startswith("hw:"):
            # ALSA hardware device
            input_device = device_id
        else:
            # Default fallback
            input_device = "default"
        
        # Use PulseAudio for better device compatibility
        # For USB devices like webcams, use their native sample rate
        if "usb" in device_id.lower() or "webcam" in device_id.lower():
            # USB devices often work better with their native rates
            native_rate = 48000 if sample_rate > 44100 else 32000
        else:
            native_rate = sample_rate
        
        # Use default output device for streaming
        output_device = "default"
        
        # Convert PulseAudio device name to ALSA format for monitoring
        monitor_device = input_device
        if input_device.startswith("alsa_input."):
            # Convert PulseAudio device name to ALSA hw: format
            # Extract card and device numbers from PulseAudio name
            try:
                # Try to find corresponding ALSA device
                monitor_device = "default"  # Fallback to default
                # Could implement more sophisticated mapping here
            except:
                monitor_device = "default"
        
        # Start audio level monitoring for live streaming
        start_audio_level_monitoring(monitor_device)
            
        cmd = [
            "ffmpeg",
            "-f", "pulse",
            "-i", input_device,
            "-f", "pulse",
            "-ac", str(channels),
            "-ar", str(native_rate),
            output_device,
            "-y"
        ]
        
        # Fallback to ALSA if PulseAudio fails
        try:
            live_stream_process = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
            # Check if process started successfully
            import time
            time.sleep(0.5)
            if live_stream_process.poll() is not None:
                # Process failed, get error details - kurwa mać
                stderr_output = live_stream_process.stderr.read().decode() if live_stream_process.stderr else ""
                print(f"PulseAudio streaming failed: {stderr_output}")
                raise Exception(f"PulseAudio failed: {stderr_output}")
        except Exception as e:
            print(f"PulseAudio attempt failed: {e}")
            # Try simpler arecord + aplay approach for better compatibility
            try:
                # Use arecord piped to aplay for direct audio passthrough
                arecord_cmd = [
                    "arecord",
                    "-D", input_device,
                    "-f", "S16_LE",
                    "-c", str(channels),
                    "-r", str(sample_rate),
                    "-t", "raw"
                ]
                
                aplay_cmd = [
                    "aplay",
                    "-f", "S16_LE", 
                    "-c", str(channels),
                    "-r", str(sample_rate),
                    "-t", "raw"
                ]
                
                # Create the pipeline
                arecord_process = subprocess.Popen(arecord_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                aplay_process = subprocess.Popen(aplay_cmd, stdin=arecord_process.stdout, stderr=subprocess.PIPE)
                arecord_process.stdout.close()  # Allow arecord to receive SIGPIPE if aplay exits
                
                live_stream_process = arecord_process
                
            except Exception as fallback_error:
                print(f"Arecord/aplay fallback failed: {fallback_error}")
                # Final fallback - try with default device
                cmd = [
                    "ffmpeg",
                    "-f", "pulse",
                    "-i", "default",
                    "-f", "pulse",
                    "-ac", str(channels),
                    "-ar", str(sample_rate),
                    "default",
                    "-y"
                ]
                live_stream_process = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        return {
            "message": "Push-to-talk streaming started",
            "device_id": device_id,
            "settings": {
                "sample_rate": sample_rate,
                "bit_depth": bit_depth,
                "channels": channels
            }
        }
    except Exception as e:
        print(f"Error starting push-to-talk stream: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to start push-to-talk stream: {str(e)}")

@router.post("/push-to-talk-stop")
def push_to_talk_stop():
    """Stop push-to-talk audio streaming"""
    global live_stream_process
    
    # Stop audio level monitoring first
    stop_audio_level_monitoring()
    
    # Always perform aggressive cleanup regardless of tracked process state
    try:
        # Kill the tracked process if it exists
        if live_stream_process is not None:
            try:
                live_stream_process.terminate()
                live_stream_process.wait(timeout=2)
            except subprocess.TimeoutExpired:
                live_stream_process.kill()
                live_stream_process.wait(timeout=1)
            except:
                pass
            finally:
                live_stream_process = None
        
        # Aggressive cleanup of all related processes
        cleanup_commands = [
            ["pkill", "-9", "-f", "ffmpeg.*pulse.*pulse"],
            ["pkill", "-9", "-f", "ffmpeg.*alsa.*alsa"],
            ["pkill", "-9", "-f", "arecord.*aplay"],
            ["pkill", "-9", "-f", "arecord"],
            ["pkill", "-9", "-f", "aplay"],
            ["pkill", "-9", "-f", "parecord"],
            ["pkill", "-9", "-f", "paplay"],
            # Kill any processes with our specific device patterns
            ["pkill", "-9", "-f", "alsa_input"],
            ["pkill", "-9", "-f", "pulse.*default"]
        ]
        
        for cmd in cleanup_commands:
            try:
                subprocess.run(cmd, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=2)
            except:
                pass
        
        # Reset all paging state
        paging_state["is_live_streaming"] = False
        paging_state["current_process"] = None
        paging_state["audio_level"] = 0
        
        print("Push-to-talk stopped with aggressive cleanup")
        return {"message": "Push-to-talk stopped successfully"}
        
    except Exception as e:
        print(f"Error during push-to-talk cleanup: {e}")
        # Even if cleanup fails, reset state
        live_stream_process = None
        paging_state["is_live_streaming"] = False
        paging_state["current_process"] = None
        paging_state["audio_level"] = 0
        return {"message": "Push-to-talk stopped (with cleanup errors)"}

@router.get("/settings")
def get_paging_settings(db: Session = Depends(get_db)):
    """Get paging system settings"""
    try:
        settings = db.query(models.SystemSettings).filter(
            models.SystemSettings.key.like('paging_%')
        ).all()
        
        settings_dict = {s.key.replace('paging_', ''): s.value for s in settings}
        
        # Get available sounds for pre-announcement selection
        sounds = db.query(models.Sound).filter(
            models.Sound.type.in_(['bell', 'chime', 'notification'])
        ).all()
        
        settings_dict['availablePreSounds'] = [
            {'id': sound.id, 'name': sound.name, 'file_path': sound.file_path}
            for sound in sounds
        ]
        
        return settings_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting settings: {str(e)}")

@router.post("/settings")
def update_paging_settings(settings: dict, db: Session = Depends(get_db)):
    """Update paging system settings"""
    try:
        for key, value in settings.items():
            # Check if setting exists
            db_setting = db.query(models.SystemSettings).filter(
                models.SystemSettings.key == f"paging_{key}"
            ).first()
            
            if db_setting:
                db_setting.value = str(value)
            else:
                new_setting = models.SystemSettings(key=f"paging_{key}", value=str(value))
                db.add(new_setting)
        
        db.commit()
        return {"message": "Paging settings updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating settings: {str(e)}")

def start_audio_level_monitoring(device_id: str):
    """Start monitoring audio levels from input device"""
    def monitor_audio():
        try:
            print(f"Starting audio level monitoring for device: {device_id}")
            # Use arecord to monitor audio levels
            cmd = [
                'arecord', '-D', device_id,
                '-f', 'S16_LE', '-r', '44100', '-c', '1',
                '-t', 'raw', '--max-file-time', '0'
            ]
            
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            paging_state["audio_monitor_process"] = process
            
            # Give process a moment to start
            time.sleep(0.1)
            if process.poll() is not None:
                stderr_output = process.stderr.read().decode() if process.stderr else ""
                print(f"Audio monitoring process failed to start: {stderr_output}")
                return
            
            print("Audio monitoring process started successfully")
            
            # Read audio data and calculate RMS level
            chunk_size = 4096
            while paging_state.get("audio_monitor_process") == process and process.poll() is None:
                try:
                    data = process.stdout.read(chunk_size)
                    if not data:
                        break
                    
                    # Convert bytes to 16-bit integers
                    import struct
                    samples = struct.unpack(f'<{len(data)//2}h', data)
                    
                    # Calculate RMS level
                    if samples:
                        rms = math.sqrt(sum(s*s for s in samples) / len(samples))
                        # Convert to percentage (0-100)
                        level = min(100, (rms / 32767.0) * 100 * 3)  # Amplify for visibility
                        paging_state["audio_level"] = level
                        print(f"Audio level: {level:.1f}%")
                    
                    time.sleep(0.05)  # Update 20 times per second
                except Exception as e:
                    print(f"Audio monitoring error: {e}")
                    break
                    
        except Exception as e:
            print(f"Failed to start audio monitoring: {e}")
        finally:
            print("Audio monitoring stopped")
            if paging_state.get("audio_monitor_process") == process:
                try:
                    process.terminate()
                except:
                    pass
                paging_state["audio_monitor_process"] = None
    
    # Stop any existing monitoring first
    stop_audio_level_monitoring()
    
    # Start monitoring in background thread
    thread = threading.Thread(target=monitor_audio, daemon=True)
    thread.start()

def stop_audio_level_monitoring():
    """Stop audio level monitoring"""
    if paging_state.get("audio_monitor_process"):
        try:
            paging_state["audio_monitor_process"].terminate()
            paging_state["audio_monitor_process"].wait(timeout=2)
        except:
            pass
        paging_state["audio_monitor_process"] = None
    paging_state["audio_level"] = 0

@router.get("/status")
def get_paging_status(db: Session = Depends(get_db)):
    """Get current paging system status"""
    try:
        # Get current paging state
        is_recording = paging_state.get("is_recording", False)
        is_live_streaming = live_stream_process is not None
        # Only return audio level if actively recording or streaming
        audio_level = paging_state.get("audio_level", 0) if (is_recording or is_live_streaming) else 0
        
        # Get recent announcements
        recent_announcements = db.query(models.Sound).filter(
            models.Sound.type == 'announcement'
        ).order_by(models.Sound.created_at.desc()).limit(5).all()
        
        return {
            "is_recording": is_recording,
            "is_live_streaming": is_live_streaming,
            "audio_level": audio_level,
            "recent_announcements": [
                {
                    "id": ann.id,
                    "name": ann.name,
                    "duration": ann.duration,
                    "created_at": ann.created_at.isoformat() if ann.created_at else datetime.now().isoformat()
                }
                for ann in recent_announcements
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting paging status: {str(e)}")

@router.post("/push-to-talk-stop")
def push_to_talk_stop():
    """Stop push-to-talk streaming"""
    global live_stream_process
    
    if live_stream_process is None:
        return {"message": "No push-to-talk stream was active"}
    
    try:
        live_stream_process.terminate()
        try:
            live_stream_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            live_stream_process.kill()
        
        live_stream_process = None
        
        return {"message": "Push-to-talk stopped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error stopping push-to-talk: {str(e)}")

@router.post("/stop-playback")
def stop_playback():
    """Stop any active audio playback"""
    try:
        # Stop any active paging processes
        if paging_state["current_process"]:
            paging_state["current_process"].terminate()
            paging_state["current_process"].wait(timeout=5)
            paging_state["current_process"] = None
        
        paging_state["is_live_streaming"] = False
        paging_state["is_recording"] = False
        
        # Also stop any other audio playback
        from api.audio import stop_all_audio
        stop_all_audio()
        
        return {"message": "Playback stopped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error stopping playback: {str(e)}")

def get_pre_announcement_duration(db: Session) -> float:
    """Get the duration of the configured pre-announcement sound"""
    try:
        # Try both key formats that exist in the database
        pre_sound_id = crud.get_system_setting(db, 'pagingPreSoundId') or crud.get_system_setting(db, 'paging_preSoundId')
        
        if pre_sound_id:
            sound = crud.get_sound(db, int(pre_sound_id))
            if sound and sound.file_path and sound.file_path != "Default Bell" and os.path.exists(sound.file_path):
                return sound.duration or get_audio_duration(sound.file_path)
    except Exception as e:
        print(f"Error getting pre-announcement duration: {e}")
    
    return 0.0

def play_pre_announcement_sound(db: Session):
    """Play the configured pre-announcement sound"""
    try:
        # Try both key formats that exist in the database
        pre_sound_id = crud.get_system_setting(db, 'pagingPreSoundId') or crud.get_system_setting(db, 'paging_preSoundId')
        pre_sound_volume = crud.get_system_setting(db, 'pagingPreSoundVolume') or crud.get_system_setting(db, 'paging_preSoundVolume') or '100'
        
        print(f"Pre-announcement sound - ID: {pre_sound_id}, Volume: {pre_sound_volume}")
        
        if pre_sound_id:
            sound = crud.get_sound(db, int(pre_sound_id))
            if sound:
                print(f"Found sound: {sound.name}, File: {sound.file_path}")
                if sound.file_path and sound.file_path != "Default Bell" and os.path.exists(sound.file_path):
                    # Play with specified volume using existing audio system
                    from .sound import play_audio_file_with_volume
                    play_audio_file_with_volume(sound.file_path, int(pre_sound_volume))
                    print(f"Playing pre-announcement sound: {sound.file_path}")
                else:
                    print(f"Sound file not found or invalid: {sound.file_path}")
            else:
                print(f"Sound with ID {pre_sound_id} not found in database")
    except Exception as e:
        print(f"Error playing pre-announcement sound: {e}")

def play_recorded_announcement(file_path: str) -> bool:
    """Play recorded announcement without stopping other audio"""
    try:
        import subprocess
        
        if not os.path.exists(file_path):
            print(f"Recorded announcement file not found: {file_path}")
            return False
        
        print(f"Starting playback of recorded announcement: {file_path}")
        
        # Try ffplay first (most reliable for direct playback)
        try:
            cmd = ['ffplay', '-nodisp', '-autoexit', file_path]
            process = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print(f"Playing recorded announcement with ffplay: {file_path}")
            return True
        except FileNotFoundError:
            pass
        
        # Fallback to aplay
        try:
            cmd = ['aplay', file_path]
            process = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print(f"Playing recorded announcement with aplay: {file_path}")
            return True
        except FileNotFoundError:
            pass
        
        # Final fallback to paplay
        try:
            cmd = ['paplay', file_path]
            process = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print(f"Playing recorded announcement with paplay: {file_path}")
            return True
        except FileNotFoundError:
            pass
        
        print(f"No audio player available for recorded announcement: {file_path}")
        return False
        
    except Exception as e:
        print(f"Error playing recorded announcement {file_path}: {e}")
        return False

def get_audio_duration(file_path: str) -> float:
    """Get duration of audio file using ffprobe"""
    try:
        result = subprocess.run([
            'ffprobe', '-v', 'quiet', '-show_entries', 'format=duration',
            '-of', 'csv=p=0', file_path
        ], capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            return float(result.stdout.strip())
    except Exception as e:
        print(f"Error getting audio duration: {e}")
    
    return 0.0
