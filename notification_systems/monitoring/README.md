# 📊 System Monitoring

Continuous system health monitoring and alerting with automated checks.

## 🚀 **Quick Start**

### **Basic Usage**
```bash
# Run monitoring script
python notification_systems/monitoring/monitor_system.py

# Run with custom interval (every 30 seconds)
python notification_systems/monitoring/monitor_system.py --interval 30

# Run with help
python notification_systems/monitoring/monitor_system.py --help
```

### **Background Service**
```bash
# Run in background
nohup python notification_systems/monitoring/monitor_system.py &

# Run as systemd service (see main README for setup)
sudo systemctl start school-bell-monitor
```

## 📋 **What It Monitors**

- **Backend API**: Health and responsiveness
- **Frontend**: Web interface availability
- **Database**: Connection and data integrity
- **Scheduler**: Bell scheduling system status
- **Next Event**: Upcoming scheduled events

## 🔧 **Features**

- **Automated Health Checks**: Continuous monitoring every 60 seconds
- **Change Detection**: Alerts when system status changes
- **Error Tracking**: Counts consecutive errors and alerts
- **Log Generation**: Daily log files with timestamps
- **Configurable Intervals**: Customizable check frequencies

## 📁 **Log Files**

- **Location**: `system_monitor_YYYYMMDD.log`
- **Format**: Timestamp, log level, message
- **Rotation**: Daily automatic rotation
- **Content**: All monitoring events and alerts

## ⚙️ **Configuration**

### **Environment Variables**
```bash
# Backend URL (default: http://localhost:8000)
export BACKEND_URL="http://your-server:8000"

# Check interval in seconds (default: 60)
export CHECK_INTERVAL="30"

# Maximum consecutive errors before critical alert (default: 3)
export MAX_ERRORS="5"
```

### **Command Line Options**
- `--interval SECONDS`: Set check interval
- `--help`: Show help message

## 🚨 **Alert Types**

- **Info**: Normal status updates
- **Warning**: Non-critical issues detected
- **Error**: System components offline
- **Critical**: Multiple consecutive failures

## 🔄 **Integration**

### **With Email Notifications**
```python
from notification_systems.email.notifications import notification_service

# The monitor will automatically send email alerts
```

### **With Push Notifications**
```python
from notification_systems.push.push_notifications import push_service

# The monitor will automatically send push alerts
```

## 🛠️ **Customization**

### **Adding New Checks**
1. Add new check method to `SystemMonitor` class
2. Include in `check_system_health()` method
3. Update `detect_changes()` for new alert conditions

### **Modifying Alert Logic**
Edit the `detect_changes()` method to customize:
- Alert conditions
- Notification thresholds
- Message content
