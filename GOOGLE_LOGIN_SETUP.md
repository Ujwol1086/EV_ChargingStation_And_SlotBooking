# Google Login Setup for EV Charging Station

This guide will help you set up Google OAuth login for your EV charging station application.

## Prerequisites

- Python 3.7+ installed
- Node.js 16+ installed
- MongoDB running locally or remotely
- Google Cloud Console account

## Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google+ API
   - Google OAuth2 API
4. Go to "Credentials" section
5. Click "Create Credentials" → "OAuth 2.0 Client IDs"
6. Choose "Web application" as application type
7. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (for development)
   - `https://yourdomain.com/api/auth/google/callback` (for production)
8. Copy the Client ID and Client Secret

## Step 2: Environment Configuration

Create a `.env` file in your `backend` directory with the following content:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_actual_google_client_id
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# JWT Configuration
JWT_SECRET_KEY=your_strong_jwt_secret_key

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/ev_charging_db

# Server Configuration
PORT=5000
HOST=0.0.0.0
```

## Step 3: Install Dependencies

### Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Frontend Dependencies
```bash
cd frontend
npm install
```

## Step 4: Start the Application

### Start Backend
```bash
cd backend
python server.py
```

### Start Frontend
```bash
cd frontend
npm run dev
```

## Step 5: Test Google Login

1. Open your application in the browser
2. Go to the login page
3. Click "Sign in with Google"
4. Complete the Google OAuth flow
5. You should be redirected to your dashboard

## Features

- **Google OAuth Integration**: Secure authentication using Google accounts
- **User Management**: Automatic user creation/update from Google profile
- **JWT Tokens**: Secure session management
- **Profile Pictures**: Automatic profile picture import from Google
- **Admin Support**: Maintains admin roles for existing users

## Security Features

- OAuth 2.0 compliant authentication
- JWT token-based sessions
- Secure password handling for non-Google users
- Environment variable configuration
- HTTPS support for production

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**: Check that your redirect URI in Google Cloud Console matches exactly
2. **"Client ID not found" error**: Verify your GOOGLE_CLIENT_ID in the .env file
3. **"Authorization code not provided" error**: Check that the OAuth flow is completing properly

### Debug Steps

1. Check browser console for JavaScript errors
2. Check backend logs for Python errors
3. Verify all environment variables are set correctly
4. Ensure MongoDB is running and accessible

## Production Deployment

For production deployment:

1. Use HTTPS for all OAuth redirects
2. Set strong, unique JWT secret keys
3. Use environment-specific configuration
4. Regularly rotate OAuth credentials
5. Monitor authentication logs

## Support

If you encounter issues:

1. Check the logs in both frontend and backend
2. Verify your Google Cloud Console configuration
3. Ensure all dependencies are properly installed
4. Check that MongoDB is accessible

## License

This implementation follows OAuth 2.0 standards and Google's authentication best practices.
