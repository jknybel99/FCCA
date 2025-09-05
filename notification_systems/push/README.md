# 📱 Push Notifications

Send mobile push notifications for critical alerts using Pushover or Telegram.

## 🚀 **Quick Setup**

### **Pushover Setup**
1. Create account at [pushover.net](https://pushover.net)
2. Get your User Key and create an Application Token
3. Configure environment variables:
```bash
export PUSHOVER_TOKEN="your-pushover-token"
export PUSHOVER_USER="your-pushover-user"
```

### **Telegram Setup**
1. Create a bot with [@BotFather](https://t.me/botfather)
2. Get your bot token and chat ID
3. Configure environment variables:
```bash
export TELEGRAM_BOT_TOKEN="your-bot-token"
export TELEGRAM_CHAT_ID="your-chat-id"
```

## 📋 **Usage Examples**

```python
from notification_systems.push.push_notifications import push_service, telegram_service

# Send push notification
push_service.send_push_notification("System Alert", "Bell system is offline", priority=1)

# Send system alert
push_service.send_system_alert("error", "Database connection failed")

# Send Telegram message
telegram_service.send_telegram_message("🔔 School Bell System is running normally")
```

## ⚙️ **Priority Levels**

- **0**: Normal priority (default)
- **1**: High priority (bypasses quiet hours)
- **2**: Emergency priority (repeats until acknowledged)

## 🔧 **Features**

- **Cross-platform**: Works on iOS, Android, and desktop
- **Priority-based**: Different alert levels for different situations
- **Rich formatting**: Support for HTML and emoji
- **Reliable delivery**: Built-in retry mechanisms
