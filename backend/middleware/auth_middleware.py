from functools import wraps
from flask import request, jsonify, g
from config.auth import decode_token
from models.user import User
import logging

logger = logging.getLogger(__name__)

def require_auth(f):
    """
    Decorator to require authentication for API endpoints
    Extracts user information and adds it to Flask's g object
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({
                'success': False,
                'error': 'Authorization header is required'
            }), 401
        
        if not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'Authorization header must start with "Bearer "'
            }), 401
        
        # Extract token
        token = auth_header.split(' ')[1]
        
        # Decode token
        user_id = decode_token(token)
        
        # Check for token errors
        if isinstance(user_id, str) and (
            user_id.startswith('Token expired') or 
            user_id.startswith('Invalid token')
        ):
            return jsonify({
                'success': False,
                'error': user_id
            }), 401
        
        # Find user in database
        user = User.find_by_id(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        # Add user to Flask's g object for access in route handlers
        g.current_user = user
        g.current_user_id = str(user['_id']) if '_id' in user else user_id
        
        logger.info(f"Authenticated user: {user.get('username', 'Unknown')} (ID: {g.current_user_id})")
        
        return f(*args, **kwargs)
    
    return decorated_function

def get_current_user():
    """
    Get the current authenticated user from Flask's g object
    Returns None if no user is authenticated
    """
    return getattr(g, 'current_user', None)

def get_current_user_id():
    """
    Get the current authenticated user's ID from Flask's g object
    Returns None if no user is authenticated
    """
    return getattr(g, 'current_user_id', None) 