from werkzeug.security import generate_password_hash, check_password_hash
from config.database import mongo
from bson import ObjectId
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class User:
    """User model for MongoDB"""
    
    @staticmethod
    def create_user(username, email, password):
        """Create a new user"""
        try:
            logger.info(f"Attempting to create user with email: {email}")
            
            # Check if email already exists
            existing_user = mongo.db.users.find_one({"email": email})
            if existing_user:
                logger.info(f"User with email {email} already exists")
                return None
                
            # Create user document
            user = {
                "username": username,
                "email": email,
                "password": generate_password_hash(password)
            }
            
            # Insert user into database
            logger.info(f"Inserting new user: {username}, {email}")
            user_id = mongo.db.users.insert_one(user).inserted_id
            logger.info(f"User created with ID: {user_id}")
            
            # Return the user document without password
            user_doc = mongo.db.users.find_one({"_id": user_id})
            if user_doc:
                user_doc.pop("password", None)
                user_doc["_id"] = str(user_doc["_id"])  # Convert ObjectId to string
            
            return user_doc
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            return None
    
    @staticmethod
    def find_by_email(email):
        """Find a user by email"""
        try:
            logger.info(f"Finding user by email: {email}")
            user = mongo.db.users.find_one({"email": email})
            if user:
                logger.info(f"User found with email: {email}")
            else:
                logger.info(f"No user found with email: {email}")
            return user
        except Exception as e:
            logger.error(f"Error finding user by email: {e}")
            return None
    
    @staticmethod
    def find_by_id(user_id):
        """Find a user by ID"""
        try:
            logger.info(f"Finding user by ID: {user_id}")
            user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
            if user:
                logger.info(f"User found with ID: {user_id}")
                user.pop("password", None)  # Remove password from returned doc
                user["_id"] = str(user["_id"])  # Convert ObjectId to string
            else:
                logger.info(f"No user found with ID: {user_id}")
            return user
        except Exception as e:
            logger.error(f"Error finding user by ID: {e}")
            return None
    
    @staticmethod
    def check_password(user, password):
        """Check if password matches user's password"""
        try:
            if not user or "password" not in user:
                logger.warning("User not found or password field missing during password check")
                return False
            result = check_password_hash(user["password"], password)
            logger.info(f"Password check result: {'Success' if result else 'Failed'}")
            return result
        except Exception as e:
            logger.error(f"Error checking password: {e}")
            return False
