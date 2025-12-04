#!/usr/bin/env python3
"""
Script to populate created_at field for existing Sound records.
For records where created_at is NULL, set it to updated_at or current time.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import sys

# Import database configuration
from database import SQLALCHEMY_DATABASE_URL, engine
from models import Sound

def fix_created_at_dates():
    """Update NULL created_at values with updated_at or current time"""
    
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Get all sounds with NULL created_at
        sounds = session.query(Sound).filter(Sound.created_at == None).all()
        
        if not sounds:
            print("✓ All sounds already have created_at dates!")
            return
        
        print(f"Found {len(sounds)} sounds with missing created_at dates")
        
        updated_count = 0
        for sound in sounds:
            # Use updated_at if available, otherwise use current time
            if sound.updated_at:
                sound.created_at = sound.updated_at
                print(f"  - {sound.name}: Set created_at to {sound.updated_at}")
            else:
                sound.created_at = datetime.now()
                print(f"  - {sound.name}: Set created_at to current time")
            updated_count += 1
        
        # Commit all changes
        session.commit()
        print(f"\n✓ Successfully updated {updated_count} sound records!")
        
    except Exception as e:
        session.rollback()
        print(f"✗ Error updating records: {e}")
        sys.exit(1)
    finally:
        session.close()

if __name__ == "__main__":
    print("Fixing created_at dates for Sound records...")
    fix_created_at_dates()
