from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import subprocess
import requests
import threading
import time

router = APIRouter()

# Global state for current stream
current_stream_process = None
stream_lock = threading.Lock()

@router.post("/play")
async def play_stream(stream_data: dict):
    """Play a radio stream through the server's audio output using the same method as audio files"""
    global current_stream_process
    
    stream_url = stream_data.get("stream_url")
    if not stream_url:
        raise HTTPException(status_code=400, detail="stream_url is required")
    
    try:
        # Stop any currently playing stream
        await stop_stream()
        
        # For URLs/streams, we need to use ffplay (paplay doesn't support URLs)
        # Use the same audio output as paplay by default
        # NOTE: Don't use -autoexit for streams - it causes premature exits on stream interruptions
        with stream_lock:
            current_stream_process = subprocess.Popen(
                ['ffplay', '-nodisp', '-loglevel', 'error', stream_url],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        
        print(f"✅ Playing stream with ffplay: {stream_url}")
        return {
            "message": "Stream started",
            "stream_url": stream_url,
            "pid": current_stream_process.pid
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
