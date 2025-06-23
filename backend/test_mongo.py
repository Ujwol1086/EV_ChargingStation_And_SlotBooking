import os
from dotenv import load_dotenv
from pymongo import MongoClient
import sys

def test_mongo_connection():
    """Test MongoDB connection independently of Flask"""
    try:
        # Load environment variables
        load_dotenv()
        
        # Get MongoDB URI
        mongo_uri = os.getenv('MONGO_URI')
        if not mongo_uri:
            print("Error: MONGO_URI not found in .env file")
            return False
            
        print(f"Connecting to MongoDB with URI: {mongo_uri[:20]}...")
        
        # Connect to MongoDB
        client = MongoClient(mongo_uri)
        
        # Test connection by getting server info
        server_info = client.server_info()
        print(f"Successfully connected to MongoDB version {server_info.get('version')}")
        
        # List databases
        db_names = client.list_database_names()
        print(f"Available databases: {db_names}")
        
        # Connect to the evcharging database
        db = client.evcharging
        print(f"Using database: {db.name}")
        
        # List collections
        collections = db.list_collection_names()
        print(f"Collections in {db.name}: {collections}")
        
        # Check for users collection
        if 'users' in collections:
            # Count users
            user_count = db.users.count_documents({})
            print(f"Found {user_count} users in the users collection")
            
            # Show sample users (without exposing sensitive info)
            if user_count > 0:
                print("\nSample users (up to 5):")
                for user in db.users.find({}, {"_id": 1, "username": 1, "email": 1}).limit(5):
                    print(f"ID: {user['_id']}, Username: {user.get('username', 'N/A')}, Email: {user.get('email', 'N/A')}")
        else:
            print("No 'users' collection found")
        
        # Try to create a test collection to verify write permissions
        if 'test_connection' not in collections:
            db.test_connection.insert_one({"test": "This is a test document"})
            print("Successfully created a test document (write permissions confirmed)")
            # Clean up test collection
            db.test_connection.drop()
            print("Test collection cleaned up")
        
        return True
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        return False

if __name__ == "__main__":
    success = test_mongo_connection()
    sys.exit(0 if success else 1)
