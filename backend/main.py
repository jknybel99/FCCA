from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import logging
from datetime import datetime

from api import schedule, sound, tts, admin, audio
from api import audio_editor
from api import auth
from services.scheduler import bell_scheduler
from database import SessionLocal
import crud, models, schemas

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="School Bell System", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(schedule.router, prefix="/api/schedule", tags=["Schedule"])
app.include_router(sound.router, prefix="/api/sounds", tags=["Sounds"])
app.include_router(tts.router, prefix="/api/tts", tags=["TTS"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(audio.router, prefix="/api/audio", tags=["Audio"])
app.include_router(audio_editor.router, prefix="/api/audio-editor", tags=["Audio Editor"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])

# Make sure this path matches where your files are actually saved!
os.makedirs("./static/sounds", exist_ok=True)
os.makedirs("./static/uploads", exist_ok=True)
app.mount("/sounds", StaticFiles(directory="./static/sounds"), name="sounds")
app.mount("/static", StaticFiles(directory="./static"), name="static")

@app.on_event("startup")
async def startup_event():
    """Initialize the system on startup"""
    logger.info("Starting School Bell System...")
    
    # Initialize database
    db = SessionLocal()
    try:
        # Set default school settings if none exist
        school_name = crud.get_system_setting(db, "school_name")
        if not school_name:
            logger.info("Setting default school settings...")
            crud.set_system_setting(db, "school_name", "FCCA School", "School name")
            crud.set_system_setting(db, "school_logo", "/static/uploads/logo_20250901_161403_fcca.png", "School logo path")
            crud.set_system_setting(db, "footer_text", "FCCA School Bell System - Automated Bell Scheduling", "Footer text")
            logger.info("Default school settings created")
        
        # Create default schedule if none exists
        schedules = db.query(models.Schedule).count()
        if schedules == 0:
            logger.info("Creating default schedule...")
            default_schedule = crud.create_schedule(db, schemas.ScheduleCreate(
                name="Default Schedule",
                description="Default school schedule",
                is_default=True,
                is_active=True
            ))
            
            # Create schedule days for Monday-Friday
            for day_of_week in range(5):  # Monday to Friday
                crud.create_schedule_day(db, schemas.ScheduleDayCreate(
                    day_of_week=day_of_week,
                    is_active=True
                ), default_schedule.id)
            
            logger.info("Default schedule created")
        
        # Set default system settings
        crud.set_system_setting(db, "system_timezone", "America/Chicago", "System timezone")
        crud.set_system_setting(db, "auto_backup", "True", "Enable automatic backups")
        crud.set_system_setting(db, "backup_frequency", "daily", "Backup frequency")
        
    except Exception as e:
        logger.error(f"Error during startup: {e}")
    finally:
        db.close()
    
    # Start the bell scheduler
    try:
        bell_scheduler.start()
        logger.info("Bell scheduler started successfully")
    except Exception as e:
        logger.error(f"Error starting bell scheduler: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down School Bell System...")
    bell_scheduler.stop()
    logger.info("Bell scheduler stopped")

@app.get("/")
async def root():
    return {
        "message": "Welcome to the School Bell System API",
        "version": "2.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "scheduler_running": bell_scheduler.is_running,
        "active_jobs": len(bell_scheduler.current_jobs)
    }

@app.get("/api/system/status")
async def get_system_status():
    """Get system status for dashboard"""
    return {
        "scheduler_running": bell_scheduler.is_running,
        "active_jobs": len(bell_scheduler.current_jobs),
        "current_time": datetime.now().isoformat(),
        "system_status": "running" if bell_scheduler.is_running else "stopped",
        "muted": bell_scheduler.is_muted if hasattr(bell_scheduler, 'is_muted') else False
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
