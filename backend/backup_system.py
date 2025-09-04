#!/usr/bin/env python3
"""
Backup System for School Bell System
Creates backups of audio files, database, and configuration
"""

import os
import shutil
import sqlite3
import json
from datetime import datetime
import zipfile
import hashlib
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('backup_system.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class BackupSystem:
    def __init__(self, backup_dir="backups"):
        self.backup_dir = backup_dir
        self.audio_dir = "static/sounds"
        self.db_file = "school_bell_system.db"
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Create backup directory if it doesn't exist
        os.makedirs(self.backup_dir, exist_ok=True)
        
    def create_backup(self, include_audio=True, include_database=True, include_config=True):
        """Create a comprehensive backup"""
        backup_name = f"backup_{self.timestamp}"
        backup_path = os.path.join(self.backup_dir, backup_name)
        
        try:
            os.makedirs(backup_path, exist_ok=True)
            logger.info(f"Creating backup: {backup_name}")
            
            # Backup database
            if include_database:
                self._backup_database(backup_path)
            
            # Backup audio files
            if include_audio:
                self._backup_audio_files(backup_path)
            
            # Backup configuration
            if include_config:
                self._backup_config(backup_path)
            
            # Create backup manifest
            self._create_manifest(backup_path, backup_name)
            
            # Create compressed archive
            archive_path = self._create_archive(backup_path, backup_name)
            
            # Clean up temporary files
            shutil.rmtree(backup_path)
            
            logger.info(f"Backup completed successfully: {archive_path}")
            return archive_path
            
        except Exception as e:
            logger.error(f"Backup failed: {e}")
            # Clean up on failure
            if os.path.exists(backup_path):
                shutil.rmtree(backup_path)
            raise
    
    def _backup_database(self, backup_path):
        """Backup the SQLite database"""
        if not os.path.exists(self.db_file):
            logger.warning(f"Database file {self.db_file} not found")
            return
        
        db_backup_path = os.path.join(backup_path, "database")
        os.makedirs(db_backup_path, exist_ok=True)
        
        # Copy database file
        db_backup_file = os.path.join(db_backup_path, os.path.basename(self.db_file))
        shutil.copy2(self.db_file, db_backup_file)
        
        # Create SQL dump
        self._create_sql_dump(db_backup_path)
        
        logger.info("Database backup completed")
    
    def _create_sql_dump(self, backup_path):
        """Create a SQL dump of the database"""
        try:
            conn = sqlite3.connect(self.db_file)
            dump_file = os.path.join(backup_path, "database_dump.sql")
            
            with open(dump_file, 'w') as f:
                for line in conn.iterdump():
                    f.write(f'{line}\n')
            
            conn.close()
            logger.info("SQL dump created successfully")
            
        except Exception as e:
            logger.error(f"Failed to create SQL dump: {e}")
    
    def _backup_audio_files(self, backup_path):
        """Backup audio files with metadata"""
        if not os.path.exists(self.audio_dir):
            logger.warning(f"Audio directory {self.audio_dir} not found")
            return
        
        audio_backup_path = os.path.join(backup_path, "audio_files")
        os.makedirs(audio_backup_path, exist_ok=True)
        
        # Copy audio files
        audio_files = []
        for root, dirs, files in os.walk(self.audio_dir):
            for file in files:
                if file.lower().endswith(('.mp3', '.wav', '.aac', '.ogg', '.flac')):
                    src_path = os.path.join(root, file)
                    rel_path = os.path.relpath(src_path, self.audio_dir)
                    dst_path = os.path.join(audio_backup_path, rel_path)
                    
                    # Create subdirectories if needed
                    os.makedirs(os.path.dirname(dst_path), exist_ok=True)
                    
                    # Copy file
                    shutil.copy2(src_path, dst_path)
                    
                    # Calculate file hash
                    file_hash = self._calculate_file_hash(src_path)
                    
                    audio_files.append({
                        'filename': rel_path,
                        'size': os.path.getsize(src_path),
                        'hash': file_hash,
                        'modified': datetime.fromtimestamp(os.path.getmtime(src_path)).isoformat()
                    })
        
        # Save audio files metadata
        metadata_file = os.path.join(audio_backup_path, "audio_metadata.json")
        with open(metadata_file, 'w') as f:
            json.dump(audio_files, f, indent=2)
        
        logger.info(f"Audio files backup completed: {len(audio_files)} files")
    
    def _backup_config(self, backup_path):
        """Backup configuration files"""
        config_backup_path = os.path.join(backup_path, "config")
        os.makedirs(config_backup_path, exist_ok=True)
        
        # List of important config files to backup
        config_files = [
            "main.py",
            "requirements.txt",
            "database.py",
            "models.py",
            "schemas.py",
            "crud.py"
        ]
        
        # Copy config files
        for file in config_files:
            if os.path.exists(file):
                shutil.copy2(file, config_backup_path)
        
        # Copy API directory
        if os.path.exists("api"):
            api_backup_path = os.path.join(config_backup_path, "api")
            shutil.copytree("api", api_backup_path, dirs_exist_ok=True)
        
        logger.info("Configuration backup completed")
    
    def _create_manifest(self, backup_path, backup_name):
        """Create a backup manifest with metadata"""
        manifest = {
            'backup_name': backup_name,
            'timestamp': self.timestamp,
            'created_at': datetime.now().isoformat(),
            'system_info': {
                'python_version': os.sys.version,
                'platform': os.name,
                'current_directory': os.getcwd()
            },
            'backup_contents': {
                'database': os.path.exists(os.path.join(backup_path, "database")),
                'audio_files': os.path.exists(os.path.join(backup_path, "audio_files")),
                'config': os.path.exists(os.path.join(backup_path, "config"))
            }
        }
        
        manifest_file = os.path.join(backup_path, "backup_manifest.json")
        with open(manifest_file, 'w') as f:
            json.dump(manifest, f, indent=2)
    
    def _create_archive(self, backup_path, backup_name):
        """Create a compressed archive of the backup"""
        archive_path = os.path.join(self.backup_dir, f"{backup_name}.zip")
        
        with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(backup_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, backup_path)
                    zipf.write(file_path, arcname)
        
        return archive_path
    
    def _calculate_file_hash(self, file_path):
        """Calculate SHA256 hash of a file"""
        hash_sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        return hash_sha256.hexdigest()
    
    def list_backups(self):
        """List all available backups"""
        if not os.path.exists(self.backup_dir):
            return []
        
        backups = []
        for file in os.listdir(self.backup_dir):
            if file.endswith('.zip') and file.startswith('backup_'):
                file_path = os.path.join(self.backup_dir, file)
                file_size = os.path.getsize(file_path)
                file_time = datetime.fromtimestamp(os.path.getmtime(file_path))
                
                backups.append({
                    'filename': file,
                    'size': file_size,
                    'size_mb': round(file_size / (1024 * 1024), 2),
                    'created': file_time.isoformat(),
                    'path': file_path
                })
        
        # Sort by creation time (newest first)
        backups.sort(key=lambda x: x['created'], reverse=True)
        return backups
    
    def restore_backup(self, backup_filename):
        """Restore from a backup file"""
        backup_path = os.path.join(self.backup_dir, backup_filename)
        
        if not os.path.exists(backup_path):
            raise FileNotFoundError(f"Backup file {backup_filename} not found")
        
        # Create restore directory
        restore_dir = f"restore_{self.timestamp}"
        os.makedirs(restore_dir, exist_ok=True)
        
        try:
            # Extract backup
            with zipfile.ZipFile(backup_path, 'r') as zipf:
                zipf.extractall(restore_dir)
            
            logger.info(f"Backup extracted to {restore_dir}")
            logger.info("Manual restoration required - please review files in restore directory")
            
            return restore_dir
            
        except Exception as e:
            logger.error(f"Restore failed: {e}")
            if os.path.exists(restore_dir):
                shutil.rmtree(restore_dir)
            raise

def main():
    """Main function for command-line usage"""
    import argparse
    
    parser = argparse.ArgumentParser(description="School Bell System Backup Tool")
    parser.add_argument("--action", choices=["backup", "list", "restore"], default="backup",
                       help="Action to perform")
    parser.add_argument("--backup-file", help="Backup file to restore from")
    parser.add_argument("--no-audio", action="store_true", help="Skip audio files backup")
    parser.add_argument("--no-database", action="store_true", help="Skip database backup")
    parser.add_argument("--no-config", action="store_true", help="Skip config backup")
    
    args = parser.parse_args()
    
    backup_system = BackupSystem()
    
    if args.action == "backup":
        backup_path = backup_system.create_backup(
            include_audio=not args.no_audio,
            include_database=not args.no_database,
            include_config=not args.no_config
        )
        print(f"Backup created: {backup_path}")
        
    elif args.action == "list":
        backups = backup_system.list_backups()
        if not backups:
            print("No backups found")
        else:
            print("Available backups:")
            for backup in backups:
                print(f"  {backup['filename']} - {backup['size_mb']} MB - {backup['created']}")
                
    elif args.action == "restore":
        if not args.backup_file:
            print("Error: --backup-file required for restore")
            return
        
        restore_dir = backup_system.restore_backup(args.backup_file)
        print(f"Backup extracted to: {restore_dir}")

if __name__ == "__main__":
    main()


