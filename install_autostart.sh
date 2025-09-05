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
PROJECT_DIR="/home/pi/Desktop/Audio Server"
SERVICE_NAME="school-bell-system"
SERVICE_FILE="$SERVICE_NAME.service"

echo -e "${BLUE}🚀 School Bell System Auto-Start Installation${NC}"
echo "=============================================="

# Check if running as pi user
if [ "$USER" != "pi" ]; then
    echo -e "${RED}Error: This script must be run as the 'pi' user${NC}"
    echo "Please run: sudo -u pi $0"
    exit 1
fi

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}Error: Project directory not found: $PROJECT_DIR${NC}"
    echo "Please ensure the School Bell System is installed in the correct location"
    exit 1
fi

echo -e "${YELLOW}📁 Project directory: $PROJECT_DIR${NC}"

# Make the start script executable
echo -e "${BLUE}🔧 Making start script executable...${NC}"
chmod +x "$PROJECT_DIR/start_school_bell_system.sh"

# Copy service file to systemd directory
echo -e "${BLUE}📋 Installing systemd service...${NC}"
sudo cp "$PROJECT_DIR/$SERVICE_FILE" "/etc/systemd/system/"

# Reload systemd daemon
echo -e "${BLUE}🔄 Reloading systemd daemon...${NC}"
sudo systemctl daemon-reload

# Enable the service
echo -e "${BLUE}✅ Enabling auto-start service...${NC}"
sudo systemctl enable "$SERVICE_NAME"

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
sudo usermod -a -G audio pi

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
