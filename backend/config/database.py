from pymongo import MongoClient
from dotenv import load_dotenv
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Get MongoDB URI from environment variables
mongo_uri = os.getenv('MONGO_URI')
db_name = os.getenv('DB_NAME', 'evcharging')  # Use 'evcharging' as default

# Initialize MongoDB client at module level
mongo_client = None
mongo_db = None

def init_db(app):
    """Initialize database connection using direct PyMongo"""
    global mongo_client, mongo_db
    
    if not mongo_uri:
        logger.error("MONGO_URI not found in environment variables")
        raise ValueError("MONGO_URI not found in environment variables")
    
    logger.info(f"Connecting to MongoDB with URI: {mongo_uri[:20]}...")
    
    try:
        # Connect to MongoDB
        mongo_client = MongoClient(mongo_uri)
        
        # Check connection by accessing server info
        server_info = mongo_client.server_info()
        logger.info(f"Successfully connected to MongoDB version {server_info.get('version')}")
        
        # Use the specified database
        mongo_db = mongo_client[db_name]
        logger.info(f"Using database: {mongo_db.name}")
        
        # Store the MongoDB client and database in app context for easy access
        app.config['MONGO_CLIENT'] = mongo_client
        app.config['MONGO_DB'] = mongo_db
        
        # Initialize the mongo helper object
        mongo.cx = mongo_client
        mongo.db = mongo_db
        
        # Print collections in the database
        collections = mongo_db.list_collection_names()
        logger.info(f"Collections in {mongo_db.name}: {collections}")
        
        return mongo_db
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")
        raise

# Helper class to mimic flask_pymongo.PyMongo interface
class MongoDB:
    def __init__(self):
        self.cx = None
        self.db = None
    
    def init_app(self, app):
        global mongo_client, mongo_db
        self.cx = mongo_client
        self.db = mongo_db

# Create a MongoDB instance that will be initialized with the app
mongo = MongoDB()
