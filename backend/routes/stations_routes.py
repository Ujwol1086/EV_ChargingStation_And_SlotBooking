from flask import Blueprint, jsonify, request
import json
import os
import logging
import time

logger = logging.getLogger(__name__)
stations_bp = Blueprint('stations', __name__)

def normalize_station_data(station, index):
    """Normalize station data to consistent format"""
    try:
        station_id = station.get('id', f'station_{index}')
        if 'location' in station and 'coordinates' in station['location']:
            coordinates = station['location']['coordinates']
            address = station['location'].get('address', '')
        elif 'latitude' in station and 'longitude' in station:
            coordinates = [float(station['latitude']), float(station['longitude'])]
            address = station.get('address', '')
        else:
            logger.warning(f"Station {station_id} has no valid location data")
            return None
        
        chargers = []
        if 'chargers' in station:
            chargers = station['chargers']
        elif 'plugs' in station:
            for plug in station['plugs']:
                chargers.append({
                    'type': plug.get('plug', 'Unknown'),
                    'power': plug.get('power', 'Unknown'),
                    'available': True
                })
        
        total_slots = len(chargers)
        available_slots = sum(1 for c in chargers if c.get('available', True))
        amenities = station.get('amenities', [])
        if not isinstance(amenities, list):
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
            'amenities': [str(a) for a in amenities],
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

@stations_bp.route('', methods=['GET'])
def get_charging_stations():
    """Get all charging stations or filter by type"""
    try:
        type_filter = request.args.get('type', None)  # Get ?type=NEA from query params
        
        # Load JSON file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        data_file = os.path.join(os.path.dirname(current_dir), 'data', 'charging_stations.json')
        if not os.path.exists(data_file):
            return jsonify({'success': False, 'error': 'Data file not found'}), 404
        
        with open(data_file, 'r', encoding='utf-8') as file:
            stations_data = json.load(file)
        
        raw_stations = stations_data.get('stations', [])
        normalized_stations = []
        
        for index, station in enumerate(raw_stations):
            normalized = normalize_station_data(station, index)
            if normalized:
                # Apply type filter if requested
                if type_filter:
                    station_types = [t.lower() for t in normalized.get('type', [])]
                    if type_filter.lower() in station_types:
                        normalized_stations.append(normalized)
                else:
                    normalized_stations.append(normalized)
        
        return jsonify({
            'success': True,
            'stations': normalized_stations,
            'total_count': len(normalized_stations)
        })
    except Exception as e:
        logger.error(f"Error fetching stations: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
