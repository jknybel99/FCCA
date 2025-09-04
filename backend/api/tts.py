from fastapi import APIRouter, Form, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import SessionLocal
import os
import uuid
import subprocess
import re
import time
import crud
import schemas
from typing import Optional

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Available voices with their languages
VOICES = {
    'en': {
        'path': 'piper/en_US-amy-medium.onnx',
        'name': 'English (Amy)',
        'language': 'en'
    },
    'es': {
        'path': 'piper/es_AR-daniela-high.onnx', 
        'name': 'Spanish (Daniela)',
        'language': 'es'
    }
}

# Mock TTS mode for testing (when Piper is not compatible)
MOCK_TTS_MODE = True  # Set to False to try real Piper

def detect_language(text: str) -> str:
    """Simple language detection based on character patterns"""
    # Count Spanish-specific characters
    spanish_chars = len(re.findall(r'[áéíóúñüÁÉÍÓÚÑÜ]', text))
    # Count English-specific patterns
    english_patterns = len(re.findall(r'\b(the|and|or|but|in|on|at|to|for|of|with|by)\b', text.lower()))
    
    # If Spanish characters are present, likely Spanish
    if spanish_chars > 0:
        return 'es'
    # If English patterns are present, likely English
    elif english_patterns > 0:
        return 'en'
    # Default to English
    else:
        return 'en'

def create_mock_audio_file(text: str, output_path: str) -> bool:
    """Create a mock audio file for testing purposes"""
    try:
        # Create a simple WAV file header (44.1kHz, 16-bit, mono)
        sample_rate = 44100
        duration = max(1.0, len(text) * 0.1)  # 0.1 seconds per character, minimum 1 second
        num_samples = int(sample_rate * duration)
        
        # Create a simple sine wave tone
        frequency = 440  # A4 note
        amplitude = 0.3
        
        import wave
        import struct
        
        with wave.open(output_path, 'w') as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(sample_rate)
            
            for i in range(num_samples):
                # Generate a simple sine wave
                sample = amplitude * (2**15 - 1) * (i % 100 < 50)  # Square wave for simplicity
                wav_file.writeframes(struct.pack('<h', int(sample)))
        
        return True
    except Exception as e:
        print(f"Mock audio creation failed: {e}")
        return False

def calculate_audio_duration(file_path: str) -> Optional[int]:
    """Calculate audio duration in seconds using pydub or ffprobe"""
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

def add_tts_file_to_database(db: Session, file_path: str, text: str, language: str) -> bool:
    """Add TTS-generated file to the database as a Sound record"""
    try:
        # Generate a descriptive name for the TTS file
        name = f"TTS_{language.upper()}_{text[:30]}{'...' if len(text) > 30 else ''}"
        
        # Calculate duration using the same method as the sound upload system
        duration = calculate_audio_duration(file_path)
        
        # Create sound record
        sound_data = schemas.SoundCreate(
            name=name,
            description=f"TTS generated audio: {text}",
            tags=f"tts,{language},auto-generated",
            type="announcement",  # Categorize as announcement
            duration=duration
        )
        
        # Add to database - file_path is a separate parameter
        sound = crud.create_sound(db, sound_data, file_path)
        if sound:
            print(f"TTS file added to database: {sound.id} - {sound.name} (duration: {duration}s)")
            return True
        else:
            print(f"Failed to add TTS file to database: {file_path}")
            return False
            
    except Exception as e:
        print(f"Error adding TTS file to database: {e}")
        return False

@router.post("/announce")
async def tts_announce(
    text: str = Form(...),
    language: str = Form(None),
    db: Session = Depends(get_db)
):
    """Generate TTS audio with automatic language detection"""
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    # Auto-detect language if not specified
    if not language:
        language = detect_language(text)
    
    # Get voice configuration
    voice_config = VOICES.get(language, VOICES['en'])
    voice_path = os.path.abspath(voice_config['path'])
    
    # Create output directory
    os.makedirs("static/sounds", exist_ok=True)
    output_name = f"tts_{uuid.uuid4().hex[:8]}.wav"
    output_path = f"static/sounds/{output_name}"
    
    if MOCK_TTS_MODE:
        # Use mock TTS for testing
        print(f"Mock TTS: Generating audio for '{text}' in {language}")
        
        # Simulate processing time
        time.sleep(1)
        
        if create_mock_audio_file(text, output_path):
            # Add to database
            add_tts_file_to_database(db, output_path, text, language)
            
            return FileResponse(
                output_path, 
                media_type="audio/wav",
                headers={"Content-Disposition": f"attachment; filename={output_name}"}
            )
        else:
            raise HTTPException(status_code=500, detail="Mock TTS generation failed")
    
    else:
        # Try real Piper TTS
        if not os.path.exists(voice_path):
            raise HTTPException(status_code=500, detail=f"Voice file not found: {voice_path}")
        
        # Generate TTS using piper
        piper_path = os.path.abspath("piper/piper")
        cmd = [
            piper_path,
            "--model", voice_path,
            "--output_file", output_path,
            "--sentence", text
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            if result.returncode != 0:
                raise HTTPException(
                    status_code=500, 
                    detail=f"TTS generation failed: {result.stderr}"
                )
            
            # Add to database
            add_tts_file_to_database(db, output_path, text, language)
            
            return FileResponse(
                output_path, 
                media_type="audio/wav",
                headers={"Content-Disposition": f"attachment; filename={output_name}"}
            )
        except subprocess.TimeoutExpired:
            raise HTTPException(status_code=500, detail="TTS generation timed out")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"TTS generation error: {str(e)}")

@router.get("/voices")
async def get_available_voices():
    """Get list of available voices"""
    return {
        "voices": VOICES,
        "default_language": "en",
        "mock_mode": MOCK_TTS_MODE,
        "note": "Mock mode enabled for testing - generates test audio files"
    }

@router.post("/detect-language")
async def detect_text_language(text: str = Form(...)):
    """Detect the language of given text"""
    detected_lang = detect_language(text)
    return {
        "text": text,
        "detected_language": detected_lang,
        "voice_name": VOICES[detected_lang]['name']
    }

@router.get("/status")
async def get_tts_status():
    """Get TTS system status and configuration"""
    piper_path = os.path.abspath("piper/piper")
    piper_exists = os.path.exists(piper_path)
    
    # Check if voice files exist
    voice_status = {}
    for lang, voice in VOICES.items():
        voice_path = os.path.abspath(voice['path'])
        voice_status[lang] = {
            'name': voice['name'],
            'path': voice['path'],
            'exists': os.path.exists(voice_path),
            'size': os.path.getsize(voice_path) if os.path.exists(voice_path) else 0
        }
    
    return {
        "mock_mode": MOCK_TTS_MODE,
        "piper_executable": {
            "path": piper_path,
            "exists": piper_exists,
            "executable": os.access(piper_path, os.X_OK) if piper_exists else False
        },
        "voices": voice_status,
        "output_directory": "static/sounds",
        "note": "Mock mode generates test audio files for development/testing"
    }
