# 🌐 WebSocket Real-time Notifications

Real-time status updates via WebSocket connections for live monitoring.

## 🚀 **Quick Setup**

### **1. Add to FastAPI Backend**
```python
from notification_systems.websocket.websocket import websocket_endpoint, manager

# Add WebSocket endpoint
app.add_websocket_route("/ws", websocket_endpoint)

# Start broadcasting task
import asyncio
asyncio.create_task(broadcast_system_status())
```

### **2. Connect from Frontend**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
    
    if (data.type === 'system_status') {
        updateSystemStatus(data.data);
    }
};
```

## 📋 **Message Types**

### **System Status Update**
```json
{
    "type": "system_status",
    "timestamp": "2025-01-03T10:30:00",
    "data": {
        "next_event": "Morning Bell at 07:39:00",
        "system_health": "healthy",
        "active_connections": 3
    }
}
```

## ⚙️ **Configuration**

- **Broadcast Interval**: 30 seconds (configurable)
- **Connection Management**: Automatic cleanup of disconnected clients
- **Error Handling**: Graceful handling of connection failures

## 🔧 **Features**

- **Real-time Updates**: Live system status broadcasting
- **Multiple Clients**: Support for multiple connected clients
- **Automatic Reconnection**: Built-in reconnection logic
- **Low Latency**: Direct WebSocket communication
