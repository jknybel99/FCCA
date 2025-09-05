#!/usr/bin/env python3
"""
School Bell System - Data Clearing Script

This script allows end users to clear all their personal data from the system,
including schedules, audio files, TTS files, and user accounts.

Usage:
    python clear_user_data.py [--confirm]

Options:
    --confirm    Skip confirmation prompt and clear data immediately
"""

import os
import sys
import shutil
import sqlite3
import argparse
from pathlib import Path

def get_project_root():
    """Get the project root directory"""
    return Path(__file__).parent.absolute()

def clear_database():
    """Clear all data from the database"""
    project_root = get_project_root()
    db_files = [
        project_root / "backend" / "bell_system.db",
        project_root / "backend" / "school_bell_system.db"
    ]
    
    cleared_dbs = []
    for db_file in db_files:
        if db_file.exists():
            try:
                # Connect to database and clear all tables
                conn = sqlite3.connect(str(db_file))
                cursor = conn.cursor()
                
                # Get all table names
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
                tables = cursor.fetchall()
                
                # Clear all tables
                for table in tables:
                    table_name = table[0]
                    if table_name != 'sqlite_sequence':  # Skip system tables
                        cursor.execute(f"DELETE FROM {table_name}")
                        print(f"  ✓ Cleared table: {table_name}")
                
                conn.commit()
                conn.close()
                cleared_dbs.append(db_file.name)
                
            except Exception as e:
                print(f"  ✗ Error clearing database {db_file.name}: {e}")
    
    return cleared_dbs

def clear_audio_files():
    """Clear all user audio files"""
    project_root = get_project_root()
    sounds_dir = project_root / "backend" / "static" / "sounds"
    
    if not sounds_dir.exists():
        return []
    
    cleared_files = []
    
    # Clear all audio files except sample files
    for file_path in sounds_dir.iterdir():
        if file_path.is_file():
            # Keep sample files
            if file_path.name.startswith('sample_'):
                continue
            
            try:
                file_path.unlink()
                cleared_files.append(file_path.name)
                print(f"  ✓ Removed: {file_path.name}")
            except Exception as e:
                print(f"  ✗ Error removing {file_path.name}: {e}")
    
    return cleared_files

def clear_tts_files():
    """Clear all TTS generated files"""
    project_root = get_project_root()
    sounds_dir = project_root / "backend" / "static" / "sounds"
    
    if not sounds_dir.exists():
        return []
    
    cleared_files = []
    
    # Clear TTS files
    for file_path in sounds_dir.glob("tts_*"):
        if file_path.is_file():
            try:
                file_path.unlink()
                cleared_files.append(file_path.name)
                print(f"  ✓ Removed TTS file: {file_path.name}")
            except Exception as e:
                print(f"  ✗ Error removing TTS file {file_path.name}: {e}")
    
    return cleared_files

def clear_backups():
    """Clear all backup files"""
    project_root = get_project_root()
    backups_dir = project_root / "backend" / "backups"
    
    if not backups_dir.exists():
        return []
    
    cleared_files = []
    
    # Clear backup files
    for file_path in backups_dir.iterdir():
        if file_path.is_file() and file_path.suffix in ['.zip', '.tar.gz', '.sql']:
            try:
                file_path.unlink()
                cleared_files.append(file_path.name)
                print(f"  ✓ Removed backup: {file_path.name}")
            except Exception as e:
                print(f"  ✗ Error removing backup {file_path.name}: {e}")
    
    return cleared_files

def clear_piper_voices():
    """Clear downloaded Piper TTS voices"""
    project_root = get_project_root()
    piper_dir = project_root / "backend" / "piper"
    
    if not piper_dir.exists():
        return []
    
    cleared_files = []
    
    # Clear .onnx files
    for file_path in piper_dir.glob("*.onnx"):
        try:
            file_path.unlink()
            cleared_files.append(file_path.name)
            print(f"  ✓ Removed voice file: {file_path.name}")
        except Exception as e:
            print(f"  ✗ Error removing voice file {file_path.name}: {e}")
    
    # Clear .onnx.json files
    for file_path in piper_dir.glob("*.onnx.json"):
        try:
            file_path.unlink()
            cleared_files.append(file_path.name)
            print(f"  ✓ Removed voice config: {file_path.name}")
        except Exception as e:
            print(f"  ✗ Error removing voice config {file_path.name}: {e}")
    
    return cleared_files

def create_sample_data():
    """Create sample data for new installations"""
    project_root = get_project_root()
    sounds_dir = project_root / "backend" / "static" / "sounds"
    
    # Create sounds directory if it doesn't exist
    sounds_dir.mkdir(parents=True, exist_ok=True)
    
    # Create a sample README file
    sample_readme = sounds_dir / "README.md"
    with open(sample_readme, 'w') as f:
        f.write("""# Audio Files Directory

This directory contains audio files for the School Bell System.

## Sample Files
- `sample_bell.wav` - Sample bell sound
- `sample_chime.wav` - Sample chime sound

## Adding Your Own Files
1. Upload audio files through the web interface
2. Supported formats: MP3, WAV, AAC, OGG, FLAC
3. Files will be automatically added to the audio library

## TTS Files
- TTS generated files are automatically created here
- They follow the naming pattern: `tts_[hash].wav`
- These files are automatically managed by the system
""")
    
    print("  ✓ Created sample data structure")

def main():
    parser = argparse.ArgumentParser(description="Clear all user data from School Bell System")
    parser.add_argument("--confirm", action="store_true", help="Skip confirmation prompt")
    args = parser.parse_args()
    
    print("=" * 60)
    print("School Bell System - Data Clearing Script")
    print("=" * 60)
    print()
    print("This script will clear ALL user data from the system:")
    print("  • All schedules and events")
    print("  • All user accounts")
    print("  • All uploaded audio files")
    print("  • All TTS generated files")
    print("  • All backup files")
    print("  • All downloaded TTS voices")
    print()
    print("The system will be reset to a clean state.")
    print()
    
    if not args.confirm:
        response = input("Are you sure you want to continue? (yes/no): ").lower().strip()
        if response not in ['yes', 'y']:
            print("Operation cancelled.")
            return
    
    print()
    print("Clearing user data...")
    print("-" * 40)
    
    # Clear different types of data
    cleared_dbs = clear_database()
    cleared_audio = clear_audio_files()
    cleared_tts = clear_tts_files()
    cleared_backups = clear_backups()
    cleared_voices = clear_piper_voices()
    
    # Create sample data
    create_sample_data()
    
    print()
    print("=" * 60)
    print("Data clearing completed!")
    print("=" * 60)
    print()
    print("Summary:")
    print(f"  • Databases cleared: {len(cleared_dbs)}")
    print(f"  • Audio files removed: {len(cleared_audio)}")
    print(f"  • TTS files removed: {len(cleared_tts)}")
    print(f"  • Backup files removed: {len(cleared_backups)}")
    print(f"  • Voice files removed: {len(cleared_voices)}")
    print()
    print("The system is now in a clean state.")
    print("You can restart the server to begin fresh.")
    print()

if __name__ == "__main__":
    main()
