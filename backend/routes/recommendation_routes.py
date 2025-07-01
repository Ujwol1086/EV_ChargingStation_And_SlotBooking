from flask import Blueprint, request, jsonify
import json
import os
import logging
import time
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
@recommendation_bp.route('/enhanced', methods=['POST'])
def get_recommendations():
    """Get EV charging station recommendations with enhanced context-aware scoring"""
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
        
        # Enhanced context parameters
        battery_percentage = data.get('battery_percentage')
        plug_type = data.get('plug_type')
        urgency_level = data.get('urgency_level', 'medium')
        
        # NEW: Context-aware parameters
        ac_status = data.get('ac_status', False)
        passengers = data.get('passengers', 1)
        terrain = data.get('terrain', 'flat')
        
        # NEW: Destination-based filtering
        destination_city = data.get('destination_city')
        max_detour_km = data.get('max_detour_km', 20)  # Maximum detour for route filtering
        
        # Build user context object
        user_context = {}
        if preferences:
            user_context.update(preferences)
        
        # Add context parameters
        context_params = {
            'battery_percentage': battery_percentage,
            'plug_type': plug_type,
            'urgency': urgency_level,
            'ac_status': ac_status,
            'passengers': passengers,
            'terrain': terrain,
            'destination_city': destination_city,
            'max_detour_km': max_detour_km
        }
        
        # Only add non-None values
        for key, value in context_params.items():
            if value is not None:
                user_context[key] = value
        
        if not user_location:
            return jsonify({
                'error': 'Missing required field: location (provide either "location" array or "latitude"/"longitude" fields)'
            }), 400
        
        # Log received data for debugging
        logger.info(f"Received enhanced context: location={user_location}, context={user_context}")
        
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
        
        # Validate context parameters
        if battery_percentage is not None:
            try:
                battery_percentage = float(battery_percentage)
                if not (0 <= battery_percentage <= 100):
                    return jsonify({'error': 'Battery percentage must be between 0 and 100'}), 400
                user_context['battery_percentage'] = battery_percentage
            except (ValueError, TypeError):
                return jsonify({'error': 'Battery percentage must be a valid number'}), 400
        
        if passengers is not None:
            try:
                passengers = int(passengers)
                if not (1 <= passengers <= 8):
                    return jsonify({'error': 'Number of passengers must be between 1 and 8'}), 400
                user_context['passengers'] = passengers
            except (ValueError, TypeError):
                return jsonify({'error': 'Number of passengers must be a valid integer'}), 400
        
        if terrain and terrain.lower() not in ['flat', 'hilly', 'steep']:
            return jsonify({'error': 'Terrain must be one of: flat, hilly, steep'}), 400
        
        # Validate destination city if provided
        if destination_city:
            if not isinstance(destination_city, str) or len(destination_city.strip()) == 0:
                return jsonify({'error': 'Destination city must be a non-empty string'}), 400
            
            # Check if city is supported (optional validation)
            city_coords = hybrid_algorithm.get_city_coordinates(destination_city)
            if not city_coords:
                return jsonify({
                    'error': f'Destination city "{destination_city}" not found. Supported cities: {", ".join(hybrid_algorithm.city_coords.keys())}'
                }), 400
        
        # Validate max detour distance
        if max_detour_km is not None:
            try:
                max_detour_km = float(max_detour_km)
                if not (1 <= max_detour_km <= 100):
                    return jsonify({'error': 'Maximum detour distance must be between 1 and 100 km'}), 400
                user_context['max_detour_km'] = max_detour_km
            except (ValueError, TypeError):
                return jsonify({'error': 'Maximum detour distance must be a valid number'}), 400
        
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
        station_data = []
        for station in stations:
            try:
                # Get real-time availability for the station
                availability_info = Booking.get_station_real_time_availability(station.get('id'))
                
                station_info = {
                    'id': station.get('id'),
                    'name': station.get('name'),
                    'location': [station.get('latitude', 0), station.get('longitude', 0)],
                    'availability': availability_info.get('available_slots', 0),
                    'total_slots': availability_info.get('total_slots', 0),
                    'active_bookings': availability_info.get('active_bookings', 0),
                    'connector_types': station.get('connector_types', []),
                    'pricing': station.get('pricing_per_kwh', 15),
                    'features': station.get('features', []),
                    'rating': station.get('rating', 4.0),
                    'distance': 0,  # Will be calculated by algorithm
                    'chargers': station.get('chargers', [])  # Include charger details
                }
                station_data.append(station_info)
            except Exception as station_error:
                logger.warning(f"Error processing station {station.get('id', 'unknown')}: {station_error}")
                continue
        
        if not station_data:
            return jsonify({
                'error': 'No valid station data available'
            }), 500
        
        # Get enhanced recommendations using hybrid algorithm
        try:
            # Check if we should use enhanced recommendations
            use_enhanced = any(key in user_context for key in ['ac_status', 'passengers', 'terrain', 'battery_percentage', 'destination_city'])
            
            if use_enhanced:
                result = hybrid_algorithm.get_enhanced_recommendations(
                    user_location=user_location,
                    stations=station_data,
                    user_context=user_context,
                    max_recommendations=5
                )
                # Extract recommendations from the result dictionary
                if isinstance(result, dict) and 'recommendations' in result:
                    recommendations = result['recommendations']
                else:
                    recommendations = result
                logger.info(f"Generated {len(recommendations)} enhanced recommendations")
            else:
                # Fall back to simple recommendations for backward compatibility
                recommendations = hybrid_algorithm.get_recommendations(
                    user_location=user_location,
                    stations=station_data,
                    user_preferences=user_context,
                    max_recommendations=5
                )
                logger.info(f"Generated {len(recommendations)} simple recommendations")
                
        except Exception as algo_error:
            logger.error(f"Error generating recommendations: {algo_error}")
            return jsonify({
                'error': 'Failed to generate recommendations'
            }), 500
        
        # Ensure recommendations is a list
        if not isinstance(recommendations, list):
            logger.error(f"Recommendations is not a list: {type(recommendations)}")
            return jsonify({
                'error': 'Invalid recommendations format'
            }), 500
        
        # Get routes for top recommendations
        enhanced_recommendations = []
        top_recommendations = recommendations[:3] if len(recommendations) > 3 else recommendations
        
        for rec in top_recommendations:  # Get routes for top 3 only
            try:
                # Add real-time availability info to each recommendation
                station_id = rec.get('id')
                if station_id:
                    # Get availability for specific charger types if plug_type is specified
                    if plug_type:
                        availability_info = Booking.get_station_real_time_availability(station_id, plug_type)
                        rec['charger_availability'] = {
                            plug_type: {
                                'available_slots': availability_info.get('available_slots', 0),
                                'total_slots': availability_info.get('total_slots', 0),
                                'active_bookings': availability_info.get('active_bookings', 0)
                            }
                        }
                    else:
                        # Get availability for all charger types
                        rec['charger_availability'] = {}
                        for charger_type in rec.get('connector_types', []):
                            availability_info = Booking.get_station_real_time_availability(station_id, charger_type)
                            rec['charger_availability'][charger_type] = {
                                'available_slots': availability_info.get('available_slots', 0),
                                'total_slots': availability_info.get('total_slots', 0),
                                'active_bookings': availability_info.get('active_bookings', 0)
                            }
                
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
        
        # Add remaining recommendations without detailed routes but with availability
        remaining_recommendations = recommendations[3:] if len(recommendations) > 3 else []
        for rec in remaining_recommendations:
            # Add availability info for remaining recommendations too
            station_id = rec.get('id')
            if station_id:
                if plug_type:
                    availability_info = Booking.get_station_real_time_availability(station_id, plug_type)
                    rec['charger_availability'] = {
                        plug_type: {
                            'available_slots': availability_info.get('available_slots', 0),
                            'total_slots': availability_info.get('total_slots', 0),
                            'active_bookings': availability_info.get('active_bookings', 0)
                        }
                    }
                else:
                    rec['charger_availability'] = {}
                    for charger_type in rec.get('connector_types', []):
                        availability_info = Booking.get_station_real_time_availability(station_id, charger_type)
                        rec['charger_availability'][charger_type] = {
                            'available_slots': availability_info.get('available_slots', 0),
                            'total_slots': availability_info.get('total_slots', 0),
                            'active_bookings': availability_info.get('active_bookings', 0)
                        }
            
            rec['route'] = {
                'distance_km': rec['distance'],
                'estimated_time': 'Estimate unavailable'
            }
            enhanced_recommendations.append(rec)
        
        logger.info(f"Generated {len(enhanced_recommendations)} final recommendations for user {user_id or 'anonymous'}")
        
        return jsonify({
            'success': True,
            'user_location': user_location,
            'user_context': user_context,
            'user_found': user is not None,
            'recommendations': enhanced_recommendations,
            'algorithm_info': {
                'type': 'enhanced_hybrid' if use_enhanced else 'simple_hybrid',
                'factors_considered': list(user_context.keys()),
                'total_stations_analyzed': len(station_data),
                'recommendations_returned': len(enhanced_recommendations)
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Unexpected error in get_recommendations: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
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
        "user_location": [lat, lng] (optional),
        "preferred_date": str (optional, YYYY-MM-DD),
        "preferred_time": str (optional, HH:MM)
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
        
        # Check if this is a time-based booking
        preferred_date = data.get('preferred_date')
        preferred_time = data.get('preferred_time')
        
        if preferred_date and preferred_time:
            # Use time-based booking
            booking_data = {
                'booking_id': f"TIMED_{data['station_id']}_{user_id}_{int(time.time())}",
                'power': data.get('power', 'Unknown'),
                'estimated_time': data.get('estimated_time', '1 hour'),
                'auto_booked': False,
                'booking_duration': data.get('booking_duration', 60),
                'station_details': data.get('station_details', {}),
                'user_location': data.get('user_location', []),
                'distance_to_station': 0,
                'urgency_level': data.get('urgency_level', 'medium'),
                'plug_type': data.get('plug_type', data['charger_type'])
            }
            
            # Calculate distance if user location provided
            if 'user_location' in data and 'station_details' in data:
                station_coords = data['station_details'].get('location', {}).get('coordinates', [])
                if len(station_coords) == 2:
                    distance_to_station = route_service.haversine_distance(
                        data['user_location'][0], data['user_location'][1],
                        station_coords[0], station_coords[1]
                    )
                    booking_data['distance_to_station'] = round(distance_to_station, 2)
            
            # Create timed booking
            result = Booking.create_timed_booking(
                user_id=user_id,
                station_id=data['station_id'],
                charger_type=data['charger_type'],
                booking_date=preferred_date,
                booking_time=preferred_time,
                booking_data=booking_data
            )
            
            if not result['success']:
                return jsonify(result), 400
            
            booking = result['booking']
            
            response = {
                'success': True,
                'booking': {
                    'booking_id': booking_data['booking_id'],
                    'database_id': booking['_id'],
                    'station_id': data['station_id'],
                    'charger_type': data['charger_type'],
                    'booking_date': preferred_date,
                    'booking_time': preferred_time,
                    'status': 'confirmed',
                    'estimated_duration': booking_data['booking_duration'],
                    'distance_to_station': booking_data['distance_to_station'],
                    'user_id': user_id
                }
            }
            
            logger.info(f"Timed booking created for user {user_id}: {booking_data['booking_id']}")
            
        else:
            # Generate booking ID
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
                'distance_to_station': round(distance_to_station, 2),
                'urgency_level': data.get('urgency_level', 'medium'),
                'plug_type': data.get('plug_type', data['charger_type'])
            }
            
            # Store booking in database using original method
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

@recommendation_bp.route('/route-to-city', methods=['POST'])
def get_route_recommendations():
    """Get EV charging station recommendations along route to destination city"""
    try:
        data = request.get_json()
        
        # Extract required fields
        user_location = data.get('location')
        destination_city = data.get('destination_city')
        
        # Also check for separate latitude/longitude fields
        if not user_location:
            latitude = data.get('latitude')
            longitude = data.get('longitude')
            if latitude is not None and longitude is not None:
                user_location = [latitude, longitude]
        
        # Validate required fields
        if not user_location:
            return jsonify({
                'error': 'Missing required field: location (provide either "location" array or "latitude"/"longitude" fields)'
            }), 400
        
        # destination_city is now optional
        # if not destination_city:
        #     return jsonify({
        #         'error': 'Missing required field: destination_city'
        #     }), 400
        
        # Validate location format
        if not isinstance(user_location, list) or len(user_location) != 2:
            return jsonify({
                'error': 'Location must be a list of [latitude, longitude]'
            }), 400
        
        # Validate coordinates
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
        
        # Validate destination city if provided
        city_coords = None
        if destination_city and isinstance(destination_city, str) and len(destination_city.strip()) > 0:
            # Check if city is supported
            city_coords = hybrid_algorithm.get_city_coordinates(destination_city)
            if not city_coords:
                return jsonify({
                    'error': f'Destination city "{destination_city}" not found',
                    'supported_cities': list(hybrid_algorithm.city_coords.keys())
                }), 400
        else:
            # No destination city provided - this is now allowed
            destination_city = None
        
        # Validate terrain parameter
        terrain = data.get('terrain', 'flat')
        if terrain not in ['flat', 'hilly', 'steep']:
            return jsonify({
                'error': 'Invalid terrain. Must be one of: flat, hilly, steep'
            }), 400
        
        # Validate max_detour_km parameter
        max_detour_km = data.get('max_detour_km', 20)
        try:
            max_detour_km = float(max_detour_km)
            if not (1 <= max_detour_km <= 100):
                return jsonify({
                    'error': 'max_detour_km must be between 1 and 100 km'
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                'error': 'max_detour_km must be a valid number'
            }), 400
        
        # Extract optional parameters with defaults optimized for route travel
        battery_percentage = data.get('battery_percentage', 50)
        plug_type = data.get('plug_type', '')
        urgency_level = data.get('urgency_level', 'medium')
        ac_status = data.get('ac_status', True)  # Default AC on for long trips
        passengers = data.get('passengers', 2)   # Default 2 passengers for trips
        
        # Build user context for route-based recommendations
        user_context = {
            'battery_percentage': battery_percentage,
            'plug_type': plug_type,
            'urgency': urgency_level,
            'ac_status': ac_status,
            'passengers': passengers,
            'terrain': terrain,
            'max_detour_km': max_detour_km,
            'route_mode': True  # Flag to indicate this is route-based
        }
        
        # Add destination info if provided
        if destination_city and city_coords:
            user_context['destination_city'] = destination_city
            logger.info(f"Route-based recommendations requested: {user_location} → {destination_city}")
        else:
            logger.info(f"Route-based recommendations requested from: {user_location} (no specific destination)")
        
        # Get all charging stations
        try:
            stations = ChargingStation.get_all()
            if not stations:
                return jsonify({
                    'message': 'No charging stations available',
                    'recommendations': []
                }), 200
        except Exception as stations_error:
            logger.error(f"Error loading charging stations: {stations_error}")
            return jsonify({
                'error': 'Failed to load charging stations data'
            }), 500
        
        # Check if enhanced recommendations should be used
        context_params = ['ac_status', 'passengers', 'terrain', 'battery_percentage']
        if destination_city:
            context_params.append('destination_city')
        use_enhanced = any(key in user_context for key in context_params)
        
        # Get enhanced recommendations with route filtering
        try:
            result = hybrid_algorithm.get_enhanced_recommendations(
                user_location=user_location,
                stations=stations,
                user_context=user_context,
                max_recommendations=5  # More recommendations when no specific destination
            )
            
            if isinstance(result, dict) and 'recommendations' in result:
                recommendations = result['recommendations']
                algorithm_info = result['algorithm_info']
            else:
                recommendations = result
                algorithm_info = {}
                
            logger.info(f"Generated {len(recommendations)} route-based recommendations")
            
        except Exception as algo_error:
            logger.error(f"Error generating route recommendations: {algo_error}")
            return jsonify({
                'error': 'Failed to generate route recommendations'
            }), 500
        
        # Build response
        response_data = {
            'success': True,
            'recommendations': recommendations,
            'algorithm_info': algorithm_info,
            'user_context': user_context
        }
        
        # Add route info if destination is specified
        if destination_city and city_coords:
            response_data['route_info'] = {
                'origin': user_location,
                'destination_city': destination_city,
                'destination_coords': city_coords,
                'direct_distance_km': round(hybrid_algorithm.haversine_distance(
                    user_location[0], user_location[1], city_coords[0], city_coords[1]
                ), 2)
            }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Unexpected error in route recommendations: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@recommendation_bp.route('/cities', methods=['GET'])
def get_supported_cities():
    """Get list of supported cities for destination-based recommendations"""
    try:
        cities = list(hybrid_algorithm.city_coords.keys())
        cities_with_coords = [
            {
                'name': city,
                'coordinates': hybrid_algorithm.city_coords[city]
            }
            for city in sorted(cities)
        ]
        
        return jsonify({
            'success': True,
            'cities': cities_with_coords,
            'total_cities': len(cities)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting supported cities: {e}")
        return jsonify({
            'error': 'Internal server error'
        }), 500

@recommendation_bp.route('/check-slot-availability', methods=['POST'])
def check_slot_availability():
    """
    Check slot availability for a specific station, charger type, date and time
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        station_id = data.get('station_id')
        charger_type = data.get('charger_type')
        booking_date = data.get('booking_date')
        booking_time = data.get('booking_time')
        
        if not all([station_id, charger_type, booking_date, booking_time]):
            return jsonify({
                'success': False,
                'error': 'Missing required fields: station_id, charger_type, booking_date, booking_time'
            }), 400
        
        # Check availability
        availability = Booking.check_slot_availability(station_id, charger_type, booking_date, booking_time)
        
        return jsonify({
            'success': True,
            'availability': availability
        })
        
    except Exception as e:
        logger.error(f"Error checking slot availability: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@recommendation_bp.route('/get-time-slots', methods=['POST'])
def get_available_time_slots():
    """
    Get all available time slots for a specific station, charger type and date
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        station_id = data.get('station_id')
        charger_type = data.get('charger_type')
        booking_date = data.get('booking_date')
        
        if not all([station_id, charger_type, booking_date]):
            return jsonify({
                'success': False,
                'error': 'Missing required fields: station_id, charger_type, booking_date'
            }), 400
        
        # Get time slots
        time_slots = Booking.get_available_time_slots(station_id, charger_type, booking_date)
        
        return jsonify({
            'success': True,
            'time_slots': time_slots,
            'total_slots': len(time_slots),
            'available_slots': len([slot for slot in time_slots if slot['available']])
        })
        
    except Exception as e:
        logger.error(f"Error getting time slots: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@recommendation_bp.route('/auto-book-slot', methods=['POST'])
@require_auth
def auto_book_charging_slot():
    """
    Automatically book a charging slot with specific date and time
    """
    try:
        user_id = get_current_user_id()
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        # Validate required fields
        required_fields = ['station_id', 'charger_type', 'booking_date', 'booking_time']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        station_id = data['station_id']
        charger_type = data['charger_type']
        booking_date = data['booking_date']
        booking_time = data['booking_time']
        
        # Generate booking ID
        booking_id = f"AUTO_{station_id}_{user_id}_{int(time.time())}"
        
        # Prepare booking data
        booking_data = {
            'booking_id': booking_id,
            'power': data.get('power', 'Unknown'),
            'estimated_time': data.get('estimated_time', '1 hour'),
            'auto_booked': True,
            'booking_duration': data.get('booking_duration', 60),
            'station_details': data.get('station_details', {}),
            'user_location': data.get('user_location', []),
            'distance_to_station': data.get('distance_to_station', 0),
            'urgency_level': data.get('urgency_level', 'medium'),
            'plug_type': data.get('plug_type', charger_type)
        }
        
        # Create timed booking
        result = Booking.create_timed_booking(
            user_id=user_id,
            station_id=station_id,
            charger_type=charger_type,
            booking_date=booking_date,
            booking_time=booking_time,
            booking_data=booking_data
        )
        
        if not result['success']:
            return jsonify(result), 400
        
        booking = result['booking']
        
        response = {
            'success': True,
            'booking': {
                'booking_id': booking_id,
                'database_id': booking['_id'],
                'station_id': station_id,
                'charger_type': charger_type,
                'booking_date': booking_date,
                'booking_time': booking_time,
                'status': 'confirmed',
                'auto_booked': True,
                'estimated_duration': booking_data['booking_duration'],
                'distance_to_station': booking_data['distance_to_station'],
                'user_id': user_id
            }
        }
        
        logger.info(f"Auto booking created for user {user_id}: {booking_id}")
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error in auto_book_charging_slot: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@recommendation_bp.route('/instant-book', methods=['POST'])
@require_auth
def instant_book_charging_slot():
    """
    Instantly book a charging slot for high urgency situations
    This endpoint checks real-time availability and books immediately if available
    """
    try:
        user_id = get_current_user_id()
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        # Validate required fields
        required_fields = ['station_id', 'charger_type']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        station_id = data['station_id']
        charger_type = data['charger_type']
        urgency_level = data.get('urgency_level', 'high')
        
        # Generate booking ID
        booking_id = f"INSTANT_{station_id}_{user_id}_{int(time.time())}"
        
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
            'estimated_time': data.get('estimated_time', '1 hour'),
            'auto_booked': True,
            'booking_duration': data.get('booking_duration', 60),
            'station_details': data.get('station_details', {}),
            'user_location': data.get('user_location', []),
            'distance_to_station': round(distance_to_station, 2),
            'urgency_level': urgency_level,
            'plug_type': data.get('plug_type', charger_type)
        }
        
        # Create instant booking using the new method
        result = Booking.create_instant_booking(
            user_id=user_id,
            station_id=station_id,
            charger_type=charger_type,
            booking_data=booking_data
        )
        
        if not result['success']:
            return jsonify(result), 400
        
        booking = result['booking']
        
        response = {
            'success': True,
            'booking': {
                'booking_id': booking_id,
                'database_id': booking['_id'],
                'station_id': station_id,
                'charger_type': charger_type,
                'booking_date': booking.get('booking_date'),
                'booking_time': booking.get('booking_time'),
                'status': 'confirmed',
                'instant_booking': True,
                'urgency_level': urgency_level,
                'estimated_duration': booking_data['booking_duration'],
                'distance_to_station': booking_data['distance_to_station'],
                'user_id': user_id
            }
        }
        
        logger.info(f"Instant booking created for user {user_id}: {booking_id}")
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error in instant_book_charging_slot: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@recommendation_bp.route('/check-availability', methods=['POST'])
def check_real_time_availability():
    """
    Check real-time availability for a station and charger type
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        station_id = data.get('station_id')
        charger_type = data.get('charger_type')  # Optional
        
        if not station_id:
            return jsonify({
                'success': False,
                'error': 'Station ID is required'
            }), 400
        
        # Get real-time availability
        availability_info = Booking.get_station_real_time_availability(station_id, charger_type)
        
        return jsonify({
            'success': True,
            'station_id': station_id,
            'charger_type': charger_type,
            'availability': availability_info
        })
        
    except Exception as e:
        logger.error(f"Error checking availability: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500 