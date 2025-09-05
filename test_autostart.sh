#!/bin/bash

# Test script for School Bell System Auto-Start
# This script tests the auto-start functionality

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing School Bell System Auto-Start${NC}"
echo "=========================================="

# Test 1: Check if start script exists and is executable
echo -e "${BLUE}Test 1: Checking start script...${NC}"
if [ -f "start_school_bell_system.sh" ] && [ -x "start_school_bell_system.sh" ]; then
    echo -e "${GREEN}✓ Start script exists and is executable${NC}"
else
    echo -e "${RED}✗ Start script missing or not executable${NC}"
    exit 1
fi

# Test 2: Check if service file exists
echo -e "${BLUE}Test 2: Checking service file...${NC}"
if [ -f "school-bell-system.service" ]; then
    echo -e "${GREEN}✓ Service file exists${NC}"
else
    echo -e "${RED}✗ Service file missing${NC}"
    exit 1
fi

# Test 3: Check if installation script exists and is executable
echo -e "${BLUE}Test 3: Checking installation script...${NC}"
if [ -f "install_autostart.sh" ] && [ -x "install_autostart.sh" ]; then
    echo -e "${GREEN}✓ Installation script exists and is executable${NC}"
else
    echo -e "${RED}✗ Installation script missing or not executable${NC}"
    exit 1
fi

# Test 4: Test start script help command
echo -e "${BLUE}Test 4: Testing start script help...${NC}"
if ./start_school_bell_system.sh help > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Start script help command works${NC}"
else
    echo -e "${RED}✗ Start script help command failed${NC}"
    exit 1
fi

# Test 5: Test start script status command
echo -e "${BLUE}Test 5: Testing start script status...${NC}"
if ./start_school_bell_system.sh status 2>&1 | grep -q "School Bell System status"; then
    echo -e "${GREEN}✓ Start script status command works${NC}"
else
    echo -e "${RED}✗ Start script status command failed${NC}"
    exit 1
fi

# Test 6: Check if required directories exist
echo -e "${BLUE}Test 6: Checking project structure...${NC}"
if [ -d "backend" ] && [ -d "frontend" ]; then
    echo -e "${GREEN}✓ Backend and frontend directories exist${NC}"
else
    echo -e "${RED}✗ Backend or frontend directory missing${NC}"
    exit 1
fi

# Test 7: Check if backend main.py exists
echo -e "${BLUE}Test 7: Checking backend main file...${NC}"
if [ -f "backend/main.py" ]; then
    echo -e "${GREEN}✓ Backend main.py exists${NC}"
else
    echo -e "${RED}✗ Backend main.py missing${NC}"
    exit 1
fi

# Test 8: Check if frontend package.json exists
echo -e "${BLUE}Test 8: Checking frontend package.json...${NC}"
if [ -f "frontend/package.json" ]; then
    echo -e "${GREEN}✓ Frontend package.json exists${NC}"
else
    echo -e "${RED}✗ Frontend package.json missing${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 All tests passed!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps for Raspberry Pi setup:${NC}"
echo "1. Copy this project to your Raspberry Pi"
echo "2. Run: ./install_autostart.sh"
echo "3. Start the service: sudo systemctl start school-bell-system"
echo "4. Access at: http://[PI_IP]:3000"
echo ""
echo -e "${YELLOW}💡 For detailed instructions, see: RASPBERRY_PI_SETUP.md${NC}"
