from flask import Blueprint, jsonify
import json
import os
import logging

# Configure logging
logger = logging.getLogger(__name__)

stations_bp = Blueprint('stations', __name__)

def normalize_station_data(station, index):
    """Normalize station data to consistent format"""
    try:
        # Generate ID if missing
        station_id = station.get('id', f'station_{index}')
        
        # Handle location data
        if 'location' in station and 'coordinates' in station['location']:
            # Format: {"location": {"coordinates": [lat, lon]}}
            coordinates = station['location']['coordinates']
            address = station['location'].get('address', '')
        elif 'latitude' in station and 'longitude' in station:
            # Format: {"latitude": "lat", "longitude": "lon"}
            coordinates = [float(station['latitude']), float(station['longitude'])]
            address = station.get('address', '')
        else:
            logger.warning(f"Station {station_id} has no valid location data")
            return None
        
        # Normalize charger data
        chargers = []
        if 'chargers' in station:
            chargers = station['chargers']
        elif 'plugs' in station:
            # Convert plugs format to chargers format
            for plug in station['plugs']:
                chargers.append({
                    'type': plug.get('plug', 'Unknown'),
                    'power': plug.get('power', 'Unknown'),
                    'available': True  # Default to available
                })
        
        # Calculate slot availability from chargers
        total_slots = len(chargers)
        available_slots = sum(1 for charger in chargers if charger.get('available', True))
        
        # Normalize amenities
        amenities = station.get('amenities', [])
        if isinstance(amenities, list):
            amenities = [str(a) for a in amenities]
        else:
            amenities = []
        
        normalized = {
            'id': station_id,
            'name': station.get('name', 'Unknown Station'),
            'location': {
                'address': address,
                'coordinates': coordinates
            },
            'chargers': chargers,
            'total_slots': total_slots,
            'available_slots': available_slots,
            'amenities': amenities,
            'operatingHours': station.get('operatingHours', station.get('time', '24/7')),
            'pricing': station.get('pricing', 'Contact for pricing'),
            'photos': station.get('photos', []),
            'telephone': station.get('telephone', ''),
            'city': station.get('city', ''),
            'province': station.get('province', ''),
            'type': station.get('type', ['car'])
        }
        
        return normalized
        
    except Exception as e:
        logger.error(f"Error normalizing station data: {e}")
        return None

@stations_bp.route('/', methods=['GET'])
def get_charging_stations():
    """Get all charging stations"""
    try:
        # Get the path to the charging stations JSON file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        data_file = os.path.join(os.path.dirname(current_dir), 'data', 'charging_stations.json')
        
        # Check if file exists
        if not os.path.exists(data_file):
            logger.error(f"Charging stations data file not found: {data_file}")
            return jsonify({
                'success': False,
                'error': "Charging stations data file not found"
            }), 404
            
        # Read the JSON file
        with open(data_file, 'r', encoding='utf-8') as file:
            stations_data = json.load(file)
        
        # Normalize all station data
        normalized_stations = []
        raw_stations = stations_data.get('stations', [])
        
        for index, station in enumerate(raw_stations):
            normalized = normalize_station_data(station, index)
            if normalized:
                normalized_stations.append(normalized)
        
        logger.info(f"Successfully loaded {len(normalized_stations)} charging stations")
        
        return jsonify({
            'success': True,
            'stations': normalized_stations,
            'total_count': len(normalized_stations)
        })
        
    except Exception as e:
        logger.error(f"Error fetching charging stations: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@stations_bp.route('/list', methods=['GET'])
def get_charging_stations_list():
    """Get all charging stations (list route)"""
    return get_charging_stations()

@stations_bp.route('/<station_id>', methods=['GET'])
def get_charging_station(station_id):
    """Get a specific charging station by ID"""
    try:
        # Get the path to the charging stations JSON file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        data_file = os.path.join(os.path.dirname(current_dir), 'data', 'charging_stations.json')
        
        # Check if file exists
        if not os.path.exists(data_file):
            logger.error(f"Charging stations data file not found: {data_file}")
            return jsonify({
                'success': False,
                'error': "Charging stations data file not found"
            }), 404
            
        # Read the JSON file
        with open(data_file, 'r', encoding='utf-8') as file:
            stations_data = json.load(file)
        
        # Find and normalize the station
        raw_stations = stations_data.get('stations', [])
        
        for index, station in enumerate(raw_stations):
            current_id = station.get('id', f'station_{index}')
            if current_id == station_id:
                normalized = normalize_station_data(station, index)
                if normalized:
                    return jsonify({
                        'success': True,
                        'station': normalized
                    })
                break
        
        # Return a fallback station for missing station IDs
        logger.warning(f"Station {station_id} not found, returning fallback data")
        fallback_station = {
            'id': station_id,
            'name': f"Station {station_id}",
            'location': {
                'address': 'Location not available',
                'coordinates': [0, 0]
            },
            'chargers': [],
            'total_slots': 0,
            'available_slots': 0,
            'amenities': [],
            'operatingHours': 'Unknown',
            'pricing': 'Contact for pricing',
            'photos': [],
            'telephone': 'N/A',
            'city': 'Unknown',
            'province': 'Unknown',
            'type': ['car']
        }
        
        return jsonify({
            'success': True,
            'station': fallback_station,
            'note': 'This is a fallback station - the original station data was not found'
        })
            
    except Exception as e:
        logger.error(f"Error fetching charging station {station_id}: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500 