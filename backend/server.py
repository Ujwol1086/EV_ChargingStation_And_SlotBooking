from flask import Flask, request
from flask_cors import CORS
from config.database import init_db, mongo
from routes.auth_routes import auth_bp
from routes.stations_routes import stations_bp
from routes.recommendation_routes import recommendation_bp
from routes.admin_routes import admin_bp
from routes.payment_routes import payment_bp
from routes.booking_routes import booking_bp
import logging
import threading
import time
from datetime import datetime, timedelta
import os
import sys

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    """Create and configure Flask application"""
    app = Flask(__name__)
    
    # Initialize CORS with more permissive settings for development
    CORS(app, 
         origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://192.168.1.67:5173"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept"],
         expose_headers=["Content-Type", "Authorization"],
         supports_credentials=True,
         max_age=86400)
    
    # Initialize database
    try:
        logger.info("Initializing database connection...")
        db = init_db(app)
        
        # Update the mongo interface with the initialized objects
        mongo.cx = app.config.get('MONGO_CLIENT')
        mongo.db = app.config.get('MONGO_DB')
        
        # Verify database connection was successful
        if mongo.db is None:
            logger.error("Database initialization failed: mongo.db is None")
        else:
            logger.info(f"Database initialization successful. Using database: {mongo.db.name}")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        # Continue running the app even if DB fails, so we can show error messages
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(stations_bp, url_prefix='/api/stations')
    app.register_blueprint(recommendation_bp, url_prefix='/api/recommendations')
    app.register_blueprint(admin_bp)
    app.register_blueprint(payment_bp, url_prefix='/api/payments')
    app.register_blueprint(booking_bp, url_prefix='/api/bookings')
    
    # Test route
    @app.route("/")
    def index():
        return {"message": "Welcome to EVConnectNepal API"}
    
    # Debug route for CORS testing
    @app.route("/debug")
    def debug():
        return {
            "message": "Debug endpoint working",
            "cors_origin": request.headers.get('Origin'),
            "user_agent": request.headers.get('User-Agent'),
            "timestamp": time.time()
        }
    
    # Add CORS headers to all responses
    @app.after_request
    def after_request(response):
        origin = request.headers.get('Origin')
        if origin in ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://192.168.1.67:5173"]:
            response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Max-Age', '86400')
        return response
    
    return app

def background_cleanup_task():
    """
    Background task that runs periodically to clean up expired bookings
    """
    while True:
        try:
            from models.booking import Booking
            count = Booking.cleanup_expired_bookings()
            if count > 0:
                logger.info(f"Background cleanup: Marked {count} expired bookings as completed")
        except Exception as e:
            logger.error(f"Error in background cleanup task: {e}")
        
        # Sleep for 5 minutes before next cleanup
        time.sleep(300)

# Create app instance at module level
app = create_app()

if __name__ == "__main__":
    try:
        # Start background cleanup task
        cleanup_thread = threading.Thread(target=background_cleanup_task, daemon=True)
        cleanup_thread.start()
        logger.info("Background cleanup task started")
        
        # Get port from environment variable or use default
        port = int(os.getenv('PORT', 5000))
        host = os.getenv('HOST', '0.0.0.0')
        
        logger.info(f"Starting server on {host}:{port}")
        app.run(host=host, port=port, debug=True)
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        sys.exit(1)