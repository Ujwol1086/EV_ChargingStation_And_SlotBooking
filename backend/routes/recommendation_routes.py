from flask import Blueprint, request, jsonify
import json
import os
import logging
from services.recommendation_service import RecommendationService
from services.route_service import RouteService
from models.booking import Booking
from middleware.auth_middleware import require_auth, get_current_user_id

logger = logging.getLogger(__name__)

recommendation_bp = Blueprint('recommendations', __name__)

# Initialize services
recommendation_service = RecommendationService()
route_service = RouteService()

@recommendation_bp.route('/get-recommendations', methods=['POST'])
@require_auth
def get_station_recommendations():
    """
    Get personalized charging station recommendations based on user input
    Now requires authentication
    
    Expected JSON payload:
    {
        "latitude": float,
        "longitude": float,
        "battery_percentage": int,
        "plug_type": str,
        "urgency_level": str
    }
    """
    try:
        # Get current user ID
        user_id = get_current_user_id()
        
        # Validate request data
        if not request.json:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        data = request.json
        
        # Validate required fields
        required_fields = ['latitude', 'longitude', 'battery_percentage', 'plug_type', 'urgency_level']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Validate data types and values
        if not isinstance(data['latitude'], (int, float)) or not isinstance(data['longitude'], (int, float)):
            return jsonify({
                'success': False,
                'error': 'Latitude and longitude must be numbers'
            }), 400
        
        if not isinstance(data['battery_percentage'], (int, float)) or not (0 <= data['battery_percentage'] <= 100):
            return jsonify({
                'success': False,
                'error': 'Battery percentage must be a number between 0 and 100'
            }), 400
        
        valid_plug_types = ['Type A', 'Type B', 'CHAdeMO', 'CCS', 'Tesla Supercharger']
        if data['plug_type'] not in valid_plug_types:
            return jsonify({
                'success': False,
                'error': f'Plug type must be one of: {", ".join(valid_plug_types)}'
            }), 400
        
        valid_urgency_levels = ['low', 'medium', 'high', 'emergency']
        if data['urgency_level'].lower() not in valid_urgency_levels:
            return jsonify({
                'success': False,
                'error': f'Urgency level must be one of: {", ".join(valid_urgency_levels)}'
            }), 400
        
        # Load charging stations data
        current_dir = os.path.dirname(os.path.abspath(__file__))
        data_file = os.path.join(os.path.dirname(current_dir), 'data', 'charging_stations.json')
        
        if not os.path.exists(data_file):
            logger.error(f"Charging stations data file not found: {data_file}")
            return jsonify({
                'success': False,
                'error': "Charging stations data not available"
            }), 500
        
        with open(data_file, 'r') as file:
            stations_data = json.load(file)
        
        # Prepare input for recommendation service (convert to expected format)
        user_input = {
            'location': [data['latitude'], data['longitude']],
            'battery_percentage': data['battery_percentage'],
            'plug_type': data['plug_type'],
            'urgency': data['urgency_level'].lower(),
            'stations': stations_data['stations']
        }
        
        # Get recommendations
        recommendations_result = recommendation_service.get_recommendations(user_input)
        
        if not recommendations_result['success']:
            return jsonify(recommendations_result), 400
        
        # Process auto-bookings and store in database
        auto_bookings = []
        for recommendation in recommendations_result['recommendations']:
            if recommendation['auto_booking'].get('auto_booked', False):
                # Store auto-booking in database
                booking_data = {
                    'booking_id': recommendation['auto_booking']['booking_id'],
                    'power': recommendation['auto_booking']['power'],
                    'estimated_time': recommendation['auto_booking']['estimated_time'],
                    'auto_booked': True,
                    'station_details': recommendation['station'],
                    'user_location': [data['latitude'], data['longitude']],
                    'distance_to_station': recommendation['distance']
                }
                
                booking = Booking.create_booking(
                    user_id=user_id,
                    station_id=recommendation['station']['id'],
                    charger_type=recommendation['auto_booking']['charger_type'],
                    booking_data=booking_data
                )
                
                if booking:
                    logger.info(f"Auto-booking created and stored: {booking['booking_id']}")
                    recommendation['auto_booking']['database_id'] = booking['_id']
                    auto_bookings.append({
                        'booking_id': recommendation['auto_booking']['booking_id'],
                        'station_name': recommendation['station']['name']
                    })
        
        # Format response
        response = {
            'success': True,
            'recommendations': recommendations_result['recommendations'],
            'auto_bookings': auto_bookings,
            'metadata': {
                'total_compatible_stations': recommendations_result['total_compatible_stations'],
                'algorithm_used': recommendations_result['algorithm_used'],
                'weights_used': recommendations_result['weights_used'],
                'user_id': user_id,
                'processing_time': '< 1 second',
                'user_input': {
                    'location': [data['latitude'], data['longitude']],
                    'battery_percentage': data['battery_percentage'],
                    'plug_type': data['plug_type'],
                    'urgency_level': data['urgency_level']
                }
            }
        }
        
        logger.info(f"Generated {len(recommendations_result['recommendations'])} recommendations for user {user_id}")
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error in get_station_recommendations: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@recommendation_bp.route('/book-slot', methods=['POST'])
@require_auth
def book_charging_slot():
    """
    Book a charging slot at a station (requires authentication)
    
    Expected JSON payload:
    {
        "station_id": str,
        "charger_type": str,
        "booking_duration": int (minutes, optional),
        "station_details": dict (optional),
        "user_location": [lat, lng] (optional)
    }
    """
    try:
        user_id = get_current_user_id()
        
        if not request.json:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        data = request.json
        
        # Validate required fields
        if 'station_id' not in data or 'charger_type' not in data:
            return jsonify({
                'success': False,
                'error': 'Station ID and charger type are required'
            }), 400
        
        # Generate booking ID
        import time
        booking_id = f"MANUAL_{data['station_id']}_{user_id}_{int(time.time())}"
        
        # Calculate distance if user location provided
        distance_to_station = 0
        if 'user_location' in data and 'station_details' in data:
            station_coords = data['station_details'].get('location', {}).get('coordinates', [])
            if len(station_coords) == 2:
                distance_to_station = recommendation_service.haversine_distance(
                    data['user_location'][0], data['user_location'][1],
                    station_coords[0], station_coords[1]
                )
        
        # Prepare booking data
        booking_data = {
            'booking_id': booking_id,
            'power': data.get('power', 'Unknown'),
            'estimated_time': data.get('estimated_time', 'Unknown'),
            'auto_booked': False,
            'booking_duration': data.get('booking_duration', 60),
            'station_details': data.get('station_details', {}),
            'user_location': data.get('user_location', []),
            'distance_to_station': round(distance_to_station, 2)
        }
        
        # Store booking in database
        booking = Booking.create_booking(
            user_id=user_id,
            station_id=data['station_id'],
            charger_type=data['charger_type'],
            booking_data=booking_data
        )
        
        if not booking:
            return jsonify({
                'success': False,
                'error': 'Failed to create booking'
            }), 500
        
        response = {
            'success': True,
            'booking': {
                'booking_id': booking_id,
                'database_id': booking['_id'],
                'station_id': data['station_id'],
                'charger_type': data['charger_type'],
                'status': 'confirmed',
                'booking_time': booking['booking_time'].isoformat() if 'booking_time' in booking else None,
                'estimated_duration': booking_data['booking_duration'],
                'distance_to_station': booking_data['distance_to_station'],
                'user_id': user_id
            }
        }
        
        logger.info(f"Manual booking created for user {user_id}: {booking_id}")
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error in book_charging_slot: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@recommendation_bp.route('/my-bookings', methods=['GET'])
@require_auth
def get_user_bookings():
    """
    Get all bookings for the authenticated user
    """
    try:
        user_id = get_current_user_id()
        
        # Get bookings from database
        bookings = Booking.find_by_user_id(user_id)
        
        return jsonify({
            'success': True,
            'bookings': bookings,
            'total_bookings': len(bookings),
            'user_id': user_id
        })
        
    except Exception as e:
        logger.error(f"Error getting user bookings: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@recommendation_bp.route('/active-bookings', methods=['GET'])
@require_auth
def get_active_bookings():
    """
    Get active bookings for the authenticated user
    """
    try:
        user_id = get_current_user_id()
        
        # Get active bookings from database
        bookings = Booking.find_active_bookings_by_user(user_id)
        
        return jsonify({
            'success': True,
            'bookings': bookings,
            'total_active_bookings': len(bookings),
            'user_id': user_id
        })
        
    except Exception as e:
        logger.error(f"Error getting active bookings: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@recommendation_bp.route('/route-to-station', methods=['POST'])
@require_auth
def get_route_to_station():
    """
    Calculate route from user location to a charging station using hardcoded algorithms
    
    Expected JSON payload:
    {
        "user_location": [lat, lng],
        "station_location": [lat, lng],
        "booking_id": str (optional)
    }
    """
    try:
        user_id = get_current_user_id()
        
        if not request.json:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        data = request.json
        
        # Validate required fields
        if 'user_location' not in data or 'station_location' not in data:
            return jsonify({
                'success': False,
                'error': 'User location and station location are required'
            }), 400
        
        if (not isinstance(data['user_location'], list) or len(data['user_location']) != 2 or
            not isinstance(data['station_location'], list) or len(data['station_location']) != 2):
            return jsonify({
                'success': False,
                'error': 'Locations must be arrays of [lat, lng]'
            }), 400
        
        # Calculate route using hardcoded A* algorithm
        route_data = route_service.get_route_to_station(
            data['user_location'], 
            data['station_location']
        )
        
        if not route_data['success']:
            return jsonify(route_data), 400
        
        # Add user context
        route_data['user_id'] = user_id
        route_data['booking_id'] = data.get('booking_id')
        
        # Verify booking belongs to user if booking_id provided
        if data.get('booking_id'):
            booking = Booking.find_by_booking_id(data['booking_id'])
            if booking and booking['user_id'] == user_id:
                route_data['booking_verified'] = True
                route_data['booking_details'] = booking
            else:
                route_data['booking_verified'] = False
        
        logger.info(f"Route calculated for user {user_id}: {route_data['metrics']['total_distance']}km")
        
        return jsonify(route_data)
        
    except Exception as e:
        logger.error(f"Error calculating route: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@recommendation_bp.route('/cancel-booking/<booking_id>', methods=['DELETE'])
@require_auth
def cancel_booking(booking_id):
    """
    Cancel a booking (only if it belongs to the authenticated user)
    """
    try:
        user_id = get_current_user_id()
        
        # Delete booking from database
        success = Booking.delete_booking(booking_id, user_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Booking {booking_id} cancelled successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Booking not found or you are not authorized to cancel it'
            }), 404
        
    except Exception as e:
        logger.error(f"Error cancelling booking: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500 