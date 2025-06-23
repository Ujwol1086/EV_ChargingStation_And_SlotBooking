from flask import Blueprint, jsonify
from config.database import mongo
import logging

# Configure logging
logger = logging.getLogger(__name__)

db_test_bp = Blueprint('db_test', __name__)

@db_test_bp.route('/test-connection', methods=['GET'])
def test_connection():
    """Test MongoDB connection and return database info"""
    try:
        # Verify that mongo.db is not None
        if mongo is None:
            logger.error("MongoDB instance is not initialized")
            return jsonify({
                'success': False,
                'error': "MongoDB instance is not initialized"
            }), 500
            
        if mongo.db is None:
            logger.error("mongo.db is None - database connection failed")
            return jsonify({
                'success': False,
                'error': "mongo.db is None - database connection failed"
            }), 500
            
        # Get MongoDB server info
        server_info = mongo.cx.server_info()
        
        # Get database info
        db_names = mongo.cx.list_database_names()
        
        # Get current database collections
        try:
            current_db = mongo.db.name
            logger.info(f"Current database: {current_db}")
        except AttributeError as e:
            logger.error(f"Error accessing mongo.db.name: {e}")
            return jsonify({
                'success': False,
                'error': f"Error accessing mongo.db.name: {e}",
                'mongo_db_type': str(type(mongo.db))
            }), 500
            
        collections = mongo.db.list_collection_names()
        logger.info(f"Collections: {collections}")
        
        # Count users in the users collection if it exists
        user_count = 0
        if 'users' in collections:
            user_count = mongo.db.users.count_documents({})
            logger.info(f"User count: {user_count}")
            
        # Try listing some user data (without exposing sensitive info)
        sample_users = []
        if 'users' in collections and user_count > 0:
            cursor = mongo.db.users.find({}, {"_id": 1, "username": 1, "email": 1})
            for user in cursor.limit(5):  # Limit to 5 users for display
                # Convert ObjectId to string for JSON serialization
                user["_id"] = str(user["_id"])
                sample_users.append(user)
        
        return jsonify({
            'success': True,
            'mongodb_version': server_info.get('version', 'Unknown'),
            'databases': db_names,
            'current_database': current_db,
            'collections': collections,
            'user_count': user_count,
            'sample_users': sample_users if user_count > 0 else "No users found"
        })
    except Exception as e:
        logger.error(f"Error testing MongoDB connection: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'mongo_initialized': mongo is not None,
            'mongo_db_exists': hasattr(mongo, 'db') and mongo.db is not None
        }), 500
