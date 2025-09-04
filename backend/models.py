from sqlalchemy import Column, Integer, String, Boolean, Time, Date, ForeignKey, JSON, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Sound(Base):
    __tablename__ = "sounds"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    file_path = Column(String)
    description = Column(Text, nullable=True)
    tags = Column(String, nullable=True)
    type = Column(String)  # bell, music, announcement, tts
    duration = Column(Integer, nullable=True)  # duration in seconds
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Schedule(Base):
    __tablename__ = "schedules"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_muted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ScheduleDay(Base):
    __tablename__ = "schedule_days"
    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id", ondelete="CASCADE"))
    day_of_week = Column(Integer)  # 0=Monday, 1=Tuesday, ..., 6=Sunday
    is_active = Column(Boolean, default=True)
    
    schedule = relationship("Schedule", back_populates="days")
    events = relationship("BellEvent", back_populates="schedule_day", cascade="all, delete-orphan")

class SpecialSchedule(Base):
    __tablename__ = "special_schedules"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id", ondelete="CASCADE"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    schedule = relationship("Schedule")
    # Using only date-specific scheduling
    scheduled_dates = relationship("SpecialScheduleDate", back_populates="special_schedule", cascade="all, delete-orphan")
    # Adding back day-of-week support for event management
    days = relationship("SpecialScheduleDay", back_populates="special_schedule", cascade="all, delete-orphan")

# Adding back SpecialScheduleDay for event management
class SpecialScheduleDay(Base):
    __tablename__ = "special_schedule_days"
    id = Column(Integer, primary_key=True, index=True)
    special_schedule_id = Column(Integer, ForeignKey("special_schedules.id", ondelete="CASCADE"))
    day_of_week = Column(Integer)  # 0=Monday, 1=Tuesday, ..., 6=Sunday
    is_active = Column(Boolean, default=True)
    
    special_schedule = relationship("SpecialSchedule", back_populates="days")
    events = relationship("SpecialBellEvent", back_populates="schedule_day", cascade="all, delete-orphan")

# Removed SpecialScheduleDay - using date-specific scheduling only

class SpecialScheduleDate(Base):
    __tablename__ = "special_schedule_dates"
    id = Column(Integer, primary_key=True, index=True)
    special_schedule_id = Column(Integer, ForeignKey("special_schedules.id", ondelete="CASCADE"))
    date = Column(Date, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    special_schedule = relationship("SpecialSchedule", back_populates="scheduled_dates")

class BellEvent(Base):
    __tablename__ = "bell_events"
    id = Column(Integer, primary_key=True, index=True)
    schedule_day_id = Column(Integer, ForeignKey("schedule_days.id", ondelete="CASCADE"))
    time = Column(Time)  # accurate to the second
    description = Column(Text, nullable=False)  # Mandatory description for distinguishing bells/periods
    sound_id = Column(Integer, ForeignKey("sounds.id", ondelete="SET NULL"), nullable=True)
    tts_text = Column(Text, nullable=True)
    repeat_tag = Column(String, nullable=True)  # For one-click replace
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    schedule_day = relationship("ScheduleDay", back_populates="events")
    sound = relationship("Sound")

# Adding back SpecialBellEvent for special schedule event management
class SpecialBellEvent(Base):
    __tablename__ = "special_bell_events"
    id = Column(Integer, primary_key=True, index=True)
    special_schedule_day_id = Column(Integer, ForeignKey("special_schedule_days.id", ondelete="CASCADE"))
    time = Column(Time)  # accurate to the second
    description = Column(Text, nullable=False)  # Mandatory description for distinguishing bells/periods
    sound_id = Column(Integer, ForeignKey("sounds.id", ondelete="SET NULL"), nullable=True)
    tts_text = Column(Text, nullable=True)
    repeat_tag = Column(String, nullable=True)  # For one-click replace
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    schedule_day = relationship("SpecialScheduleDay", back_populates="events")
    sound = relationship("Sound")

# Removed SpecialBellEvent - using date-specific scheduling only

class SystemSettings(Base):
    __tablename__ = "system_settings"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(Text)
    description = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class AdminUser(Base):
    __tablename__ = "admin_users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

# Add relationships
Schedule.days = relationship("ScheduleDay", back_populates="schedule", cascade="all, delete-orphan")

# User model for authentication
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())