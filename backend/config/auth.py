import jwt
import os
import datetime
from dotenv import load_dotenv

load_dotenv()

# Support both env var names
JWT_SECRET = os.getenv('JWT_SECRET') or os.getenv('JWT_SECRET_KEY')

if not JWT_SECRET or not isinstance(JWT_SECRET, str):
    # Provide a clear error at startup if secret is missing or invalid
    raise RuntimeError(
        'JWT secret not configured. Please set JWT_SECRET or JWT_SECRET_KEY in your environment/.env.'
    )

def generate_token(user_id):
    """Generate a JWT token for the user"""
    payload = {
        'exp': datetime.datetime.now(tz=datetime.timezone.utc) + datetime.timedelta(days=1),
        'iat': datetime.datetime.now(tz=datetime.timezone.utc),
        'sub': str(user_id)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def decode_token(token):
    """Decode a JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload['sub']
    except jwt.ExpiredSignatureError:
        return 'Token expired. Please log in again.'
    except jwt.InvalidTokenError:
        return 'Invalid token. Please log in again.'
