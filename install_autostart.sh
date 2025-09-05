#!/bin/bash

# School Bell System Auto-Start Installation Script for Raspberry Pi 4
# This script installs the auto-start functionality

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="school-bell-system"
SERVICE_FILE="$SERVICE_NAME.service"

echo -e "${BLUE}🚀 School Bell System Auto-Start Installation${NC}"
echo "=============================================="

# Get current user
CURRENT_USER="$USER"

# Prompt for project directory
echo -e "${YELLOW}📁 Please enter the full path to your School Bell System directory:${NC}"
echo -e "${BLUE}Current directory: $(pwd)${NC}"
read -p "Project directory path: " PROJECT_DIR

# Validate project directory
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}Error: Project directory not found: $PROJECT_DIR${NC}"
    echo "Please ensure the School Bell System is installed in the correct location"
    exit 1
fi

# Check if start script exists
if [ ! -f "$PROJECT_DIR/start_school_bell_system.sh" ]; then
    echo -e "${RED}Error: start_school_bell_system.sh not found in $PROJECT_DIR${NC}"
    echo "Please ensure you're pointing to the correct School Bell System directory"
    exit 1
fi

echo -e "${GREEN}✅ Using user: $CURRENT_USER${NC}"
echo -e "${GREEN}✅ Using directory: $PROJECT_DIR${NC}"

# Make the start script executable
echo -e "${BLUE}🔧 Making start script executable...${NC}"
chmod +x "$PROJECT_DIR/start_school_bell_system.sh"

# Verify script permissions and shebang
echo -e "${BLUE}🔍 Verifying start script...${NC}"
ls -la "$PROJECT_DIR/start_school_bell_system.sh"
head -1 "$PROJECT_DIR/start_school_bell_system.sh"

# Test script syntax
echo -e "${BLUE}🧪 Testing script syntax...${NC}"
bash -n "$PROJECT_DIR/start_school_bell_system.sh"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Script syntax is valid${NC}"
else
    echo -e "${RED}❌ Script syntax error detected${NC}"
    exit 1
fi

# Create dynamic service file
echo -e "${BLUE}📋 Creating systemd service file...${NC}"
cat > "/tmp/$SERVICE_FILE" << EOF
[Unit]
Description=School Bell System
After=network.target
Wants=network.target

[Service]
Type=simple
User=$CURRENT_USER
Group=$CURRENT_USER
WorkingDirectory=$PROJECT_DIR
ExecStart=/bin/bash $PROJECT_DIR/start_school_bell_system.sh start
ExecStop=/bin/bash $PROJECT_DIR/start_school_bell_system.sh stop
ExecReload=/bin/bash $PROJECT_DIR/start_school_bell_system.sh restart
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
TimeoutStartSec=60
TimeoutStopSec=30

# Environment variables
Environment=NODE_ENV=production
Environment=PYTHONPATH=$PROJECT_DIR/backend
Environment=HOME=$PROJECT_DIR

# Minimal security settings for Pi compatibility
NoNewPrivileges=false
PrivateTmp=false

[Install]
WantedBy=multi-user.target
EOF

# Copy service file to systemd directory
echo -e "${BLUE}📋 Installing systemd service...${NC}"
sudo cp "/tmp/$SERVICE_FILE" "/etc/systemd/system/"

# Set proper permissions on service file
sudo chmod 644 "/etc/systemd/system/$SERVICE_FILE"

# Clean up temporary file
rm "/tmp/$SERVICE_FILE"

# Reload systemd daemon
echo -e "${BLUE}🔄 Reloading systemd daemon...${NC}"
sudo systemctl daemon-reload

# Reset failed state if service was previously failed
echo -e "${BLUE}🔄 Resetting any failed service state...${NC}"
sudo systemctl reset-failed "$SERVICE_NAME" 2>/dev/null || true

# Test the service configuration
echo -e "${BLUE}🧪 Testing service configuration...${NC}"
sudo systemctl daemon-reload
if sudo systemctl is-enabled "$SERVICE_NAME" >/dev/null 2>&1; then
    sudo systemctl disable "$SERVICE_NAME" 2>/dev/null || true
fi

# Enable the service
echo -e "${BLUE}✅ Enabling auto-start service...${NC}"
sudo systemctl enable "$SERVICE_NAME"

# Test service start (dry run)
echo -e "${BLUE}🧪 Testing service start (dry run)...${NC}"
sudo systemctl start "$SERVICE_NAME"
sleep 3
if sudo systemctl is-active "$SERVICE_NAME" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Service started successfully${NC}"
    sudo systemctl stop "$SERVICE_NAME"
else
    echo -e "${YELLOW}⚠️  Service start test failed, but continuing...${NC}"
    echo -e "${YELLOW}   Check logs with: sudo journalctl -u $SERVICE_NAME -f${NC}"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js not found. Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}⚠️  Python 3 not found. Installing Python 3...${NC}"
    sudo apt-get update
    sudo apt-get install -y python3 python3-pip python3-venv
fi

# Install additional system dependencies
echo -e "${BLUE}📦 Installing system dependencies...${NC}"
sudo apt-get update
sudo apt-get install -y \
    alsa-utils \
    mpg123 \
    ffmpeg \
    curl \
    git

# Set up audio permissions
echo -e "${BLUE}🔊 Setting up audio permissions...${NC}"
sudo usermod -a -G audio $CURRENT_USER

# Create necessary directories
echo -e "${BLUE}📁 Creating necessary directories...${NC}"
mkdir -p "$PROJECT_DIR/logs"
mkdir -p "$PROJECT_DIR/pids"

# Set proper permissions
echo -e "${BLUE}🔐 Setting proper permissions...${NC}"
chmod 755 "$PROJECT_DIR"
chmod 755 "$PROJECT_DIR/logs"
chmod 755 "$PROJECT_DIR/pids"

# Test the start script
echo -e "${BLUE}🧪 Testing the start script...${NC}"
"$PROJECT_DIR/start_school_bell_system.sh" status

echo ""
echo -e "${GREEN}🎉 Installation completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Available commands:${NC}"
echo "  sudo systemctl start $SERVICE_NAME     # Start the service"
echo "  sudo systemctl stop $SERVICE_NAME      # Stop the service"
echo "  sudo systemctl restart $SERVICE_NAME   # Restart the service"
echo "  sudo systemctl status $SERVICE_NAME    # Check service status"
echo "  sudo systemctl enable $SERVICE_NAME    # Enable auto-start (already done)"
echo "  sudo systemctl disable $SERVICE_NAME   # Disable auto-start"
echo ""
echo -e "${BLUE}📋 Manual control:${NC}"
echo "  $PROJECT_DIR/start_school_bell_system.sh start    # Start manually"
echo "  $PROJECT_DIR/start_school_bell_system.sh stop     # Stop manually"
echo "  $PROJECT_DIR/start_school_bell_system.sh restart  # Restart manually"
echo "  $PROJECT_DIR/start_school_bell_system.sh status   # Check status"
echo "  $PROJECT_DIR/start_school_bell_system.sh logs     # View logs"
echo ""
echo -e "${GREEN}🚀 The School Bell System will now start automatically on boot!${NC}"
echo -e "${BLUE}🌐 Access the system at: http://$(hostname -I | awk '{print $1}'):3000${NC}"
echo ""
echo -e "${YELLOW}💡 To start the service now, run:${NC}"
echo -e "   ${BLUE}sudo systemctl start $SERVICE_NAME${NC}"
echo ""
echo -e "${GREEN}✅ Service configured for user: $CURRENT_USER${NC}"
echo -e "${GREEN}✅ Service configured for directory: $PROJECT_DIR${NC}"
echo ""
echo -e "${YELLOW}🔧 Troubleshooting Tips:${NC}"
echo "  If you get 'status=226/NAMESPACE' error:"
echo "  1. Check service file: sudo cat /etc/systemd/system/$SERVICE_NAME.service"
echo "  2. Check permissions: ls -la $PROJECT_DIR/start_school_bell_system.sh"
echo "  3. Test start script manually: $PROJECT_DIR/start_school_bell_system.sh start"
echo "  4. Check logs: sudo journalctl -u $SERVICE_NAME -f"
echo "  5. Restart service: sudo systemctl restart $SERVICE_NAME"
