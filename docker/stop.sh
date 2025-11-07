#!/bin/bash
# Stop script for School Bell System Docker container

echo "🛑 Stopping School Bell System..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Stop the container
docker compose stop

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Container stopped successfully!${NC}"
    echo ""
    echo "To start again, run: ${GREEN}./start.sh${NC}"
    echo "To remove completely, run: ${GREEN}docker compose down${NC}"
else
    echo ""
    echo -e "${RED}❌ Failed to stop container!${NC}"
    exit 1
fi
