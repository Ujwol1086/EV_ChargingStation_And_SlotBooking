from flask import Blueprint, request, jsonify
from models.user import User
from config.auth import generate_token, decode_token
import json

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    
    # Validate request data
    if not data or not data.get('email') or not data.get('password') or not data.get('username'):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Create user
    user = User.create_user(
        username=data.get('username'),
        email=data.get('email'),
        password=data.get('password')
    )
    
    if not user:
        return jsonify({"error": "Email already exists"}), 400
    
    # Generate token
    token = generate_token(user["_id"])
    
    return jsonify({
        "message": "User registered successfully",
        "token": token,
        "user": user
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login an existing user"""
    data = request.get_json()
    
    # Validate request data
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Missing email or password"}), 400
    
    # Find user by email
    user = User.find_by_email(data.get('email'))
    
    # Check if user exists and password is correct
    if not user or not User.check_password(user, data.get('password')):
        return jsonify({"error": "Invalid email or password"}), 401
    
    # Generate token with user role information
    token = generate_token(str(user["_id"]))
    
    # Remove password from response
    user.pop("password", None)
    user["_id"] = str(user["_id"])  # Convert ObjectId to string
    
    # Check if user is admin
    is_admin = user.get('role') == 'admin'
    
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": user,
        "is_admin": is_admin
    }), 200

@auth_bp.route('/me', methods=['GET'])
def get_me():
    """Get current user info"""
    # Get token from header
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Authorization header required"}), 401
    
    token = auth_header.split(' ')[1]
    
    # Decode token
    user_id = decode_token(token)
    
    if isinstance(user_id, str) and (user_id.startswith('Token expired') or user_id.startswith('Invalid token')):
        return jsonify({"error": user_id}), 401
    
    # Find user by ID
    user = User.find_by_id(user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify({"user": user}), 200
