from pymongo import MongoClient
from dotenv import load_dotenv
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_mongo_connection():
    """Test MongoDB connection using direct pymongo approach"""
    load_dotenv()
    
    # Get MongoDB URI from environment variables
    mongo_uri = os.getenv('MONGO_URI')
    db_name = os.getenv('DB_NAME', 'evcharging')  # Use 'evcharging' as default
    
    if not mongo_uri:
        logger.error("MONGO_URI not found in environment variables")
        return False
    
    logger.info(f"Connecting to MongoDB with URI: {mongo_uri[:20]}...")
    
    try:
        # Connect to MongoDB
        client = MongoClient(mongo_uri)
        
        # Check connection by accessing server info
        server_info = client.server_info()
        logger.info(f"Successfully connected to MongoDB version {server_info.get('version')}")
        
        # Print available databases
        db_names = client.list_database_names()
        logger.info(f"Available databases: {db_names}")
        
        # Use the specified database
        db = client[db_name]
        logger.info(f"Using database: {db.name}")
        
        # Print collections in the database
        collections = db.list_collection_names()
        logger.info(f"Collections in {db.name}: {collections}")
        
        # Check if users collection exists and get user count
        if 'users' in collections:
            user_count = db.users.count_documents({})
            logger.info(f"User count in users collection: {user_count}")
            
            # Print users (without sensitive info)
            if user_count > 0:
                logger.info("Sample users:")
                for user in db.users.find({}, {"_id": 1, "username": 1, "email": 1}).limit(5):
                    logger.info(f"  User: {user}")
        
        return True
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")
        return False

if __name__ == "__main__":
    success = test_mongo_connection()
    print(f"MongoDB connection test {'successful' if success else 'failed'}")
