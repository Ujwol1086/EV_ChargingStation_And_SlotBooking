from flask import Blueprint, jsonify, request
import logging

logger = logging.getLogger(__name__)
stations_bp = Blueprint('stations', __name__)



@stations_bp.route('', methods=['GET'])
def get_charging_stations():
    """Get all charging stations or filter by company type"""
    try:
        from models.charging_station import ChargingStation
        
        company_filter = request.args.get('company', None)  # Get ?company=nea from query params
        
        # Get stations from database
        stations = ChargingStation.get_all()
        
        if not stations:
            return jsonify({
                'success': True,
                'stations': [],
                'total_count': 0,
                'company_filter': company_filter
            })
        
        # Apply company filter if requested
        filtered_stations = []
        for station in stations:
            if company_filter and company_filter.lower() != 'all':
                if station.get('company') and station['company'].lower() == company_filter.lower():
                    filtered_stations.append(station)
            else:
                filtered_stations.append(station)
        
        return jsonify({
            'success': True,
            'stations': filtered_stations,
            'total_count': len(filtered_stations),
            'company_filter': company_filter
        })
    except Exception as e:
        logger.error(f"Error fetching stations: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
