# Multi-stage Dockerfile for School Bell System
# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY ../frontend/package*.json ./

# Install dependencies
RUN npm ci --no-audit --no-fund

# Copy frontend source
COPY ../frontend/ ./

# Build production frontend
RUN npm run build

# Stage 2: Production Image
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    pulseaudio \
    pulseaudio-utils \
    alsa-utils \
    libasound2-dev \
    portaudio19-dev \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy backend requirements
COPY ../backend/requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY ../backend/ ./

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/frontend/build ./frontend_build

# Create necessary directories
RUN mkdir -p \
    ./static/sounds \
    ./static/uploads \
    ./static/recordings \
    ./backups \
    ./piper

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV FRONTEND_BUILD_DIR=/app/frontend_build

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start command
CMD ["python", "main.py"]
