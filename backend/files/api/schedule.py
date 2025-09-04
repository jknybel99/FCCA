from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Schedule, SpecialSchedule, BellEvent
from typing import List

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[dict])
def list_schedules(db: Session = Depends(get_db)):
    schedules = db.query(Schedule).all()
    return [{"id": s.id, "name": s.name, "is_default": s.is_default, "is_muted": s.is_muted} for s in schedules]

# More endpoints: create, update, assign special, mute/unmute, replace sound, etc.