from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import subprocess
import requests
import threading
import time
from database import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Global state for current stream
current_stream_process = None
stream_lock = threading.Lock()

@router.post("/play")
async def play_stream(stream_data: dict, db: Session = Depends(get_db)):
    """Play a radio stream through the server's audio output with volume and EQ settings"""
    global current_stream_process
    
    stream_url = stream_data.get("stream_url")
    if not stream_url:
        raise HTTPException(status_code=400, detail="stream_url is required")
    
    try:
        # Stop any currently playing stream
        await stop_stream()
        
        # Get audio settings for volume and EQ
        from api.sound import get_audio_settings_from_db
        audio_settings = get_audio_settings_from_db(db)
        print(f"Audio settings for stream: {audio_settings}")
        
        # Build ffplay command with volume and EQ filters
        ffplay_cmd = ['ffplay', '-nodisp', '-loglevel', 'error']
        
        # Build audio filter chain
        filter_parts = []
        
        # Add EQ filters if any are non-zero
        eq_settings = audio_settings.get('eq', {})
        if eq_settings:
            eq_values = [float(v) for v in eq_settings.values()]
            if any(v != 0 for v in eq_values):
                if eq_settings.get('bass') and eq_settings['bass'] != '0':
                    bass_gain = float(eq_settings['bass'])
                    filter_parts.append(f"equalizer=f=60:width_type=o:width=2:g={bass_gain}")
                
                if eq_settings.get('treble') and eq_settings['treble'] != '0':
                    treble_gain = float(eq_settings['treble'])
                    filter_parts.append(f"equalizer=f=8000:width_type=o:width=2:g={treble_gain}")
                
                if eq_settings.get('low') and eq_settings['low'] != '0':
                    low_gain = float(eq_settings['low'])
                    filter_parts.append(f"equalizer=f=100:width_type=o:width=2:g={low_gain}")
                
                if eq_settings.get('mid') and eq_settings['mid'] != '0':
                    mid_gain = float(eq_settings['mid'])
                    filter_parts.append(f"equalizer=f=1000:width_type=o:width=2:g={mid_gain}")
                
                if eq_settings.get('high') and eq_settings['high'] != '0':
                    high_gain = float(eq_settings['high'])
                    filter_parts.append(f"equalizer=f=8000:width_type=o:width=2:g={high_gain}")
        
        # Add volume filter if not 100%
        volume = int(audio_settings.get('volume', '100'))
        if volume != 100:
            volume_multiplier = volume / 100.0
            filter_parts.append(f"volume={volume_multiplier}")
            print(f"Adding volume filter to stream: {volume_multiplier}x ({volume}%)")
        
        # Apply audio filters if any
        if filter_parts:
            filter_str = ','.join(filter_parts)
            ffplay_cmd.extend(['-af', filter_str])
            print(f"Stream audio filters: {filter_str}")
        
        # Add stream URL
        ffplay_cmd.append(stream_url)
        
        # Start stream playback
        with stream_lock:
            current_stream_process = subprocess.Popen(
                ffplay_cmd,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        
        print(f"✅ Playing stream with ffplay: {' '.join(ffplay_cmd)}")
        return {
            "message": "Stream started",
            "stream_url": stream_url,
            "pid": current_stream_process.pid,
            "volume": volume
        }
    except FileNotFoundError:
        raise HTTPException(
            status_code=500, 
            detail="No audio player found. Please install pulseaudio or ffmpeg."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error playing stream: {str(e)}")

@router.post("/stop")
async def stop_stream():
    """Stop the currently playing stream"""
    global current_stream_process
    
    with stream_lock:
        if current_stream_process:
            try:
                current_stream_process.terminate()
                current_stream_process.wait(timeout=2)
            except:
                current_stream_process.kill()
            current_stream_process = None
            return {"message": "Stream stopped"}
        else:
            return {"message": "No stream playing"}

@router.get("/status")
async def stream_status():
    """Get the status of the current stream"""
    global current_stream_process
    
    with stream_lock:
        if current_stream_process and current_stream_process.poll() is None:
            return {
                "playing": True,
                "pid": current_stream_process.pid
            }
        else:
            return {"playing": False}
