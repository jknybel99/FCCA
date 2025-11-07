# 🐳 Docker Deployment Guide

Complete Docker setup for the School Bell System with audio support, database persistence, and easy deployment.

## 📋 Prerequisites

- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **Audio Hardware**: Sound card accessible via `/dev/snd`

Install Docker:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose-plugin

# Or use Docker's official installation script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

## 🚀 Quick Start

### 1. Build and Start the Container

From the project root directory:

```bash
cd docker
docker compose up -d
```

This will:
- Build the Docker image (first time only, ~5-10 minutes)
- Start the container in detached mode
- Expose the application on `http://localhost:8000`

### 2. Access the Application

Open your browser and navigate to:
```
http://localhost:8000
```

Default login credentials:
- **Username**: `admin`
- **Password**: `admin123`

### 3. Check Container Status

```bash
# View running containers
docker compose ps

# View logs
docker compose logs -f

# View last 100 lines of logs
docker compose logs --tail=100
```

## 🔧 Configuration

### Audio Device Access

The container needs access to your audio hardware. By default, it uses:
```yaml
devices:
  - /dev/snd:/dev/snd
```

**Troubleshooting Audio:**

If audio doesn't work, try one of these approaches:

#### Option 1: Host Network Mode
Edit `docker-compose.yml`:
```yaml
network_mode: host
```

#### Option 2: PulseAudio Socket
```yaml
volumes:
  - /run/user/1000/pulse:/run/user/1000/pulse
environment:
  - PULSE_SERVER=unix:/run/user/1000/pulse/native
```

#### Option 3: Run as Host User
```bash
# Set your user ID
export UID=$(id -u)
export GID=$(id -g)

# Uncomment in docker-compose.yml:
# user: "${UID}:${GID}"
```

### Volume Mounts

Data persists in these directories (relative to project root):

| Host Path | Container Path | Purpose |
|-----------|---------------|---------|
| `./school_bell.db` | `/app/school_bell.db` | SQLite database |
| `./static/sounds` | `/app/static/sounds` | Audio files |
| `./static/uploads` | `/app/static/uploads` | Uploaded files |
| `./static/recordings` | `/app/static/recordings` | Recorded announcements |
| `./backups` | `/app/backups` | System backups |
| `./piper` | `/app/piper` | TTS voice models |

### Environment Variables

Edit `docker-compose.yml` to customize:

```yaml
environment:
  - TZ=America/Chicago              # Your timezone
  - DATABASE_URL=sqlite:///./school_bell.db
  - PYTHONUNBUFFERED=1
```

## 📦 Docker Commands

### Build and Run

```bash
# Build the image
docker compose build

# Start containers
docker compose up -d

# Start with rebuild
docker compose up -d --build

# Start and view logs
docker compose up
```

### Stop and Remove

```bash
# Stop containers
docker compose stop

# Stop and remove containers
docker compose down

# Stop, remove containers, and remove volumes (⚠️ deletes data!)
docker compose down -v
```

### Logs and Debugging

```bash
# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f school-bell-system

# Execute commands inside container
docker compose exec school-bell-system bash

# Check audio devices inside container
docker compose exec school-bell-system aplay -l
docker compose exec school-bell-system pactl list sinks
```

### Updates and Maintenance

```bash
# Pull latest code and rebuild
git pull
docker compose down
docker compose up -d --build

# Restart container
docker compose restart

# View resource usage
docker stats school-bell-system
```

## 🔍 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs

# Check if port 8000 is already in use
sudo lsof -i :8000

# Remove old containers and try again
docker compose down
docker compose up -d
```

### Audio Not Working

```bash
# Check audio devices on host
aplay -l

# Check audio devices in container
docker compose exec school-bell-system aplay -l

# Test audio playback in container
docker compose exec school-bell-system speaker-test -t wav -c 2

# Check PulseAudio
docker compose exec school-bell-system pactl info
```

### Database Issues

```bash
# Backup database
cp ../school_bell.db ../school_bell.db.backup

# Reset database (⚠️ deletes all data!)
rm ../school_bell.db
docker compose restart
```

### Permission Issues

```bash
# Fix file permissions
sudo chown -R $USER:$USER ../static
sudo chown -R $USER:$USER ../backups

# Or run container as your user
export UID=$(id -u)
export GID=$(id -g)
docker compose up -d
```

## 🌐 Production Deployment

### Using Reverse Proxy (Nginx/Caddy)

Example Nginx configuration:
```nginx
server {
    listen 80;
    server_name bell.yourschool.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support for paging
    location /api/paging/ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### SSL/HTTPS Setup

Use Caddy (recommended) or Let's Encrypt with Nginx.

Example Caddyfile:
```
bell.yourschool.com {
    reverse_proxy localhost:8000
}
```

### Automatic Restarts

The container is configured with `restart: unless-stopped`, so it will:
- Auto-start on system boot
- Restart if it crashes
- Stay stopped if you manually stop it

### Backups

```bash
# Backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf backup_$DATE.tar.gz \
    ../school_bell.db \
    ../static \
    ../backups

# Schedule with cron
# 0 2 * * * /path/to/backup.sh
```

## 📊 Monitoring

### Health Checks

The container includes a health check that runs every 30 seconds:
```bash
# Check health status
docker inspect school-bell-system | grep -A 10 Health
```

### Resource Monitoring

```bash
# Real-time stats
docker stats school-bell-system

# Container info
docker inspect school-bell-system
```

## 🔄 Migration from Non-Docker Setup

If you're migrating from a non-Docker setup:

1. **Backup your data:**
   ```bash
   cp school_bell.db school_bell.db.backup
   tar -czf static_backup.tar.gz static/
   ```

2. **Stop existing services:**
   ```bash
   # Stop any running backend
   pkill -f "python main.py"
   ```

3. **Start Docker container:**
   ```bash
   cd docker
   docker compose up -d
   ```

4. **Verify data:**
   - Check that all audio files are accessible
   - Verify schedules are intact
   - Test audio playback

## 🆘 Support

### Common Issues

| Issue | Solution |
|-------|----------|
| Port 8000 already in use | Change port in `docker-compose.yml`: `"8001:8000"` |
| Audio not playing | Check `/dev/snd` permissions, try `network_mode: host` |
| Database locked | Stop container, check for stale locks: `rm school_bell.db-journal` |
| Container keeps restarting | Check logs: `docker compose logs` |

### Getting Help

1. Check logs: `docker compose logs -f`
2. Check container status: `docker compose ps`
3. Test audio: `docker compose exec school-bell-system aplay -l`
4. Review this README

## 📝 Notes

- **First build** takes 5-10 minutes (downloads dependencies)
- **Subsequent builds** are faster (uses cache)
- **Data persists** across container restarts via volumes
- **Audio requires** host audio device access
- **Time zone** defaults to `America/Chicago` (change in docker-compose.yml)

## 🎯 Next Steps

After successful deployment:

1. ✅ Change default admin password
2. ✅ Configure school settings (name, logo, etc.)
3. ✅ Upload audio files
4. ✅ Create bell schedules
5. ✅ Test audio playback
6. ✅ Set up backups
7. ✅ Configure reverse proxy (if needed)

---

**Happy Scheduling! 🔔**
