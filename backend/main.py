from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import logging
from datetime import datetime

from api import schedule, sound, tts, admin, audio, paging
from api import audio_editor
from api import auth, playlist, stream
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
app.include_router(paging.router, prefix="/api/paging", tags=["Paging"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(playlist.router, prefix="/api/playlists", tags=["Playlists"])
app.include_router(stream.router, prefix="/api/stream", tags=["Stream"])

# Make sure this path matches where your files are actually saved!
os.makedirs("./static/sounds", exist_ok=True)
os.makedirs("./static/uploads", exist_ok=True)
os.makedirs("./static/recordings", exist_ok=True)
app.mount("/sounds", StaticFiles(directory="./static/sounds"), name="sounds")
app.mount("/static", StaticFiles(directory="./static"), name="static")

# Serve frontend build files
# Determine build directory from env (Docker) or common local paths
frontend_build_path = (
    os.environ.get("FRONTEND_BUILD_DIR")
    or os.path.join(os.path.dirname(__file__), "../frontend/build")
)

# If env var not set or missing, try a local fallback copied by Dockerfile
if not os.path.exists(frontend_build_path):
    alt_path = os.path.join(os.path.dirname(__file__), "../frontend_build")
    if os.path.exists(alt_path):
        frontend_build_path = alt_path

if os.path.exists(frontend_build_path):
    # Mount static assets (JS, CSS, etc.) from the build folder
    static_dir = os.path.join(frontend_build_path, "static")
    if os.path.exists(static_dir):
        app.mount("/static-frontend", StaticFiles(directory=static_dir), name="static-frontend")

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
        
        # Set default system settings (only if they don't exist)
        if not crud.get_system_setting(db, "system_timezone"):
            crud.set_system_setting(db, "system_timezone", "America/Chicago", "System timezone")
        if not crud.get_system_setting(db, "auto_backup"):
            crud.set_system_setting(db, "auto_backup", "True", "Enable automatic backups")
        if not crud.get_system_setting(db, "backup_frequency"):
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

# Favicon route temporarily removed to fix API routing

# Catch-all route to serve React app for client-side routing
# This must be LAST so it doesn't override API routes
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    """Serve the React frontend for all non-API routes"""
    frontend_build_path = os.path.join(os.path.dirname(__file__), "../frontend/build")
    
    # If frontend build doesn't exist, return error message
    if not os.path.exists(frontend_build_path):
        return {
            "error": "Frontend build not found",
            "message": "Run 'npm run build' in the frontend directory"
        }
    
    # Check if the requested file exists in the build directory
    file_path = os.path.join(frontend_build_path, full_path)
    
    # If it's a file and exists, serve it
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # Otherwise, serve index.html for client-side routing
    index_path = os.path.join(frontend_build_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    return {"error": "Frontend not found"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
