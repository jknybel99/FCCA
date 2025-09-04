from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
import crud, models, schemas
import os
import subprocess
import tempfile
import shutil
from typing import Optional
import uuid
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backup_system import BackupSystem

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_ffmpeg():
    """Check if ffmpeg is available"""
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

@router.post("/trim-preview")
async def trim_audio_preview(
    sound_id: int = Form(...),
    start_time: float = Form(...),
    end_time: float = Form(...),
    db: Session = Depends(get_db)
):
    """Create a trimmed preview of audio for editing"""
    
    if not check_ffmpeg():
        raise HTTPException(status_code=500, detail="ffmpeg not available on server")
    
    # Get the sound file
    sound = crud.get_sound(db, sound_id)
    if not sound:
        raise HTTPException(status_code=404, detail="Sound not found")
    
    if not os.path.exists(sound.file_path):
        raise HTTPException(status_code=404, detail="Sound file not found")
    
    # Validate trim times
    if start_time < 0 or end_time <= start_time:
        raise HTTPException(status_code=400, detail="Invalid trim times")
    
    # Create temporary output file
    temp_output = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
    temp_output.close()
    
    try:
        # Use ffmpeg to trim the audio
        cmd = [
            'ffmpeg',
            '-i', sound.file_path,
            '-ss', str(start_time),
            '-t', str(end_time - start_time),
            '-c:a', 'pcm_s16le',  # WAV format
            '-ar', '44100',       # 44.1kHz sample rate
            '-ac', '2',           # Stereo
            '-y',                 # Overwrite output
            temp_output.name
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"ffmpeg error: {result.stderr}")
        
        # Check if output file was created and has content
        if not os.path.exists(temp_output.name) or os.path.getsize(temp_output.name) == 0:
            raise HTTPException(status_code=500, detail="Failed to create trimmed audio")
        
        # Return the trimmed audio file
        from fastapi.responses import FileResponse
        return FileResponse(
            temp_output.name,
            media_type="audio/wav",
            filename=f"{sound.name}_trimmed_preview.wav"
        )
        
    except Exception as e:
        # Clean up temp file on error
        if os.path.exists(temp_output.name):
            os.unlink(temp_output.name)
        raise HTTPException(status_code=500, detail=f"Audio processing error: {str(e)}")

@router.post("/fade-preview")
async def fade_audio_preview(
    sound_id: int = Form(...),
    start_time: float = Form(...),
    end_time: float = Form(...),
    fade_in: float = Form(0.0),
    fade_out: float = Form(0.0),
    volume: float = Form(100.0),
    db: Session = Depends(get_db)
):
    """Create a fade preview of audio for editing"""
    
    if not check_ffmpeg():
        raise HTTPException(status_code=500, detail="ffmpeg not available on server")
    
    # Get the sound file
    sound = crud.get_sound(db, sound_id)
    if not sound:
        raise HTTPException(status_code=404, detail="Sound not found")
    
    if not os.path.exists(sound.file_path):
        raise HTTPException(status_code=404, detail="Sound file not found")
    
    # Validate parameters
    if start_time < 0 or end_time <= start_time:
        raise HTTPException(status_code=400, detail="Invalid trim times")
    
    if fade_in < 0 or fade_out < 0:
        raise HTTPException(status_code=400, detail="Invalid fade times")
    
    if volume < 0 or volume > 200:
        raise HTTPException(status_code=400, detail="Invalid volume (0-200%)")
    
    # Create temporary output file
    temp_output = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
    temp_output.close()
    
    try:
        # Build ffmpeg command for fade effects
        cmd = [
            'ffmpeg',
            '-i', sound.file_path,
            '-ss', str(start_time),
            '-t', str(end_time - start_time),
        ]
        
        # Add fade in effect
        if fade_in > 0:
            cmd.extend(['-af', f'afade=t=in:st=0:d={fade_in}'])
        
        # Add fade out effect
        if fade_out > 0:
            fade_out_start = end_time - start_time - fade_out
            if fade_out_start > 0:
                cmd.extend(['-af', f'afade=t=out:st={fade_out_start}:d={fade_out}'])
        
        # Add volume adjustment
        if volume != 100:
            volume_multiplier = volume / 100
            cmd.extend(['-af', f'volume={volume_multiplier}'])
        
        # Add output format settings
        cmd.extend([
            '-c:a', 'pcm_s16le',  # WAV format
            '-ar', '44100',       # 44.1kHz sample rate
            '-ac', '2',           # Stereo
            '-y',                 # Overwrite output
            temp_output.name
        ])
        
        print(f"Running ffmpeg command: {' '.join(cmd)}")
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"ffmpeg error: {result.stderr}")
            raise HTTPException(status_code=500, detail=f"ffmpeg error: {result.stderr}")
        
        # Check if output file was created and has content
        if not os.path.exists(temp_output.name) or os.path.getsize(temp_output.name) == 0:
            raise HTTPException(status_code=500, detail="Failed to create faded audio")
        
        print(f"Successfully created fade preview: {temp_output.name}")
        
        # Return the processed audio file
        from fastapi.responses import FileResponse
        return FileResponse(
            temp_output.name,
            media_type="audio/wav",
            filename=f"{sound.name}_fade_preview.wav"
        )
        
    except Exception as e:
        # Clean up temp file on error
        if os.path.exists(temp_output.name):
            os.unlink(temp_output.name)
        print(f"Error in fade preview: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Audio processing error: {str(e)}")

@router.post("/process-and-save")
async def process_and_save_audio(
    sound_id: int = Form(...),
    start_time: float = Form(...),
    end_time: float = Form(...),
    fade_in: float = Form(0.0),
    fade_out: float = Form(0.0),
    volume: float = Form(100.0),
    name: str = Form(...),
    description: str = Form(""),
    tags: str = Form(""),
    type: str = Form(""),
    db: Session = Depends(get_db)
):
    """Process audio with trim, fade, and volume effects, then save to server"""
    
    # Debug: print received parameters
    print(f"DEBUG: Received parameters - sound_id: {sound_id}, start_time: {start_time}, end_time: {end_time}")
    print(f"DEBUG: fade_in: {fade_in}, fade_out: {fade_out}, volume: {volume}")
    print(f"DEBUG: name: {name}, description: {description}, tags: {tags}, type: {type}")
    
    if not check_ffmpeg():
        raise HTTPException(status_code=500, detail="ffmpeg not available on server")
    
    # Get the sound file
    sound = crud.get_sound(db, sound_id)
    if not sound:
        raise HTTPException(status_code=404, detail="Sound not found")
    
    if not os.path.exists(sound.file_path):
        raise HTTPException(status_code=404, detail="Sound file not found")
    
    # Validate parameters
    if start_time < 0 or end_time <= start_time:
        raise HTTPException(status_code=400, detail="Invalid trim times")
    
    if fade_in < 0 or fade_out < 0:
        raise HTTPException(status_code=400, detail="Invalid fade times")
    
    if volume < 0 or volume > 200:
        raise HTTPException(status_code=400, detail="Invalid volume (0-200%)")
    
    # Create output filename with timestamp to avoid duplicates
    import time
    timestamp = int(time.time())
    # Use .aac extension since we're outputting AAC format
    output_filename = f"{uuid.uuid4().hex[:8]}_{name.replace(' ', '_')}_{timestamp}.aac"
    output_path = f"static/sounds/{output_filename}"
    
    # Ensure output directory exists
    os.makedirs("static/sounds", exist_ok=True)
    
    try:
        # Build ffmpeg command for processing - simplified version
        cmd = [
            'ffmpeg',
            '-i', sound.file_path,
            '-ss', str(start_time),
            '-t', str(end_time - start_time),
            '-c:a', 'aac',
            '-b:a', '192k',
            '-ar', '44100',
            '-ac', '2',
            '-y',
            output_path
        ]
        
        # Add audio filters only if needed
        if volume != 100 or fade_in > 0 or fade_out > 0:
            audio_filters = []
            
            # Add volume adjustment
            if volume != 100:
                volume_factor = volume / 100
                audio_filters.append(f'volume={volume_factor}')
            
            # Add fade effects
            if fade_in > 0:
                audio_filters.append(f'afade=t=in:st=0:d={fade_in}')
            if fade_out > 0:
                fade_out_start = end_time - start_time - fade_out
                if fade_out_start > 0:
                    audio_filters.append(f'afade=t=out:st={fade_out_start}:d={fade_out}')
            
            # Insert audio filter before output settings
            if audio_filters:
                cmd.insert(-1, '-af')
                cmd.insert(-1, ','.join(audio_filters))
        
        # Debug: print the exact command being run
        print(f"DEBUG: Running ffmpeg command: {' '.join(cmd)}")
        print(f"DEBUG: Working directory: {os.getcwd()}")
        
        # Process the audio
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"ffmpeg error: {result.stderr}")
        
        # Check if output file was created
        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            raise HTTPException(status_code=500, detail="Failed to create processed audio")
        
        # Calculate duration of processed audio
        duration_cmd = [
            'ffprobe', '-v', 'quiet', '-show_entries', 'format=duration',
            '-of', 'csv=p=0', output_path
        ]
        
        duration_result = subprocess.run(duration_cmd, capture_output=True, text=True)
        duration = None
        if duration_result.returncode == 0:
            try:
                duration = int(float(duration_result.stdout.strip()))
            except:
                pass
        
        # Create new sound record in database with unique name
        import time
        timestamp = int(time.time())
        unique_name = f"{name}_{timestamp}"
        
        new_sound_data = schemas.SoundCreate(
            name=unique_name,
            description=description or f"Edited version of {sound.name}",
            tags=tags or sound.tags,
            type=type or sound.type,
            file_path=output_path,
            duration=duration
        )
        
        new_sound = crud.create_sound(db, new_sound_data, output_path)
        
        # Create a backup of the original sound file before editing
        try:
            backup_system = BackupSystem()
            backup_system.create_backup(include_audio=True, include_database=True, include_config=False)
            print(f"Backup created after processing audio: {sound.name}")
        except Exception as e:
            print(f"Warning: Backup failed after audio processing: {e}")
            # Continue even if backup fails
        
        return {
            "message": "Audio processed and saved successfully",
            "sound": {
                "id": new_sound.id,
                "name": new_sound.name,
                "file_path": new_sound.file_path,
                "duration": new_sound.duration
            }
        }
        
    except Exception as e:
        # Clean up output file on error
        if os.path.exists(output_path):
            os.unlink(output_path)
        raise HTTPException(status_code=500, detail=f"Audio processing error: {str(e)}")

@router.get("/check-ffmpeg")
def check_ffmpeg_status():
    """Check if ffmpeg is available on the server"""
    available = check_ffmpeg()
    return {
        "ffmpeg_available": available,
        "message": "ffmpeg is available" if available else "ffmpeg is not available"
    }
