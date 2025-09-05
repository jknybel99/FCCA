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
import requests
import json

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Available voices with their languages and download URLs
VOICES = {
    'en': {
        'path': 'piper/en_US-amy-medium.onnx',
        'name': 'English (Amy)',
        'language': 'en',
        'download_url': 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/amy/medium/en_US-amy-medium.onnx',
        'size': '~50MB'
    },
    'es': {
        'path': 'piper/es_AR-daniela-high.onnx', 
        'name': 'Spanish (Daniela)',
        'language': 'es',
        'download_url': 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/es/es_AR/daniela/high/es_AR-daniela-high.onnx',
        'size': '~50MB'
    }
}

# Dynamic voice system - will be populated from voices.json
ADDITIONAL_VOICES = {}
VOICES_CACHE = None
VOICES_CACHE_TIMESTAMP = None
CACHE_DURATION = 3600  # 1 hour cache

# Mock TTS mode for testing (when Piper is not compatible)
MOCK_TTS_MODE = True  # Set to False to try real Piper

def fetch_all_voices() -> dict:
    """Fetch all available voices from the Piper TTS repository"""
    global VOICES_CACHE, VOICES_CACHE_TIMESTAMP
    
    # Check if cache is still valid
    import time
    current_time = time.time()
    if VOICES_CACHE and VOICES_CACHE_TIMESTAMP and (current_time - VOICES_CACHE_TIMESTAMP) < CACHE_DURATION:
        return VOICES_CACHE
    
    try:
        import requests
        print("Fetching voices from Piper TTS repository...")
        response = requests.get("https://huggingface.co/rhasspy/piper-voices/raw/main/voices.json", timeout=60)
        response.raise_for_status()
        voices_data = response.json()
        print(f"Fetched {len(voices_data)} voices from repository")
        
        # Process and organize voices
        organized_voices = {}
        processed_count = 0
        
        for voice_key, voice_info in voices_data.items():
            try:
                # Extract language info
                lang_info = voice_info.get('language', {})
                language_code = lang_info.get('code', 'unknown')
                language_name = lang_info.get('name_english', 'Unknown')
                country = lang_info.get('country_english', '')
                
                # Create a more descriptive name
                if country:
                    display_name = f"{language_name} ({country})"
                else:
                    display_name = language_name
                
                # Get file path for download
                files = voice_info.get('files', {})
                onnx_file = None
                for file_path in files.keys():
                    if file_path.endswith('.onnx'):
                        onnx_file = file_path
                        break
                
                if onnx_file:
                    # Create voice entry
                    voice_entry = {
                        'path': f"piper/{voice_key}.onnx",
                        'name': f"{display_name} ({voice_info.get('name', 'Unknown')} - {voice_info.get('quality', 'unknown').title()} Quality)",
                        'language': lang_info.get('family', 'unknown'),
                        'language_code': language_code,
                        'language_name': language_name,
                        'country': country,
                        'voice_name': voice_info.get('name', 'Unknown'),
                        'quality': voice_info.get('quality', 'unknown'),
                        'download_url': f"https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/{onnx_file}",
                        'size': f"~{files[onnx_file].get('size_bytes', 0) // (1024*1024)}MB" if onnx_file in files else "~60MB"
                    }
                    
                    organized_voices[voice_key] = voice_entry
                    processed_count += 1
                    
            except Exception as e:
                print(f"Error processing voice {voice_key}: {e}")
                continue
        
        print(f"Successfully processed {processed_count} voices")
        
        # Cache the results
        VOICES_CACHE = organized_voices
        VOICES_CACHE_TIMESTAMP = current_time
        
        return organized_voices
        
    except Exception as e:
        print(f"Error fetching voices: {e}")
        # Return empty dict instead of crashing
        return {}

def get_voices_by_language() -> dict:
    """Get voices organized by language family"""
    all_voices = fetch_all_voices()
    organized = {}
    
    for voice_key, voice_info in all_voices.items():
        lang_family = voice_info.get('language', 'unknown')
        if lang_family not in organized:
            organized[lang_family] = {
                'language_name': voice_info.get('language_name', 'Unknown'),
                'voices': []
            }
        
        organized[lang_family]['voices'].append({
            'key': voice_key,
            'name': voice_info['name'],
            'country': voice_info.get('country', ''),
            'quality': voice_info['quality'],
            'size': voice_info['size'],
            'download_url': voice_info['download_url']
        })
    
    # Sort voices within each language by country and quality
    for lang_family in organized:
        organized[lang_family]['voices'].sort(key=lambda x: (x['country'], x['quality']))
    
    return organized

def detect_language(text: str) -> str:
    """Comprehensive language detection based on character patterns and common words"""
    text_lower = text.lower().strip()
    
    if not text_lower:
        return 'en'
    
    # Language-specific characters and patterns
    spanish_chars = len(re.findall(r'[áéíóúñüÁÉÍÓÚÑÜ]', text))
    polish_chars = len(re.findall(r'[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]', text))
    french_chars = len(re.findall(r'[àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]', text))
    german_chars = len(re.findall(r'[äöüßÄÖÜ]', text))
    
    # Language-specific common words
    spanish_words = [
        'como', 'estas', 'estoy', 'bien', 'gracias', 'hola', 'adios', 'si', 'no',
        'que', 'de', 'la', 'el', 'en', 'un', 'una', 'es', 'son', 'con', 'por',
        'para', 'del', 'las', 'los', 'muy', 'mas', 'menos', 'todo', 'nada',
        'aqui', 'alli', 'donde', 'cuando', 'porque', 'quien', 'cual', 'esta',
        'este', 'esta', 'estos', 'estas', 'tambien', 'pero', 'solo', 'hasta'
    ]
    
    polish_words = [
        'gdzie', 'jestes', 'jest', 'jestem', 'tak', 'nie', 'dziekuje', 'czesc',
        'witaj', 'do', 'z', 'na', 'w', 'i', 'lub', 'ale', 'tez', 'tylko',
        'bardzo', 'wszystko', 'nic', 'tutaj', 'tam', 'kiedy', 'dlaczego', 'kto',
        'ktory', 'jak', 'co', 'gdy', 'jesli', 'choc', 'az', 'dopoki', 'dopiero'
    ]
    
    english_words = [
        'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
        'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
        'after', 'above', 'below', 'between', 'among', 'hello', 'goodbye',
        'yes', 'no', 'how', 'what', 'where', 'when', 'why', 'who', 'which',
        'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be',
        'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would'
    ]
    
    french_words = [
        'bonjour', 'salut', 'merci', 'oui', 'non', 'comment', 'que', 'de', 'la',
        'le', 'et', 'ou', 'mais', 'dans', 'sur', 'avec', 'pour', 'par', 'du',
        'des', 'les', 'un', 'une', 'est', 'sont', 'etre', 'avoir', 'faire',
        'aller', 'venir', 'voir', 'savoir', 'pouvoir', 'vouloir', 'dire'
    ]
    
    german_words = [
        'hallo', 'danke', 'ja', 'nein', 'wie', 'was', 'wo', 'wann', 'warum',
        'wer', 'welcher', 'der', 'die', 'das', 'und', 'oder', 'aber', 'in',
        'auf', 'mit', 'fur', 'von', 'zu', 'ist', 'sind', 'sein', 'haben',
        'machen', 'gehen', 'kommen', 'sehen', 'wissen', 'konnen', 'wollen'
    ]
    
    # Count words for each language
    spanish_count = sum(1 for word in spanish_words if word in text_lower)
    polish_count = sum(1 for word in polish_words if word in text_lower)
    english_count = sum(1 for word in english_words if word in text_lower)
    french_count = sum(1 for word in french_words if word in text_lower)
    german_count = sum(1 for word in german_words if word in text_lower)
    
    # Scoring system - characters are worth more than words
    scores = {
        'es': spanish_chars * 3 + spanish_count + (5 if spanish_chars > 0 else 0),
        'pl': polish_chars * 3 + polish_count + (5 if polish_chars > 0 else 0),
        'en': english_count,
        'fr': french_chars * 3 + french_count + (5 if french_chars > 0 else 0),
        'de': german_chars * 3 + german_count + (5 if german_chars > 0 else 0)
    }
    
    # Find the language with the highest score
    detected_language = max(scores, key=scores.get)
    
    # Only return the detected language if it has a meaningful score
    if scores[detected_language] > 0:
        return detected_language
    else:
        # Default to English if no clear language detected
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

def download_voice_file(voice_id: str) -> dict:
    """Download a voice file from the internet"""
    # Check VOICES first, then dynamic voices
    voice_config = None
    if voice_id in VOICES:
        voice_config = VOICES[voice_id]
    else:
        # Get from dynamic voices
        all_voices = fetch_all_voices()
        if voice_id in all_voices:
            voice_config = all_voices[voice_id]
        else:
            return {"success": False, "error": f"Unknown voice: {voice_id}"}
    
    voice_path = os.path.abspath(voice_config['path'])
    
    # Create piper directory if it doesn't exist
    os.makedirs(os.path.dirname(voice_path), exist_ok=True)
    
    # Check if file already exists
    if os.path.exists(voice_path):
        return {"success": True, "message": f"Voice file already exists: {voice_config['name']}"}
    
    try:
        print(f"Downloading voice file for {voice_config['name']}...")
        response = requests.get(voice_config['download_url'], stream=True, timeout=300)
        response.raise_for_status()
        
        # Download the file
        with open(voice_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        # Verify the file was downloaded
        if os.path.exists(voice_path) and os.path.getsize(voice_path) > 0:
            return {
                "success": True, 
                "message": f"Successfully downloaded {voice_config['name']}",
                "size": os.path.getsize(voice_path)
            }
        else:
            return {"success": False, "error": "Downloaded file is empty or corrupted"}
            
    except requests.exceptions.RequestException as e:
        return {"success": False, "error": f"Download failed: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Unexpected error: {str(e)}"}

@router.post("/download-voice")
async def download_voice(voice_id: str = Form(...)):
    """Download a voice file for the specified voice ID"""
    if not voice_id:
        raise HTTPException(status_code=400, detail="Voice ID parameter is required")
    
    result = download_voice_file(voice_id)
    
    if result["success"]:
        return result
    else:
        raise HTTPException(status_code=500, detail=result["error"])

@router.post("/remove-voice")
async def remove_voice(voice_id: str = Form(...)):
    """Remove a downloaded voice file"""
    if not voice_id:
        raise HTTPException(status_code=400, detail="Voice ID parameter is required")
    
    try:
        # Check if it's a core voice (can't be removed)
        if voice_id in VOICES:
            return {"success": False, "error": "Core voices cannot be removed"}
        
        # Check if it's a downloaded voice
        all_voices = fetch_all_voices()
        if voice_id not in all_voices:
            return {"success": False, "error": "Voice not found"}
        
        voice_config = all_voices[voice_id]
        voice_path = os.path.abspath(voice_config['path'])
        
        # Check if file exists
        if not os.path.exists(voice_path):
            return {"success": False, "error": "Voice file not found"}
        
        # Remove the file
        os.remove(voice_path)
        
        return {
            "success": True, 
            "message": f"Successfully removed voice: {voice_config['name']}"
        }
        
    except Exception as e:
        return {"success": False, "error": f"Failed to remove voice: {str(e)}"}

@router.post("/toggle-mock-mode")
async def toggle_mock_mode(mock_mode: bool = Form(...)):
    """Toggle TTS mock mode on/off"""
    global MOCK_TTS_MODE
    MOCK_TTS_MODE = mock_mode
    
    return {
        "success": True,
        "mock_mode": MOCK_TTS_MODE,
        "message": f"Mock mode {'enabled' if MOCK_TTS_MODE else 'disabled'}"
    }

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
    # Add download status for each core voice
    voices_with_status = {}
    for voice_id, voice in VOICES.items():
        voice_path = os.path.abspath(voice['path'])
        voices_with_status[voice_id] = {
            **voice,
            'exists': os.path.exists(voice_path),
            'size_bytes': os.path.getsize(voice_path) if os.path.exists(voice_path) else 0
        }
    
    # Get all dynamic voices with download status
    all_voices = fetch_all_voices()
    additional_voices_with_status = {}
    for voice_id, voice in all_voices.items():
        voice_path = os.path.abspath(voice['path'])
        additional_voices_with_status[voice_id] = {
            **voice,
            'exists': os.path.exists(voice_path),
            'size_bytes': os.path.getsize(voice_path) if os.path.exists(voice_path) else 0
        }
    
    return {
        "voices": voices_with_status,
        "additional_voices": additional_voices_with_status,
        "voices_by_language": get_voices_by_language(),
        "default_language": "en",
        "mock_mode": MOCK_TTS_MODE,
        "note": "Mock mode enabled for testing - generates test audio files"
    }

@router.get("/languages")
async def get_languages():
    """Get all available languages with statistics"""
    voices_by_lang = get_voices_by_language()
    
    languages = []
    for lang_family, lang_data in voices_by_lang.items():
        voices = lang_data['voices']
        languages.append({
            'family': lang_family,
            'name': lang_data['language_name'],
            'voice_count': len(voices),
            'countries': list(set(voice['country'] for voice in voices if voice['country'])),
            'qualities': list(set(voice['quality'] for voice in voices)),
            'total_size_mb': sum(int(voice['size'].replace('~', '').replace('MB', '')) for voice in voices if 'MB' in voice['size'])
        })
    
    # Sort by voice count (most voices first)
    languages.sort(key=lambda x: x['voice_count'], reverse=True)
    
    return {
        'languages': languages,
        'total_languages': len(languages),
        'total_voices': sum(lang['voice_count'] for lang in languages)
    }

@router.post("/detect-language")
async def detect_text_language(text: str = Form(...)):
    """Detect the language of given text"""
    detected_lang = detect_language(text)
    
    # Get voice name from available voices
    voice_name = "Unknown"
    if detected_lang in VOICES:
        voice_name = VOICES[detected_lang]['name']
    else:
        # Check if we have voices for this language in the dynamic voices
        all_voices = fetch_all_voices()
        for voice_id, voice_info in all_voices.items():
            if voice_info.get('language_code') == detected_lang:
                voice_name = voice_info['name']
                break
    
    return {
        "text": text,
        "detected_language": detected_lang,
        "voice_name": voice_name
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
