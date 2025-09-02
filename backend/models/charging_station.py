from config.database import mongo
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

class ChargingStation:
    """Charging Station model for MongoDB"""
    
    @staticmethod
    def get_all():
        """Get all charging stations from database"""
        try:
            logger.info("Fetching all charging stations from database")
            
            if mongo.db is None:
                logger.error("Database connection not established")
                return []
            
            stations = list(mongo.db.charging_stations.find())
            
            if stations:
                # Convert ObjectIds to strings and format data
                formatted_stations = []
                for station in stations:
                    formatted_station = ChargingStation._format_station_from_db(station)
                    formatted_stations.append(formatted_station)
                
                logger.info(f"Retrieved {len(formatted_stations)} stations from database")
                return formatted_stations
            else:
                logger.info("No stations found in database")
                return []
                
        except Exception as e:
            logger.error(f"Error fetching charging stations: {e}")
            return []
    
    @staticmethod
    def get_by_id(station_id):
        """Get a specific charging station by ID"""
        try:
            logger.info(f"Fetching charging station with ID: {station_id}")
            
            if mongo.db is None:
                logger.error("Database connection not established")
                return None
            
            station = mongo.db.charging_stations.find_one({"id": station_id})
            if station:
                formatted_station = ChargingStation._format_station_from_db(station)
                logger.info(f"Retrieved station {station_id} from database")
                return formatted_station
            
            logger.warning(f"Station {station_id} not found in database")
            return None
            
        except Exception as e:
            logger.error(f"Error fetching charging station {station_id}: {e}")
            return None
    

    
    @staticmethod
    def _format_station_from_db(station_data):
        """Format station data from database to consistent structure"""
        try:
            # Convert ObjectId to string
            if '_id' in station_data:
                station_data['_id'] = str(station_data['_id'])
            
            # Ensure required fields exist with defaults
            return {
                'id': station_data.get('id'),
                'name': station_data.get('name'),
                'company': station_data.get('company', 'Independent'),
                'latitude': station_data.get('latitude', 0),
                'longitude': station_data.get('longitude', 0),
                'address': station_data.get('address', ''),
                'available_slots': station_data.get('available_slots', 0),
                'total_slots': station_data.get('total_slots', 0),
                'connector_types': station_data.get('connector_types', []),
                'pricing_per_kwh': station_data.get('pricing_per_kwh', 15),
                'features': station_data.get('features', []),
                'operating_hours': station_data.get('operating_hours', '24/7'),
                'status': station_data.get('status', 'active'),
                'chargers': station_data.get('chargers', []),
                'photos': station_data.get('photos', []),
                'rating': station_data.get('rating', 4.0),
                '_id': station_data.get('_id')
            }
            
        except Exception as e:
            logger.error(f"Error formatting station from database: {e}")
            return station_data
    
    @staticmethod
    def create_station(station_data):
        """Create a new charging station in the database"""
        try:
            logger.info(f"Creating new charging station: {station_data.get('name')}")
            
            if mongo.db is None:
                logger.error("Database connection not established")
                return None
            
            # Insert station into database
            result = mongo.db.charging_stations.insert_one(station_data)
            station_id = result.inserted_id
            
            logger.info(f"Station created with ID: {station_id}")
            
            # Return the created station
            station_doc = mongo.db.charging_stations.find_one({"_id": station_id})
            if station_doc:
                return ChargingStation._format_station_from_db(station_doc)
            
            return None
            
        except Exception as e:
            logger.error(f"Error creating charging station: {e}")
            return None
    
    @staticmethod
    def update_station(station_id, update_data):
        """Update a charging station"""
        try:
            logger.info(f"Updating charging station: {station_id}")
            
            if mongo.db is None:
                logger.error("Database connection not established")
                return False
            
            result = mongo.db.charging_stations.update_one(
                {"id": station_id},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                logger.info(f"Station {station_id} updated successfully")
                return True
            else:
                logger.warning(f"No station found with ID: {station_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error updating charging station: {e}")
            return False
    
    @staticmethod
    def delete_station(station_id):
        """Delete a charging station"""
        try:
            logger.info(f"Deleting charging station: {station_id}")
            
            if mongo.db is None:
                logger.error("Database connection not established")
                return False
            
            result = mongo.db.charging_stations.delete_one({"id": station_id})
            
            if result.deleted_count > 0:
                logger.info(f"Station {station_id} deleted successfully")
                return True
            else:
                logger.warning(f"No station found with ID: {station_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error deleting charging station: {e}")
            return False
    
 