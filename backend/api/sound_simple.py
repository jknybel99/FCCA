from fastapi import APIRouter, UploadFile, File, Form
from typing import List

router = APIRouter()

# Simple placeholder endpoints to prevent frontend crashes
@router.get("/")
def list_sounds():
    """Get all audio files - placeholder implementation"""
    return []

@router.post("/")
async def upload_sound(
    name: str = Form(...),
    description: str = Form(""),
    tags: str = Form(""),
    type: str = Form(...),
    file: UploadFile = File(...)
):
    """Upload sound - placeholder implementation"""
    return {"message": "Sound uploaded", "id": 1, "name": name}

@router.get("/{sound_id}")
def get_sound(sound_id: int):
    """Get sound by ID - placeholder implementation"""
    return {"id": sound_id, "name": "Placeholder Sound", "type": "bell"}

@router.put("/{sound_id}")
async def update_sound(sound_id: int, name: str = Form(...), description: str = Form(""), tags: str = Form(""), type: str = Form(...)):
    """Update sound - placeholder implementation"""
    return {"message": "Sound updated", "id": sound_id}

@router.delete("/{sound_id}")
def delete_sound(sound_id: int):
    """Delete sound - placeholder implementation"""
    return {"message": "Sound deleted"}

@router.post("/{sound_id}/play")
def play_sound(sound_id: int):
    """Play sound - placeholder implementation"""
    return {"message": "Sound playing", "id": sound_id}
