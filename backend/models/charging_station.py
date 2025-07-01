from config.database import mongo
from bson import ObjectId
import json
import os
import logging

logger = logging.getLogger(__name__)

class ChargingStation:
    """Charging Station model for MongoDB with JSON file fallback"""
    
    @staticmethod
    def get_all():
        """Get all charging stations from database or JSON file"""
        try:
            logger.info("Fetching all charging stations")
            
            # Ensure stations are synced to database
            ChargingStation.ensure_stations_in_database()
            
            # Try to get from database first
            if mongo.db is not None:
                try:
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
                        logger.info("No stations in database, loading from JSON file")
                        return ChargingStation._load_from_json_file()
                        
                except Exception as db_error:
                    logger.warning(f"Database query failed: {db_error}, falling back to JSON file")
                    return ChargingStation._load_from_json_file()
            else:
                logger.warning("Database not available, loading from JSON file")
                return ChargingStation._load_from_json_file()
                
        except Exception as e:
            logger.error(f"Error fetching charging stations: {e}")
            return []
    
    @staticmethod
    def get_by_id(station_id):
        """Get a specific charging station by ID"""
        try:
            logger.info(f"Fetching charging station with ID: {station_id}")
            
            # Try database first
            if mongo.db is not None:
                try:
                    station = mongo.db.charging_stations.find_one({"id": station_id})
                    if station:
                        formatted_station = ChargingStation._format_station_from_db(station)
                        logger.info(f"Retrieved station {station_id} from database")
                        return formatted_station
                except Exception as db_error:
                    logger.warning(f"Database query failed: {db_error}, checking JSON file")
            
            # Fallback to JSON file
            stations = ChargingStation._load_from_json_file()
            for station in stations:
                if station.get('id') == station_id:
                    logger.info(f"Retrieved station {station_id} from JSON file")
                    return station
            
            logger.warning(f"Station {station_id} not found")
            return None
            
        except Exception as e:
            logger.error(f"Error fetching charging station {station_id}: {e}")
            return None
    
    @staticmethod
    def _load_from_json_file():
        """Load charging stations from JSON file"""
        try:
            # Get the path to the charging stations JSON file
            current_dir = os.path.dirname(os.path.abspath(__file__))
            data_file = os.path.join(os.path.dirname(current_dir), 'data', 'charging_stations.json')
            
            if not os.path.exists(data_file):
                logger.error(f"Charging stations JSON file not found: {data_file}")
                return []
            
            with open(data_file, 'r') as file:
                data = json.load(file)
                stations = data.get('stations', [])
                
                # Format stations for consistent API
                formatted_stations = []
                for station in stations:
                    formatted_station = ChargingStation._format_station_from_json(station)
                    formatted_stations.append(formatted_station)
                
                logger.info(f"Loaded {len(formatted_stations)} stations from JSON file")
                return formatted_stations
                
        except Exception as e:
            logger.error(f"Error loading stations from JSON file: {e}")
            return []
    
    @staticmethod
    def _format_station_from_json(station_data):
        """Format station data from JSON file to consistent structure"""
        try:
            # Extract coordinates
            location = station_data.get('location', {})
            coordinates = location.get('coordinates', [0, 0])
            
            # Count available slots
            chargers = station_data.get('chargers', [])
            total_slots = len(chargers)
            available_slots = sum(1 for charger in chargers if charger.get('available', False))
            
            # Extract connector types
            connector_types = list(set(charger.get('type') for charger in chargers if charger.get('type')))
            
            # Extract pricing (convert from string to number)
            pricing_str = station_data.get('pricing', 'NPR 15 per kWh')
            pricing_per_kwh = 15  # Default
            try:
                # Extract number from string like "NPR 15 per kWh"
                import re
                price_match = re.search(r'(\d+)', pricing_str)
                if price_match:
                    pricing_per_kwh = int(price_match.group(1))
            except:
                pass
            
            return {
                'id': station_data.get('id'),
                'name': station_data.get('name'),
                'latitude': coordinates[0] if len(coordinates) > 0 else 0,
                'longitude': coordinates[1] if len(coordinates) > 1 else 0,
                'address': location.get('address', ''),
                'available_slots': available_slots,
                'total_slots': total_slots,
                'connector_types': connector_types,
                'pricing_per_kwh': pricing_per_kwh,
                'features': station_data.get('amenities', []),
                'operating_hours': station_data.get('operatingHours', '24/7'),
                'chargers': chargers,
                'photos': station_data.get('photos', []),
                'rating': 4.0  # Default rating
            }
            
        except Exception as e:
            logger.error(f"Error formatting station from JSON: {e}")
            return station_data
    
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
                'latitude': station_data.get('latitude', 0),
                'longitude': station_data.get('longitude', 0),
                'address': station_data.get('address', ''),
                'available_slots': station_data.get('available_slots', 0),
                'total_slots': station_data.get('total_slots', 0),
                'connector_types': station_data.get('connector_types', []),
                'pricing_per_kwh': station_data.get('pricing_per_kwh', 15),
                'features': station_data.get('features', []),
                'operating_hours': station_data.get('operating_hours', '24/7'),
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
    
    @staticmethod
    def initialize_from_json():
        """Initialize database with data from JSON file (for setup)"""
        try:
            logger.info("Initializing charging stations database from JSON file")
            
            if mongo.db is None:
                logger.error("Database connection not established")
                return False
            
            # Check if stations already exist
            existing_count = mongo.db.charging_stations.count_documents({})
            if existing_count > 0:
                logger.info(f"Database already has {existing_count} stations, skipping initialization")
                return True
            
            # Load stations from JSON
            stations_from_json = ChargingStation._load_from_json_file()
            
            if not stations_from_json:
                logger.error("No stations loaded from JSON file")
                return False
            
            # Insert stations into database
            station_docs = []
            for station in stations_from_json:
                # Convert to database format
                station_doc = {
                    'id': station['id'],
                    'name': station['name'],
                    'latitude': station['latitude'],
                    'longitude': station['longitude'],
                    'address': station['address'],
                    'available_slots': station['available_slots'],
                    'total_slots': station['total_slots'],
                    'connector_types': station['connector_types'],
                    'pricing_per_kwh': station['pricing_per_kwh'],
                    'features': station['features'],
                    'operating_hours': station['operating_hours'],
                    'chargers': station['chargers'],
                    'photos': station['photos'],
                    'rating': station['rating']
                }
                station_docs.append(station_doc)
            
            result = mongo.db.charging_stations.insert_many(station_docs)
            logger.info(f"Initialized database with {len(result.inserted_ids)} charging stations")
            
            return True
            
        except Exception as e:
            logger.error(f"Error initializing charging stations database: {e}")
            return False
    
    @staticmethod
    def ensure_stations_in_database():
        """
        Ensure all stations from JSON file are stored in the database with proper structure
        """
        try:
            # Skip if database is not available
            if mongo.db is None:
                return False
                
            logger.info("Ensuring stations are properly stored in database...")
            
            # Load stations from JSON file
            json_stations = ChargingStation._load_from_json_file()
            
            if not json_stations:
                logger.warning("No stations found in JSON file")
                return False
            
            # Get existing stations from database
            existing_stations = list(mongo.db.charging_stations.find({}))
            existing_ids = {station.get('id') for station in existing_stations}
            
            updated_count = 0
            inserted_count = 0
            
            for station in json_stations:
                station_id = station.get('id')
                
                if not station_id:
                    logger.warning(f"Station missing ID: {station}")
                    continue
                
                # Ensure proper charger structure
                chargers = station.get('chargers', [])
                if not chargers and station.get('connector_types'):
                    # Convert old connector_types format to new chargers format
                    chargers = []
                    for connector_type in station.get('connector_types', []):
                        chargers.append({
                            'type': connector_type,
                            'power_kw': 50,  # Default power
                            'status': 'available',
                            'connector_id': f"{station_id}_{connector_type}_{len(chargers) + 1}"
                        })
                    station['chargers'] = chargers
                
                # Ensure required fields
                from datetime import datetime
                station_doc = {
                    'id': station_id,
                    'name': station.get('name', f'Station {station_id}'),
                    'latitude': float(station.get('latitude', 0)),
                    'longitude': float(station.get('longitude', 0)),
                    'connector_types': station.get('connector_types', []),
                    'chargers': chargers,
                    'available_slots': len([c for c in chargers if c.get('status') == 'available']),
                    'total_slots': len(chargers),
                    'pricing_per_kwh': station.get('pricing_per_kwh', 15),
                    'features': station.get('features', []),
                    'rating': station.get('rating', 4.0),
                    'address': station.get('address', ''),
                    'operating_hours': station.get('operating_hours', '24/7'),
                    'photos': station.get('photos', []),
                    'last_updated': datetime.utcnow()
                }
                
                if station_id in existing_ids:
                    # Update existing station
                    result = mongo.db.charging_stations.update_one(
                        {'id': station_id},
                        {'$set': station_doc}
                    )
                    if result.modified_count > 0:
                        updated_count += 1
                else:
                    # Insert new station
                    mongo.db.charging_stations.insert_one(station_doc)
                    inserted_count += 1
            
            logger.info(f"Station database sync complete: {inserted_count} inserted, {updated_count} updated")
            return True
            
        except Exception as e:
            logger.error(f"Error ensuring stations in database: {e}")
            return False 