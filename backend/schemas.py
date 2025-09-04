from pydantic import BaseModel, computed_field, field_validator
from typing import List, Optional, ForwardRef, Union
from datetime import time, date, datetime

class SoundBase(BaseModel):
    name: str
    description: Optional[str] = ""
    tags: Optional[str] = ""
    type: str

class SoundCreate(SoundBase):
    duration: Optional[int] = None

class Sound(SoundBase):
    id: int
    file_path: str
    duration: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    @computed_field
    @property
    def url(self) -> str:
        # Convert file_path to URL for frontend consumption
        # Remove 'static/' prefix and add '/sounds/' prefix
        if self.file_path.startswith('static/sounds/'):
            return f"/sounds/{self.file_path.replace('static/sounds/', '')}"
        return self.file_path
    
    class Config:
        from_attributes = True

class BellEventBase(BaseModel):
    time: Union[str, time]  # Accept both string and time objects
    description: str  # Mandatory description for distinguishing bells/periods
    sound_id: Optional[int] = None
    tts_text: Optional[str] = None
    repeat_tag: Optional[str] = None
    is_active: Optional[bool] = True
    
    @field_validator('time', mode='before')
    @classmethod
    def validate_time(cls, v):
        if isinstance(v, str):
            try:
                from datetime import datetime
                time_obj = datetime.strptime(v, '%H:%M:%S').time()
                return time_obj
            except ValueError:
                raise ValueError('Time must be in HH:MM:SS format')
        elif isinstance(v, time):
            return v
        else:
            raise ValueError('Time must be a string in HH:MM:SS format or a time object')

class BellEventCreate(BellEventBase):
    schedule_day_id: int

class BellEvent(BellEventBase):
    id: int
    schedule_day_id: int
    is_active: bool
    created_at: Optional[datetime] = None
    sound: Optional[Sound] = None
    
    @field_validator('time', mode='after')
    @classmethod
    def format_time_response(cls, v):
        if isinstance(v, time):
            return v.strftime('%H:%M:%S')
        return v
    
    class Config:
        from_attributes = True

class ScheduleDayBase(BaseModel):
    day_of_week: int  # 0=Monday, 1=Tuesday, ..., 6=Sunday
    is_active: bool = True

class ScheduleDayCreate(ScheduleDayBase):
    pass

class ScheduleDay(ScheduleDayBase):
    id: int
    schedule_id: int
    events: List[BellEvent] = []
    
    class Config:
        from_attributes = True

class ScheduleBase(BaseModel):
    name: str
    description: Optional[str] = ""
    is_default: bool = False
    is_active: bool = True
    is_muted: bool = False

class ScheduleCreate(ScheduleBase):
    pass

class Schedule(ScheduleBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    days: List[ScheduleDay] = []
    
    class Config:
        from_attributes = True

class SpecialScheduleBase(BaseModel):
    name: str
    description: Optional[str] = ""
    schedule_id: int
    is_active: bool = True

class SpecialScheduleCreate(SpecialScheduleBase):
    pass

class SpecialScheduleSchedule(BaseModel):
    special_schedule_id: int
    date: date

class SpecialScheduleDayBase(BaseModel):
    day_of_week: int
    is_active: bool = True

class SpecialScheduleDayCreate(SpecialScheduleDayBase):
    pass

class SpecialScheduleDay(SpecialScheduleDayBase):
    id: int
    special_schedule_id: int
    events: List["SpecialBellEvent"] = []
    
    class Config:
        from_attributes = True

class SpecialBellEventBase(BaseModel):
    time: Union[str, time]  # Accept both string and time objects
    description: str  # Mandatory description for distinguishing bells/periods
    sound_id: Optional[int] = None
    tts_text: Optional[str] = None
    repeat_tag: Optional[str] = None
    is_active: Optional[bool] = True
    
    @field_validator('time', mode='before')
    @classmethod
    def validate_time(cls, v):
        if isinstance(v, str):
            try:
                from datetime import datetime
                time_obj = datetime.strptime(v, '%H:%M:%S').time()
                return time_obj
            except ValueError:
                raise ValueError('Time must be in HH:MM:SS format')
        elif isinstance(v, time):
            return v
        else:
            raise ValueError('Time must be a string in HH:MM:SS format or a time object')

class SpecialBellEventCreate(SpecialBellEventBase):
    pass

class SpecialBellEvent(SpecialBellEventBase):
    id: int
    special_schedule_day_id: int
    is_active: bool
    created_at: Optional[datetime] = None
    sound: Optional[Sound] = None
    
    @field_validator('time', mode='after')
    @classmethod
    def format_time_response(cls, v):
        if isinstance(v, time):
            return v.strftime('%H:%M:%S')
        return v
    
    class Config:
        from_attributes = True

class SpecialSchedule(SpecialScheduleBase):
    id: int
    created_at: Optional[datetime] = None
    schedule: Optional[Schedule] = None
    scheduled_dates: List[date] = []
    
    @field_validator('scheduled_dates', mode='before')
    @classmethod
    def convert_scheduled_dates(cls, v):
        """Convert SpecialScheduleDate objects to dates"""
        if isinstance(v, list):
            return [item.date if hasattr(item, 'date') else item for item in v]
        return v
    
    class Config:
        from_attributes = True

class SystemSettingsBase(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

class SystemSettings(SystemSettingsBase):
    id: int
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class AdminUserBase(BaseModel):
    username: str
    is_active: bool = True

class AdminUserCreate(AdminUserBase):
    password: str

class AdminUser(AdminUserBase):
    id: int
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Additional schemas for API responses
class ScheduleWithEvents(Schedule):
    events: List[BellEvent] = []

class DaySchedule(BaseModel):
    day_of_week: int
    day_name: str
    events: List[BellEvent] = []

class WeeklySchedule(BaseModel):
    schedule: Schedule
    days: List[DaySchedule] = []

class NextEvent(BaseModel):
    time: str
    sound_name: Optional[str] = None
    tts_text: Optional[str] = None
    description: Optional[str] = None
    scheduled_date: Optional[str] = None
    days_from_now: Optional[int] = None
    minutes_until: int

# Authentication schemas
class UserBase(BaseModel):
    username: str
    email: str
    is_active: bool = True
    is_admin: bool = False

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None

class User(UserBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None