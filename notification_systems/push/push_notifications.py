import requests
import json
from typing import Optional

class PushNotificationService:
    def __init__(self):
        # Using Pushover as an example - you can use other services
        self.pushover_token = os.getenv("PUSHOVER_TOKEN")
        self.pushover_user = os.getenv("PUSHOVER_USER")
        
    def send_push_notification(self, title: str, message: str, priority: int = 0):
        """Send push notification via Pushover"""
        if not self.pushover_token or not self.pushover_user:
            print("Push notification credentials not configured")
            return False
            
        try:
            url = "https://api.pushover.net/1/messages.json"
            data = {
                "token": self.pushover_token,
                "user": self.pushover_user,
                "title": f"School Bell System: {title}",
                "message": message,
                "priority": priority,  # 0 = normal, 1 = high, 2 = emergency
                "sound": "bell" if priority > 0 else "pushover"
            }
            
            response = requests.post(url, data=data)
            if response.status_code == 200:
                print(f"Push notification sent: {title}")
                return True
            else:
                print(f"Failed to send push notification: {response.text}")
                return False
                
        except Exception as e:
            print(f"Error sending push notification: {e}")
            return False
    
    def send_system_alert(self, alert_type: str, message: str):
        """Send system alert with appropriate priority"""
        priority = 1 if "error" in alert_type.lower() else 0
        return self.send_push_notification(alert_type, message, priority)

# Alternative: Telegram Bot Notifications
class TelegramNotificationService:
    def __init__(self):
        self.bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.chat_id = os.getenv("TELEGRAM_CHAT_ID")
        
    def send_telegram_message(self, message: str):
        """Send message via Telegram bot"""
        if not self.bot_token or not self.chat_id:
            print("Telegram credentials not configured")
            return False
            
        try:
            url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
            data = {
                "chat_id": self.chat_id,
                "text": f"🔔 School Bell System\n\n{message}",
                "parse_mode": "HTML"
            }
            
            response = requests.post(url, data=data)
            if response.status_code == 200:
                print("Telegram message sent successfully")
                return True
            else:
                print(f"Failed to send Telegram message: {response.text}")
                return False
                
        except Exception as e:
            print(f"Error sending Telegram message: {e}")
            return False

# Global instances
push_service = PushNotificationService()
telegram_service = TelegramNotificationService()
