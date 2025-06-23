from flask import Blueprint, jsonify
import json
import os
import logging

# Configure logging
logger = logging.getLogger(__name__)

stations_bp = Blueprint('stations', __name__)

@stations_bp.route('/list', methods=['GET'])
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
        with open(data_file, 'r') as file:
            stations_data = json.load(file)
            
        return jsonify({
            'success': True,
            'stations': stations_data['stations']
        })
    except Exception as e:
        logger.error(f"Error fetching charging stations: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

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
        with open(data_file, 'r') as file:
            stations_data = json.load(file)
            
        # Find the station with the given ID
        station = next((s for s in stations_data['stations'] if s['id'] == station_id), None)
        
        if not station:
            return jsonify({
                'success': False,
                'error': f"Charging station with ID {station_id} not found"
            }), 404
            
        return jsonify({
            'success': True,
            'station': station
        })
    except Exception as e:
        logger.error(f"Error fetching charging station {station_id}: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
