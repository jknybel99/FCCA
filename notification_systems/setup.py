#!/usr/bin/env python3
"""
Setup script for School Bell System notification systems
"""

import os
import sys
import subprocess
from pathlib import Path

def check_python_dependencies():
    """Check if required Python packages are installed"""
    required_packages = ['requests']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Missing Python packages: {', '.join(missing_packages)}")
        print("   Install with: pip install " + " ".join(missing_packages))
        return False
    else:
        print("✅ All Python dependencies are installed")
        return True

def create_env_template():
    """Create a template .env file for configuration"""
    env_template = """# School Bell System Notification Configuration

# Email Configuration
NOTIFICATION_EMAIL=your-email@gmail.com
NOTIFICATION_PASSWORD=your-app-password
NOTIFICATION_RECIPIENTS=admin@school.edu,principal@school.edu

# SMTP Configuration (optional, defaults to Gmail)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587

# Push Notification Configuration
PUSHOVER_TOKEN=your-pushover-token
PUSHOVER_USER=your-pushover-user
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# Monitoring Configuration
BACKEND_URL=http://localhost:8000
CHECK_INTERVAL=60
MAX_ERRORS=3
"""
    
    env_file = Path(".env")
    if not env_file.exists():
        with open(env_file, 'w') as f:
            f.write(env_template)
        print("✅ Created .env template file")
        print("   Edit .env file with your configuration")
    else:
        print("ℹ️  .env file already exists")

def create_directories():
    """Create necessary directories"""
    directories = [
        "logs",
        "notification_systems/logs"
    ]
    
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
    
    print("✅ Created necessary directories")

def test_system():
    """Test the notification system setup"""
    print("\n🔍 Testing notification system setup...")
    
    # Test monitoring script
    try:
        result = subprocess.run([
            sys.executable, 
            "notification_systems/monitoring/monitor_system.py", 
            "--help"
        ], capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            print("✅ Monitoring script is working")
        else:
            print("❌ Monitoring script has issues")
    except Exception as e:
        print(f"❌ Failed to test monitoring script: {e}")
    
    # Test dashboard
    try:
        result = subprocess.run([
            sys.executable, 
            "notification_systems/test_dashboard.py"
        ], capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            print("✅ Dashboard test script is working")
        else:
            print("❌ Dashboard test script has issues")
    except Exception as e:
        print(f"❌ Failed to test dashboard: {e}")

def main():
    print("🔔 School Bell System - Notification Systems Setup")
    print("=" * 50)
    
    # Check dependencies
    deps_ok = check_python_dependencies()
    
    # Create directories
    create_directories()
    
    # Create .env template
    create_env_template()
    
    # Test system
    test_system()
    
    print("\n" + "=" * 50)
    print("🎉 Setup complete!")
    print("\n📋 Next steps:")
    print("1. Edit .env file with your notification settings")
    print("2. Test the dashboard: python notification_systems/test_dashboard.py")
    print("3. Start monitoring: python notification_systems/monitoring/monitor_system.py")
    print("4. Open dashboard: notification_systems/dashboard/status_dashboard.html")
    
    if not deps_ok:
        print("\n⚠️  Please install missing dependencies before using the system")

if __name__ == "__main__":
    main()
