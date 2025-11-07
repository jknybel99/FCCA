# 🏗️ Docker Architecture

Visual overview of the School Bell System Docker deployment architecture.

## 📦 Container Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Container                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                             │ │
│  │  ┌──────────────────┐         ┌──────────────────┐        │ │
│  │  │                  │         │                  │        │ │
│  │  │  Frontend Build  │◄────────│   React App      │        │ │
│  │  │  (Static Files)  │         │   (Built)        │        │ │
│  │  │                  │         │                  │        │ │
│  │  └────────┬─────────┘         └──────────────────┘        │ │
│  │           │                                                │ │
│  │           │ Served by                                      │ │
│  │           ▼                                                │ │
│  │  ┌──────────────────────────────────────┐                 │ │
│  │  │                                       │                 │ │
│  │  │      FastAPI Backend                 │                 │ │
│  │  │      (Python 3.11)                   │                 │ │
│  │  │                                       │                 │ │
│  │  │  ├── API Endpoints                   │                 │ │
│  │  │  ├── Schedule Service                │                 │ │
│  │  │  ├── Audio Processing (FFmpeg)       │                 │ │
│  │  │  ├── TTS Service (Piper)             │                 │ │
│  │  │  ├── Paging System (PulseAudio)      │                 │ │
│  │  │  └── Authentication (JWT)            │                 │ │
│  │  │                                       │                 │ │
│  │  └───────────────┬───────────────────────┘                 │ │
│  │                  │                                         │ │
│  │                  ▼                                         │ │
│  │  ┌──────────────────────────────────────┐                 │ │
│  │  │      SQLite Database                 │                 │ │
│  │  │      (Mounted Volume)                │                 │ │
│  │  └──────────────────────────────────────┘                 │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Port 8000 ──────────────────────────────────────────────►      │
│                                                                  │
│  Audio Device (/dev/snd) ◄──────────────────────────────────    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## 🔄 Build Process Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Multi-Stage Build                         │
└─────────────────────────────────────────────────────────────┘

Stage 1: Frontend Builder
┌──────────────────────────────────┐
│  Node.js 18 Alpine               │
│  ├── npm install                 │
│  ├── npm run build               │
│  └── Output: /app/frontend/build │
└──────────────┬───────────────────┘
               │
               │ Copy build artifacts
               ▼
Stage 2: Production Image
┌──────────────────────────────────┐
│  Python 3.11 Slim                │
│  ├── Install system deps         │
│  │   ├── ffmpeg                  │
│  │   ├── pulseaudio              │
│  │   └── alsa-utils              │
│  ├── Install Python packages     │
│  ├── Copy backend code           │
│  ├── Copy frontend build ◄───────┘
│  └── Configure & Start           │
└──────────────────────────────────┘
```

## 💾 Data Flow & Persistence

```
Host System                          Docker Container
┌─────────────────┐                 ┌──────────────────┐
│                 │                 │                  │
│  Database       │◄───Volume──────►│  /app/           │
│  school_bell.db │                 │  school_bell.db  │
│                 │                 │                  │
└─────────────────┘                 └──────────────────┘

┌─────────────────┐                 ┌──────────────────┐
│  Audio Files    │◄───Volume──────►│  /app/static/    │
│  static/sounds/ │                 │  sounds/         │
│  static/uploads/│                 │  uploads/        │
│  static/        │                 │  recordings/     │
│  recordings/    │                 │                  │
└─────────────────┘                 └──────────────────┘

┌─────────────────┐                 ┌──────────────────┐
│  Backups        │◄───Volume──────►│  /app/backups/   │
│  backups/       │                 │                  │
└─────────────────┘                 └──────────────────┘

┌─────────────────┐                 ┌──────────────────┐
│  TTS Voices     │◄───Volume──────►│  /app/piper/     │
│  piper/         │                 │                  │
└─────────────────┘                 └──────────────────┘
```

## 🌐 Network Architecture

### Development Mode (Bridge Network)
```
┌──────────────────────────────────────────────────────┐
│  Host Machine                                         │
│                                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │  Docker Bridge Network (172.x.x.x)             │  │
│  │                                                 │  │
│  │  ┌──────────────────────────────────────────┐  │  │
│  │  │  Container: school-bell-system           │  │  │
│  │  │  IP: 172.x.x.x                           │  │  │
│  │  │  Port: 8000                              │  │  │
│  │  └──────────────────────────────────────────┘  │  │
│  │                                                 │  │
│  └─────────────────┬───────────────────────────────┘  │
│                    │                                  │
│                    │ Port Mapping                     │
│                    │ 8000:8000                        │
│                    ▼                                  │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Host Network Interface                         │ │
│  │  localhost:8000                                 │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
└───────────────────────────────────────────────────────┘
```

### Production Mode (Host Network)
```
┌──────────────────────────────────────────────────────┐
│  Host Machine                                         │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │  Container: school-bell-system               │    │
│  │  Network: host                               │    │
│  │  (Shares host network stack)                 │    │
│  └──────────────────────────────────────────────┘    │
│                    │                                  │
│                    │ Direct access                    │
│                    ▼                                  │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Host Network Interface                         │ │
│  │  0.0.0.0:8000                                   │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
└───────────────────────────────────────────────────────┘
```

## 🔊 Audio System Architecture

```
┌────────────────────────────────────────────────────────┐
│  Host Audio System                                      │
│                                                         │
│  ┌──────────────────┐                                  │
│  │  /dev/snd        │                                  │
│  │  (ALSA Devices)  │                                  │
│  └────────┬─────────┘                                  │
│           │                                            │
│           │ Device Passthrough                         │
│           ▼                                            │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Docker Container                                 │ │
│  │                                                   │ │
│  │  ┌─────────────────────────────────────────────┐ │ │
│  │  │  PulseAudio / ALSA                          │ │ │
│  │  │  ├── Audio Playback (Bells, Music)          │ │ │
│  │  │  ├── Audio Recording (Paging)               │ │ │
│  │  │  └── Audio Processing (FFmpeg)              │ │ │
│  │  └─────────────────────────────────────────────┘ │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌──────────────────┐                                  │
│  │  Speakers        │                                  │
│  │  Microphones     │                                  │
│  └──────────────────┘                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 🔐 Security Layers

```
┌─────────────────────────────────────────────────────────┐
│  External Access                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Reverse Proxy (Nginx/Caddy)                      │  │
│  │  ├── SSL/TLS Termination                          │  │
│  │  ├── Rate Limiting                                │  │
│  │  └── Access Control                               │  │
│  └────────────────────┬──────────────────────────────┘  │
│                       │                                  │
│                       ▼                                  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Docker Container                                  │  │
│  │  ├── No new privileges                            │  │
│  │  ├── Resource limits                              │  │
│  │  ├── Read-only filesystem (optional)              │  │
│  │  └── Non-root user (optional)                     │  │
│  │                                                    │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Application                                 │  │  │
│  │  │  ├── JWT Authentication                      │  │  │
│  │  │  ├── Role-based Access Control              │  │  │
│  │  │  └── Password Hashing (bcrypt)              │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 📊 Resource Management

```
┌─────────────────────────────────────────────────────────┐
│  Host System Resources                                   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  CPU (Configurable Limits)                         │ │
│  │  ├── Min: 0.5 cores                                │ │
│  │  └── Max: 2.0 cores                                │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Memory (Configurable Limits)                      │ │
│  │  ├── Min: 512 MB                                   │ │
│  │  └── Max: 2 GB                                     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Disk I/O                                          │ │
│  │  ├── Database                                      │ │
│  │  ├── Audio Files                                   │ │
│  │  └── Logs                                          │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## 🔄 Lifecycle Management

```
Build Phase
    │
    ├── Pull base images
    ├── Install dependencies
    ├── Build frontend
    ├── Copy application code
    └── Create final image
         │
         ▼
Start Phase
    │
    ├── Create container
    ├── Mount volumes
    ├── Attach devices
    ├── Set environment
    └── Start application
         │
         ▼
Runtime Phase
    │
    ├── Health checks (every 30s)
    ├── Log rotation
    ├── Resource monitoring
    └── Auto-restart on failure
         │
         ▼
Stop Phase
    │
    ├── Graceful shutdown
    ├── Save state
    └── Preserve volumes
         │
         ▼
Update Phase
    │
    ├── Pull new code
    ├── Rebuild image
    ├── Stop old container
    └── Start new container
```

## 🎯 Deployment Scenarios

### Scenario 1: Single Server
```
┌─────────────────────────────────────┐
│  Physical/Virtual Server            │
│  ├── Docker Engine                  │
│  ├── School Bell System Container   │
│  ├── Audio Hardware                 │
│  └── Local Storage                  │
└─────────────────────────────────────┘
```

### Scenario 2: With Reverse Proxy
```
┌─────────────────────────────────────┐
│  Server                              │
│  ├── Nginx/Caddy (Port 80/443)      │
│  │   └── Proxy to ──────┐           │
│  │                       ▼           │
│  └── Bell System (Port 8000)        │
└─────────────────────────────────────┘
```

### Scenario 3: Multiple Buildings
```
Building A                Building B
┌──────────────┐         ┌──────────────┐
│  Container   │         │  Container   │
│  + Audio     │         │  + Audio     │
└──────────────┘         └──────────────┘
       │                        │
       └────────┬───────────────┘
                │
                ▼
        ┌──────────────┐
        │  Central     │
        │  Management  │
        └──────────────┘
```

---

**Architecture designed for reliability, scalability, and ease of deployment! 🏗️**
