# School Bell System Backup System

This backup system automatically protects your audio files, database, and configuration from data loss.

## 🚀 Quick Start

### Create a backup now:
```bash
python create_backup.py
```

### Set up automatic daily backups:
```bash
./setup_auto_backup.sh
```

## 📁 What Gets Backed Up

- **Audio Files**: All MP3, WAV, AAC, OGG, FLAC files in `static/sounds/`
- **Database**: Complete SQLite database with SQL dump
- **Configuration**: Python files, API endpoints, requirements
- **Metadata**: File hashes, sizes, modification dates

## 🔧 Manual Backup Commands

### Create a backup:
```bash
python backup_system.py --action backup
```

### List all backups:
```bash
python backup_system.py --action list
```

### Restore from backup:
```bash
python backup_system.py --action restore --backup-file backup_20250902_221739.zip
```

## 📅 Automatic Backups

The system creates backups automatically when:
- **New files are uploaded** - Protects against upload corruption
- **Audio files are edited** - Preserves original files before processing
- **Daily at 2:00 AM** - Scheduled backup of entire system

## 📊 Backup Information

Each backup includes:
- **Compressed ZIP archive** - Easy to store and transfer
- **Manifest file** - Details about what was backed up
- **File hashes** - Verify file integrity
- **SQL dump** - Database can be restored even if SQLite is corrupted

## 🛡️ Safety Features

- **Non-destructive** - Original files are never modified
- **Error handling** - System continues even if backup fails
- **Hash verification** - Detect file corruption
- **Incremental** - Only backs up what's changed

## 📍 Backup Locations

- **Backup files**: `backups/` directory
- **Logs**: `backup_system.log` and `backup.log`
- **Temporary files**: Automatically cleaned up

## 🚨 Recovery

### If files get corrupted:
1. Stop the system
2. Extract the latest backup: `python backup_system.py --action restore --backup-file backup_YYYYMMDD_HHMMSS.zip`
3. Review files in the restore directory
4. Copy needed files back to their original locations
5. Restart the system

### If database is corrupted:
1. Stop the system
2. Restore from backup
3. Copy `database_dump.sql` to a new database file
4. Restart the system

## 📋 Monitoring

### Check backup status:
```bash
# View recent backups
ls -la backups/

# Check backup logs
tail -f backup.log

# Verify backup integrity
python -c "from backup_system import BackupSystem; bs = BackupSystem(); print(f'Total backups: {len(bs.list_backups())}')"
```

### Backup health check:
```bash
# Test backup system
python create_backup.py

# Should show: ✅ Backup created successfully!
```

## 🔄 Maintenance

### Clean old backups:
```bash
# Keep only last 10 backups
cd backups/
ls -t *.zip | tail -n +11 | xargs rm -f
```

### Check disk space:
```bash
du -sh backups/
df -h .
```

## 🆘 Troubleshooting

### Backup fails:
- Check disk space: `df -h`
- Check permissions: `ls -la backups/`
- View logs: `tail -f backup_system.log`

### Restore fails:
- Verify backup file integrity: `unzip -t backup_YYYYMMDD_HHMMSS.zip`
- Check file permissions
- Ensure enough disk space for extraction

## 📞 Support

If you encounter issues:
1. Check the logs first
2. Verify disk space and permissions
3. Test with a manual backup
4. Check that all required Python modules are installed

---

**Remember**: Regular backups are your best defense against data loss. The system automatically protects your work, but you can always create manual backups when making important changes.


