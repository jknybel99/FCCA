#!/bin/bash
# Start script for School Bell System Docker container

set -e

echo "🚀 Starting School Bell System..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo "Please start Docker first"
    exit 1
fi

# Check if image exists
if ! docker images | grep -q "school-bell-system"; then
    echo -e "${YELLOW}⚠️  Docker image not found. Building first...${NC}"
    ./build.sh
fi

# Start the container
echo -e "${YELLOW}🐳 Starting Docker container...${NC}"
docker compose up -d

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Container started successfully!${NC}"
    echo ""
    
    # Wait a moment for the container to fully start
    sleep 3
    
    # Check container status
    if docker compose ps | grep -q "Up"; then
        echo -e "${GREEN}✅ Container is running${NC}"
        echo ""
        echo -e "${YELLOW}📊 Container Status:${NC}"
        docker compose ps
        echo ""
        echo -e "${YELLOW}🌐 Access the application at:${NC}"
        echo "   ${GREEN}http://localhost:8000${NC}"
        echo ""
        echo -e "${YELLOW}📝 Useful commands:${NC}"
        echo "   View logs:        ${GREEN}docker compose logs -f${NC}"
        echo "   Stop container:   ${GREEN}docker compose stop${NC}"
        echo "   Restart:          ${GREEN}docker compose restart${NC}"
        echo "   Remove:           ${GREEN}docker compose down${NC}"
        echo ""
    else
        echo -e "${RED}❌ Container failed to start!${NC}"
        echo "Checking logs..."
        docker compose logs --tail=50
        exit 1
    fi
else
    echo ""
    echo -e "${RED}❌ Failed to start container!${NC}"
    exit 1
fi
