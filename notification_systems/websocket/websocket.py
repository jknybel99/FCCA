from fastapi import WebSocket, WebSocketDisconnect
from typing import List
import asyncio
import json
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                # Remove disconnected clients
                self.active_connections.remove(connection)

manager = ConnectionManager()

async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

async def broadcast_system_status():
    """Broadcast system status to all connected clients"""
    while True:
        try:
            # Get system status
            status_data = {
                "type": "system_status",
                "timestamp": datetime.now().isoformat(),
                "data": {
                    "next_event": "Morning Bell at 07:39:00",
                    "system_health": "healthy",
                    "active_connections": len(manager.active_connections)
                }
            }
            
            await manager.broadcast(json.dumps(status_data))
            await asyncio.sleep(30)  # Update every 30 seconds
            
        except Exception as e:
            print(f"Error broadcasting status: {e}")
            await asyncio.sleep(60)  # Wait longer on error
