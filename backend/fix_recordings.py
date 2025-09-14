import os
import sqlite3
from datetime import datetime

def get_audio_duration(file_path):
    """Get duration of audio file using ffprobe"""
    try:
        import subprocess
        result = subprocess.run(
            ['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
             '-of', 'default=noprint_wrappers=1:nokey=1', file_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        return int(float(result.stdout.strip()))
    except Exception as e:
        print(f"Error getting duration for {file_path}: {e}")
        return 0

def main():
    # Connect to the database
    conn = sqlite3.connect('bell_system.db')
    cursor = conn.cursor()
    
    # Create recordings directory if it doesn't exist
    os.makedirs('static/recordings', exist_ok=True)
    
    # Get all existing recordings from the database
    cursor.execute("SELECT file_path FROM sounds WHERE file_path LIKE '%recordings%'")
    existing_files = {row[0] for row in cursor.fetchall()}
    
    # Scan the recordings directory
    added = 0
    for filename in os.listdir('static/recordings'):
        if not filename.lower().endswith(('.wav', '.mp3', '.ogg')):
            continue
            
        file_path = f"static/recordings/{filename}"
        
        # Skip if already in database
        if file_path in existing_files:
            print(f"Skipping existing: {file_path}")
            continue
            
        # Get file info
        try:
            file_size = os.path.getsize(file_path)
            duration = get_audio_duration(file_path)
            
            # Create a friendly name from the filename
            base_name = os.path.splitext(filename)[0]
            name = f"Recording {base_name.replace('_', ' ').replace('page ', '')}"
            
            # Insert into database
            cursor.execute("""
                INSERT INTO sounds (name, file_path, description, type, tags, duration, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            """, (
                name,  # name
                file_path,  # file_path
                f"Recorded announcement from {base_name.replace('_', ' ')}",  # description
                'announcement',  # type
                'paging,announcement,recorded',  # tags
                duration,  # duration in seconds
            ))
            
            print(f"Added: {name} ({duration}s, {file_size} bytes)")
            added += 1
            
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            
    # Commit changes
    conn.commit()
    conn.close()
    
    print(f"\nAdded {added} new recordings to the database.")

if __name__ == "__main__":
    main()
