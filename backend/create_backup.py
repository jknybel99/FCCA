#!/usr/bin/env python3
"""
Simple backup script for School Bell System
Run this to create a backup of your system
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backup_system import BackupSystem

def main():
    print("Creating backup of School Bell System...")
    
    try:
        backup_system = BackupSystem()
        backup_path = backup_system.create_backup(
            include_audio=True,
            include_database=True,
            include_config=True
        )
        
        print(f"✅ Backup created successfully!")
        print(f"📁 Location: {backup_path}")
        
        # List all backups
        print("\n📋 Available backups:")
        backups = backup_system.list_backups()
        for backup in backups[:5]:  # Show last 5 backups
            print(f"  • {backup['filename']} - {backup['size_mb']} MB - {backup['created']}")
        
        if len(backups) > 5:
            print(f"  ... and {len(backups) - 5} more backups")
            
    except Exception as e:
        print(f"❌ Backup failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())


