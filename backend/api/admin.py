from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from database import SessionLocal
import crud, schemas
from typing import List
import os
import shutil
from datetime import datetime

router = APIRouter(tags=["admin"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# System settings management
@router.get("/settings")
def get_admin_settings(db: Session = Depends(get_db)):
    """Get all system settings"""
    settings = {}
    setting_keys = [
        'school_name', 'school_logo', 'contact_email', 'contact_phone',
        'footer_text', 'system_timezone', 'auto_backup', 'backup_frequency',
        'max_file_size', 'allowed_file_types', 'ntp_enabled', 'ntp_servers', 'ntp_sync_interval'
    ]
    
    for key in setting_keys:
        value = crud.get_system_setting(db, key)
        if value:
            # Convert snake_case to camelCase for frontend compatibility
            if key == 'school_name':
                settings['schoolName'] = value
            elif key == 'school_logo':
                # Make logo URL absolute if it's a relative path
                if value and value.startswith('/'):
                    settings['schoolLogo'] = f"http://localhost:8000{value}"
                else:
                    settings['schoolLogo'] = value
            elif key == 'contact_email':
                settings['contactEmail'] = value
            elif key == 'contact_phone':
                settings['contactPhone'] = value
            elif key == 'footer_text':
                settings['footerText'] = value
            elif key == 'system_timezone':
                settings['systemTimezone'] = value
            elif key == 'auto_backup':
                settings['autoBackup'] = value == 'True'
            elif key == 'backup_frequency':
                settings['backupFrequency'] = value
            elif key == 'max_file_size':
                settings['maxFileSize'] = value
            elif key == 'allowed_file_types':
                settings['allowedFileTypes'] = value
            elif key == 'ntp_enabled':
                settings['ntpEnabled'] = value == 'True'
            elif key == 'ntp_servers':
                settings['ntpServers'] = value
            elif key == 'ntp_sync_interval':
                settings['ntpSyncInterval'] = value
            else:
                settings[key] = value
    
    return settings

@router.post("/settings")
def save_admin_settings(settings: dict, db: Session = Depends(get_db)):
    """Save system settings"""
    try:
        # Convert camelCase to snake_case for database storage
        field_mapping = {
            'schoolName': 'school_name',
            'schoolLogo': 'school_logo',
            'contactEmail': 'contact_email',
            'contactPhone': 'contact_phone',
            'footerText': 'footer_text',
            'systemTimezone': 'system_timezone',
            'autoBackup': 'auto_backup',
            'backupFrequency': 'backup_frequency',
            'maxFileSize': 'max_file_size',
            'allowedFileTypes': 'allowed_file_types',
            'ntpEnabled': 'ntp_enabled',
            'ntpServers': 'ntp_servers',
            'ntpSyncInterval': 'ntp_sync_interval'
        }
        
        for key, value in settings.items():
            if value is not None:
                # Convert camelCase to snake_case if mapping exists
                db_key = field_mapping.get(key, key)
                crud.set_system_setting(db, db_key, str(value))
        return {"message": "Settings saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving settings: {str(e)}")

@router.post("/upload-logo")
async def upload_logo(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload school logo"""
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Create uploads directory if it doesn't exist
        upload_dir = "static/uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"logo_{timestamp}_{file.filename}"
        file_path = os.path.join(upload_dir, filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Save logo path to settings
        logo_url = f"/static/uploads/{filename}"
        crud.set_system_setting(db, "school_logo", logo_url)
        
        return {"logo_url": logo_url, "message": "Logo uploaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading logo: {str(e)}")

# NTP Management
@router.get("/ntp/status")
def get_ntp_status():
    """Get current NTP synchronization status"""
    try:
        import ntplib
        import time
        
        # Get NTP settings from database
        db = SessionLocal()
        ntp_enabled = crud.get_system_setting(db, 'ntp_enabled')
        ntp_servers = crud.get_system_setting(db, 'ntp_servers')
        db.close()
        
        if not ntp_enabled or ntp_enabled != 'True':
            return {
                "ntp_enabled": False,
                "status": "disabled",
                "message": "NTP is not enabled"
            }
        
        if not ntp_servers:
            return {
                "ntp_enabled": True,
                "status": "error",
                "message": "No NTP servers configured"
            }
        
        # Parse NTP servers (comma-separated)
        server_list = [s.strip() for s in ntp_servers.split(',') if s.strip()]
        
        # Test NTP servers
        ntp_client = ntplib.NTPClient()
        results = []
        
        for server in server_list[:3]:  # Test up to 3 servers
            try:
                response = ntp_client.request(server, timeout=2)
                offset = response.offset
                delay = response.delay
                results.append({
                    "server": server,
                    "offset": offset,
                    "delay": delay,
                    "status": "reachable"
                })
            except Exception as e:
                results.append({
                    "server": server,
                    "status": "unreachable",
                    "error": str(e)
                })
        
        # Calculate average offset if we have successful responses
        successful_results = [r for r in results if r["status"] == "reachable"]
        if successful_results:
            avg_offset = sum(r["offset"] for r in successful_results) / len(successful_results)
            status = "synchronized" if abs(avg_offset) < 1.0 else "drift_detected"
        else:
            avg_offset = None
            status = "error"
        
        return {
            "ntp_enabled": True,
            "status": status,
            "servers": results,
            "average_offset": avg_offset,
            "local_time": time.time(),
            "message": f"NTP status: {status}"
        }
        
    except ImportError:
        return {
            "ntp_enabled": False,
            "status": "error",
            "message": "ntplib not installed. Install with: pip install ntplib"
        }
    except Exception as e:
        return {
            "ntp_enabled": False,
            "status": "error",
            "message": f"Error checking NTP status: {str(e)}"
        }

@router.post("/ntp/sync")
def sync_with_ntp():
    """Manually trigger NTP synchronization"""
    try:
        import ntplib
        import time
        
        # Get NTP settings from database
        db = SessionLocal()
        ntp_enabled = crud.get_system_setting(db, 'ntp_enabled')
        ntp_servers = crud.get_system_setting(db, 'ntp_servers')
        db.close()
        
        if not ntp_enabled or ntp_enabled != 'True':
            raise HTTPException(status_code=400, detail="NTP is not enabled")
        
        if not ntp_servers:
            raise HTTPException(status_code=400, detail="No NTP servers configured")
        
        # Parse NTP servers
        server_list = [s.strip() for s in ntp_servers.split(',') if s.strip()]
        
        # Try to sync with first available server
        ntp_client = ntplib.NTPClient()
        sync_result = None
        
        for server in server_list:
            try:
                response = ntp_client.request(server, timeout=3)
                offset = response.offset
                delay = response.delay
                
                sync_result = {
                    "server": server,
                    "offset": offset,
                    "delay": delay,
                    "timestamp": time.time()
                }
                break
                
            except Exception as e:
                continue
        
        if not sync_result:
            raise HTTPException(status_code=500, detail="Could not sync with any NTP server")
        
        # Store the sync result for reference
        crud.set_system_setting(db, 'last_ntp_sync', str(sync_result))
        
        return {
            "message": "NTP synchronization successful",
            "sync_result": sync_result
        }
        
    except ImportError:
        raise HTTPException(status_code=500, detail="ntplib not installed. Install with: pip install ntplib")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during NTP sync: {str(e)}")

@router.get("/ntp/servers")
def get_ntp_servers():
    """Get list of recommended NTP servers"""
    return {
        "recommended_servers": [
            "pool.ntp.org",
            "time.nist.gov",
            "time.google.com",
            "time.windows.com",
            "time.apple.com"
        ],
        "note": "Use comma-separated values when configuring multiple servers"
    }

@router.post("/backup")
def create_backup(db: Session = Depends(get_db)):
    """Create a comprehensive system backup"""
    try:
        from backup_system import BackupSystem
        
        backup_system = BackupSystem()
        backup_path = backup_system.create_backup(
            include_audio=True,
            include_database=True,
            include_config=True
        )
        
        return {
            "message": "Backup created successfully",
            "backup_path": backup_path,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating backup: {str(e)}")

@router.get("/backups")
def list_backups():
    """List all available backups"""
    try:
        from backup_system import BackupSystem
        
        backup_system = BackupSystem()
        backups = backup_system.list_backups()
        
        # Return only the last 10 backups to avoid overwhelming the frontend
        return {
            "backups": backups[:10],
            "total_count": len(backups)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing backups: {str(e)}")

@router.post("/backup/restore/{backup_filename:path}")
def restore_backup(backup_filename: str, db: Session = Depends(get_db)):
    """Restore from a backup file"""
    try:
        from backup_system import BackupSystem
        
        backup_system = BackupSystem()
        restore_dir = backup_system.restore_backup(backup_filename)
        
        return {
            "message": "Backup extracted successfully",
            "restore_directory": restore_dir,
            "note": "Manual restoration required - please review files in restore directory"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error restoring backup: {str(e)}")

@router.delete("/backup/{backup_filename:path}")
def delete_backup(backup_filename: str, db: Session = Depends(get_db)):
    """Delete a backup file"""
    try:
        from backup_system import BackupSystem
        import os
        
        backup_system = BackupSystem()
        backup_path = os.path.join(backup_system.backup_dir, backup_filename)
        
        if not os.path.exists(backup_path):
            raise HTTPException(status_code=404, detail="Backup file not found")
        
        os.remove(backup_path)
        
        return {
            "message": "Backup deleted successfully",
            "deleted_file": backup_filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting backup: {str(e)}")

@router.get("/backup/status")
def get_backup_status():
    """Get backup system status and configuration"""
    try:
        from backup_system import BackupSystem
        import os
        
        backup_system = BackupSystem()
        backups = backup_system.list_backups()
        
        # Get disk space info
        backup_dir = backup_system.backup_dir
        if os.path.exists(backup_dir):
            total_size = sum(backup['size'] for backup in backups)
            total_size_mb = round(total_size / (1024 * 1024), 2)
        else:
            total_size_mb = 0
        
        return {
            "total_backups": len(backups),
            "total_size_mb": total_size_mb,
            "backup_directory": backup_dir,
            "recent_backups": backups[:5] if backups else []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting backup status: {str(e)}")

@router.get("/system-info")
def get_system_info():
    """Get system information"""
    try:
        import platform
        import psutil
        
        return {
            "platform": platform.platform(),
            "python_version": platform.python_version(),
            "cpu_count": psutil.cpu_count(),
            "memory_total": psutil.virtual_memory().total,
            "memory_available": psutil.virtual_memory().available,
            "disk_usage": psutil.disk_usage('/')._asdict()
        }
    except ImportError:
        return {
            "platform": platform.platform(),
            "python_version": platform.python_version(),
            "note": "Install psutil for detailed system information"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting system info: {str(e)}")

@router.get("/system-stats")
def get_system_stats():
    """Get real-time system statistics"""
    try:
        import psutil
        import time
        import os
        
        # CPU usage
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # Memory usage
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        memory_used_gb = round(memory.used / (1024**3), 1)
        
        # Disk usage
        disk = psutil.disk_usage('/')
        disk_percent = disk.percent
        disk_free_gb = round(disk.free / (1024**3), 1)
        
        # Uptime
        uptime_seconds = time.time() - psutil.boot_time()
        uptime_days = int(uptime_seconds // (24 * 3600))
        uptime_hours = int((uptime_seconds % (24 * 3600)) // 3600)
        
        # CPU temperature (if available)
        cpu_temp = "N/A"
        try:
            # Try to read CPU temperature from system files
            temp_paths = [
                "/sys/class/thermal/thermal_zone0/temp",
                "/sys/class/hwmon/hwmon0/temp1_input",
                "/proc/acpi/thermal_zone/THM0/temperature"
            ]
            for temp_path in temp_paths:
                if os.path.exists(temp_path):
                    with open(temp_path, 'r') as f:
                        temp_raw = f.read().strip()
                        if temp_raw.isdigit():
                            cpu_temp = f"{int(temp_raw) / 1000:.1f}"
                            break
        except:
            pass
        
        return {
            "cpu_percent": round(cpu_percent, 1),
            "cpu_temp": cpu_temp,
            "memory_percent": round(memory_percent, 1),
            "memory_used_gb": memory_used_gb,
            "disk_percent": round(disk_percent, 1),
            "disk_free_gb": disk_free_gb,
            "uptime_days": uptime_days,
            "uptime_hours": uptime_hours
        }
    except ImportError:
        raise HTTPException(status_code=500, detail="psutil library not available")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting system stats: {str(e)}")