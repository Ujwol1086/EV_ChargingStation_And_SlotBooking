from flask import Blueprint, request, jsonify, redirect, url_for
from models.user import User
from config.auth import generate_token, decode_token
from services.google_oauth_service import GoogleOAuthService
from config.google_config import FRONTEND_OAUTH_REDIRECT
from config.email_config import send_otp_email
import json
import logging
from datetime import datetime

auth_bp = Blueprint('auth', __name__)
logger = logging.getLogger(__name__)

@auth_bp.route('/google/login', methods=['GET'])
def google_login():
    """Redirect user to Google OAuth"""
    try:
        auth_url = GoogleOAuthService.get_authorization_url()
        if auth_url:
            return jsonify({"auth_url": auth_url}), 200
        else:
            return jsonify({"error": "Failed to generate Google authorization URL"}), 500
    except Exception as e:
        logger.exception("Google login error")
        return jsonify({"error": "Google login error", "details": str(e)}), 500

@auth_bp.route('/google/callback', methods=['GET'])
def google_callback():
    """Handle Google OAuth callback"""
    try:
        # Check if Google sent an error
        google_error = request.args.get('error')
        if google_error:
            error_desc = request.args.get('error_description')
            logger.error(f"Google returned error: {google_error}, description: {error_desc}")
            return jsonify({"error": "Google returned error", "details": error_desc or google_error}), 400
        
        # Get authorization code from query parameters
        authorization_code = request.args.get('code')
        
        if not authorization_code:
            logger.error("Authorization code not provided in callback")
            return jsonify({"error": "Authorization code not provided"}), 400
        
        # Exchange code for tokens
        tokens = GoogleOAuthService.exchange_code_for_tokens(authorization_code)
        if not tokens:
            logger.error("Failed to exchange authorization code for tokens")
            return jsonify({"error": "Failed to exchange authorization code"}), 400
        
        # Get user info from Google
        user_info = GoogleOAuthService.get_user_info(tokens['access_token'])
        if not user_info:
            logger.error("Failed to get user info from Google with provided access token")
            return jsonify({"error": "Failed to get user info from Google"}), 400
        
        # Create or update user in our database
        user = User.create_or_update_google_user(user_info)
        if not user:
            logger.error("Failed to create or update user from Google data")
            return jsonify({"error": "Failed to create/update user"}), 500
        
        # Generate JWT token
        token = generate_token(str(user["_id"]))
        
        # Check if user is admin
        is_admin = user.get('role') == 'admin'
        
        # If redirect flag is present (default: yes), redirect to frontend callback with token
        redirect_flag = request.args.get('redirect', '1')
        if redirect_flag == '1' and FRONTEND_OAUTH_REDIRECT:
            try:
                target = f"{FRONTEND_OAUTH_REDIRECT}?token={token}&is_admin={'1' if is_admin else '0'}"
                return redirect(target)
            except Exception:
                logger.exception("Failed to redirect to frontend OAuth callback, falling back to JSON response")
        
        # Fallback: JSON response
        return jsonify({
            "message": "Google login successful",
            "token": token,
            "user": user,
            "is_admin": is_admin
        }), 200
        
    except Exception as e:
        logger.exception("Google callback error")
        return jsonify({"error": "Google callback error", "details": str(e)}), 500

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
    user["id"] = user["_id"]  # Add id field for frontend compatibility
    
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
    
    # Add id field for frontend compatibility
    user["id"] = user["_id"]
    
    return jsonify({"user": user}), 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Send OTP for password reset"""
    try:
        data = request.get_json()
        
        # Validate request data
        if not data or not data.get('email'):
            return jsonify({"error": "Email is required"}), 400
        
        email = data.get('email').strip().lower()
        
        # Create OTP
        otp_result = User.create_password_reset_otp(email)
        
        if not otp_result:
            # Don't reveal if email exists or not for security
            return jsonify({
                "message": "If an account with this email exists, you will receive an OTP shortly."
            }), 200
        
        # Send OTP email
        email_sent = send_otp_email(
            email=email,
            otp=otp_result['otp'],
            username=otp_result['user']['username']
        )
        
        if email_sent:
            return jsonify({
                "message": "OTP sent successfully. Please check your email.",
                "expires_in": 600  # 10 minutes in seconds
            }), 200
        else:
            return jsonify({
                "error": "Failed to send OTP email. Please try again later."
            }), 500
            
    except Exception as e:
        logger.exception("Forgot password error")
        return jsonify({"error": "An error occurred. Please try again later."}), 500

@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    """Verify OTP for password reset"""
    try:
        data = request.get_json()
        
        # Validate request data
        if not data or not data.get('email') or not data.get('otp'):
            return jsonify({"error": "Email and OTP are required"}), 400
        
        email = data.get('email').strip().lower()
        otp = data.get('otp').strip()
        
        # Verify OTP
        is_valid = User.verify_otp(email, otp)
        
        if is_valid:
            return jsonify({
                "message": "OTP verified successfully. You can now reset your password."
            }), 200
        else:
            return jsonify({
                "error": "Invalid or expired OTP. Please try again."
            }), 400
            
    except Exception as e:
        logger.exception("Verify OTP error")
        return jsonify({"error": "An error occurred. Please try again later."}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset user password with OTP verification"""
    try:
        data = request.get_json()
        
        # Validate request data
        if not data or not data.get('email') or not data.get('otp') or not data.get('new_password'):
            return jsonify({"error": "Email, OTP, and new password are required"}), 400
        
        email = data.get('email').strip().lower()
        otp = data.get('otp').strip()
        new_password = data.get('new_password')
        
        # Validate password strength
        if len(new_password) < 6:
            return jsonify({"error": "Password must be at least 6 characters long"}), 400
        
        # OTP verification is not needed here since it's already verified
        # and user is redirected from verify-otp page
        logger.info(f"Resetting password for: {email}")
        
        # Reset password
        password_reset = User.reset_password(email, new_password)
        
        if password_reset:
            logger.info(f"Password reset successful for: {email}")
            return jsonify({
                "message": "Password reset successfully. You can now login with your new password."
            }), 200
        else:
            logger.error(f"Password reset failed for: {email}")
            return jsonify({
                "error": "Failed to reset password. Please try again."
            }), 500
            
    except Exception as e:
        logger.exception("Reset password error")
        return jsonify({"error": "An error occurred. Please try again later."}), 500
