# School Bell System

A comprehensive school bell scheduling system with automated scheduling, audio management, system monitoring, and user authentication.

## 🎵 **Core System Features**

- **Dashboard**: Real-time system status, clock, and monitoring
- **Schedule Management**: Create and manage bell schedules (Admin only)
- **Audio Library**: Upload and manage audio files (Admin only)
- **TTS Manager**: Text-to-speech functionality (Admin only)
- **Calendar View**: Monthly schedule overview
- **Backup Management**: System backup and restore (Admin only)
- **System Monitoring**: CPU, RAM, storage, and uptime stats
- **Admin Panel**: System configuration and maintenance (Admin only)
- **User Management**: Role-based access control system
- **Authentication**: Secure login with JWT tokens

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

## 📁 **Project Structure**

```
├── backend/
│   ├── api/           # API endpoints (auth, audio, schedules, etc.)
│   ├── auth/          # Authentication utilities
│   ├── services/      # Business logic services
│   ├── models.py      # Database models (User, Schedule, Audio, etc.)
│   ├── schemas.py     # Pydantic schemas
│   ├── database.py    # Database configuration
│   ├── main.py        # FastAPI application
│   ├── backup_system.py # Backup and restore functionality
│   ├── crud.py        # Database CRUD operations
│   └── static/        # Static files (audio, images)
├── frontend/
│   ├── src/
│   │   ├── components/ # React components
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

## 🔧 **Troubleshooting**

### **TTS Issues**
If you experience problems with the TTS Manager:
1. Verify Piper TTS files are properly installed
2. Check system logs for error messages
3. Ensure your system meets the CPU requirements for Piper TTS

### **Authentication Issues**
1. Ensure the backend is running on port 8000
2. Check database contains the users table
3. Verify JWT secret key configuration

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 **License**

This project is open source and available under the MIT License.
