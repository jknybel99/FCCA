#!/bin/bash

# School Bell System Auto-Start Script for Raspberry Pi 4
# This script starts both backend and frontend services

# Configuration - Auto-detect project directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
LOG_DIR="$PROJECT_DIR/logs"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
PID_DIR="$PROJECT_DIR/pids"
BACKEND_PID="$PID_DIR/backend.pid"
FRONTEND_PID="$PID_DIR/frontend.pid"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create necessary directories
mkdir -p "$LOG_DIR"
mkdir -p "$PID_DIR"

# Function to log messages
log_message() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_DIR/startup.log"
}

# Function to check if a process is running
is_running() {
    local pid_file=$1
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$pid_file"
            return 1
        fi
    fi
    return 1
}

# Function to start backend
start_backend() {
    log_message "Starting School Bell System Backend..."
    
    if is_running "$BACKEND_PID"; then
        log_message "${YELLOW}Backend is already running${NC}"
        return 0
    fi
    
    cd "$BACKEND_DIR" || {
        log_message "${RED}Error: Cannot change to backend directory${NC}"
        return 1
    }
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        log_message "${YELLOW}Creating Python virtual environment...${NC}"
        python3 -m venv venv
    fi
    
    # Activate virtual environment and install dependencies
    source venv/bin/activate
    pip install -r requirements.txt > /dev/null 2>&1
    
    # Start backend in background
    nohup python main.py > "$BACKEND_LOG" 2>&1 &
    local backend_pid=$!
    echo $backend_pid > "$BACKEND_PID"
    
    # Wait a moment and check if it started successfully
    sleep 3
    if is_running "$BACKEND_PID"; then
        log_message "${GREEN}Backend started successfully (PID: $backend_pid)${NC}"
        return 0
    else
        log_message "${RED}Failed to start backend${NC}"
        return 1
    fi
}

# Function to start frontend
start_frontend() {
    log_message "Starting School Bell System Frontend..."
    
    if is_running "$FRONTEND_PID"; then
        log_message "${YELLOW}Frontend is already running${NC}"
        return 0
    fi
    
    cd "$FRONTEND_DIR" || {
        log_message "${RED}Error: Cannot change to frontend directory${NC}"
        return 1
    }
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        log_message "${YELLOW}Installing frontend dependencies...${NC}"
        npm install
    fi
    
    # Start frontend in background
    nohup npm start > "$FRONTEND_LOG" 2>&1 &
    local frontend_pid=$!
    echo $frontend_pid > "$FRONTEND_PID"
    
    # Wait a moment and check if it started successfully
    sleep 5
    if is_running "$FRONTEND_PID"; then
        log_message "${GREEN}Frontend started successfully (PID: $frontend_pid)${NC}"
        return 0
    else
        log_message "${RED}Failed to start frontend${NC}"
        return 1
    fi
}

# Function to stop services
stop_services() {
    log_message "Stopping School Bell System services..."
    
    # Stop frontend
    if [ -f "$FRONTEND_PID" ]; then
        local frontend_pid=$(cat "$FRONTEND_PID")
        if ps -p "$frontend_pid" > /dev/null 2>&1; then
            kill "$frontend_pid"
            log_message "Frontend stopped (PID: $frontend_pid)"
        fi
        rm -f "$FRONTEND_PID"
    fi
    
    # Stop backend
    if [ -f "$BACKEND_PID" ]; then
        local backend_pid=$(cat "$BACKEND_PID")
        if ps -p "$backend_pid" > /dev/null 2>&1; then
            kill "$backend_pid"
            log_message "Backend stopped (PID: $backend_pid)"
        fi
        rm -f "$BACKEND_PID"
    fi
    
    # Kill any remaining processes
    pkill -f "python main.py" 2>/dev/null
    pkill -f "react-scripts" 2>/dev/null
    
    log_message "${GREEN}All services stopped${NC}"
}

# Function to check system status
check_status() {
    log_message "Checking School Bell System status..."
    
    local backend_running=false
    local frontend_running=false
    
    if is_running "$BACKEND_PID"; then
        backend_running=true
        log_message "${GREEN}✓ Backend is running${NC}"
    else
        log_message "${RED}✗ Backend is not running${NC}"
    fi
    
    if is_running "$FRONTEND_PID"; then
        frontend_running=true
        log_message "${GREEN}✓ Frontend is running${NC}"
    else
        log_message "${RED}✗ Frontend is not running${NC}"
    fi
    
    if [ "$backend_running" = true ] && [ "$frontend_running" = true ]; then
        log_message "${GREEN}🎉 School Bell System is fully operational!${NC}"
        log_message "Access the system at: http://$(hostname -I | awk '{print $1}'):3000"
        return 0
    else
        log_message "${RED}⚠️  School Bell System is not fully operational${NC}"
        return 1
    fi
}

# Function to show help
show_help() {
    echo "School Bell System Auto-Start Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start all services (default)"
    echo "  stop      Stop all services"
    echo "  restart   Restart all services"
    echo "  status    Check service status"
    echo "  logs      Show recent logs"
    echo "  help      Show this help message"
    echo ""
}

# Function to show logs
show_logs() {
    echo -e "${BLUE}=== Recent Backend Logs ===${NC}"
    tail -20 "$BACKEND_LOG" 2>/dev/null || echo "No backend logs found"
    echo ""
    echo -e "${BLUE}=== Recent Frontend Logs ===${NC}"
    tail -20 "$FRONTEND_LOG" 2>/dev/null || echo "No frontend logs found"
    echo ""
    echo -e "${BLUE}=== Startup Log ===${NC}"
    tail -20 "$LOG_DIR/startup.log" 2>/dev/null || echo "No startup logs found"
}

# Main script logic
main() {
    local command=${1:-start}
    
    case $command in
        start)
            log_message "🚀 Starting School Bell System..."
            start_backend
            sleep 2
            start_frontend
            sleep 3
            check_status
            ;;
        stop)
            stop_services
            ;;
        restart)
            log_message "🔄 Restarting School Bell System..."
            stop_services
            sleep 2
            start_backend
            sleep 2
            start_frontend
            sleep 3
            check_status
            ;;
        status)
            check_status
            ;;
        logs)
            show_logs
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_message "${RED}Unknown command: $command${NC}"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
