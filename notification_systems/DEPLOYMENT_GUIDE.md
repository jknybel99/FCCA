# 🚀 School Bell System - Remote Monitoring Deployment Guide

This guide explains how to set up remote monitoring for your School Bell System from a separate server.

## 🏗️ **Architecture Overview**

```
┌─────────────────────┐    ┌─────────────────────┐
│   School Bell       │    │   Monitoring        │
│   System Server     │    │   Server            │
│                     │    │                     │
│  ┌───────────────┐  │    │  ┌───────────────┐  │
│  │   Backend     │  │◄───┤  │   Monitor     │  │
│  │   (Port 8000) │  │    │  │   Script      │  │
│  └───────────────┘  │    │  └───────────────┘  │
│                     │    │                     │
│  ┌───────────────┐  │    │  ┌───────────────┐  │
│  │   Frontend    │  │◄───┤  │   Dashboard   │  │
│  │   (Port 3000) │  │    │  │   (HTML)      │  │
│  └───────────────┘  │    │  └───────────────┘  │
└─────────────────────┘    └─────────────────────┘
```

## 📋 **Prerequisites**

### **School Bell System Server**
- ✅ School Bell System running and accessible
- ✅ Backend API accessible on port 8000
- ✅ Frontend accessible on port 3000
- ✅ Network access from monitoring server

### **Monitoring Server**
- ✅ Python 3.7+ installed
- ✅ Network access to School Bell System server
- ✅ Web browser (for dashboard)
- ✅ Optional: Email/Push notification credentials

## 🚀 **Quick Deployment**

### **Step 1: Copy Files**
```bash
# Copy the notification_systems folder to your monitoring server
scp -r notification_systems/ monitoring-server:/path/to/monitoring/
```

### **Step 2: Setup**
```bash
# On your monitoring server
cd notification_systems/
python setup_monitoring.py
```

### **Step 3: Configure**
```bash
# Edit the configuration file
nano config.env

# Update these values:
BELL_SYSTEM_URL=http://YOUR_BELL_SERVER_IP:8000
BELL_FRONTEND_URL=http://YOUR_BELL_SERVER_IP:3000
```

### **Step 4: Test**
```bash
# Test the connection
python test_dashboard.py

# Start monitoring
python monitoring/monitor_system.py
```

## 🔧 **Configuration Examples**

### **Local Network Monitoring**
```bash
# If your School Bell System is at 192.168.1.100
BELL_SYSTEM_URL=http://192.168.1.100:8000
BELL_FRONTEND_URL=http://192.168.1.100:3000
```

### **Internet Monitoring**
```bash
# If your School Bell System has a public IP
BELL_SYSTEM_URL=http://your-domain.com:8000
BELL_FRONTEND_URL=http://your-domain.com:3000
```

### **VPN Monitoring**
```bash
# If accessing through VPN
BELL_SYSTEM_URL=http://10.0.0.100:8000
BELL_FRONTEND_URL=http://10.0.0.100:3000
```

## 📱 **Dashboard Access**

### **Local Access**
```bash
# Open dashboard locally
open dashboard/status_dashboard.html
```

### **Remote Access**
```bash
# Access dashboard remotely with URL parameters
http://your-monitoring-server/dashboard/status_dashboard.html?backend=http://192.168.1.100:8000&frontend=http://192.168.1.100:3000
```

### **Web Server Setup**
```bash
# Serve dashboard via web server
python -m http.server 8080
# Then access: http://your-monitoring-server:8080/dashboard/status_dashboard.html
```

## 🔔 **Notification Setup**

### **Email Notifications**
```bash
# Add to config.env
NOTIFICATION_EMAIL=admin@school.edu
NOTIFICATION_PASSWORD=your-app-password
NOTIFICATION_RECIPIENTS=admin@school.edu,principal@school.edu
```

### **Push Notifications**
```bash
# Pushover
PUSHOVER_TOKEN=your-token
PUSHOVER_USER=your-user

# Telegram
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

## 🛠️ **Advanced Configuration**

### **Custom Check Intervals**
```bash
# Check every 30 seconds
CHECK_INTERVAL=30

# Allow 5 consecutive errors before critical alert
MAX_ERRORS=5
```

### **Multiple Bell Systems**
```bash
# Monitor multiple systems by running multiple instances
python monitoring/monitor_system.py --config config1.env
python monitoring/monitor_system.py --config config2.env
```

## 🔒 **Security Considerations**

### **Network Security**
- Use VPN for remote monitoring
- Configure firewall rules
- Use HTTPS if possible
- Consider authentication for dashboard

### **Credential Security**
- Never commit credentials to version control
- Use environment variables
- Rotate credentials regularly
- Use app-specific passwords

## 📊 **Monitoring Best Practices**

### **Resource Management**
- Monitor from a separate server to avoid resource conflicts
- Use appropriate check intervals (not too frequent)
- Monitor disk space and log rotation

### **Alert Management**
- Set up multiple notification channels
- Use different alert levels (info, warning, critical)
- Implement alert throttling to avoid spam

### **Logging**
- Monitor logs regularly
- Set up log rotation
- Keep logs for troubleshooting

## 🚨 **Troubleshooting**

### **Connection Issues**
```bash
# Test network connectivity
ping YOUR_BELL_SERVER_IP
telnet YOUR_BELL_SERVER_IP 8000
curl http://YOUR_BELL_SERVER_IP:8000/api/system/status
```

### **Dashboard Issues**
- Check browser console for errors
- Verify CORS settings on School Bell System
- Test API endpoints directly

### **Notification Issues**
- Verify email credentials
- Check push notification tokens
- Test notification services separately

## 📈 **Scaling**

### **Multiple Monitors**
- Deploy monitoring on multiple servers for redundancy
- Use load balancers for high availability
- Implement centralized logging

### **Enterprise Features**
- Integrate with existing monitoring systems (Nagios, Zabbix)
- Use professional notification services
- Implement advanced alerting rules

## 🆘 **Support**

For issues or questions:
1. Check the troubleshooting section
2. Review log files
3. Test individual components
4. Verify network connectivity

---

**Note**: This monitoring system is designed to be lightweight and non-intrusive. It only reads status information and doesn't modify your School Bell System.
