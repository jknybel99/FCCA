#!/usr/bin/env python3
"""
Check backup system status
"""

import os
from backup_system import BackupSystem

def main():
    print("🔍 Checking backup system status...")
    
    # Check if backup directory exists
    if not os.path.exists("backups"):
        print("❌ Backup directory not found!")
        return 1
    
    # List backups
    backup_system = BackupSystem()
    backups = backup_system.list_backups()
    
    if not backups:
        print("⚠️  No backups found!")
        print("💡 Run: python create_backup.py")
        return 1
    
    print(f"✅ Found {len(backups)} backup(s)")
    print()
    
    # Show recent backups
    print("📋 Recent backups:")
    for i, backup in enumerate(backups[:5]):
        status = "🟢" if i == 0 else "🔵"
        print(f"  {status} {backup['filename']}")
        print(f"     📏 Size: {backup['size_mb']} MB")
        print(f"     📅 Created: {backup['created']}")
        print()
    
    # Check disk space
    import shutil
    total, used, free = shutil.disk_usage(".")
    free_gb = free // (1024**3)
    used_gb = used // (1024**3)
    
    print(f"💾 Disk space:")
    print(f"   📊 Used: {used_gb} GB")
    print(f"   📊 Free: {free_gb} GB")
    
    # Check backup directory size
    backup_size = 0
    for backup in backups:
        backup_size += backup['size']
    
    backup_size_mb = backup_size / (1024**2)
    print(f"   📁 Backups: {backup_size_mb:.1f} MB")
    
    # Recommendations
    print()
    if free_gb < 1:
        print("⚠️  Low disk space! Consider cleaning old backups.")
    elif len(backups) > 10:
        print("💡 Many backups found. Consider cleaning old ones.")
    else:
        print("✅ Backup system is healthy!")
    
    return 0

if __name__ == "__main__":
    exit(main())


