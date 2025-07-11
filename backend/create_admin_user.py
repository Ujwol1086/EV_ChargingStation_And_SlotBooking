#!/usr/bin/env python3
"""
Script to create an admin user for testing the admin panel
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config.database import init_db, mongo
from models.user import User
from werkzeug.security import generate_password_hash
from bson import ObjectId
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_admin_user():
    """Create an admin user for testing"""
    try:
        # Initialize database
        from flask import Flask
        app = Flask(__name__)
        init_db(app)
        
        # Check if admin user already exists
        existing_admin = mongo.db.users.find_one({"email": "admin@evconnect.com"})
        if existing_admin:
            logger.info("Admin user already exists")
            return existing_admin
        
        # Create admin user
        admin_user = {
            "username": "admin",
            "email": "admin@evconnect.com",
            "password": generate_password_hash("admin123"),
            "role": "admin",
            "status": "active",
            "created_at": "2024-01-01T00:00:00Z",
            "last_login": "2024-01-01T00:00:00Z"
        }
        
        # Insert admin user
        user_id = mongo.db.users.insert_one(admin_user).inserted_id
        logger.info(f"Admin user created with ID: {user_id}")
        
        # Return the created user (without password)
        admin_user["_id"] = str(user_id)
        admin_user.pop("password", None)
        
        return admin_user
        
    except Exception as e:
        logger.error(f"Error creating admin user: {e}")
        return None

if __name__ == "__main__":
    admin_user = create_admin_user()
    if admin_user:
        print("Admin user created successfully!")
        print(f"Username: {admin_user['username']}")
        print(f"Email: {admin_user['email']}")
        print("Password: admin123")
        print("\nYou can now log in to the admin panel with these credentials.")
    else:
        print("Failed to create admin user.") 