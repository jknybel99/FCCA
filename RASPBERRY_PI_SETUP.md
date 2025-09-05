# School Bell System - Raspberry Pi 4 Setup Guide

This guide will help you set up the School Bell System to run automatically on a Raspberry Pi 4.

## Prerequisites

- Raspberry Pi 4 (4GB RAM recommended)
- MicroSD card (32GB+ recommended)
- Raspberry Pi OS (Bullseye or newer)
- Internet connection
- Audio output device (speakers/headphones)

## Quick Setup

### 1. Install the School Bell System

```bash
# Clone or copy the project to your Pi
cd /home/pi/Desktop
# (Copy your Audio Server folder here)

# Make the installation script executable
chmod +x "Audio Server/install_autostart.sh"

# Run the installation script
"Audio Server/install_autostart.sh"
```

### 2. Start the System

```bash
# Start the service immediately
sudo systemctl start school-bell-system

# Check if it's running
sudo systemctl status school-bell-system
```

### 3. Access the System

Open your web browser and navigate to:
```
http://[PI_IP_ADDRESS]:3000
```

To find your Pi's IP address:
```bash
hostname -I
```

## Manual Control

### Using systemctl (Recommended)

```bash
# Start the service
sudo systemctl start school-bell-system

# Stop the service
sudo systemctl stop school-bell-system

# Restart the service
sudo systemctl restart school-bell-system

# Check service status
sudo systemctl status school-bell-system

# Enable auto-start on boot
sudo systemctl enable school-bell-system

# Disable auto-start on boot
sudo systemctl disable school-bell-system
```

### Using the Start Script

```bash
cd "/home/pi/Desktop/Audio Server"

# Start all services
./start_school_bell_system.sh start

# Stop all services
./start_school_bell_system.sh stop

# Restart all services
./start_school_bell_system.sh restart

# Check status
./start_school_bell_system.sh status

# View logs
./start_school_bell_system.sh logs
```

## Logs and Troubleshooting

### View Logs

```bash
# System service logs
sudo journalctl -u school-bell-system -f

# Application logs
tail -f "/home/pi/Desktop/Audio Server/logs/backend.log"
tail -f "/home/pi/Desktop/Audio Server/logs/frontend.log"
tail -f "/home/pi/Desktop/Audio Server/logs/startup.log"
```

### Common Issues

#### 1. Service Won't Start
```bash
# Check service status
sudo systemctl status school-bell-system

# Check logs
sudo journalctl -u school-bell-system --no-pager

# Restart the service
sudo systemctl restart school-bell-system
```

#### 2. Port Already in Use
```bash
# Kill processes using ports 3000 and 8000
sudo lsof -ti:3000 | xargs sudo kill -9
sudo lsof -ti:8000 | xargs sudo kill -9

# Restart the service
sudo systemctl restart school-bell-system
```

#### 3. Audio Issues
```bash
# Test audio
speaker-test -t wav -c 2

# Check audio devices
aplay -l

# Set default audio device
sudo raspi-config
# Navigate to: Advanced Options > Audio
```

#### 4. Permission Issues
```bash
# Fix ownership
sudo chown -R pi:pi "/home/pi/Desktop/Audio Server"

# Fix permissions
chmod +x "/home/pi/Desktop/Audio Server/start_school_bell_system.sh"
```

## Network Access

### Enable SSH (Optional)
```bash
sudo systemctl enable ssh
sudo systemctl start ssh
```

### Configure Firewall (Optional)
```bash
# Install UFW
sudo apt install ufw

# Allow SSH and web access
sudo ufw allow ssh
sudo ufw allow 3000
sudo ufw allow 8000

# Enable firewall
sudo ufw enable
```

### Static IP (Optional)
Edit `/etc/dhcpcd.conf`:
```
interface eth0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=8.8.8.8 8.8.4.4
```

## Performance Optimization

### Overclock (Optional)
Edit `/boot/config.txt`:
```
arm_freq=2000
gpu_freq=750
over_voltage=6
```

### Disable Unnecessary Services
```bash
# Disable Bluetooth
sudo systemctl disable bluetooth

# Disable WiFi power management
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

## Backup and Recovery

### Create Backup
```bash
# Create backup script
cat > backup_school_bell.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/pi/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/school_bell_backup_$DATE.tar.gz" \
    -C /home/pi/Desktop "Audio Server" \
    --exclude="Audio Server/node_modules" \
    --exclude="Audio Server/backend/venv" \
    --exclude="Audio Server/logs" \
    --exclude="Audio Server/pids"
echo "Backup created: $BACKUP_DIR/school_bell_backup_$DATE.tar.gz"
EOF

chmod +x backup_school_bell.sh
```

### Restore from Backup
```bash
# Stop the service
sudo systemctl stop school-bell-system

# Extract backup
tar -xzf school_bell_backup_YYYYMMDD_HHMMSS.tar.gz -C /home/pi/Desktop/

# Restart the service
sudo systemctl start school-bell-system
```

## Monitoring

### System Resources
```bash
# Check CPU and memory usage
htop

# Check disk usage
df -h

# Check network connections
netstat -tulpn | grep -E ':(3000|8000)'
```

### Service Health Check
```bash
# Create health check script
cat > health_check.sh << 'EOF'
#!/bin/bash
echo "=== School Bell System Health Check ==="
echo "Service Status:"
sudo systemctl is-active school-bell-system
echo ""
echo "Port Status:"
netstat -tulpn | grep -E ':(3000|8000)'
echo ""
echo "Process Status:"
ps aux | grep -E '(python main.py|react-scripts)' | grep -v grep
echo ""
echo "Disk Usage:"
df -h /home/pi/Desktop/Audio\ Server
echo ""
echo "Memory Usage:"
free -h
EOF

chmod +x health_check.sh
```

## Updates

### Update the System
```bash
# Stop the service
sudo systemctl stop school-bell-system

# Update code (replace with your update method)
# git pull origin main

# Restart the service
sudo systemctl start school-bell-system
```

## Support

If you encounter issues:

1. Check the logs: `sudo journalctl -u school-bell-system -f`
2. Verify service status: `sudo systemctl status school-bell-system`
3. Check manual start: `./start_school_bell_system.sh status`
4. Review this documentation

## Security Notes

- Change default Pi password: `passwd`
- Enable SSH key authentication
- Keep the system updated: `sudo apt update && sudo apt upgrade`
- Use a firewall for production deployments
- Regular backups are recommended

---

**Happy Bell Scheduling! 🔔**
