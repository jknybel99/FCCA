# 🖥️ Status Dashboard

Visual web-based status monitoring with real-time updates and activity logging.

## 🚀 **Quick Start**

### **Open Dashboard**
```bash
# Open in default browser
open notification_systems/dashboard/status_dashboard.html

# Open in specific browser
firefox notification_systems/dashboard/status_dashboard.html
chrome notification_systems/dashboard/status_dashboard.html
```

### **Access Remotely**
1. Copy the HTML file to a web server
2. Update the API URLs in the JavaScript
3. Access via web browser

## 📋 **Features**

- **Real-time Status**: Live system health monitoring
- **Auto-refresh**: Automatic updates every 30 seconds
- **Activity Log**: Real-time event logging
- **Mobile-friendly**: Responsive design for all devices
- **Visual Indicators**: Color-coded status indicators

## 🔧 **Status Indicators**

- 🟢 **Green**: System online and healthy
- 🔴 **Red**: System offline or critical error
- 🟡 **Yellow**: System has issues or warnings

## ⚙️ **Configuration**

### **API Endpoints**
The dashboard fetches data from:
- `http://localhost:8000/api/system/status` - System health
- `http://localhost:8000/api/schedule/next` - Next scheduled event
- `http://localhost:3000` - Frontend status check

### **Customization**
Edit the JavaScript section to:
- Change refresh intervals
- Modify API endpoints
- Add new status checks
- Customize alert messages

## 📱 **Mobile Support**

- **Responsive Design**: Works on phones and tablets
- **Touch-friendly**: Large buttons and touch targets
- **Portrait/Landscape**: Adapts to screen orientation

## 🔄 **Auto-refresh**

- **Default Interval**: 30 seconds
- **Toggle**: Enable/disable auto-refresh
- **Manual Refresh**: Click "Refresh Now" button
- **Status Updates**: Real-time status changes

## 📊 **Displayed Information**

### **System Status**
- Backend API status
- Frontend availability
- Bell scheduler status

### **Next Event**
- Event name and description
- Scheduled time
- Countdown timer

### **System Metrics**
- System uptime
- Active connections
- Last update time

### **Activity Log**
- Real-time event logging
- Color-coded log levels
- Timestamp for each entry

## 🛠️ **Troubleshooting**

### **Dashboard Not Loading Data**
1. Check if backend is running on port 8000
2. Verify CORS settings in backend
3. Check browser console for errors
4. Ensure API endpoints are accessible

### **Auto-refresh Not Working**
1. Check browser JavaScript console
2. Verify network connectivity
3. Ensure API endpoints are responding

### **Mobile Display Issues**
1. Clear browser cache
2. Check viewport settings
3. Verify responsive CSS is loading
