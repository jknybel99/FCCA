from sqlalchemy import Column, Integer, String, Boolean, Time, Date, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base

class Sound(Base):
    __tablename__ = "sounds"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    file_path = Column(String)
    description = Column(String)
    tags = Column(String)
    type = Column(String)  # bell, music, announcement

class Schedule(Base):
    __tablename__ = "schedules"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    is_default = Column(Boolean, default=False)
    days = Column(JSON)  # e.g. {"monday": [...], "tuesday": [...], ...}
    is_muted = Column(Boolean, default=False)

class SpecialSchedule(Base):
    __tablename__ = "special_schedules"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id"))
    schedule = relationship("Schedule")

class BellEvent(Base):
    __tablename__ = "bell_events"
    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id"))
    time = Column(Time)  # accurate to the second
    sound_id = Column(Integer, ForeignKey("sounds.id"))
    tts_text = Column(String, nullable=True)
    repeat_tag = Column(String, nullable=True)  # for group replace