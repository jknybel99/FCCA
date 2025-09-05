from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime, date, time, timedelta
from typing import List, Optional
import hashlib
import os

# Import models and schemas after other imports to avoid circular dependencies
import models
import schemas

# Sound operations
def create_sound(db: Session, sound: schemas.SoundCreate, file_path: str):
    db_sound = models.Sound(**sound.dict(), file_path=file_path)
    db.add(db_sound)
    db.commit()
    db.refresh(db_sound)
    return db_sound

def get_sound(db: Session, sound_id: int):
    return db.query(models.Sound).filter(models.Sound.id == sound_id).first()

def search_sounds(db: Session, query: str = "", sound_type: str = None):
    q = db.query(models.Sound)
    if query:
        q = q.filter(
            or_(
                models.Sound.name.contains(query),
                models.Sound.description.contains(query),
                models.Sound.tags.contains(query)
            )
        )
    if sound_type:
        q = q.filter(models.Sound.type == sound_type)
    return q.all()

def get_sounds_by_type(db: Session, sound_type: str):
    return db.query(models.Sound).filter(models.Sound.type == sound_type).all()

def delete_sound(db: Session, sound_id: int):
    sound = db.query(models.Sound).filter(models.Sound.id == sound_id).first()
    if sound and sound.file_path and os.path.exists(sound.file_path):
        os.remove(sound.file_path)
    db.delete(sound)
    db.commit()
    return sound

# Schedule operations
def create_schedule(db: Session, schedule: schemas.ScheduleCreate):
    db_schedule = models.Schedule(**schedule.dict())
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule

def get_schedules(db: Session):
    return db.query(models.Schedule).all()

def get_schedule(db: Session, schedule_id: int):
    return db.query(models.Schedule).filter(models.Schedule.id == schedule_id).first()

def get_default_schedule(db: Session):
    return db.query(models.Schedule).filter(models.Schedule.is_default == True).first()

def update_schedule(db: Session, schedule_id: int, schedule_update: dict):
    schedule = db.query(models.Schedule).filter(models.Schedule.id == schedule_id).first()
    if schedule:
        for key, value in schedule_update.items():
            setattr(schedule, key, value)
        db.commit()
        db.refresh(schedule)
    return schedule

def delete_schedule(db: Session, schedule_id: int):
    schedule = db.query(models.Schedule).filter(models.Schedule.id == schedule_id).first()
    if schedule:
        db.delete(schedule)
        db.commit()
    return schedule

def mute_schedule(db: Session, schedule_id: int, mute: bool):
    schedule = db.query(models.Schedule).filter(models.Schedule.id == schedule_id).first()
    if schedule:
        schedule.is_muted = mute
        db.commit()
        db.refresh(schedule)
    return schedule

# Schedule Day operations
def create_schedule_day(db: Session, schedule_day: schemas.ScheduleDayCreate, schedule_id: int):
    db_schedule_day = models.ScheduleDay(**schedule_day.dict(), schedule_id=schedule_id)
    db.add(db_schedule_day)
    db.commit()
    db.refresh(db_schedule_day)
    return db_schedule_day

def get_schedule_day(db: Session, schedule_day_id: int):
    return db.query(models.ScheduleDay).filter(models.ScheduleDay.id == schedule_day_id).first()

def get_schedule_days(db: Session, schedule_id: int):
    return db.query(models.ScheduleDay).filter(models.ScheduleDay.schedule_id == schedule_id).all()

# Bell Event operations
def create_bell_event(db: Session, event: schemas.BellEventCreate):
    db_event = models.BellEvent(**event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def get_bell_events(db: Session, schedule_day_id: Optional[int] = None):
    q = db.query(models.BellEvent).join(models.Sound, isouter=True)
    if schedule_day_id:
        q = q.filter(models.BellEvent.schedule_day_id == schedule_day_id)
    return q.filter(models.BellEvent.is_active == True).order_by(models.BellEvent.time).all()

def get_bell_events_by_day(db: Session, schedule_day_id: int):
    """Get all bell events for a specific schedule day"""
    q = db.query(models.BellEvent).join(models.Sound, isouter=True)
    return q.filter(
        models.BellEvent.schedule_day_id == schedule_day_id,
        models.BellEvent.is_active == True
    ).order_by(models.BellEvent.time).all()

def get_bell_event(db: Session, event_id: int):
    return db.query(models.BellEvent).filter(models.BellEvent.id == event_id).first()

def update_bell_event(db: Session, event_id: int, event_update: dict):
    event = db.query(models.BellEvent).filter(models.BellEvent.id == event_id).first()
    if event:
        # Convert time string to time object if provided
        if 'time' in event_update and isinstance(event_update['time'], str):
            from datetime import datetime
            event_update['time'] = datetime.strptime(event_update['time'], "%H:%M:%S").time()
        
        for key, value in event_update.items():
            setattr(event, key, value)
        db.commit()
        db.refresh(event)
    return event

def delete_bell_event(db: Session, event_id: int):
    event = db.query(models.BellEvent).filter(models.BellEvent.id == event_id).first()
    if event:
        db.delete(event)
        db.commit()
    return event

def delete_similar_bell_events(db: Session, event_id: int):
    """Delete all events with the same description and time across all days in the schedule"""
    original_event = db.query(models.BellEvent).filter(models.BellEvent.id == event_id).first()
    if not original_event:
        return 0
    
    # Get the schedule day to find the schedule ID
    schedule_day = db.query(models.ScheduleDay).filter(models.ScheduleDay.id == original_event.schedule_day_id).first()
    if not schedule_day:
        return 0
    
    similar_events = db.query(models.BellEvent).join(models.ScheduleDay).filter(
        models.ScheduleDay.schedule_id == schedule_day.schedule_id,
        models.BellEvent.time == original_event.time,
        models.BellEvent.description == original_event.description
    ).all()
    
    deleted_count = len(similar_events)
    for event in similar_events:
        db.delete(event)
    
    db.commit()
    return deleted_count

def replace_repeating_sound(db: Session, schedule_id: int, old_sound_id: int, new_sound_id: int, repeat_tag: str):
    events = db.query(models.BellEvent).join(models.ScheduleDay).filter(
        models.ScheduleDay.schedule_id == schedule_id,
        models.BellEvent.sound_id == old_sound_id,
        models.BellEvent.repeat_tag == repeat_tag
    ).all()
    for event in events:
        event.sound_id = new_sound_id
    db.commit()
    return events

# Special Schedule operations
def create_special_schedule(db: Session, special_schedule: schemas.SpecialScheduleCreate):
    """Create a new special schedule"""
    db_special = models.SpecialSchedule(**special_schedule.dict())
    db.add(db_special)
    db.commit()
    db.refresh(db_special)
    return db_special

def create_special_schedule_day(db: Session, special_day: schemas.SpecialScheduleDayCreate, special_schedule_id: int):
    """Create a new special schedule day"""
    db_day = models.SpecialScheduleDay(**special_day.dict(), special_schedule_id=special_schedule_id)
    db.add(db_day)
    db.commit()
    db.refresh(db_day)
    return db_day

def create_special_bell_event(db: Session, event: schemas.SpecialBellEventCreate, special_day_id: int):
    """Create a new special bell event"""
    # Convert time string to time object for SQLite
    from datetime import datetime
    time_obj = datetime.strptime(event.time, "%H:%M:%S").time()
    
    event_data = event.dict()
    event_data['time'] = time_obj
    event_data['special_schedule_day_id'] = special_day_id
    
    db_event = models.SpecialBellEvent(**event_data)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def get_special_schedule_days(db: Session, special_schedule_id: int):
    """Get all days for a special schedule"""
    return db.query(models.SpecialScheduleDay).filter(
        models.SpecialScheduleDay.special_schedule_id == special_schedule_id,
        models.SpecialScheduleDay.is_active == True
    ).all()

def get_special_bell_events_by_day(db: Session, special_day_id: int):
    """Get all bell events for a special schedule day"""
    return db.query(models.SpecialBellEvent).filter(
        models.SpecialBellEvent.special_schedule_day_id == special_day_id,
        models.SpecialBellEvent.is_active == True
    ).order_by(models.SpecialBellEvent.time).all()

def delete_special_bell_event(db: Session, event_id: int):
    """Delete a special bell event"""
    event = db.query(models.SpecialBellEvent).filter(models.SpecialBellEvent.id == event_id).first()
    if event:
        db.delete(event)
        db.commit()
    return event

def update_special_bell_event(db: Session, event_id: int, event_update: dict):
    """Update a special bell event"""
    event = db.query(models.SpecialBellEvent).filter(models.SpecialBellEvent.id == event_id).first()
    if not event:
        return None
    
    # Convert time string to time object if provided
    if 'time' in event_update and isinstance(event_update['time'], str):
        from datetime import datetime
        event_update['time'] = datetime.strptime(event_update['time'], "%H:%M:%S").time()
    
    # Update the event with the new data
    for key, value in event_update.items():
        if hasattr(event, key):
            setattr(event, key, value)
    
    db.commit()
    db.refresh(event)
    return event

def copy_bell_event_to_days(db: Session, event_id: int, target_day_ids: List[int]):
    """Copy a bell event to multiple schedule days"""
    # Get the original event
    original_event = db.query(models.BellEvent).filter(models.BellEvent.id == event_id).first()
    if not original_event:
        return []
    
    copied_events = []
    for day_id in target_day_ids:
        # Check if the day exists
        day = db.query(models.ScheduleDay).filter(models.ScheduleDay.id == day_id).first()
        if day:
            # Create a copy of the event
            new_event = models.BellEvent(
                schedule_day_id=day_id,
                time=original_event.time,
                sound_id=original_event.sound_id,
                tts_text=original_event.tts_text,
                description=original_event.description,
                repeat_tag=original_event.repeat_tag,
                is_active=original_event.is_active
            )
            db.add(new_event)
            copied_events.append(new_event)
    
    db.commit()
    # Refresh all copied events to get their IDs
    for event in copied_events:
        db.refresh(event)
    
    return copied_events

def copy_special_bell_event_to_days(db: Session, event_id: int, target_day_ids: List[int]):
    """Copy a special bell event to multiple target days"""
    # Get the original event
    original_event = db.query(models.SpecialBellEvent).filter(models.SpecialBellEvent.id == event_id).first()
    if not original_event:
        return None
    
    # Create copies for each target day
    copied_events = []
    for day_id in target_day_ids:
        new_event = models.SpecialBellEvent(
            special_schedule_day_id=day_id,
            time=original_event.time,
            sound_id=original_event.sound_id,
            tts_text=original_event.tts_text,
            description=original_event.description,
            repeat_tag=original_event.repeat_tag,
            is_active=original_event.is_active
        )
        db.add(new_event)
        copied_events.append(new_event)
    
    db.commit()
    return copied_events

def schedule_special_schedule(db: Session, special_schedule_id: int, target_date: date):
    """Schedule a special schedule for a specific date"""
    # Check if already scheduled for this date
    existing = db.query(models.SpecialScheduleDate).filter(
        models.SpecialScheduleDate.special_schedule_id == special_schedule_id,
        models.SpecialScheduleDate.date == target_date
    ).first()
    
    if existing:
        return existing
    
    scheduled_date = models.SpecialScheduleDate(
        special_schedule_id=special_schedule_id,
        date=target_date
    )
    db.add(scheduled_date)
    db.commit()
    db.refresh(scheduled_date)
    return scheduled_date

def get_special_schedules(db: Session, start_date: Optional[date] = None, end_date: Optional[date] = None):
    """Get special schedules with their scheduled dates"""
    q = db.query(models.SpecialSchedule)
    if start_date or end_date:
        q = q.join(models.SpecialScheduleDate)
        if start_date:
            q = q.filter(models.SpecialScheduleDate.date >= start_date)
        if end_date:
            q = q.filter(models.SpecialScheduleDate.date <= end_date)
    return q.filter(models.SpecialSchedule.is_active == True).all()

def get_special_schedule_for_date(db: Session, target_date: date):
    """Get special schedule scheduled for a specific date"""
    scheduled_date = db.query(models.SpecialScheduleDate).filter(
        models.SpecialScheduleDate.date == target_date
    ).first()
    
    if scheduled_date:
        return db.query(models.SpecialSchedule).filter(
            models.SpecialSchedule.id == scheduled_date.special_schedule_id,
            models.SpecialSchedule.is_active == True
        ).first()
    
    return None

def get_special_schedule(db: Session, special_id: int):
    """Get a specific special schedule by ID"""
    return db.query(models.SpecialSchedule).filter(models.SpecialSchedule.id == special_id).first()

def delete_special_schedule(db: Session, special_id: int):
    special = db.query(models.SpecialSchedule).filter(models.SpecialSchedule.id == special_id).first()
    if special:
        db.delete(special)
        db.commit()
    return special

# Special Bell Event operations
def create_special_bell_event(db: Session, special_schedule_id: int, event: schemas.SpecialBellEventBase):
    """Create a new bell event in a special schedule"""
    # Get the special schedule
    special_schedule = get_special_schedule(db, special_schedule_id)
    if not special_schedule:
        return None
    
    # Find or create a special schedule day (default to Monday if none exists)
    special_day = db.query(models.SpecialScheduleDay).filter(
        models.SpecialScheduleDay.special_schedule_id == special_schedule_id,
        models.SpecialScheduleDay.is_active == True
    ).first()
    
    if not special_day:
        # Create a default day (Monday)
        special_day = models.SpecialScheduleDay(
            special_schedule_id=special_schedule_id,
            day_of_week=0,  # Monday
            is_active=True
        )
        db.add(special_day)
        db.commit()
        db.refresh(special_day)
    
    # Create the special bell event
    db_event = models.SpecialBellEvent(
        special_schedule_day_id=special_day.id,
        time=event.time,
        description=event.description,
        sound_id=event.sound_id,
        tts_text=event.tts_text,
        repeat_tag=event.repeat_tag,
        is_active=event.is_active
    )
    
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def get_special_bell_events(db: Session, special_schedule_id: int):
    """Get all bell events in a special schedule"""
    # Get all special bell events for this special schedule
    events = db.query(models.SpecialBellEvent).join(models.SpecialScheduleDay).filter(
        models.SpecialScheduleDay.special_schedule_id == special_schedule_id,
        models.SpecialBellEvent.is_active == True
    ).all()
    
    return events

def update_special_bell_event(db: Session, event_id: int, event_update: schemas.SpecialBellEventBase):
    """Update a bell event in a special schedule"""
    bell_event = db.query(models.SpecialBellEvent).filter(models.SpecialBellEvent.id == event_id).first()
    if not bell_event:
        return None
    
    # Update the event
    for key, value in event_update.dict().items():
        if hasattr(bell_event, key):
            setattr(bell_event, key, value)
    
    db.commit()
    db.refresh(bell_event)
    return bell_event

def delete_special_bell_event(db: Session, event_id: int):
    """Delete a bell event from a special schedule"""
    bell_event = db.query(models.SpecialBellEvent).filter(models.SpecialBellEvent.id == event_id).first()
    if not bell_event:
        return None
    
    db.delete(bell_event)
    db.commit()
    return bell_event

# System operations
def get_system_setting(db: Session, key: str):
    setting = db.query(models.SystemSettings).filter(models.SystemSettings.key == key).first()
    return setting.value if setting else None

def set_system_setting(db: Session, key: str, value: str, description: str = None):
    setting = db.query(models.SystemSettings).filter(models.SystemSettings.key == key).first()
    if setting:
        setting.value = value
        if description:
            setting.description = description
    else:
        setting = models.SystemSettings(key=key, value=value, description=description)
        db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting

# Admin operations
def create_admin_user(db: Session, user: schemas.AdminUserCreate):
    password_hash = hashlib.sha256(user.password.encode()).hexdigest()
    db_user = models.AdminUser(
        username=user.username,
        password_hash=password_hash,
        is_active=user.is_active
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_admin(db: Session, username: str, password: str):
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    user = db.query(models.AdminUser).filter(
        models.AdminUser.username == username,
        models.AdminUser.password_hash == password_hash,
        models.AdminUser.is_active == True
    ).first()
    if user:
        user.last_login = datetime.now()
        db.commit()
    return user

def get_admin_user(db: Session, user_id: int):
    return db.query(models.AdminUser).filter(models.AdminUser.id == user_id).first()

# Utility functions
def get_events_for_date(db: Session, target_date: date):
    """Get all events for a specific date, considering special schedules"""
    # Check for special schedule first
    special = get_special_schedule_for_date(db, target_date)
    if special:
        # Get events from special schedule
        special_events = get_special_bell_events(db, special.id)
        # Convert special events to regular event format for compatibility
        events = []
        for special_event in special_events:
            # Create a mock event object with the required attributes
            class MockEvent:
                def __init__(self, special_event, target_date):
                    self.id = special_event.id
                    self.time = special_event.time
                    self.description = special_event.description
                    self.sound_id = special_event.sound_id
                    self.tts_text = special_event.tts_text
                    self.repeat_tag = special_event.repeat_tag
                    self.is_active = special_event.is_active
                    self.sound = special_event.sound
                    self.scheduled_date = target_date
                    self.days_from_now = 0  # Today
            
            events.append(MockEvent(special_event, target_date))
        return events
    else:
        # Use default schedule
        schedule = get_default_schedule(db)
        
        if not schedule:
            return []
        
        # Get day of week (0=Monday, 6=Sunday)
        day_of_week = target_date.weekday()
        
        # Get schedule day
        schedule_day = db.query(models.ScheduleDay).filter(
            models.ScheduleDay.schedule_id == schedule.id,
            models.ScheduleDay.day_of_week == day_of_week,
            models.ScheduleDay.is_active == True
        ).first()
        
        if not schedule_day:
            return []
        
        regular_events = get_bell_events(db, schedule_day.id)
        # Add scheduled_date to regular events
        for event in regular_events:
            event.scheduled_date = target_date
            event.days_from_now = 0  # Today
        
        return regular_events

def get_next_event(db: Session, current_time: time = None):
    """Get the next scheduled event from the currently active schedule"""
    if current_time is None:
        current_time = datetime.now().time()
    
    today = date.today()
    
    # Look for events in the next 7 days
    for days_ahead in range(7):
        check_date = today + timedelta(days=days_ahead)
        
        # First, check if there's a special schedule active for this date
        special_schedule = get_special_schedule_for_date(db, check_date)
        
        if special_schedule:
            # Get events from special schedule
            special_events = get_special_bell_events(db, special_schedule.id)
            
            # For today, only include future events; for future days, include all events
            if days_ahead == 0:
                future_events = [event for event in special_events if event.time > current_time]
            else:
                future_events = special_events
            
            if future_events:
                # Sort by time and get the earliest
                future_events.sort(key=lambda x: x.time)
                next_event = future_events[0]
                
                # Create a mock event object with required attributes
                class MockEvent:
                    def __init__(self, special_event, target_date, days_ahead):
                        self.id = special_event.id
                        self.time = special_event.time
                        self.description = special_event.description
                        self.sound_id = special_event.sound_id
                        self.tts_text = special_event.tts_text
                        self.repeat_tag = special_event.repeat_tag
                        self.is_active = special_event.is_active
                        self.sound = special_event.sound
                        self.scheduled_date = target_date
                        self.days_from_now = days_ahead
                
                mock_event = MockEvent(next_event, check_date, days_ahead)
                return mock_event
        else:
            # Use regular schedule for this day
            schedule = get_default_schedule(db)
            if not schedule:
                continue
            
            # Get day of week (0=Monday, 6=Sunday)
            day_of_week = check_date.weekday()
            
            # Get schedule day
            schedule_day = db.query(models.ScheduleDay).filter(
                models.ScheduleDay.schedule_id == schedule.id,
                models.ScheduleDay.day_of_week == day_of_week,
                models.ScheduleDay.is_active == True
            ).first()
            
            if not schedule_day:
                continue
            
            regular_events = get_bell_events(db, schedule_day.id)
            
            # For today, only include future events; for future days, include all events
            if days_ahead == 0:
                future_events = [event for event in regular_events if event.time > current_time]
            else:
                future_events = regular_events
            
            if future_events:
                # Sort by time and get the earliest
                future_events.sort(key=lambda x: x.time)
                next_event = future_events[0]
                
                # Add date information to the event
                next_event.scheduled_date = check_date
                next_event.days_from_now = days_ahead
                
                return next_event
    
    return None

def activate_special_schedule_for_day(db: Session, special_schedule_id: int, day_of_week: int):
    """Activate a special schedule for a specific day of week"""
    # Check if the special schedule exists
    special_schedule = db.query(models.SpecialSchedule).filter(
        models.SpecialSchedule.id == special_schedule_id,
        models.SpecialSchedule.is_active == True
    ).first()
    
    if not special_schedule:
        raise ValueError("Special schedule not found or inactive")
    
    # Deactivate any existing special schedules for this day
    existing_special_days = db.query(models.SpecialScheduleDay).filter(
        models.SpecialScheduleDay.day_of_week == day_of_week,
        models.SpecialScheduleDay.is_active == True
    ).all()
    
    for existing_day in existing_special_days:
        existing_day.is_active = False
    
    # Find or create a special schedule day for this day of week
    special_day = db.query(models.SpecialScheduleDay).filter(
        models.SpecialScheduleDay.special_schedule_id == special_schedule_id,
        models.SpecialScheduleDay.day_of_week == day_of_week
    ).first()
    
    if not special_day:
        # Create a new special day
        special_day = models.SpecialScheduleDay(
            special_schedule_id=special_schedule_id,
            day_of_week=day_of_week,
            is_active=True
        )
        db.add(special_day)
    else:
        # Activate existing day
        special_day.is_active = True
    
    db.commit()
    db.refresh(special_day)
    
    return special_day.id

def deactivate_special_schedule_for_day(db: Session, special_schedule_id: int, day_of_week: int):
    """Deactivate a special schedule for a specific day of week"""
    # Find the special schedule day
    special_day = db.query(models.SpecialScheduleDay).filter(
        models.SpecialScheduleDay.special_schedule_id == special_schedule_id,
        models.SpecialScheduleDay.day_of_week == day_of_week,
        models.SpecialScheduleDay.is_active == True
    ).first()
    
    if not special_day:
        raise ValueError("Special schedule day not found or already inactive")
    
    # Deactivate the day
    special_day.is_active = False
    db.commit()
    
    return special_day.id

def schedule_special_schedule_for_date(db: Session, special_schedule_id: int, target_date: date):
    """Schedule a special schedule for a specific date (not recurring)"""
    # Check if the special schedule exists
    special_schedule = db.query(models.SpecialSchedule).filter(
        models.SpecialSchedule.id == special_schedule_id,
        models.SpecialSchedule.is_active == True
    ).first()
    
    if not special_schedule:
        raise ValueError("Special schedule not found or inactive")
    
    # Check if there's already a schedule for this date
    existing_date = db.query(models.SpecialScheduleDate).filter(
        models.SpecialScheduleDate.date == target_date
    ).first()
    
    if existing_date:
        # Update existing date to point to the new schedule
        existing_date.special_schedule_id = special_schedule_id
    else:
        # Create new scheduled date
        scheduled_date = models.SpecialScheduleDate(
            special_schedule_id=special_schedule_id,
            date=target_date
        )
        db.add(scheduled_date)
    
    db.commit()
    return True

def unschedule_special_schedule_for_date(db: Session, target_date: date):
    """Remove special schedule from a specific date (revert to regular)"""
    # Find and delete the scheduled date
    scheduled_date = db.query(models.SpecialScheduleDate).filter(
        models.SpecialScheduleDate.date == target_date
    ).first()
    
    if scheduled_date:
        db.delete(scheduled_date)
        db.commit()
        return True
    
    return False

def get_special_schedule_for_specific_date(db: Session, target_date: date):
    """Get the special schedule active for a specific date (from scheduled_dates)"""
    scheduled_date = db.query(models.SpecialScheduleDate).filter(
        models.SpecialScheduleDate.date == target_date
    ).first()
    
    if scheduled_date:
        return db.query(models.SpecialSchedule).filter(
            models.SpecialSchedule.id == scheduled_date.special_schedule_id,
            models.SpecialSchedule.is_active == True
        ).first()
    
    return None

def get_scheduled_dates_for_calendar(db: Session, start_date: Optional[date] = None, end_date: Optional[date] = None):
    """Get all scheduled dates for calendar view"""
    query = db.query(models.SpecialScheduleDate)
    
    if start_date:
        query = query.filter(models.SpecialScheduleDate.date >= start_date)
    if end_date:
        query = query.filter(models.SpecialScheduleDate.date <= end_date)
    
    scheduled_dates = query.all()
    
    # Group by date and return a map of date -> special schedule
    result = {}
    for scheduled_date in scheduled_dates:
        date_str = scheduled_date.date.strftime('%Y-%m-%d')
        special_schedule = db.query(models.SpecialSchedule).filter(
            models.SpecialSchedule.id == scheduled_date.special_schedule_id,
            models.SpecialSchedule.is_active == True
        ).first()
        if special_schedule:
            result[date_str] = {
                'id': special_schedule.id,
                'name': special_schedule.name,
                'description': special_schedule.description,
                'is_active': special_schedule.is_active
            }
    
    return result

# User operations
def create_user(db: Session, user: schemas.UserCreate):
    """Create a new user."""
    from auth.utils import get_password_hash
    
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        is_active=user.is_active,
        is_admin=user.is_admin
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_username(db: Session, username: str):
    """Get user by username."""
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_email(db: Session, email: str):
    """Get user by email."""
    return db.query(models.User).filter(models.User.email == email).first()

def get_user(db: Session, user_id: int):
    """Get user by ID."""
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    """Get all users."""
    return db.query(models.User).offset(skip).limit(limit).all()

def authenticate_user(db: Session, username: str, password: str):
    """Authenticate a user."""
    from auth.utils import verify_password
    
    user = get_user_by_username(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    """Update a user."""
    user = get_user(db, user_id)
    if not user:
        return None
    
    update_data = user_update.dict(exclude_unset=True)
    
    # Hash password if it's being updated
    if 'password' in update_data:
        from auth.utils import get_password_hash
        update_data['hashed_password'] = get_password_hash(update_data.pop('password'))
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: int):
    """Delete a user."""
    user = get_user(db, user_id)
    if user:
        db.delete(user)
        db.commit()
    return user