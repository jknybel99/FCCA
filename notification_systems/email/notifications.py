import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import os
from typing import List, Optional

class NotificationService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.email = os.getenv("NOTIFICATION_EMAIL")
        self.password = os.getenv("NOTIFICATION_PASSWORD")
        self.recipients = os.getenv("NOTIFICATION_RECIPIENTS", "").split(",")
        
    def send_email(self, subject: str, body: str, recipients: Optional[List[str]] = None):
        """Send email notification"""
        if not self.email or not self.password:
            print("Email credentials not configured")
            return False
            
        recipients = recipients or self.recipients
        if not recipients:
            print("No recipients configured")
            return False
            
        try:
            message = MIMEMultipart()
            message["From"] = self.email
            message["To"] = ", ".join(recipients)
            message["Subject"] = f"[School Bell System] {subject}"
            
            message.attach(MIMEText(body, "html"))
            
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.email, self.password)
                server.sendmail(self.email, recipients, message.as_string())
                
            print(f"Email sent successfully to {recipients}")
            return True
            
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False
    
    def send_system_status(self, status: str, details: str = ""):
        """Send system status notification"""
        subject = f"System Status: {status}"
        body = f"""
        <html>
        <body>
            <h2>School Bell System Status Update</h2>
            <p><strong>Status:</strong> {status}</p>
            <p><strong>Time:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p><strong>Details:</strong> {details}</p>
            <hr>
            <p><em>This is an automated notification from your School Bell System.</em></p>
        </body>
        </html>
        """
        return self.send_email(subject, body)
    
    def send_error_alert(self, error: str, context: str = ""):
        """Send error alert notification"""
        subject = f"System Error Alert"
        body = f"""
        <html>
        <body>
            <h2 style="color: red;">🚨 School Bell System Error Alert</h2>
            <p><strong>Error:</strong> {error}</p>
            <p><strong>Context:</strong> {context}</p>
            <p><strong>Time:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <hr>
            <p><em>Please check your School Bell System immediately.</em></p>
        </body>
        </html>
        """
        return self.send_email(subject, body)
    
    def send_daily_summary(self, events_count: int, next_event: str):
        """Send daily summary notification"""
        subject = "Daily System Summary"
        body = f"""
        <html>
        <body>
            <h2>📅 School Bell System Daily Summary</h2>
            <p><strong>Date:</strong> {datetime.now().strftime('%Y-%m-%d')}</p>
            <p><strong>Scheduled Events:</strong> {events_count}</p>
            <p><strong>Next Event:</strong> {next_event}</p>
            <p><strong>System Status:</strong> ✅ Operational</p>
            <hr>
            <p><em>Your School Bell System is running smoothly!</em></p>
        </body>
        </html>
        """
        return self.send_email(subject, body)

# Global notification service instance
notification_service = NotificationService()
