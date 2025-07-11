from functools import wraps
from flask import request, jsonify
from config.database import mongo
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

def require_admin(f):
    """Decorator to require admin authentication for admin routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # Get authorization header
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({'success': False, 'error': 'Authorization header required'}), 401
            
            token = auth_header.split(' ')[1]
            
            # Decode token to get user_id
            from config.auth import decode_token
            user_id = decode_token(token)
            
            if isinstance(user_id, str) and (user_id.startswith('Token expired') or user_id.startswith('Invalid token')):
                return jsonify({'success': False, 'error': user_id}), 401
            
            # Check if user exists in database and has admin role
            if user_id:
                user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
                if user and user.get('role') == 'admin':
                    return f(*args, **kwargs)
            
            return jsonify({'success': False, 'error': 'Admin access required'}), 403
            
        except Exception as e:
            logger.error(f"Error in admin authentication: {e}")
            return jsonify({'success': False, 'error': 'Authentication failed'}), 401
    
    return decorated_function

def is_admin_user(user_id):
    """Check if a user has admin role"""
    try:
        if not user_id:
            return False
        
        user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
        return user and user.get('role') == 'admin'
    except Exception as e:
        logger.error(f"Error checking admin status: {e}")
        return False 