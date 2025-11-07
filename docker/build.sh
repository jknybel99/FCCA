#!/bin/bash
# Build script for School Bell System Docker image

set -e  # Exit on error

echo "🐳 Building School Bell System Docker Image..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed!${NC}"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed!${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"
echo ""

# Check if we're in the docker directory
if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}❌ Dockerfile not found!${NC}"
    echo "Please run this script from the docker/ directory"
    exit 1
fi

# Create necessary directories in parent directory
echo -e "${YELLOW}📁 Creating necessary directories...${NC}"
cd ..
mkdir -p static/sounds static/uploads static/recordings backups piper
cd docker

echo -e "${GREEN}✅ Directories created${NC}"
echo ""

# Build the Docker image
echo -e "${YELLOW}🔨 Building Docker image (this may take 5-10 minutes on first build)...${NC}"
docker compose build

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Docker image built successfully!${NC}"
    echo ""
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo "  1. Start the container:"
    echo "     ${GREEN}docker compose up -d${NC}"
    echo ""
    echo "  2. View logs:"
    echo "     ${GREEN}docker compose logs -f${NC}"
    echo ""
    echo "  3. Access the application:"
    echo "     ${GREEN}http://localhost:8000${NC}"
    echo ""
    echo "  4. Default login:"
    echo "     Username: ${GREEN}admin${NC}"
    echo "     Password: ${GREEN}admin123${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Build failed! Check the error messages above.${NC}"
    exit 1
fi
