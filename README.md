# School Bell System

A comprehensive school bell scheduling system with automated scheduling, audio management, and system monitoring.

## 🎵 **Core System Features**

- **Dashboard**: Real-time system status, clock, and monitoring
- **Schedule Management**: Create and manage bell schedules
- **Audio Library**: Upload and manage audio files
- **TTS Manager**: Text-to-speech functionality
- **Calendar View**: Monthly schedule overview
- **Backup Management**: System backup and restore
- **System Monitoring**: CPU, RAM, storage, and uptime stats
- **Admin Panel**: System configuration and maintenance

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

4. **Initialize database:**
   ```bash
   python init_db.py
   ```

5. **Start the server:**
   ```bash
   python main.py
   ```

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

## 📁 **Project Structure**

```
├── backend/
│   ├── api/           # API endpoints
│   ├── services/      # Business logic services
│   ├── models.py      # Database models
│   ├── schemas.py     # Pydantic schemas
│   ├── database.py    # Database configuration
│   ├── main.py        # FastAPI application
│   ├── backup_system.py # Backup and restore functionality
│   └── static/        # Static files (audio, images)
├── frontend/
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── api.js      # API client
│   │   └── App.js      # Main application
│   └── public/         # Public assets
└── README.md
```

## 🔧 **System Requirements**

- **Python**: 3.8+
- **Node.js**: 16+
- **Database**: SQLite (included)
- **OS**: Linux, Windows, macOS

## 📊 **Features Overview**

### **Dashboard**
- Real-time clock display
- System status monitoring
- Next scheduled event display
- Volume control and audio testing
- Backup status and management

### **Schedule Management**
- Create and edit bell schedules
- Day-of-week scheduling
- Audio file assignment
- Time-based event management

### **Audio Library**
- Upload audio files (MP3, WAV, AAC)
- File categorization (bells, music, announcements)
- Duration calculation
- Preview functionality

### **TTS Manager**
- Text-to-speech generation
- Voice customization
- Audio file export

### **Backup System**
- Automated database backups
- Audio file preservation
- Configuration backup
- One-click restore functionality

## 🚨 **Important Notes**

- **Backup**: Always backup before making major changes
- **Audio Files**: Supported formats: MP3, WAV, AAC
- **Database**: SQLite database is automatically created
- **Ports**: Backend runs on port 8000, Frontend on port 3000

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 **License**

This project is open source and available under the MIT License.
