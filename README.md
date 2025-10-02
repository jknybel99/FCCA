# School Bell System

A comprehensive school bell scheduling system with automated scheduling, audio management, system monitoring, and user authentication.

## 🎵 **Core System Features**

- **Dashboard**: Real-time system status, clock, and monitoring
- **Schedule Management**: Create and manage bell schedules (Admin only)
- **Audio Library**: Upload and manage audio files (Admin only)
- **TTS Manager**: Text-to-speech functionality (Admin only)
- **Paging System**: Live audio announcements with push-to-talk functionality
- **Calendar View**: Monthly schedule overview
- **Backup Management**: System backup and restore (Admin only)
- **System Monitoring**: CPU, RAM, storage, and uptime stats
- **Admin Panel**: System configuration and maintenance (Admin only)
- **User Management**: Role-based access control system
- **Authentication**: Secure login with JWT tokens

## 🔒 **Data Privacy & Management**

### **What Data is Stored**
The system stores the following data locally on your server:
- **User accounts** (usernames, emails, hashed passwords)
- **Bell schedules** and events
- **Audio files** (uploaded MP3s, WAVs, etc.)
- **TTS generated files** (text-to-speech audio)
- **System settings** and configuration
- **Backup files** (if created)

### **Data Privacy**
- **No data is sent to external servers** (except for TTS voice downloads)
- **All data remains on your local server**
- **No telemetry or analytics** are collected
- **No personal information** is shared with third parties

### **Clearing Your Data**
To completely reset the system and remove all user data:

```bash
# Clear all user data (schedules, audio files, users, etc.)
python clear_user_data.py

# Or with automatic confirmation
python clear_user_data.py --confirm
```

This will remove:
- All schedules and events
- All user accounts
- All uploaded audio files
- All TTS generated files
- All backup files
- All downloaded TTS voices

### **Sample Data Setup**
For new installations or after clearing data:

```bash
# Set up sample data for demonstration
python setup_sample_data.py
```

This creates:
- Sample bell schedule
- Default admin user (admin/admin123)
- Sample audio file structure
- Basic system configuration

## 🚀 **Quick Start**

### **Backend Setup**

1. **Navigate to backend directory:**
```bash
cd backend
   ```

2. **Create virtual environment:**
   ```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
pip install -r requirements.txt
   ```

4. **Start the server:**
   ```bash
   python main.py
   ```

**Default Admin Account:**
- Username: `admin`
- Password: `admin123`

### **Frontend Setup**

1. **Navigate to frontend directory:**
```bash
cd frontend
   ```

2. **Install dependencies:**
   ```bash
npm install
   ```

3. **Start the development server:**
   ```bash
npm start
```

### **Frontend Build & Deploy (served by Caddy)**

Use this when you want to produce a static production build and have Caddy serve it from `/var/www/audio-frontend/`.

1. Build the frontend

```bash
cd frontend
# Install deps if needed
npm install --no-audit --no-fund

# Build optimized static assets into frontend/build/
npm run build
```

2. Deploy the build to Caddy's web root

```bash
# Replace existing static site with freshly built files
sudo rsync -a --delete "$(pwd)/build/" /var/www/audio-frontend/

# Ensure permissions are correct for the Caddy user (optional, depends on your setup)
sudo chown -R caddy:caddy /var/www/audio-frontend
sudo find /var/www/audio-frontend -type d -exec chmod 755 {} +
sudo find /var/www/audio-frontend -type f -exec chmod 644 {} +

# Reload Caddy (optional for static files, but safe)
sudo systemctl reload caddy
```

3. Refresh the browser

```text
- Perform a hard refresh (Shift+Reload) to bypass cached index.html
- Alternatively, open a fresh URL like https://your-host/?t=<timestamp>
```

Notes

- The Caddyfile is already configured to serve the UI from `/var/www/audio-frontend/` and to reverse-proxy API calls at `/api/*` to the FastAPI backend on port 8000.
- Create React App uses content-hashed filenames for assets; a hard refresh ensures the latest `index.html` is used.

## 📁 **Project Structure**

```
├── backend/
│   ├── api/           # API endpoints (auth, audio, schedules, paging, etc.)
│   │   ├── paging.py  # Paging system endpoints
│   │   └── ...        # Other API modules
│   ├── auth/          # Authentication utilities
│   ├── services/      # Business logic services
│   ├── models.py      # Database models (User, Schedule, Audio, etc.)
│   ├── schemas.py     # Pydantic schemas
│   ├── database.py    # Database configuration
│   ├── main.py        # FastAPI application
│   ├── backup_system.py # Backup and restore functionality
│   ├── crud.py        # Database CRUD operations
│   └── static/        # Static files (audio, recordings)
├── frontend/
│   ├── src/
│   │   ├── components/ # React components
│   │   │   ├── PushToTalkButton.js # Push-to-talk interface
│   │   │   └── ...     # Other components
│   │   ├── contexts/   # React contexts (AuthContext)
│   │   ├── api.js      # API client with authentication
│   │   └── App.js      # Main application with role-based routing
│   └── public/         # Public assets
└── README.md
```

## 🔧 **System Requirements**

- **Python**: 3.8+
- **Node.js**: 16+
- **Database**: SQLite (included)
- **OS**: Linux, Windows, macOS
- **CPU**: Piper TTS requires AVX2/AVX-512 support (Intel Haswell+ or equivalent)

## 🔐 **Authentication & Access Control**

### **User Roles**
- **Admin Users**: Full access to all features including system administration
- **Regular Users**: Access to Dashboard, Calendar, and Profile management

### **Security Features**
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Protected API endpoints

## 📊 **Features Overview**

### **Dashboard**
- Real-time clock display
- System status monitoring
- Next scheduled event display
- Volume control and audio testing
- Backup status and management

### **Schedule Management** (Admin Only)
- Create and edit bell schedules
- Day-of-week scheduling
- Audio file assignment
- Time-based event management

### **Audio Library** (Admin Only)
- Upload audio files (MP3, WAV, AAC)
- File categorization (bells, music, announcements)
- Duration calculation
- Preview functionality

### **TTS Manager** (Admin Only)
- Text-to-speech generation using Piper TTS
- Voice customization and audio file export

### **Paging System**
- **Push-to-Talk Interface**: Real-time audio streaming with spacebar or button control
- **Audio Input Management**: Automatic detection and configuration of microphones and USB devices
- **Device Capabilities**: Automatic detection of supported sample rates, bit depths, and channels
- **Live Audio Streaming**: Direct microphone-to-speaker audio passthrough
- **Announcement Recording**: Record and save announcements for later playback with proper sequencing
- **Pre-announcement Sounds**: Configurable bell/chime sounds before announcements with accurate timing
- **Real-time Audio Level Monitoring**: Live input level visualization during recording and streaming
- **Multi-device Support**: Support for built-in microphones, USB devices, and webcam audio
- **Announcement Playback**: Full recorded message playback after pre-announcement sound completion
- **Timestamp Management**: Accurate creation timestamps for all recorded announcements

### **User Management** (Admin Only)
- Create and manage user accounts
- Role assignment and permissions
- Password management
- Account status control

### **Backup System** (Admin Only)
- Automated database backups
- Audio file preservation
- Configuration backup
- One-click restore functionality

## 🚨 **Important Notes**

- **Backup**: Always backup before making major changes
- **Audio Files**: Supported formats: MP3, WAV, AAC
- **Database**: SQLite database is automatically created
- **Ports**: Backend runs on port 8000, Frontend on port 3000
- **TTS Requirements**: Piper TTS requires AVX2/AVX-512 CPU instructions for optimal performance
- **Authentication**: Default admin account should be changed after first login for security
- **Paging System**: Requires PulseAudio or ALSA for audio input/output functionality
- **Audio Devices**: USB microphones and webcams are automatically detected and preferred over built-in audio
- **Settings Persistence**: System settings (including backup frequency) persist across restarts
- **Audio Monitoring**: Real-time audio levels only display during active recording or streaming

## 🔧 **Troubleshooting**

### **TTS Issues**
If you experience problems with the TTS Manager:
1. Verify Piper TTS files are properly installed
2. Check system logs for error messages
3. Ensure your system meets the CPU requirements for Piper TTS

### **TTS Configuration**
- **Mock Mode**: Set `MOCK_TTS_MODE = True` in `backend/api/tts.py` (default)
- **Real Mode**: Set `MOCK_TTS_MODE = False` for full Piper TTS functionality
- **Voice Models**: Ensure `.onnx` files exist in `backend/piper/` directory
- **File Permissions**: Verify Piper executable has proper permissions

### **Authentication Issues**
1. Ensure the backend is running on port 8000
2. Check database contains the users table
3. Verify JWT secret key configuration

### **Paging System Issues**
If you experience problems with the paging system:
1. **Audio Input Not Working**: 
   - Check if PulseAudio is running: `pulseaudio --check`
   - Verify microphone permissions and device access
   - Try different input devices from the settings dialog
2. **No Audio Devices Detected**:
   - Restart PulseAudio: `pulseaudio -k && pulseaudio --start`
   - Check ALSA devices: `arecord -l`
   - Ensure USB devices are properly connected
3. **Push-to-Talk Not Responding**:
   - Check browser microphone permissions
   - Verify spacebar key events are not blocked by other applications
   - Try using mouse/touch controls instead of keyboard
4. **Audio Quality Issues**:
   - Adjust sample rate and bit depth in device settings
   - Use recommended settings for your specific device
   - Check for audio feedback loops and adjust volume levels

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 **License**

This project is open source and available under the MIT License.
