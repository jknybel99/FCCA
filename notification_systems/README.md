# 🔔 School Bell System - Notification & Monitoring Systems

This folder contains various notification and monitoring solutions for the School Bell System to keep you informed about system status without manual checking.

**⚠️ Important**: These notification systems are designed to run on a **separate monitoring server**, not on the School Bell System server itself. This provides better isolation, security, and reliability.

## 📋 **Available Systems**

### 1. 📧 **Email Notifications** (`email/`)
- **Purpose**: Send email alerts for system status changes, errors, and daily summaries
- **Features**: 
  - System status alerts
  - Error notifications
  - Daily summaries
  - HTML formatted emails
- **Setup**: Configure SMTP credentials in environment variables

### 2. 📱 **Push Notifications** (`push/`)
- **Purpose**: Send mobile push notifications for critical alerts
- **Features**:
  - Pushover integration
  - Telegram bot notifications
  - Priority-based alerts
  - Cross-platform support
- **Setup**: Configure API tokens for your preferred service

### 3. 🌐 **WebSocket Real-time** (`websocket/`)
- **Purpose**: Real-time status updates via WebSocket connections
- **Features**:
  - Live system status broadcasting
  - Multiple client connections
  - Automatic reconnection
  - Low latency updates
- **Setup**: Integrate with existing FastAPI backend

### 4. 📊 **System Monitoring** (`monitoring/`)
- **Purpose**: Continuous system health monitoring and alerting
- **Features**:
  - Automated health checks
  - Change detection
  - Log file generation
  - Configurable intervals
- **Setup**: Run as background service or cron job

### 5. 🖥️ **Status Dashboard** (`dashboard/`)
- **Purpose**: Visual web-based status monitoring
- **Features**:
  - Real-time status display
  - Auto-refresh capability
  - Activity logging
  - Mobile-friendly design
- **Setup**: Open HTML file in web browser

## 🚀 **Quick Start Guide**

### **Prerequisites**
- A separate server/computer for monitoring (can be your laptop, desktop, or another server)
- Network access to your School Bell System server
- Python 3.7+ installed on the monitoring server

### **Option 1: Simple Monitoring (Recommended for beginners)**
```bash
# On your monitoring server, clone or copy the notification_systems folder
# Then run the monitoring script
python notification_systems/monitoring/monitor_system.py

# Run with custom interval (every 30 seconds)
python notification_systems/monitoring/monitor_system.py --interval 30
```

### **Option 2: Visual Dashboard**
```bash
# Open the dashboard in your browser
open notification_systems/dashboard/status_dashboard.html

# For remote monitoring, add URL parameters:
# notification_systems/dashboard/status_dashboard.html?backend=http://192.168.1.100:8000&frontend=http://192.168.1.100:3000
```

### **Option 3: Email Notifications**
```bash
# Set up environment variables
export NOTIFICATION_EMAIL="your-email@gmail.com"
export NOTIFICATION_PASSWORD="your-app-password"
export NOTIFICATION_RECIPIENTS="admin@school.edu,principal@school.edu"

# The system will automatically send notifications
```

### **Option 4: Push Notifications**
```bash
# For Pushover
export PUSHOVER_TOKEN="your-pushover-token"
export PUSHOVER_USER="your-pushover-user"

# For Telegram
export TELEGRAM_BOT_TOKEN="your-bot-token"
export TELEGRAM_CHAT_ID="your-chat-id"
```

## 🔧 **Configuration**

### **Quick Setup**
```bash
# Run the setup script
python notification_systems/setup_monitoring.py

# Edit the generated config.env file
nano notification_systems/config.env
```

### **Environment Variables**
Create a `config.env` file with your notification settings:

```bash
# Bell System Server URLs (where your School Bell System is running)
BELL_SYSTEM_URL=http://192.168.1.100:8000
BELL_FRONTEND_URL=http://192.168.1.100:3000

# Monitoring Settings
CHECK_INTERVAL=60
MAX_ERRORS=3

# Email Configuration
NOTIFICATION_EMAIL=your-email@gmail.com
NOTIFICATION_PASSWORD=your-app-password
NOTIFICATION_RECIPIENTS=admin@school.edu,principal@school.edu

# Push Notification Configuration
PUSHOVER_TOKEN=your-pushover-token
PUSHOVER_USER=your-pushover-user
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

### **Remote Monitoring Setup**
For monitoring from a separate server:

1. **Copy the notification_systems folder** to your monitoring server
2. **Run the setup script**: `python setup_monitoring.py`
3. **Edit config.env** with your School Bell System server details
4. **Start monitoring**: `python monitoring/monitor_system.py`

## 📱 **Mobile Integration**

### **IFTTT (If This Then That)**
- Create applets to trigger notifications based on system events
- Connect to email, SMS, or push notification services
- Customize notification content and timing

### **Zapier**
- Automate workflows between your system and notification services
- Create complex notification chains
- Integrate with multiple platforms

### **Pushbullet**
- Cross-device notification syncing
- Universal copy-paste
- File sharing capabilities

## 🛠️ **Customization**

### **Adding New Notification Methods**
1. Create a new service class in the appropriate folder
2. Implement the required methods (send, configure, etc.)
3. Add configuration options to the main system
4. Update this README with usage instructions

### **Modifying Alert Thresholds**
Edit the monitoring script to change:
- Check intervals
- Error thresholds
- Alert conditions
- Notification frequency

## 🔍 **Troubleshooting**

### **Common Issues**

1. **Dashboard not loading data**
   - Check if backend is running on port 8000
   - Verify CORS settings
   - Check browser console for errors

2. **Email notifications not working**
   - Verify SMTP credentials
   - Check firewall settings
   - Ensure app passwords are used (not regular passwords)

3. **Push notifications failing**
   - Verify API tokens
   - Check service status
   - Ensure proper formatting

4. **Monitoring script errors**
   - Check Python dependencies
   - Verify file permissions
   - Review log files

### **Log Files**
- Monitor logs are saved as `system_monitor_YYYYMMDD.log`
- Check these files for detailed error information
- Logs are automatically rotated daily

## 📚 **Dependencies**

### **Python Packages**
```bash
pip install requests smtplib ssl email
```

### **Node.js Packages** (for advanced features)
```bash
npm install ws socket.io
```

## 🔒 **Security Considerations**

- **Never commit credentials** to version control
- **Use environment variables** for sensitive information
- **Implement rate limiting** for notifications
- **Use HTTPS** for web-based notifications
- **Regularly rotate** API keys and passwords

## 📞 **Support**

For issues or questions:
1. Check the troubleshooting section above
2. Review log files for error details
3. Verify configuration settings
4. Test individual components separately

## 🎯 **Best Practices**

1. **Start simple**: Begin with the monitoring script
2. **Test thoroughly**: Verify notifications work before relying on them
3. **Monitor logs**: Regularly check notification logs
4. **Backup configurations**: Keep copies of working configurations
5. **Update regularly**: Keep notification services updated

---

**Note**: These notification systems are designed to work alongside your existing School Bell System. They don't replace the core functionality but enhance it with monitoring and alerting capabilities.
