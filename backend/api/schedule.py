from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import SessionLocal
import crud, schemas
from typing import List, Optional
from datetime import date, datetime
from services.scheduler import bell_scheduler

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



# Bell Event management (must come before schedule_id routes)
@router.post("/events", response_model=schemas.BellEvent)
def create_bell_event(event: schemas.BellEventCreate, db: Session = Depends(get_db)):
    event_obj = crud.create_bell_event(db, event)
    bell_scheduler.refresh_schedule()
    return event_obj

@router.get("/events", response_model=List[schemas.BellEvent])
def list_bell_events(schedule_day_id: Optional[int] = None, db: Session = Depends(get_db)):
    return crud.get_bell_events(db, schedule_day_id)

@router.get("/events/{event_id}", response_model=schemas.BellEvent)
def get_bell_event(event_id: int, db: Session = Depends(get_db)):
    event = crud.get_bell_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Bell event not found")
    return event

@router.put("/events/{event_id}", response_model=schemas.BellEvent)
def update_bell_event(event_id: int, event_update: dict, db: Session = Depends(get_db)):
    event = crud.update_bell_event(db, event_id, event_update)
    if not event:
        raise HTTPException(status_code=404, detail="Bell event not found")
    # Temporarily disable scheduler refresh to test
    # bell_scheduler.refresh_schedule()
    return event

@router.delete("/events/{event_id}")
def delete_bell_event(event_id: int, db: Session = Depends(get_db)):
    event = crud.delete_bell_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Bell event not found")
    bell_scheduler.refresh_schedule()
    return {"message": "Bell event deleted"}

@router.delete("/events/similar/{event_id}")
def delete_similar_bell_events(event_id: int, db: Session = Depends(get_db)):
    """Delete all events with the same description and time across all days"""
    deleted_count = crud.delete_similar_bell_events(db, event_id)
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bell event not found")
    bell_scheduler.refresh_schedule()
    return {"message": f"Deleted {deleted_count} similar events"}

# Schedule management
@router.post("/", response_model=schemas.Schedule)
def create_schedule(schedule: schemas.ScheduleCreate, db: Session = Depends(get_db)):
    return crud.create_schedule(db, schedule)

@router.get("/", response_model=List[schemas.Schedule])
def list_schedules(db: Session = Depends(get_db)):
    return crud.get_schedules(db)

@router.get("/scheduled-dates")
def get_scheduled_dates_for_calendar(
    start_date: str = Query(None),
    end_date: str = Query(None),
    db: Session = Depends(get_db)
):
    """Get all scheduled dates for calendar view"""
    try:
        start = None
        end = None
        
        if start_date:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
        if end_date:
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        scheduled_dates = crud.get_scheduled_dates_for_calendar(db, start, end)
        return scheduled_dates
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting scheduled dates: {str(e)}")

@router.get("/next", response_model=schemas.NextEvent)
def get_next_event(db: Session = Depends(get_db)):
    next_event = bell_scheduler.get_next_event()
    if not next_event:
        raise HTTPException(status_code=404, detail="No upcoming events")
    return next_event

@router.get("/today", response_model=List[schemas.BellEvent])
def get_today_events(db: Session = Depends(get_db)):
    today = date.today()
    return crud.get_events_for_date(db, today)



@router.get("/{schedule_id}", response_model=schemas.Schedule)
def get_schedule(schedule_id: int, db: Session = Depends(get_db)):
    schedule = crud.get_schedule(db, schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return schedule

@router.put("/{schedule_id}", response_model=schemas.Schedule)
def update_schedule(schedule_id: int, schedule_update: dict, db: Session = Depends(get_db)):
    schedule = crud.update_schedule(db, schedule_id, schedule_update)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    bell_scheduler.refresh_schedule()
    return schedule

@router.delete("/{schedule_id}")
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    schedule = crud.delete_schedule(db, schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    bell_scheduler.refresh_schedule()
    return {"message": "Schedule deleted"}

@router.post("/{schedule_id}/mute", response_model=schemas.Schedule)
def mute_schedule(schedule_id: int, mute: bool, db: Session = Depends(get_db)):
    schedule = crud.mute_schedule(db, schedule_id, mute)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    bell_scheduler.refresh_schedule()
    return schedule

# Schedule day management
@router.post("/{schedule_id}/days", response_model=schemas.ScheduleDay)
def create_schedule_day(schedule_id: int, day: schemas.ScheduleDayCreate, db: Session = Depends(get_db)):
    schedule = crud.get_schedule(db, schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return crud.create_schedule_day(db, day, schedule_id)

@router.get("/{schedule_id}/days", response_model=List[schemas.ScheduleDay])
def get_schedule_days(schedule_id: int, db: Session = Depends(get_db)):
    return crud.get_schedule_days(db, schedule_id)

@router.get("/days/{schedule_day_id}/events", response_model=List[schemas.BellEvent])
def get_bell_events_by_day(schedule_day_id: int, db: Session = Depends(get_db)):
    return crud.get_bell_events_by_day(db, schedule_day_id)

@router.post("/days", response_model=schemas.ScheduleDay)
def create_schedule_day(day: schemas.ScheduleDayCreate, schedule_id: int, db: Session = Depends(get_db)):
    return crud.create_schedule_day(db, day, schedule_id)



@router.post("/{schedule_id}/replace", response_model=List[schemas.BellEvent])
def replace_repeating(schedule_id: int, old_sound_id: int, new_sound_id: int, repeat_tag: str, db: Session = Depends(get_db)):
    events = crud.replace_repeating_sound(db, schedule_id, old_sound_id, new_sound_id, repeat_tag)
    bell_scheduler.refresh_schedule()
    return events

# Special schedule management
@router.post("/special/", response_model=schemas.SpecialSchedule)
def create_special_schedule(special: schemas.SpecialScheduleCreate, db: Session = Depends(get_db)):
    special_obj = crud.create_special_schedule(db, special)
    return special_obj

@router.post("/special/activate")
def activate_special_schedule(
    activation_data: dict,
    db: Session = Depends(get_db)
):
    """Activate a special schedule for a specific date"""
    special_schedule_id = activation_data.get("special_schedule_id")
    target_date = activation_data.get("target_date")
    
    if not special_schedule_id or not target_date:
        raise HTTPException(status_code=400, detail="special_schedule_id and target_date are required")
    
    try:
        # Parse the date string
        if isinstance(target_date, str):
            target_date = datetime.strptime(target_date, "%Y-%m-%d").date()
        
        # Schedule the special schedule for the target date
        result = crud.schedule_special_schedule_for_date(db, special_schedule_id, target_date)
        bell_scheduler.refresh_schedule()
        return {"message": f"Special schedule activated for {target_date}", "success": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error activating special schedule: {str(e)}")

# Special schedule event management
@router.post("/special/{special_id}/events", response_model=schemas.SpecialBellEvent)
def create_special_bell_event(
    special_id: int,
    event: schemas.SpecialBellEventBase,
    db: Session = Depends(get_db)
):
    """Create a new bell event in a special schedule"""
    special_schedule = crud.get_special_schedule(db, special_id)
    if not special_schedule:
        raise HTTPException(status_code=404, detail="Special schedule not found")
    
    # Create the event in the special schedule
    bell_event = crud.create_special_bell_event(db, special_id, event)
    bell_scheduler.refresh_schedule()
    return bell_event

@router.get("/special/{special_id}/events", response_model=List[schemas.SpecialBellEvent])
def get_special_bell_events(special_id: int, db: Session = Depends(get_db)):
    """Get all bell events in a special schedule"""
    special_schedule = crud.get_special_schedule(db, special_id)
    if not special_schedule:
        raise HTTPException(status_code=404, detail="Special schedule not found")
    
    return crud.get_special_bell_events(db, special_id)

@router.put("/special/events/{event_id}", response_model=schemas.SpecialBellEvent)
def update_special_bell_event(
    event_id: int,
    event: schemas.SpecialBellEventBase,
    db: Session = Depends(get_db)
):
    """Update a bell event in a special schedule"""
    bell_event = crud.update_special_bell_event(db, event_id, event)
    if not bell_event:
        raise HTTPException(status_code=404, detail="Special bell event not found")
    
    bell_scheduler.refresh_schedule()
    return bell_event

@router.delete("/special/events/{event_id}")
def delete_special_bell_event(event_id: int, db: Session = Depends(get_db)):
    """Delete a bell event from a special schedule"""
    result = crud.delete_special_bell_event(db, event_id)
    if not result:
        raise HTTPException(status_code=404, detail="Special bell event not found")
    
    bell_scheduler.refresh_schedule()
    return {"message": "Special bell event deleted"}

# Removed SpecialScheduleDay and SpecialBellEvent endpoints - using date-specific scheduling only

@router.post("/special/{special_id}/schedule", response_model=schemas.SpecialSchedule)
def schedule_special_schedule(special_id: int, schedule_data: schemas.SpecialScheduleSchedule, db: Session = Depends(get_db)):
    scheduled = crud.schedule_special_schedule(db, special_id, schedule_data.date)
    bell_scheduler.refresh_schedule()
    return crud.get_special_schedule(db, special_id)

@router.get("/special/", response_model=List[schemas.SpecialSchedule])
def list_special_schedules(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    return crud.get_special_schedules(db, start_date, end_date)

@router.get("/special/{special_id}", response_model=schemas.SpecialSchedule)
def get_special_schedule(special_id: int, db: Session = Depends(get_db)):
    special = crud.get_special_schedule(db, special_id)
    if not special:
        raise HTTPException(status_code=404, detail="Special schedule not found")
    return special

@router.delete("/special/{special_id}")
def delete_special_schedule(special_id: int, db: Session = Depends(get_db)):
    special = crud.delete_special_schedule(db, special_id)
    if not special:
        raise HTTPException(status_code=404, detail="Special schedule not found")
    bell_scheduler.refresh_schedule()
    return {"message": "Special schedule deleted"}

@router.post("/special/activate-day")
def activate_special_schedule_for_day(
    activation_data: dict,
    db: Session = Depends(get_db)
):
    """Activate a special schedule for a specific day of week"""
    special_schedule_id = activation_data.get("special_schedule_id")
    day_of_week = activation_data.get("day_of_week")
    
    if not special_schedule_id or day_of_week is None:
        raise HTTPException(status_code=400, detail="special_schedule_id and day_of_week are required")
    
    try:
        # Activate the special schedule for the specific day of week
        result = crud.activate_special_schedule_for_day(db, special_schedule_id, day_of_week)
        bell_scheduler.refresh_schedule()
        return {"message": f"Special schedule activated for day {day_of_week}", "activation_id": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error activating special schedule: {str(e)}")

@router.post("/special/deactivate-day")
def deactivate_special_schedule_for_day(
    deactivation_data: dict,
    db: Session = Depends(get_db)
):
    """Deactivate a special schedule for a specific day of week"""
    special_schedule_id = deactivation_data.get("special_schedule_id")
    day_of_week = deactivation_data.get("day_of_week")
    
    if not special_schedule_id or day_of_week is None:
        raise HTTPException(status_code=400, detail="special_schedule_id and day_of_week are required")
    
    try:
        # Deactivate the special schedule for the specific day of week
        result = crud.deactivate_special_schedule_for_day(db, special_schedule_id, day_of_week)
        bell_scheduler.refresh_schedule()
        return {"message": f"Special schedule deactivated for day {day_of_week}", "activation_id": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deactivating special schedule: {str(e)}")

@router.post("/mute-all")
def mute_all_schedules(mute_data: dict, db: Session = Depends(get_db)):
    mute = mute_data.get("mute", False)
    bell_scheduler.mute_all(mute)
    return {"message": f"All schedules {'muted' if mute else 'unmuted'}"}

@router.post("/refresh")
def refresh_schedule():
    bell_scheduler.refresh_schedule()
    return {"message": "Schedule refreshed"}

@router.get("/status")
def get_scheduler_status():
    return {
        "scheduler_running": bell_scheduler.is_running,
        "active_jobs": len(bell_scheduler.current_jobs),
        "current_time": datetime.now().isoformat()
    }

@router.post("/special/schedule-date")
def schedule_special_schedule_for_date(
    schedule_data: dict,
    db: Session = Depends(get_db)
):
    """Schedule a special schedule for a specific date (not recurring)"""
    special_schedule_id = schedule_data.get("special_schedule_id")
    target_date = schedule_data.get("target_date")
    
    if not special_schedule_id or not target_date:
        raise HTTPException(status_code=400, detail="special_schedule_id and target_date are required")
    
    try:
        # Parse the date string
        if isinstance(target_date, str):
            target_date = datetime.strptime(target_date, "%Y-%m-%d").date()
        
        # Schedule the special schedule for the target date
        result = crud.schedule_special_schedule_for_date(db, special_schedule_id, target_date)
        bell_scheduler.refresh_schedule()
        return {"message": f"Special schedule scheduled for {target_date}", "success": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error scheduling special schedule: {str(e)}")

@router.post("/special/unschedule-date")
def unschedule_special_schedule_for_date(
    unschedule_data: dict,
    db: Session = Depends(get_db)
):
    """Remove special schedule from a specific date (revert to regular)"""
    target_date = unschedule_data.get("target_date")
    
    if not target_date:
        raise HTTPException(status_code=400, detail="target_date is required")
    
    try:
        # Parse the date string
        if isinstance(target_date, str):
            target_date = datetime.strptime(target_date, "%Y-%m-%d").date()
        
        # Remove the special schedule from the target date
        result = crud.unschedule_special_schedule_for_date(db, target_date)
        bell_scheduler.refresh_schedule()
        return {"message": f"Special schedule removed from {target_date}", "success": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error removing special schedule: {str(e)}")

@router.get("/special/date/{target_date}")
def get_special_schedule_for_date(
    target_date: str,
    db: Session = Depends(get_db)
):
    """Get the special schedule active for a specific date"""
    try:
        # Parse the date string
        parsed_date = datetime.strptime(target_date, "%Y-%m-%d").date()
        
        # Get the special schedule for the target date
        special_schedule = crud.get_special_schedule_for_specific_date(db, parsed_date)
        if special_schedule:
            return special_schedule
        else:
            return {"message": "No special schedule for this date"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting special schedule: {str(e)}")



# System operations (must come after all other routes)

@router.post("/events/copy", response_model=List[schemas.BellEvent])
def copy_bell_event_to_days(
    request: dict,
    db: Session = Depends(get_db)
):
    """Copy a bell event to multiple schedule days"""
    event_id = request.get("event_id")
    target_day_ids = request.get("target_day_ids", [])
    
    if not event_id or not target_day_ids:
        raise HTTPException(status_code=400, detail="event_id and target_day_ids are required")
    
    events = crud.copy_bell_event_to_days(db, event_id, target_day_ids)
    bell_scheduler.refresh_schedule()
    return events
