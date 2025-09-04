from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import SessionLocal
import crud, schemas, models
import os
from typing import List, Optional

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def calculate_audio_duration(file_path: str) -> Optional[int]:
    """Calculate audio duration in seconds using pydub"""
    try:
        from pydub import AudioSegment
        audio = AudioSegment.from_file(file_path)
        return int(len(audio) / 1000)  # Convert milliseconds to seconds
    except ImportError:
        # Fallback to ffprobe if pydub is not available
        try:
            import subprocess
            result = subprocess.run([
                'ffprobe', '-v', 'quiet', '-show_entries', 'format=duration',
                '-of', 'csv=p=0', file_path
            ], capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                return int(float(result.stdout.strip()))
        except Exception as e:
            print(f"ffprobe failed: {e}")
    except Exception as e:
        print(f"pydub failed: {e}")
        # Try ffprobe as fallback
        try:
            import subprocess
            result = subprocess.run([
                'ffprobe', '-v', 'quiet', '-show_entries', 'format=duration',
                '-of', 'csv=p=0', file_path
            ], capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                return int(float(result.stdout.strip()))
        except Exception as e2:
            print(f"ffprobe fallback also failed: {e2}")
    return None

@router.post("/", response_model=schemas.Sound)
async def upload_sound(
    name: str = Form(...),
    description: str = Form(""),
    tags: str = Form(""),
    type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        # Validate file type
        if not file.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="File must be an audio file")
    
        # Create sounds directory
        os.makedirs("static/sounds", exist_ok=True)
        
        # Generate unique filename
        import uuid
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4().hex[:8]}_{name.replace(' ', '_')}{file_extension}"
        file_location = f"static/sounds/{unique_filename}"
        
        # Save file
        with open(file_location, "wb") as f:
            f.write(await file.read())
        
        # Calculate duration (with error handling and retry)
        duration = None
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Small delay to ensure file is fully written
                import time
                if attempt > 0:
                    time.sleep(0.5)
                
                duration = calculate_audio_duration(file_location)
                if duration is not None:
                    print(f"Successfully calculated duration for {file_location}: {duration} seconds")
                    break
                else:
                    print(f"Duration calculation returned None for {file_location}, attempt {attempt + 1}")
            except Exception as e:
                print(f"Warning: Could not calculate duration for {file_location} (attempt {attempt + 1}): {e}")
                if attempt == max_retries - 1:
                    print(f"Failed to calculate duration after {max_retries} attempts, continuing without duration")
                # Continue without duration on final attempt
        
        # Create sound record
        sound = crud.create_sound(db, schemas.SoundCreate(
            name=name, 
            description=description, 
            tags=tags, 
            type=type,
            duration=duration
        ), file_location)
        
        # Create a backup after successful upload
        try:
            from backup_system import BackupSystem
            backup_system = BackupSystem()
            backup_system.create_backup(include_audio=True, include_database=True, include_config=False)
            print(f"Backup created after uploading: {name}")
        except Exception as e:
            print(f"Warning: Backup failed after upload: {e}")
            # Continue even if backup fails
        
        return sound
    except Exception as e:
        print(f"Error in upload_sound: {e}")
        # Clean up file if it was created
        if 'file_location' in locals() and os.path.exists(file_location):
            try:
                os.remove(file_location)
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/", response_model=List[schemas.Sound])
def search_sounds(
    q: str = Query("", description="Search query"),
    type: str = Query(None, description="Filter by sound type"),
    db: Session = Depends(get_db)
):
    return crud.search_sounds(db, q, type)

@router.get("/types", response_model=List[str])
def get_sound_types(db: Session = Depends(get_db)):
    """Get all available sound types"""
    sounds = db.query(models.Sound).all()
    types = list(set(sound.type for sound in sounds))
    return sorted(types)

@router.get("/{sound_id}/stream")
def stream_sound(sound_id: int, db: Session = Depends(get_db)):
    """Stream audio file for editing/preview"""
    from fastapi.responses import FileResponse
    import mimetypes
    
    print(f"Stream endpoint called for sound_id: {sound_id}")
    
    sound = crud.get_sound(db, sound_id)
    if not sound:
        print(f"Sound not found for ID: {sound_id}")
        raise HTTPException(status_code=404, detail="Sound not found")
    
    print(f"Sound found: {sound.name}, file_path: {sound.file_path}")
    
    if not os.path.exists(sound.file_path):
        print(f"File not found at path: {sound.file_path}")
        raise HTTPException(status_code=404, detail="Sound file not found")
    
    # Get file size for debugging
    file_size = os.path.getsize(sound.file_path)
    print(f"File exists, size: {file_size} bytes")
    
    # Detect media type based on file extension
    file_extension = os.path.splitext(sound.file_path)[1].lower()
    media_type_map = {
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.m4a': 'audio/mp4',
        '.flac': 'audio/flac',
        '.aac': 'audio/aac'
    }
    
    media_type = media_type_map.get(file_extension, 'audio/mpeg')
    print(f"Detected media type: {media_type} for extension: {file_extension}")
    
    # Return the audio file as a stream
    response = FileResponse(
        sound.file_path,
        media_type=media_type,
        filename=sound.name
    )
    
    # Add CORS headers for audio streaming
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Cache-Control"] = "no-cache"
    
    print(f"Returning FileResponse for: {sound.file_path}")
    return response

@router.get("/{sound_id}", response_model=schemas.Sound)
def get_sound(sound_id: int, db: Session = Depends(get_db)):
    sound = crud.get_sound(db, sound_id)
    if not sound:
        raise HTTPException(status_code=404, detail="Sound not found")
    
    # Auto-fix duration if missing
    if sound.duration is None and os.path.exists(sound.file_path):
        try:
            duration = calculate_audio_duration(sound.file_path)
            if duration is not None:
                sound.duration = duration
                db.commit()
                db.refresh(sound)
                print(f"Auto-fixed duration for sound {sound_id}: {duration} seconds")
        except Exception as e:
            print(f"Could not auto-fix duration for sound {sound_id}: {e}")
    
    return sound

@router.put("/{sound_id}", response_model=schemas.Sound)
def update_sound(
    sound_id: int,
    name: str = Form(None),
    description: str = Form(None),
    tags: str = Form(None),
    type: str = Form(None),
    db: Session = Depends(get_db)
):
    sound = crud.get_sound(db, sound_id)
    if not sound:
        raise HTTPException(status_code=404, detail="Sound not found")
    
    # Handle file renaming if name is being updated
    if name is not None and name != sound.name:
        # Generate new filename
        import uuid
        file_extension = os.path.splitext(sound.file_path)[1]
        new_filename = f"{uuid.uuid4().hex[:8]}_{name.replace(' ', '_')}{file_extension}"
        new_file_path = f"static/sounds/{new_filename}"
        
        # Rename the file
        try:
            if os.path.exists(sound.file_path):
                os.rename(sound.file_path, new_file_path)
                sound.file_path = new_file_path
            else:
                # If original file doesn't exist, create a placeholder or use existing path
                print(f"Warning: Original file {sound.file_path} not found")
        except Exception as e:
            print(f"Error renaming file: {e}")
            # Continue without renaming if there's an error
    
    # Update fields
    update_data = {}
    if name is not None:
        update_data["name"] = name
    if description is not None:
        update_data["description"] = description
    if tags is not None:
        update_data["tags"] = tags
    if type is not None:
        update_data["type"] = type
    
    # Update sound
    for key, value in update_data.items():
        setattr(sound, key, value)
    
    db.commit()
    db.refresh(sound)
    return sound

@router.delete("/{sound_id}")
def delete_sound(sound_id: int, db: Session = Depends(get_db)):
    sound = crud.delete_sound(db, sound_id)
    if not sound:
        raise HTTPException(status_code=404, detail="Sound not found")
    return {"message": "Sound deleted successfully"}

# Global variable to track playing processes
playing_processes = {}

@router.post("/{sound_id}/play")
def play_sound(sound_id: int, db: Session = Depends(get_db)):
    """Play a sound immediately (for testing)"""
    sound = crud.get_sound(db, sound_id)
    if not sound:
        raise HTTPException(status_code=404, detail="Sound not found")
    
    if not os.path.exists(sound.file_path):
        raise HTTPException(status_code=404, detail="Sound file not found")
    
    # Stop any currently playing audio
    stop_all_audio()
    
    # Get audio settings
    audio_settings = get_audio_settings_from_db(db)
    print(f"Audio settings for playback: {audio_settings}")
    
    # Apply EQ if needed
    playback_file = sound.file_path
    if audio_settings.get('eq'):
        eq_settings = audio_settings['eq']
        print(f"EQ settings found: {eq_settings}")
        # Check if any EQ settings are non-zero
        eq_values = [float(v) for v in eq_settings.values()]
        print(f"EQ values: {eq_values}")
        if any(v != 0 for v in eq_values):
            print(f"Applying EQ settings: {eq_settings}")
            playback_file = apply_eq_to_audio(sound.file_path, eq_settings)
            print(f"EQ processed file: {playback_file}")
        else:
            print("No EQ settings to apply (all values are 0)")
    else:
        print("No EQ settings found in audio_settings")
    
    # Try multiple audio players with better MP3 support and audio settings
    import subprocess
    file_extension = os.path.splitext(playback_file)[1].lower()
    
    # Build player command with audio settings
    def build_player_command(player, file_path):
        base_cmd = [player]
        
        # Add volume control
        if audio_settings.get('volume') and audio_settings['volume'] != '100':
            volume = int(audio_settings['volume'])
            if player == 'mpg123':
                base_cmd.extend(['-g', str(volume * 2)])  # mpg123 uses 0-200 scale
            elif player == 'ffplay':
                base_cmd.extend(['-volume', str(volume)])
            elif player == 'mpv':
                base_cmd.extend(['--volume', str(volume)])
            elif player == 'paplay':
                # paplay doesn't support volume directly, we'll use sox for processing
                pass
            print(f"Applied volume: {volume}% to {player}")
        else:
            print(f"No volume adjustment needed for {player}")
        
        # Add output device if specified
        if audio_settings.get('output') and audio_settings['output'] != 'default':
            output = audio_settings['output']
            if player == 'mpg123' and output.startswith('alsa_card_'):
                # Extract card and device from output ID
                parts = output.split('_')
                if len(parts) >= 4:
                    card = parts[2]
                    device = parts[4]
                    base_cmd.extend(['-a', f"hw:{card},{device}"])
            elif player == 'ffplay':
                base_cmd.extend(['-f', 'alsa', '-i', output])
        
        base_cmd.append(file_path)
        return base_cmd
    
    # Prioritize players based on file type
    if file_extension in ['.mp3', '.m4a', '.aac']:
        players = ['mpg123', 'ffplay', 'mpv', 'paplay', 'aplay']
    else:
        players = ['aplay', 'paplay', 'ffplay', 'mpg123', 'mpv']
    
    for i, player in enumerate(players):
        try:
            player_cmd = build_player_command(player, playback_file)
            print(f"Trying player {i+1}: {' '.join(player_cmd)}")
            process = subprocess.Popen(player_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            playing_processes[sound_id] = process
            print(f"Successfully started playback with: {' '.join(player_cmd)}")
            return {"message": f"Playing sound: {sound.name} with {player} (volume: {audio_settings.get('volume', '100')}%)"}
        except FileNotFoundError:
            print(f"Player not found: {player}")
            continue
        except Exception as e:
            print(f"Error with player {player}: {e}")
            continue
    

    
    # If no player works, return error
    raise HTTPException(status_code=500, detail="No compatible audio player found")

def apply_eq_to_audio(input_file: str, eq_settings: dict) -> str:
    """Apply EQ settings to audio file using ffmpeg"""
    try:
        import subprocess
        import tempfile
        
        print(f"Starting EQ processing for {input_file}")
        print(f"EQ settings: {eq_settings}")
        
        # Create temporary output file
        output_file = tempfile.mktemp(suffix='.wav')
        print(f"Output file: {output_file}")
        
        # Build ffmpeg command with EQ filters
        ffmpeg_cmd = ['ffmpeg', '-i', input_file, '-y']  # -y to overwrite output
        
        # Build complex filter for EQ
        filter_parts = []
        
        # Add EQ filters based on settings
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
        
        if filter_parts:
            # Combine all filters
            filter_str = ','.join(filter_parts)
            ffmpeg_cmd.extend(['-af', filter_str])
        
        ffmpeg_cmd.append(output_file)
        
        # Run ffmpeg command
        print(f"Running ffmpeg command: {' '.join(ffmpeg_cmd)}")
        result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True, timeout=30)
        print(f"ffmpeg return code: {result.returncode}")
        if result.returncode == 0:
            print(f"EQ processing successful, returning: {output_file}")
            return output_file
        else:
            print(f"ffmpeg EQ processing failed: {result.stderr}")
            print(f"ffmpeg stdout: {result.stdout}")
            return input_file
    except Exception as e:
        print(f"EQ processing error: {e}")
        return input_file

def get_audio_settings_from_db(db: Session):
    """Get audio settings from database"""
    try:
        # Get all audio settings from database
        all_settings = db.query(models.SystemSettings).filter(
            models.SystemSettings.key.like('audio_%')
        ).all()
        
        # Initialize default settings
        settings = {
            "volume": "100",
            "masterVolume": "100",
            "eq": {
                "low": "0",
                "mid": "0", 
                "high": "0",
                "bass": "0",
                "treble": "0"
            },
            "audio": {
                "sampleRate": "44100",
                "bitDepth": "16",
                "channels": "2",
                "bufferSize": "512"
            },
            "output": "default",
            "enabled": "true"
        }
        
        # Override with actual saved values from database
        for setting in all_settings:
            if setting.key == 'audio_settings_complete':
                continue
                
            key = setting.key.replace('audio_', '')
            value = setting.value
            
            # Handle specific keys
            if key == 'volume':
                settings['volume'] = value
            elif key == 'output':
                settings['output'] = value
            elif key == 'enabled':
                settings['enabled'] = value
            elif key == 'masterVolume':
                settings['masterVolume'] = value
            elif key == 'eq_low':
                settings['eq']['low'] = value
            elif key == 'eq_mid':
                settings['eq']['mid'] = value
            elif key == 'eq_high':
                settings['eq']['high'] = value
            elif key == 'eq_bass':
                settings['eq']['bass'] = value
            elif key == 'eq_treble':
                settings['eq']['treble'] = value
            elif key == 'audio_sampleRate':
                settings['audio']['sampleRate'] = value
            elif key == 'audio_bitDepth':
                settings['audio']['bitDepth'] = value
            elif key == 'audio_channels':
                settings['audio']['channels'] = value
            elif key == 'audio_bufferSize':
                settings['audio']['bufferSize'] = value
        
        return settings
    except Exception as e:
        print(f"Error getting audio settings: {e}")
        return {"volume": "100", "output": "default", "enabled": "true"}



@router.post("/update-all-durations")
def update_all_sound_durations(db: Session = Depends(get_db)):
    """Update durations for all sound files that don't have them"""
    sounds = crud.search_sounds(db, "", None)  # Get all sounds
    updated_count = 0
    
    for sound in sounds:
        if sound.duration is None and os.path.exists(sound.file_path):
            duration = calculate_audio_duration(sound.file_path)
            if duration is not None:
                sound.duration = duration
                updated_count += 1
    
    if updated_count > 0:
        db.commit()
        return {"message": f"Updated duration for {updated_count} sound files"}
    else:
        return {"message": "No sound files needed duration updates"}

@router.post("/{sound_id}/update-duration")
def update_sound_duration(sound_id: int, db: Session = Depends(get_db)):
    """Update the duration of a sound file"""
    sound = crud.get_sound(db, sound_id)
    if not sound:
        raise HTTPException(status_code=404, detail="Sound not found")
    
    if not os.path.exists(sound.file_path):
        raise HTTPException(status_code=404, detail="Sound file not found")
    
    # Calculate duration
    duration = calculate_audio_duration(sound.file_path)
    if duration is not None:
        sound.duration = duration
        db.commit()
        db.refresh(sound)
        return {"message": f"Duration updated to {duration} seconds", "duration": duration}
    else:
        raise HTTPException(status_code=500, detail="Could not calculate duration")

@router.post("/{sound_id}/stop")
def stop_sound(sound_id: int, db: Session = Depends(get_db)):
    """Stop a specific sound"""
    if sound_id in playing_processes:
        try:
            playing_processes[sound_id].terminate()
            del playing_processes[sound_id]
        except:
            pass
    return {"message": f"Stopped sound {sound_id}"}

@router.post("/stop-all")
def stop_all_audio():
    """Stop all currently playing audio"""
    global playing_processes
    for process in playing_processes.values():
        try:
            process.terminate()
        except:
            pass
    playing_processes.clear()
    
    # Also try to kill any audio processes
    import subprocess
    try:
        subprocess.run(['pkill', '-f', 'aplay'], capture_output=True)
        subprocess.run(['pkill', '-f', 'paplay'], capture_output=True)
        subprocess.run(['pkill', '-f', 'ffplay'], capture_output=True)
        subprocess.run(['pkill', '-f', 'mpg123'], capture_output=True)
        subprocess.run(['pkill', '-f', 'mpv'], capture_output=True)
    except:
        pass
    
    return {"message": "Stopped all audio"}

@router.get("/categories/stats")
def get_sound_categories_stats(db: Session = Depends(get_db)):
    """Get statistics about sound categories"""
    sounds = db.query(models.Sound).all()
    
    stats = {}
    for sound in sounds:
        if sound.type not in stats:
            stats[sound.type] = 0
        stats[sound.type] += 1
    
    return stats

@router.get("/debug/files")
def debug_files(db: Session = Depends(get_db)):
    """Debug endpoint to check file system vs database"""
    try:
        sounds = db.query(models.Sound).all()
        debug_info = []
        
        for sound in sounds:
            file_exists = os.path.exists(sound.file_path)
            file_size = os.path.getsize(sound.file_path) if file_exists else 0
            actual_path = os.path.abspath(sound.file_path)
            
            debug_info.append({
                "id": sound.id,
                "name": sound.name,
                "db_path": sound.file_path,
                "actual_path": actual_path,
                "exists": file_exists,
                "size": file_size,
                "type": sound.type
            })
        
        return {
            "debug_info": debug_info,
            "static_sounds_dir": os.path.abspath("./static/sounds"),
            "static_sounds_exists": os.path.exists("./static/sounds"),
            "static_sounds_contents": os.listdir("./static/sounds") if os.path.exists("./static/sounds") else []
        }
    except Exception as e:
        return {"error": str(e)}