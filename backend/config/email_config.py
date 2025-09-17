import os
from flask_mail import Mail, Message
from flask import current_app
import logging

logger = logging.getLogger(__name__)

# Initialize Flask-Mail
mail = Mail()

def init_email(app):
    """Initialize email configuration"""
    try:
        # Email configuration with better defaults
        app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
        app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
        app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
        app.config['MAIL_USE_SSL'] = os.getenv('MAIL_USE_SSL', 'False').lower() == 'true'
        app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME', 'ujwolaryal1086@gmail.com')
        app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
        app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER', app.config['MAIL_USERNAME'])
        
        # Initialize mail with app
        mail.init_app(app)
        logger.info("Email service initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize email service: {e}")
        return False

def send_otp_email(email, otp, username=None):
    """Send OTP email to user"""
    try:
        if not current_app.config.get('MAIL_USERNAME') or current_app.config.get('MAIL_PASSWORD') == 'your_app_password_here':
            logger.error("Email not configured. Please set MAIL_USERNAME and MAIL_PASSWORD environment variables.")
            logger.error("For testing purposes, OTP will be printed to console instead of sending email.")
            print(f"\n{'='*50}")
            print(f"🔐 OTP FOR PASSWORD RESET")
            print(f"{'='*50}")
            print(f"Email: {email}")
            print(f"OTP: {otp}")
            print(f"Username: {username or 'User'}")
            print(f"Expires in: 10 minutes")
            print(f"{'='*50}\n")
            return True  # Return True for testing purposes
            
        msg = Message(
            subject='EVConnect Nepal - Password Reset OTP',
            recipients=[email],
            sender=current_app.config['MAIL_DEFAULT_SENDER']
        )
        
        # Create HTML email template
        msg.html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset OTP</title>
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f4f4f4;
                }}
                .container {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 40px;
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                }}
                .header {{
                    text-align: center;
                    margin-bottom: 30px;
                }}
                .logo {{
                    font-size: 28px;
                    font-weight: bold;
                    color: white;
                    margin-bottom: 10px;
                }}
                .subtitle {{
                    color: rgba(255,255,255,0.9);
                    font-size: 16px;
                }}
                .content {{
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    margin: 20px 0;
                }}
                .otp-container {{
                    text-align: center;
                    margin: 30px 0;
                }}
                .otp-code {{
                    display: inline-block;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    font-size: 32px;
                    font-weight: bold;
                    padding: 20px 30px;
                    border-radius: 10px;
                    letter-spacing: 5px;
                    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
                }}
                .warning {{
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    color: #856404;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 30px;
                    color: rgba(255,255,255,0.8);
                    font-size: 14px;
                }}
                .button {{
                    display: inline-block;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 12px 25px;
                    text-decoration: none;
                    border-radius: 25px;
                    font-weight: bold;
                    margin: 20px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">EVConnect Nepal</div>
                    <div class="subtitle">Your trusted EV charging partner</div>
                </div>
                
                <div class="content">
                    <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
                    
                    <p>Hello {username or 'User'},</p>
                    
                    <p>We received a request to reset your password for your EVConnect Nepal account. Use the OTP code below to verify your identity and reset your password:</p>
                    
                    <div class="otp-container">
                        <div class="otp-code">{otp}</div>
                    </div>
                    
                    <div class="warning">
                        <strong>⚠️ Important Security Information:</strong>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>This OTP is valid for 10 minutes only</li>
                            <li>Do not share this code with anyone</li>
                            <li>If you didn't request this reset, please ignore this email</li>
                        </ul>
                    </div>
                    
                    <p>If you have any questions or need assistance, please contact our support team.</p>
                    
                    <p style="margin-top: 30px;">
                        Best regards,<br>
                        <strong>EVConnect Nepal Team</strong>
                    </p>
                </div>
                
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                    <p>&copy; 2024 EVConnect Nepal. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Send the email
        mail.send(msg)
        logger.info(f"OTP email sent successfully to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send OTP email to {email}: {e}")
        return False
