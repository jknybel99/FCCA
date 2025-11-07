# 🚀 Quick Start Guide

Get the School Bell System running in Docker in under 5 minutes!

## Prerequisites

- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose installed (usually comes with Docker Desktop)

## 3-Step Deployment

### Step 1: Build the Image

```bash
cd docker
./build.sh
```

This will:
- ✅ Check Docker installation
- ✅ Create necessary directories
- ✅ Build the Docker image (~5-10 minutes first time)

### Step 2: Start the Container

```bash
./start.sh
```

This will:
- ✅ Start the container
- ✅ Show container status
- ✅ Display access URL

### Step 3: Access the Application

Open your browser:
```
http://localhost:8000
```

**Default Login:**
- Username: `admin`
- Password: `admin123`

---

## 📋 Common Commands

```bash
# View logs
docker compose logs -f

# Stop container
./stop.sh
# or
docker compose stop

# Restart container
docker compose restart

# Stop and remove container
docker compose down

# Rebuild and restart
docker compose up -d --build
```

---

## 🔧 Troubleshooting

### Port 8000 Already in Use?

Edit `docker-compose.yml` and change:
```yaml
ports:
  - "8001:8000"  # Use port 8001 instead
```

### Audio Not Working?

Try host network mode. Edit `docker-compose.yml`:
```yaml
network_mode: host
```

Then restart:
```bash
docker compose down
docker compose up -d
```

### View Detailed Logs

```bash
docker compose logs -f school-bell-system
```

### Check Container Status

```bash
docker compose ps
docker stats school-bell-system
```

---

## 📁 Data Persistence

Your data is stored in these directories (outside the container):

- `../school_bell.db` - Database
- `../static/sounds/` - Audio files
- `../static/uploads/` - Uploaded files
- `../backups/` - System backups

These persist even if you remove the container!

---

## 🔄 Updates

To update to a new version:

```bash
# Pull latest code
cd ..
git pull

# Rebuild and restart
cd docker
docker compose down
docker compose up -d --build
```

---

## 🆘 Need Help?

See the full [README.md](README.md) for:
- Detailed configuration options
- Audio setup guides
- Production deployment tips
- Advanced troubleshooting

---

**That's it! You're ready to go! 🎉**
