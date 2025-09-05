#!/usr/bin/env python3
"""
School Bell System Monitor
Continuously monitors system status and sends notifications
"""

import time
import requests
import json
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, Any

class SystemMonitor:
    def __init__(self):
        # Default to localhost, but can be configured for remote monitoring
        self.backend_url = os.getenv("BELL_SYSTEM_URL", "http://localhost:8000")
        self.frontend_url = os.getenv("BELL_FRONTEND_URL", "http://localhost:3000")
        self.check_interval = int(os.getenv("CHECK_INTERVAL", "60"))  # Check every minute
        self.last_status = {}
        self.error_count = 0
        self.max_errors = int(os.getenv("MAX_ERRORS", "3"))
        
    def check_system_health(self) -> Dict[str, Any]:
        """Check overall system health"""
        health_status = {
            "timestamp": datetime.now().isoformat(),
            "backend_online": False,
            "frontend_online": False,
            "database_healthy": False,
            "scheduler_running": False,
            "next_event": None,
            "errors": []
        }
        
        try:
            # Check backend
            response = requests.get(f"{self.backend_url}/api/system/status", timeout=5)
            if response.status_code == 200:
                health_status["backend_online"] = True
                system_data = response.json()
                health_status["scheduler_running"] = system_data.get("scheduler_running", False)
                
            # Get system metrics
            response = requests.get(f"{self.backend_url}/api/admin/system-stats", timeout=5)
            if response.status_code == 200:
                metrics_data = response.json()
                health_status["cpu_percent"] = metrics_data.get("cpu_percent", 0)
                health_status["memory_percent"] = metrics_data.get("memory_percent", 0)
                health_status["disk_percent"] = metrics_data.get("disk_percent", 0)
                health_status["uptime_days"] = metrics_data.get("uptime_days", 0)
                
        except Exception as e:
            health_status["errors"].append(f"Backend check failed: {str(e)}")
            
        try:
            # Check frontend
            response = requests.get(self.frontend_url, timeout=5)
            if response.status_code == 200:
                health_status["frontend_online"] = True
                
        except Exception as e:
            health_status["errors"].append(f"Frontend check failed: {str(e)}")
            
        try:
            # Check next event
            response = requests.get(f"{self.backend_url}/api/schedule/next", timeout=5)
            if response.status_code == 200:
                next_event = response.json()
                health_status["next_event"] = next_event
                
        except Exception as e:
            health_status["errors"].append(f"Next event check failed: {str(e)}")
            
        return health_status
    
    def send_notification(self, message: str, alert_type: str = "info"):
        """Send notification via configured method"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        full_message = f"[{timestamp}] {message}"
        
        print(f"🔔 {full_message}")
        
        # You can add email, push notification, or other methods here
        # For now, just log to file
        self.log_to_file(full_message, alert_type)
    
    def log_to_file(self, message: str, alert_type: str):
        """Log message to file"""
        log_file = f"system_monitor_{datetime.now().strftime('%Y%m%d')}.log"
        with open(log_file, "a") as f:
            f.write(f"{datetime.now().isoformat()} [{alert_type.upper()}] {message}\n")
    
    def detect_changes(self, current_status: Dict[str, Any]):
        """Detect significant changes in system status"""
        if not self.last_status:
            self.last_status = current_status
            return
            
        # Check for system going offline
        if (self.last_status.get("backend_online") and 
            not current_status.get("backend_online")):
            self.send_notification("🚨 Backend system went offline!", "error")
            
        if (self.last_status.get("frontend_online") and 
            not current_status.get("frontend_online")):
            self.send_notification("🚨 Frontend system went offline!", "error")
            
        # Check for system coming back online
        if (not self.last_status.get("backend_online") and 
            current_status.get("backend_online")):
            self.send_notification("✅ Backend system is back online!", "success")
            
        if (not self.last_status.get("frontend_online") and 
            current_status.get("frontend_online")):
            self.send_notification("✅ Frontend system is back online!", "success")
            
        # Check for new errors
        if len(current_status.get("errors", [])) > len(self.last_status.get("errors", [])):
            new_errors = set(current_status.get("errors", [])) - set(self.last_status.get("errors", []))
            for error in new_errors:
                self.send_notification(f"⚠️ New error detected: {error}", "warning")
                
        # Check for scheduler status changes
        if (self.last_status.get("scheduler_running") != 
            current_status.get("scheduler_running")):
            status = "running" if current_status.get("scheduler_running") else "stopped"
            self.send_notification(f"📅 Bell scheduler is now {status}", "info")
            
        # Check for high resource usage
        cpu_percent = current_status.get("cpu_percent", 0)
        memory_percent = current_status.get("memory_percent", 0)
        disk_percent = current_status.get("disk_percent", 0)
        
        if cpu_percent > 90:
            self.send_notification(f"⚠️ High CPU usage: {cpu_percent}%", "warning")
        if memory_percent > 90:
            self.send_notification(f"⚠️ High memory usage: {memory_percent}%", "warning")
        if disk_percent > 95:
            self.send_notification(f"⚠️ Critical disk usage: {disk_percent}%", "critical")
            
        self.last_status = current_status
    
    def run_monitor(self):
        """Main monitoring loop"""
        print("🔍 Starting School Bell System Monitor...")
        print(f"📊 Monitoring: {self.backend_url}")
        print(f"📊 Frontend: {self.frontend_url}")
        print(f"📊 Checking system every {self.check_interval} seconds")
        print("Press Ctrl+C to stop monitoring")
        
        try:
            while True:
                current_status = self.check_system_health()
                self.detect_changes(current_status)
                
                # Reset error count if system is healthy
                if (current_status.get("backend_online") and 
                    current_status.get("frontend_online") and 
                    not current_status.get("errors")):
                    self.error_count = 0
                else:
                    self.error_count += 1
                    
                # Send critical alert if too many consecutive errors
                if self.error_count >= self.max_errors:
                    self.send_notification(
                        f"🚨 CRITICAL: System has been unhealthy for {self.error_count} consecutive checks!",
                        "critical"
                    )
                    self.error_count = 0  # Reset to avoid spam
                
                time.sleep(self.check_interval)
                
        except KeyboardInterrupt:
            print("\n🛑 Monitoring stopped by user")
        except Exception as e:
            print(f"❌ Monitor error: {e}")
            self.send_notification(f"Monitor script error: {e}", "error")

def main():
    monitor = SystemMonitor()
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "--help":
            print("School Bell System Monitor")
            print("Usage: python monitor_system.py [--interval SECONDS]")
            print("  --interval: Check interval in seconds (default: 60)")
            return
        elif sys.argv[1] == "--interval" and len(sys.argv) > 2:
            try:
                monitor.check_interval = int(sys.argv[2])
            except ValueError:
                print("Error: Invalid interval value")
                return
    
    monitor.run_monitor()

if __name__ == "__main__":
    main()
