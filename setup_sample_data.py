#!/usr/bin/env python3
"""
School Bell System - Sample Data Setup Script

This script creates sample data for new installations, including:
- Sample audio files
- Sample schedules
- Default admin user
- Basic system configuration

Usage:
    python setup_sample_data.py
"""

import os
import sys
import sqlite3
from pathlib import Path
from datetime import datetime, time

def get_project_root():
    """Get the project root directory"""
    return Path(__file__).parent.absolute()

def create_database():
    """Create the database with sample data"""
    project_root = get_project_root()
    db_path = project_root / "backend" / "bell_system.db"
    
    # Remove existing database if it exists
    if db_path.exists():
        db_path.unlink()
    
    # Create new database
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    # Create tables (simplified version)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            is_active BOOLEAN NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sounds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            duration INTEGER,
            file_size INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS schedule_days (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            schedule_id INTEGER NOT NULL,
            day_of_week INTEGER NOT NULL,
            name TEXT NOT NULL,
            FOREIGN KEY (schedule_id) REFERENCES schedules (id)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bell_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            schedule_day_id INTEGER NOT NULL,
            time TEXT NOT NULL,
            sound_id INTEGER,
            tts_text TEXT,
            description TEXT NOT NULL,
            repeat_tag TEXT,
            FOREIGN KEY (schedule_day_id) REFERENCES schedule_days (id),
            FOREIGN KEY (sound_id) REFERENCES sounds (id)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS system_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Insert sample data
    insert_sample_data(cursor)
    
    conn.commit()
    conn.close()
    
    print(f"✓ Created database: {db_path.name}")

def insert_sample_data(cursor):
    """Insert sample data into the database"""
    
    # Insert default admin user (password: admin123)
    cursor.execute("""
        INSERT INTO users (username, email, hashed_password, role) VALUES
        ('admin', 'admin@school.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2y', 'admin')
    """)
    
    # Insert sample sounds
    cursor.execute("""
        INSERT INTO sounds (name, file_path, duration, file_size) VALUES
        ('Sample Bell', 'static/sounds/sample_bell.wav', 3, 48000),
        ('Sample Chime', 'static/sounds/sample_chime.wav', 2, 32000)
    """)
    
    # Insert sample schedule
    cursor.execute("""
        INSERT INTO schedules (name, description) VALUES
        ('Sample School Schedule', 'A sample schedule for demonstration purposes')
    """)
    
    # Insert sample schedule days
    cursor.execute("""
        INSERT INTO schedule_days (schedule_id, day_of_week, name) VALUES
        (1, 1, 'Monday'),
        (1, 2, 'Tuesday'),
        (1, 3, 'Wednesday'),
        (1, 4, 'Thursday'),
        (1, 5, 'Friday')
    """)
    
    # Insert sample bell events
    cursor.execute("""
        INSERT INTO bell_events (schedule_day_id, time, sound_id, description, repeat_tag) VALUES
        (1, '08:00:00', 1, 'Morning Bell', 'morning'),
        (1, '08:45:00', 2, 'First Period Start', 'period1'),
        (1, '09:30:00', 2, 'Second Period Start', 'period2'),
        (1, '10:15:00', 2, 'Break', 'break1'),
        (1, '10:30:00', 2, 'Third Period Start', 'period3'),
        (1, '11:15:00', 2, 'Fourth Period Start', 'period4'),
        (1, '12:00:00', 1, 'Lunch Break', 'lunch'),
        (1, '12:45:00', 2, 'Fifth Period Start', 'period5'),
        (1, '13:30:00', 2, 'Sixth Period Start', 'period6'),
        (1, '14:15:00', 2, 'Seventh Period Start', 'period7'),
        (1, '15:00:00', 1, 'End of Day', 'end')
    """)
    
    # Insert system settings
    cursor.execute("""
        INSERT INTO system_settings (key, value) VALUES
        ('school_name', 'Sample School'),
        ('school_logo', ''),
        ('system_volume', '80'),
        ('tts_enabled', 'true'),
        ('mock_tts_mode', 'true')
    """)
    
    print("✓ Inserted sample data")

def create_sample_audio_files():
    """Create sample audio files"""
    project_root = get_project_root()
    sounds_dir = project_root / "backend" / "static" / "sounds"
    
    # Create sounds directory
    sounds_dir.mkdir(parents=True, exist_ok=True)
    
    # Create sample README
    readme_content = """# Audio Files Directory

This directory contains audio files for the School Bell System.

## Sample Files
- `sample_bell.wav` - Sample bell sound (3 seconds)
- `sample_chime.wav` - Sample chime sound (2 seconds)

## Adding Your Own Files
1. Upload audio files through the web interface
2. Supported formats: MP3, WAV, AAC, OGG, FLAC
3. Files will be automatically added to the audio library

## TTS Files
- TTS generated files are automatically created here
- They follow the naming pattern: `tts_[hash].wav`
- These files are automatically managed by the system

## File Management
- Use the web interface to manage audio files
- Files are automatically organized and indexed
- Duration and file size are automatically calculated
"""
    
    readme_file = sounds_dir / "README.md"
    with open(readme_file, 'w') as f:
        f.write(readme_content)
    
    print("✓ Created sample audio directory structure")

def create_sample_config():
    """Create sample configuration files"""
    project_root = get_project_root()
    
    # Create sample .env file
    env_content = """# School Bell System - Environment Configuration
# Copy this file to .env and modify as needed

# Database
DATABASE_URL=sqlite:///./bell_system.db

# Security
SECRET_KEY=your-secret-key-here-change-this-in-production
JWT_SECRET_KEY=your-jwt-secret-key-here-change-this-in-production

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=false

# TTS Settings
TTS_ENABLED=true
MOCK_TTS_MODE=true
PIPER_MODEL_PATH=./piper

# Audio Settings
AUDIO_OUTPUT=alsa_card_0_device_3
DEFAULT_VOLUME=80

# School Settings
SCHOOL_NAME=Sample School
SCHOOL_LOGO=
"""
    
    env_file = project_root / ".env.sample"
    with open(env_file, 'w') as f:
        f.write(env_content)
    
    print("✓ Created sample configuration files")

def main():
    print("=" * 60)
    print("School Bell System - Sample Data Setup")
    print("=" * 60)
    print()
    print("This script will create sample data for a new installation:")
    print("  • Database with sample schedules and events")
    print("  • Default admin user (username: admin, password: admin123)")
    print("  • Sample audio file structure")
    print("  • Basic system configuration")
    print()
    
    response = input("Continue with setup? (yes/no): ").lower().strip()
    if response not in ['yes', 'y']:
        print("Setup cancelled.")
        return
    
    print()
    print("Setting up sample data...")
    print("-" * 40)
    
    try:
        create_database()
        create_sample_audio_files()
        create_sample_config()
        
        print()
        print("=" * 60)
        print("Sample data setup completed!")
        print("=" * 60)
        print()
        print("Default login credentials:")
        print("  Username: admin")
        print("  Password: admin123")
        print()
        print("Next steps:")
        print("  1. Start the backend server: cd backend && python main.py")
        print("  2. Start the frontend: cd frontend && npm start")
        print("  3. Open http://localhost:3000 in your browser")
        print("  4. Log in with the default credentials")
        print("  5. Change the default password in the admin panel")
        print()
        
    except Exception as e:
        print(f"Error during setup: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
