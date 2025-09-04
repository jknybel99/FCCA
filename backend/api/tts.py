from fastapi import APIRouter, Form, HTTPException
from fastapi.responses import FileResponse
import os
import uuid
import subprocess
import re

router = APIRouter()

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

@router.post("/announce")
async def tts_announce(
    text: str = Form(...),
    language: str = Form(None)
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
    
    if not os.path.exists(voice_path):
        raise HTTPException(status_code=500, detail=f"Voice file not found: {voice_path}")
    
    # Create output directory
    os.makedirs("static/sounds", exist_ok=True)
    output_name = f"tts_{uuid.uuid4().hex[:8]}.wav"
    output_path = f"static/sounds/{output_name}"
    
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
        "default_language": "en"
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
