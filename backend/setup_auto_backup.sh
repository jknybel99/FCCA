#!/bin/bash
# Setup automatic daily backups for School Bell System

echo "Setting up automatic daily backups..."

# Create backup directory
mkdir -p backups

# Create a simple backup script
cat > daily_backup.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
source venv/bin/activate
python create_backup.py >> backup.log 2>&1
EOF

# Make it executable
chmod +x daily_backup.sh

# Add to crontab for daily backup at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * cd $(pwd) && ./daily_backup.sh") | crontab -

echo "✅ Automatic daily backups configured!"
echo "📅 Backups will run daily at 2:00 AM"
echo "📁 Backup location: $(pwd)/backups/"
echo "📝 Log file: $(pwd)/backup.log"
echo ""
echo "To test the backup system now, run:"
echo "  python create_backup.py"
echo ""
echo "To view backup logs:"
echo "  tail -f backup.log"
echo ""
echo "To list all backups:"
echo "  python -c \"from backup_system import BackupSystem; bs = BackupSystem(); [print(f'{b['filename']} - {b['size_mb']} MB') for b in bs.list_backups()]\""


