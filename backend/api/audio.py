from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
import crud, models
from typing import Dict, Any
import subprocess
import json

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

@router.get("/settings")
def get_audio_settings(db: Session = Depends(get_db)):
    """Get current audio settings"""
    try:
        # Initialize default settings
        default_settings = {
            'volume': '100',
            'masterVolume': '100',
            'eq': {
                'low': '0',
                'mid': '0', 
                'high': '0',
                'bass': '0',
                'treble': '0'
            },
            'audio': {
                'sampleRate': '44100',
                'bitDepth': '16',
                'channels': '2',
                'bufferSize': '512'
            },
            'output': 'default',
            'enabled': 'true'
        }
        
        # Get all audio-related settings
        try:
            all_settings = db.query(models.SystemSettings).filter(
                models.SystemSettings.key.like('audio_%')
            ).all()
        except Exception as e:
            print(f"Error querying audio settings: {e}")
            return default_settings
        
        # Start with defaults
        result = default_settings.copy()
        
        # Override with actual saved values from database
        for setting in all_settings:
            if setting.key == 'audio_settings_complete':
                continue
                
            key = setting.key.replace('audio_', '')
            value = setting.value
            
            # Handle specific keys
            if key == 'volume':
                result['volume'] = value
            elif key == 'output':
                result['output'] = value
            elif key == 'enabled':
                result['enabled'] = value
            elif key == 'masterVolume':
                result['masterVolume'] = value
            elif key == 'eq_low':
                result['eq']['low'] = value
            elif key == 'eq_mid':
                result['eq']['mid'] = value
            elif key == 'eq_high':
                result['eq']['high'] = value
            elif key == 'eq_bass':
                result['eq']['bass'] = value
            elif key == 'eq_treble':
                result['eq']['treble'] = value
            elif key == 'audio_sampleRate':
                result['audio']['sampleRate'] = value
            elif key == 'audio_bitDepth':
                result['audio']['bitDepth'] = value
            elif key == 'audio_channels':
                result['audio']['channels'] = value
            elif key == 'audio_bufferSize':
                result['audio']['bufferSize'] = value
        
        print(f"Final result: {result}")
        return result
    except Exception as e:
        print(f"Error in get_audio_settings: {e}")
        # Return defaults on error
        return {
            'volume': '100',
            'masterVolume': '100',
            'eq': {
                'low': '0',
                'mid': '0', 
                'high': '0',
                'bass': '0',
                'treble': '0'
            },
            'audio': {
                'sampleRate': '44100',
                'bitDepth': '16',
                'channels': '2',
                'bufferSize': '512'
            },
            'output': 'default',
            'enabled': 'true'
        }

@router.post("/settings")
def save_audio_settings(settings: Dict[str, Any], db: Session = Depends(get_db)):
    """Save audio settings"""
    try:
        print(f"Saving audio settings: {settings}")
        
        # Save each setting individually using crud function (which commits immediately)
        for key, value in settings.items():
            if value is not None:
                # Handle nested objects like eq settings
                if isinstance(value, dict):
                    for sub_key, sub_value in value.items():
                        if sub_value is not None:
                            setting_key = f"audio_{key}_{sub_key}"
                            print(f"Saving {setting_key} = {sub_value}")
                            crud.set_system_setting(db, setting_key, str(sub_value))
                else:
                    setting_key = f"audio_{key}"
                    print(f"Saving {setting_key} = {value}")
                    crud.set_system_setting(db, setting_key, str(value))
        
        # Also save the complete settings as a backup
        crud.set_system_setting(db, "audio_settings_complete", json.dumps(settings))
        
        print("Audio settings saved successfully")
        return {"message": "Audio settings saved successfully"}
    except Exception as e:
        print(f"Error saving audio settings: {e}")
        raise HTTPException(status_code=500, detail=f"Error saving audio settings: {str(e)}")

@router.get("/debug-settings")
def debug_audio_settings(db: Session = Depends(get_db)):
    """Debug endpoint to see what's actually in the database"""
    try:
        all_settings = db.query(models.SystemSettings).filter(
            models.SystemSettings.key.like('audio_%')
        ).all()
        
        debug_info = {
            "total_audio_settings": len(all_settings),
            "settings": []
        }
        
        for setting in all_settings:
            debug_info["settings"].append({
                "key": setting.key,
                "value": setting.value,
                "id": setting.id
            })
        
        return debug_info
    except Exception as e:
        return {"error": str(e)}

@router.get("/test-settings")
def test_audio_settings(db: Session = Depends(get_db)):
    """Test endpoint to verify audio settings retrieval"""
    from api.sound import get_audio_settings_from_db
    settings = get_audio_settings_from_db(db)
    return {
        "settings": settings,
        "volume": settings.get('volume'),
        "output": settings.get('output'),
        "eq": settings.get('eq')
    }

@router.get("/debug-audio-outputs")
def debug_audio_outputs():
    """Debug endpoint to see raw audio output detection"""
    try:
        import subprocess
        
        debug_info = {
            "aplay_output": "",
            "parsed_outputs": []
        }
        
        # Get raw aplay output
        result = subprocess.run(['aplay', '-l'],
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            debug_info["aplay_output"] = result.stdout
        
        # Get current outputs
        outputs = get_audio_outputs()
        debug_info["parsed_outputs"] = outputs
        
        return debug_info
    except Exception as e:
        return {"error": str(e)}

@router.get("/outputs")
def get_audio_outputs():
    """Get available audio outputs"""
    outputs = []
    
    # Method 1: Using pactl (PulseAudio) - for virtual devices
    try:
        result = subprocess.run(['pactl', 'list', 'short', 'sinks'],
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            for line in result.stdout.strip().split('\n'):
                if line.strip():
                    parts = line.split('\t')
                    if len(parts) >= 2:
                        sink_id = parts[0]
                        sink_name = parts[1]
                        
                        # Check if this sink is the default
                        try:
                            default_result = subprocess.run(['pactl', 'get-default-sink'],
                                                          capture_output=True, text=True, timeout=3)
                            if default_result.returncode == 0:
                                default_sink = default_result.stdout.strip()
                                if sink_id == default_sink:
                                    sink_name += ' (Default)'
                                elif sink_name.endswith(' (Active)'):
                                    sink_name += ' (Active)'
                            break
                        except:
                            pass
                        
                        outputs.append({
                            'id': sink_id,
                            'name': sink_name,
                            'type': 'pulseaudio'
                        })
    except Exception as e:
        print(f"PulseAudio detection failed: {e}")

    # Method 2: Using aplay (ALSA) - for hardware devices
    try:
        result = subprocess.run(['aplay', '-l'],
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            for line in lines:
                line = line.strip()
                
                # Parse card line (e.g., "card 0: MID [HDA Intel MID], device 0: VT1828S Analog [VT1828S Analog]")
                if line.startswith('card') and ':' in line and 'device' in line:
                    # Extract card info
                    card_part = line.split(',')[0]  # "card 0: MID [HDA Intel MID]"
                    device_part = line.split(',')[1] if ',' in line else ""  # "device 0: VT1828S Analog [VT1828S Analog]"
                    
                    # Parse card number and name
                    if 'card' in card_part and ':' in card_part:
                        card_num = card_part.split('card')[1].split(':')[0].strip()
                        card_name = card_part.split(':')[1].strip()
                        
                        # Parse device info
                        if 'device' in device_part and ':' in device_part:
                            device_name = device_part.split(':')[1].strip()
                            
                            # Determine device type
                            device_type = 'alsa'
                            if 'digital' in device_name.lower() or 'spdif' in device_name.lower():
                                device_type = 'optical'
                                device_name += ' (SPDIF/Optical)'
                            elif 'hdmi' in device_name.lower():
                                device_type = 'hdmi'
                                device_name += ' (HDMI)'
                            elif 'usb' in device_name.lower():
                                device_type = 'usb'
                                device_name += ' (USB)'
                            elif 'analog' in device_name.lower():
                                device_type = 'analog'
                                device_name += ' (Analog)'
                            
                            # Extract device number for unique ID
                            device_num = device_part.split('device')[1].split(':')[0].strip()
                            outputs.append({
                                'id': f"alsa_card_{card_num}_device_{device_num}",
                                'name': f"{card_name} - {device_name}",
                                'type': device_type
                            })
    except Exception as e:
        print(f"ALSA detection failed: {e}")

    # Method 3: Using cat /proc/asound/cards for additional info
    try:
        result = subprocess.run(['cat', '/proc/asound/cards'],
                              capture_output=True, text=True, timeout=3)
        if result.returncode == 0:
            for line in result.stdout.strip().split('\n'):
                if '[' in line and ']' in line:
                    # Parse card info
                    parts = line.split('[')
                    if len(parts) >= 2:
                        card_num = parts[0].strip()
                        card_name = parts[1].split(']')[0].strip()
                        
                        # Check if this card is already in outputs
                        existing = False
                        for output in outputs:
                            if card_name in output['name']:
                                existing = True
                                break
                        
                        if not existing and card_num.isdigit():
                            outputs.append({
                                'id': f"card_{card_num}",
                                'name': card_name,
                                'type': 'alsa'
                            })
    except Exception as e:
        print(f"ASound cards detection failed: {e}")

    # Remove duplicates and ensure default is first
    unique_outputs = []
    seen_ids = set()
    
    # Add default first if it exists
    for output in outputs:
        if 'default' in output['name'].lower() or output['id'] == 'default':
            if output['id'] not in seen_ids:
                unique_outputs.append(output)
                seen_ids.add(output['id'])
            break
    
    # Add all other outputs
    for output in outputs:
        if output['id'] not in seen_ids:
            unique_outputs.append(output)
            seen_ids.add(output['id'])

    return unique_outputs
    """Get available audio output devices"""
    try:
        outputs = []

        # Method 1: Using pactl (PulseAudio) - most comprehensive
        try:
            result = subprocess.run(['pactl', 'list', 'short', 'sinks'],
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                for line in result.stdout.strip().split('\n'):
                    if line.strip():
                        parts = line.split('\t')
                        if len(parts) >= 2:
                            sink_id = parts[0]
                            sink_name = parts[1]
                            
                            # Get more details about the sink
                            try:
                                detail_result = subprocess.run(['pactl', 'list', 'sinks', 'short'],
                                                             capture_output=True, text=True, timeout=3)
                                if detail_result.returncode == 0:
                                    for detail_line in detail_result.stdout.strip().split('\n'):
                                        if sink_id in detail_line:
                                            # Extract additional info
                                            if 'RUNNING' in detail_line:
                                                sink_name += ' (Active)'
                                            break
                            except:
                                pass
                            
                            outputs.append({
                                'id': sink_id,
                                'name': sink_name,
                                'type': 'pulseaudio'
                            })
        except Exception as e:
            print(f"PulseAudio detection failed: {e}")

        # Method 2: Using aplay (ALSA) - for hardware devices
        try:
            result = subprocess.run(['aplay', '-l'],
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                i = 0
                while i < len(lines):
                    line = lines[i].strip()
                    
                    # Parse card line (e.g., "card 0: MID [HDA Intel MID], device 0: VT1828S Analog [VT1828S Analog]")
                    if line.startswith('card') and ':' in line and 'device' in line:
                        # Extract card info
                        card_part = line.split(',')[0]  # "card 0: MID [HDA Intel MID]"
                        device_part = line.split(',')[1] if ',' in line else ""  # "device 0: VT1828S Analog [VT1828S Analog]"
                        
                        # Parse card number and name
                        if 'card' in card_part and ':' in card_part:
                            card_num = card_part.split('card')[1].split(':')[0].strip()
                            card_name = card_part.split(':')[1].strip()
                            
                            # Parse device info
                            if 'device' in device_part and ':' in device_part:
                                device_name = device_part.split(':')[1].strip()
                                
                                # Determine device type
                                device_type = 'alsa'
                                if 'digital' in device_name.lower() or 'spdif' in device_name.lower():
                                    device_type = 'optical'
                                    device_name += ' (SPDIF/Optical)'
                                elif 'hdmi' in device_name.lower():
                                    device_type = 'hdmi'
                                    device_name += ' (HDMI)'
                                elif 'usb' in device_name.lower():
                                    device_type = 'usb'
                                    device_name += ' (USB)'
                                elif 'analog' in device_name.lower():
                                    device_type = 'analog'
                                    device_name += ' (Analog)'
                                
                                outputs.append({
                                    'id': f"alsa_card_{card_num}",
                                    'name': f"{card_name} - {device_name}",
                                    'type': device_type
                                })
                    i += 1
        except Exception as e:
            print(f"ALSA detection failed: {e}")

        # Method 3: Using cat /proc/asound/cards for additional info
        try:
            result = subprocess.run(['cat', '/proc/asound/cards'],
                                  capture_output=True, text=True, timeout=3)
            if result.returncode == 0:
                for line in result.stdout.strip().split('\n'):
                    if '[' in line and ']' in line:
                        # Parse card info
                        parts = line.split('[')
                        if len(parts) >= 2:
                            card_num = parts[0].strip()
                            card_name = parts[1].split(']')[0].strip()
                            
                            # Check if this card is already in outputs
                            existing = False
                            for output in outputs:
                                if card_name in output['name']:
                                    existing = True
                                    break
                            
                            if not existing and card_num.isdigit():
                                outputs.append({
                                    'id': f"card_{card_num}",
                                    'name': card_name,
                                    'type': 'alsa'
                                })
        except Exception as e:
            print(f"ASound cards detection failed: {e}")

        # Remove duplicates and ensure default is first
        unique_outputs = []
        seen_ids = set()
        
        # Add default first if it exists
        for output in outputs:
            if 'default' in output['name'].lower() or output['id'] == 'default':
                if output['id'] not in seen_ids:
                    unique_outputs.append(output)
                    seen_ids.add(output['id'])
                break
        
        # Add all other outputs
        for output in outputs:
            if output['id'] not in seen_ids:
                unique_outputs.append(output)
                seen_ids.add(output['id'])

        # Fallback to default outputs if no devices detected
        if not unique_outputs:
            unique_outputs = [
                {'id': 'default', 'name': 'Default Audio Output', 'type': 'default'},
                {'id': 'hdmi', 'name': 'HDMI Audio', 'type': 'hdmi'},
                {'id': 'optical', 'name': 'Optical/SPDIF Output', 'type': 'optical'},
                {'id': 'usb', 'name': 'USB Audio Device', 'type': 'usb'},
                {'id': 'bluetooth', 'name': 'Bluetooth Audio', 'type': 'bluetooth'}
            ]

        return unique_outputs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting audio outputs: {str(e)}")

@router.post("/stop")
def stop_audio():
    """Stop current audio playback"""
    try:
        # Kill all aplay processes
        subprocess.run(['pkill', '-f', 'aplay'], capture_output=True)
        subprocess.run(['pkill', '-f', 'ffplay'], capture_output=True)
        subprocess.run(['pkill', '-f', 'sox'], capture_output=True)
        
        return {"message": "Audio playback stopped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error stopping audio: {str(e)}")

@router.post("/stop-all")
def stop_all_audio():
    """Stop all audio playback"""
    try:
        # Kill all audio playback processes
        subprocess.run(['pkill', '-f', 'aplay'], capture_output=True)
        subprocess.run(['pkill', '-f', 'ffplay'], capture_output=True)
        subprocess.run(['pkill', '-f', 'sox'], capture_output=True)
        subprocess.run(['pkill', '-f', 'mpg123'], capture_output=True)
        subprocess.run(['pkill', '-f', 'mplayer'], capture_output=True)
        
        return {"message": "All audio playback stopped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error stopping all audio: {str(e)}")

@router.post("/test")
def test_audio_output(output_id: str = "default"):
    """Test audio output with a simple tone"""
    try:
        # Generate a test tone using sox or ffmpeg
        test_command = None
        
        # Try sox first
        try:
            subprocess.run(['sox', '--version'], capture_output=True, check=True)
            test_command = ['sox', '-n', '-r', '44100', '-c', '1', '-t', 'wav', '-', 
                           'trim', '0.0', '1.0', 'sine', '440']
        except:
            pass
        
        # Try ffmpeg if sox not available
        if not test_command:
            try:
                subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
                test_command = ['ffmpeg', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=1', 
                               '-f', 'wav', '-']
            except:
                pass
        
        if test_command:
            # Play the test tone
            subprocess.Popen(test_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            return {"message": "Test tone played successfully"}
        else:
            return {"message": "No audio test tools available"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error testing audio: {str(e)}")

@router.get("/stats")
def get_audio_stats(db: Session = Depends(get_db)):
    """Get audio library statistics"""
    try:
        import os
        import glob
        
        # Define audio directories
        audio_base_dir = "audio"
        bell_dir = os.path.join(audio_base_dir, "bells")
        music_dir = os.path.join(audio_base_dir, "music")
        announcement_dir = os.path.join(audio_base_dir, "announcements")
        
        # Count files in each directory
        def count_audio_files(directory):
            if not os.path.exists(directory):
                return 0
            audio_extensions = ['*.wav', '*.mp3', '*.ogg', '*.flac', '*.m4a']
            count = 0
            for ext in audio_extensions:
                count += len(glob.glob(os.path.join(directory, ext)))
            return count
        
        bells_count = count_audio_files(bell_dir)
        music_count = count_audio_files(music_dir)
        announcements_count = count_audio_files(announcement_dir)
        total_count = bells_count + music_count + announcements_count
        
        return {
            "bells": bells_count,
            "music": music_count,
            "announcements": announcements_count,
            "total": total_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting audio stats: {str(e)}")
