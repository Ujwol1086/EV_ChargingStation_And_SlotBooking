# Forgot Password Feature Setup

This document explains how to set up the forgot password feature with OTP email functionality.

## Backend Setup

### 1. Install Dependencies

The forgot password feature requires Flask-Mail. Install it by running:

```bash
cd backend
pip install Flask-Mail==0.9.1
```

### 2. Environment Variables

Add the following environment variables to your `.env` file or set them in your system:

```env
# Email Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USE_SSL=False
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password_here
MAIL_DEFAULT_SENDER=your_email@gmail.com
```

### 3. Gmail App Password Setup

To use Gmail for sending emails:

1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account settings > Security > App passwords
3. Generate an app password for "Mail"
4. Use this app password as `MAIL_PASSWORD` (not your regular Gmail password)

### 4. Database Collections

The forgot password feature uses a new collection `password_reset_otps` that will be created automatically when the first OTP is generated.

## Frontend Setup

The frontend components are already integrated and ready to use:

- `/forgot-password` - Enter email to request OTP
- `/verify-otp` - Enter OTP code
- `/reset-password` - Set new password

## API Endpoints

### 1. Request OTP
```
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### 2. Verify OTP
```
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

### 3. Reset Password
```
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456",
  "new_password": "newpassword123"
}
```

## Features

- ✅ 6-digit OTP generation
- ✅ 10-minute OTP expiration
- ✅ Beautiful HTML email templates
- ✅ Password strength indicator
- ✅ Resend OTP functionality
- ✅ Secure password reset flow
- ✅ Input validation and error handling
- ✅ Responsive design matching app theme

## Security Features

- OTPs expire after 10 minutes
- OTPs can only be used once
- Old OTPs are automatically cleaned up
- Email addresses are not revealed if they don't exist
- Password strength validation
- Secure password hashing

## Testing

1. Start the backend server: `cd backend && python server.py`
2. Start the frontend: `cd frontend && npm run dev`
3. Navigate to `/login` and click "Forgot your password?"
4. Enter a valid email address
5. Check your email for the OTP
6. Complete the password reset flow

## Troubleshooting

### Email Not Sending
- Check your email credentials
- Ensure 2FA is enabled and app password is correct
- Check firewall settings for SMTP port 587
- Verify Gmail "Less secure app access" is disabled (use app passwords instead)

### OTP Not Working
- Check if OTP has expired (10 minutes)
- Ensure OTP is exactly 6 digits
- Check database connection
- Verify email address is correct

### Frontend Issues
- Ensure all routes are properly configured in App.jsx
- Check browser console for JavaScript errors
- Verify API endpoints are accessible
