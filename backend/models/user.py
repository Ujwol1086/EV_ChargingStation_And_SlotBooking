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
    def create_user(username, email, password, role="user", google_id=None, profile_picture=None):
        """Create a new user"""
        try:
            logger.info(f"Attempting to create user with email: {email}")
            
            # Ensure database connection is established
            if mongo.db is None:
                logger.error("Database connection not established")
                return None
                
            # Check if email already exists
            existing_user = mongo.db.users.find_one({"email": email})
            if existing_user:
                logger.info(f"User with email {email} already exists")
                return None
                
            # Create user document
            user = {
                "username": username,
                "email": email,
                "role": role,
                "google_id": google_id,
                "profile_picture": profile_picture
            }
            
            # Only add password if it's provided (for non-Google users)
            if password:
                user["password"] = generate_password_hash(password)
            
            # Insert user into database
            logger.info(f"Inserting new user: {username}, {email}, role: {role}")
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
    def create_or_update_google_user(google_data):
        """Create or update user from Google OAuth data"""
        try:
            logger.info(f"Processing Google user data for email: {google_data.get('email')}")
            
            if mongo.db is None:
                logger.error("Database connection not established")
                return None
            
            # Check if user exists by Google ID or email
            existing_user = mongo.db.users.find_one({
                "$or": [
                    {"google_id": google_data.get('id')},
                    {"email": google_data.get('email')}
                ]
            })
            
            if existing_user:
                # Update existing user with Google info if needed
                update_data = {}
                if not existing_user.get('google_id') and google_data.get('id'):
                    update_data['google_id'] = google_data.get('id')
                if not existing_user.get('profile_picture') and google_data.get('picture'):
                    update_data['profile_picture'] = google_data.get('picture')
                
                if update_data:
                    mongo.db.users.update_one(
                        {"_id": existing_user["_id"]},
                        {"$set": update_data}
                    )
                    # Refresh user data
                    existing_user = mongo.db.users.find_one({"_id": existing_user["_id"]})
                
                logger.info(f"Updated existing user: {existing_user.get('email')}")
            else:
                # Create new user from Google data
                username = google_data.get('name', google_data.get('email').split('@')[0])
                existing_user = User.create_user(
                    username=username,
                    email=google_data.get('email'),
                    password=None,  # No password for Google users
                    google_id=google_data.get('id'),
                    profile_picture=google_data.get('picture')
                )
                logger.info(f"Created new Google user: {username}")
            
            if existing_user:
                # Remove password and convert ObjectId to string
                existing_user.pop("password", None)
                existing_user["_id"] = str(existing_user["_id"])
                existing_user["id"] = existing_user["_id"]
            
            return existing_user
        except Exception as e:
            logger.error(f"Error creating/updating Google user: {e}")
            return None
    
    @staticmethod
    def find_by_google_id(google_id):
        """Find a user by Google ID"""
        try:
            logger.info(f"Finding user by Google ID: {google_id}")
            
            if mongo.db is None:
                logger.error("Database connection not established")
                return None
                
            user = mongo.db.users.find_one({"google_id": google_id})
            if user:
                logger.info(f"User found with Google ID: {google_id}")
                user.pop("password", None)
                user["_id"] = str(user["_id"])
            else:
                logger.info(f"No user found with Google ID: {google_id}")
            return user
        except Exception as e:
            logger.error(f"Error finding user by Google ID: {e}")
            return None

    @staticmethod
    def find_by_email(email):
        """Find a user by email"""
        try:
            logger.info(f"Finding user by email: {email}")
            
            # Ensure database connection is established
            if mongo.db is None:
                logger.error("Database connection not established")
                return None
                
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
            
            # Ensure database connection is established
            if mongo.db is None:
                logger.error("Database connection not established")
                return None
                
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
