import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Helper: normalize URIs (remove trailing slash)
def _normalize_uri(uri: str | None) -> str | None:
    if not uri:
        return None
    return uri[:-1] if uri.endswith('/') else uri

# Google OAuth Configuration (read from environment only; do not hardcode secrets)
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
GOOGLE_REDIRECT_URI = _normalize_uri(os.getenv('GOOGLE_REDIRECT_URI'))
FRONTEND_OAUTH_REDIRECT = _normalize_uri(os.getenv('FRONTEND_OAUTH_REDIRECT'))

# Google OAuth Scopes
GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
]

# Google OAuth URLs
GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

# Basic validation (optional, safe to import without raising)
REQUIRED_GOOGLE_ENV_VARS = {
    'GOOGLE_CLIENT_ID': GOOGLE_CLIENT_ID,
    'GOOGLE_CLIENT_SECRET': GOOGLE_CLIENT_SECRET,
    'GOOGLE_REDIRECT_URI': GOOGLE_REDIRECT_URI,
}

MISSING_GOOGLE_ENV_VARS = [key for key, val in REQUIRED_GOOGLE_ENV_VARS.items() if not val]
