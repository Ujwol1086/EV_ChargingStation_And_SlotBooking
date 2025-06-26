from flask import Blueprint, request, jsonify
import json
import os
import logging
from services.Hybrid_Algorithm import HybridAlgorithm
from services.route_service import RouteService
from models.booking import Booking
from middleware.auth_middleware import require_auth, get_current_user_id
from models.user import User
from models.charging_station import ChargingStation

logger = logging.getLogger(__name__)

recommendation_bp = Blueprint('recommendations', __name__)

# Initialize services
hybrid_algorithm = HybridAlgorithm()
route_service = RouteService()

@recommendation_bp.route('/get-recommendations', methods=['POST'])
@recommendation_bp.route('/recommendations', methods=['POST'])
def get_recommendations():
    """Get EV charging station recommendations"""
    try:
        data = request.get_json()
        
        # Extract required fields - handle multiple location formats
        user_id = data.get('user_id')
        user_location = data.get('location')  # [lat, lon] format
        
        # Also check for separate latitude/longitude fields (frontend format)
        if not user_location:
            latitude = data.get('latitude')
            longitude = data.get('longitude')
            if latitude is not None and longitude is not None:
                user_location = [latitude, longitude]
        
        preferences = data.get('preferences', {})
        
        # Handle battery_percentage, plug_type, urgency_level from frontend
        battery_percentage = data.get('battery_percentage')
        plug_type = data.get('plug_type')
        urgency_level = data.get('urgency_level', 'medium')
        
        # Convert frontend preferences to standard format
        if battery_percentage is not None or plug_type or urgency_level:
            if not preferences:
                preferences = {}
            if battery_percentage is not None:
                preferences['battery_percentage'] = battery_percentage
            if plug_type:
                preferences['plug_type'] = plug_type
            if urgency_level:
                preferences['urgency_level'] = urgency_level
        
        if not user_location:
            return jsonify({
                'error': 'Missing required field: location (provide either "location" array or "latitude"/"longitude" fields)'
            }), 400
        
        # Log received data for debugging
        logger.info(f"Received location data: {user_location}, preferences: {preferences}")
        
        # Validate location format
        if not isinstance(user_location, list) or len(user_location) != 2:
            return jsonify({
                'error': 'Location must be a list of [latitude, longitude]'
            }), 400
        
        # Validate coordinates are numbers
        try:
            lat, lon = float(user_location[0]), float(user_location[1])
            if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
                return jsonify({
                    'error': 'Invalid coordinates: latitude must be between -90 and 90, longitude between -180 and 180'
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                'error': 'Location coordinates must be valid numbers'
            }), 400
        
        # Get user data (optional - proceed even if user not found)
        user = None
        if user_id:
            try:
                user = User.get_by_id(user_id)
                if user:
                    logger.info(f"Found user: {user_id}")
                else:
                    logger.warning(f"User not found: {user_id}, proceeding without user data")
            except Exception as user_error:
                logger.warning(f"Error looking up user {user_id}: {user_error}, proceeding without user data")
        
        # Get all charging stations
        try:
            stations = ChargingStation.get_all()
            if not stations:
                return jsonify({
                    'message': 'No charging stations available',
                    'recommendations': []
                }), 200
            
            logger.info(f"Loaded {len(stations)} charging stations")
        except Exception as stations_error:
            logger.error(f"Error loading charging stations: {stations_error}")
            return jsonify({
                'error': 'Failed to load charging stations data'
            }), 500
        
        # Prepare station data for algorithm
        # Note: ChargingStation.get_all() returns dictionaries, not objects
        station_data = []
        for station in stations:
            try:
                station_info = {
                    'id': station.get('id'),
                    'name': station.get('name'),
                    'location': [station.get('latitude', 0), station.get('longitude', 0)],
                    'availability': station.get('available_slots', 0),
                    'total_slots': station.get('total_slots', 0),
                    'connector_types': station.get('connector_types', []),
                    'pricing': station.get('pricing_per_kwh', 15),
                    'features': station.get('features', []),
                    'rating': station.get('rating', 4.0),
                    'distance': 0  # Will be calculated by algorithm
                }
                station_data.append(station_info)
            except Exception as station_error:
                logger.warning(f"Error processing station {station.get('id', 'unknown')}: {station_error}")
                continue
        
        if not station_data:
            return jsonify({
                'error': 'No valid station data available'
            }), 500
        
        # Get recommendations using hybrid algorithm
        try:
            recommendations = hybrid_algorithm.get_recommendations(
                user_location=user_location,
                stations=station_data,
                user_preferences=preferences,
                max_recommendations=5
            )
            
            logger.info(f"Generated {len(recommendations)} initial recommendations")
        except Exception as algo_error:
            logger.error(f"Error generating recommendations: {algo_error}")
            return jsonify({
                'error': 'Failed to generate recommendations'
            }), 500
        
        # Get routes for top recommendations
        enhanced_recommendations = []
        for rec in recommendations[:3]:  # Get routes for top 3 only
            try:
                station_location = rec['location']
                route_info = route_service.get_route_to_station(user_location, station_location)
                
                if route_info['success']:
                    rec['route'] = {
                        'waypoints': route_info['waypoints'],
                        'distance_km': route_info['metrics']['total_distance'],
                        'estimated_time': route_info['metrics']['estimated_time'],
                        'instructions': route_info['instructions'],
                        'algorithm_used': route_info.get('algorithm_used', 'unknown')
                    }
                else:
                    rec['route'] = {
                        'error': 'Route calculation failed',
                        'distance_km': rec['distance'],
                        'estimated_time': 'Unknown'
                    }
                    
            except Exception as route_error:
                logger.error(f"Route calculation error for station {rec['id']}: {route_error}")
                rec['route'] = {
                    'error': 'Route calculation error',
                    'distance_km': rec['distance'],
                    'estimated_time': 'Unknown'
                }
            
            enhanced_recommendations.append(rec)
        
        # Add remaining recommendations without detailed routes
        for rec in recommendations[3:]:
            rec['route'] = {
                'distance_km': rec['distance'],
                'estimated_time': 'Estimate unavailable'
            }
            enhanced_recommendations.append(rec)
        
        logger.info(f"Generated {len(enhanced_recommendations)} final recommendations for user {user_id or 'anonymous'}")
        
        return jsonify({
            'success': True,
            'user_location': user_location,
            'user_found': user is not None,
            'recommendations': enhanced_recommendations,
            'algorithm_info': {
                'type': 'hybrid_algorithm',
                'factors_considered': ['distance', 'availability', 'load_balancing', 'user_preferences'],
                'routing_method': 'osrm_api_with_fallback'
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        return jsonify({
            'error': 'Internal server error while generating recommendations'
        }), 500

@recommendation_bp.route('/route', methods=['POST'])
def get_route():
    """Get route information between two points"""
    try:
        data = request.get_json()
        
        start_location = data.get('start_location')  # [lat, lon]
        end_location = data.get('end_location')      # [lat, lon]
        
        if not all([start_location, end_location]):
            return jsonify({
                'error': 'Missing required fields: start_location, end_location'
            }), 400
        
        # Validate location formats
        for loc_name, location in [('start_location', start_location), ('end_location', end_location)]:
            if not isinstance(location, list) or len(location) != 2:
                return jsonify({
                    'error': f'{loc_name} must be a list of [latitude, longitude]'
                }), 400
        
        # Get route using route service
        route_info = route_service.get_route_to_station(start_location, end_location)
        
        if route_info['success']:
            return jsonify({
                'success': True,
                'route': route_info
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': route_info.get('error', 'Route calculation failed')
            }), 500
            
    except Exception as e:
        logger.error(f"Error calculating route: {e}")
        return jsonify({
            'error': 'Internal server error while calculating route'
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
                distance_to_station = route_service.haversine_distance(
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