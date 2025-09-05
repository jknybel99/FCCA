# 📧 Email Notifications

Send email alerts for system status changes, errors, and daily summaries.

## 🚀 **Quick Setup**

### **1. Configure Environment Variables**
```bash
export NOTIFICATION_EMAIL="your-email@gmail.com"
export NOTIFICATION_PASSWORD="your-app-password"
export NOTIFICATION_RECIPIENTS="admin@school.edu,principal@school.edu"
```

### **2. Use in Your Code**
```python
from notification_systems.email.notifications import notification_service

# Send system status alert
notification_service.send_system_status("System Online", "All services are running normally")

# Send error alert
notification_service.send_error_alert("Database Connection Failed", "Unable to connect to SQLite database")

# Send daily summary
notification_service.send_daily_summary(15, "Morning Bell at 07:39:00")
```

## 📋 **Available Methods**

- `send_email(subject, body, recipients)` - Send custom email
- `send_system_status(status, details)` - Send system status update
- `send_error_alert(error, context)` - Send error notification
- `send_daily_summary(events_count, next_event)` - Send daily summary

## ⚙️ **Configuration Options**

- **SMTP Server**: Defaults to Gmail, configurable via `SMTP_SERVER`
- **SMTP Port**: Defaults to 587, configurable via `SMTP_PORT`
- **HTML Formatting**: All emails are sent in HTML format
- **Multiple Recipients**: Comma-separated list of email addresses

## 🔒 **Security Notes**

- Use app-specific passwords for Gmail
- Never commit credentials to version control
- Consider using OAuth2 for production environments
