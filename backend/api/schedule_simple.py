from fastapi import APIRouter
from typing import List

router = APIRouter()

# Simple placeholder endpoints to prevent frontend crashes
@router.get("/events")
def list_bell_events():
    """Get all bell events - placeholder implementation"""
    return []

@router.get("/next")
def get_next_event():
    """Get next event - placeholder implementation"""
    return {"message": "No upcoming events"}

@router.get("/days/{day_id}/events")
def get_bell_events_by_day(day_id: int):
    """Get bell events for a specific day - placeholder implementation"""
    return []

@router.post("/events")
def create_bell_event(event: dict):
    """Create bell event - placeholder implementation"""
    return {"message": "Event created", "id": 1}

@router.put("/events/{event_id}")
def update_bell_event(event_id: int, event: dict):
    """Update bell event - placeholder implementation"""
    return {"message": "Event updated"}

@router.delete("/events/{event_id}")
def delete_bell_event(event_id: int):
    """Delete bell event - placeholder implementation"""
    return {"message": "Event deleted"}

@router.delete("/events/similar/{event_id}")
def delete_similar_bell_events(event_id: int):
    """Delete similar bell events - placeholder implementation"""
    return {"message": "Similar events deleted", "count": 0}
