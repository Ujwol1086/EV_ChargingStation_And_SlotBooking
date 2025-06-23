from flask import Flask
from flask_cors import CORS
from config.database import init_db, mongo
from routes.auth_routes import auth_bp
from routes.db_test_routes import db_test_bp
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    """Create and configure Flask application"""
    app = Flask(__name__)
    
    # Initialize CORS
    CORS(app)
    
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
    app.register_blueprint(db_test_bp, url_prefix='/api/db')
    
    # Test route
    @app.route("/")
    def index():
        return {"message": "Welcome to EVConnectNepal API"}
    
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)