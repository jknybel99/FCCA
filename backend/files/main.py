from fastapi import FastAPI
from api import schedule, sound, tts

app = FastAPI(title="School Bell System")

app.include_router(schedule.router, prefix="/api/schedule", tags=["Schedule"])
app.include_router(sound.router, prefix="/api/sounds", tags=["Sounds"])
app.include_router(tts.router, prefix="/api/tts", tags=["TTS"])

@app.get("/")
async def root():
    return {"message": "Welcome to the School Bell System API"}