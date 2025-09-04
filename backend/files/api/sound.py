from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Sound
from typing import List

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=dict)
async def upload_sound(
    name: str = Form(...),
    description: str = Form(""),
    tags: str = Form(""),
    type: str = Form(...),  # bell, music, announcement
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Save file and create Sound entry (simplified)
    file_location = f"static/{file.filename}"
    with open(file_location, "wb") as f:
        f.write(await file.read())
    sound = Sound(name=name, file_path=file_location, description=description, tags=tags, type=type)
    db.add(sound)
    db.commit()
    db.refresh(sound)
    return {"id": sound.id, "name": sound.name}

@router.get("/", response_model=List[dict])
def search_sounds(q: str = "", db: Session = Depends(get_db)):
    query = db.query(Sound)
    if q:
        query = query.filter(Sound.name.contains(q) | Sound.description.contains(q) | Sound.tags.contains(q))
    return [{"id": s.id, "name": s.name, "tags": s.tags, "type": s.type} for s in query.all()]