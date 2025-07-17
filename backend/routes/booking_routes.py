from flask import Blueprint, request, jsonify
import logging
from models.booking import Booking
from models.charging_station import ChargingStation
from middleware.auth_middleware import require_auth, get_current_user_id

logger = logging.getLogger(__name__)

booking_bp = Blueprint('bookings', __name__)

@booking_bp.route('/<booking_id>', methods=['GET'])
@require_auth
def get_booking_details(booking_id):
    """
    Get detailed information about a specific booking
    """
    try:
        logger.info(f"Getting booking details for: {booking_id}")
        
        # Get booking details
        booking = Booking.find_by_booking_id(booking_id)
        
        if not booking:
            logger.warning(f"Booking not found: {booking_id}")
            return jsonify({
                'success': False,
                'error': 'Booking not found'
            }), 404
        
        # Verify booking belongs to current user
        current_user_id = get_current_user_id()
        if booking.get('user_id') != current_user_id:
            logger.warning(f"Unauthorized access to booking {booking_id} by user {current_user_id}")
            return jsonify({
                'success': False,
                'error': 'Unauthorized access to booking'
            }), 403
        
        # Get station details
        station = None
        if booking.get('station_id'):
            station = ChargingStation.get_by_id(booking.get('station_id'))
            if not station:
                logger.warning(f"Station {booking.get('station_id')} not found for booking {booking_id}")
                # Create a fallback station object for missing stations
                station = {
                    'id': booking.get('station_id'),
                    'name': f"Station {booking.get('station_id')}",
                    'location': {
                        'address': 'Location not available',
                        'coordinates': [0, 0]
                    },
                    'chargers': [],
                    'amenities': [],
                    'operatingHours': 'Unknown',
                    'pricing': 'Contact for pricing',
                    'telephone': 'N/A'
                }
        
        logger.info(f"Successfully retrieved booking details for: {booking_id}")
        
        return jsonify({
            'success': True,
            'booking': booking,
            'station': station
        })
        
    except Exception as e:
        logger.error(f"Error getting booking details for {booking_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@booking_bp.route('/<booking_id>', methods=['DELETE'])
@require_auth
def cancel_booking(booking_id):
    """
    Cancel a booking (only if it belongs to the current user)
    """
    try:
        logger.info(f"Cancelling booking: {booking_id}")
        
        current_user_id = get_current_user_id()
        
        # Try to delete the booking
        result = Booking.delete_booking(booking_id, current_user_id)
        
        if result:
            logger.info(f"Booking {booking_id} cancelled successfully")
            return jsonify({
                'success': True,
                'message': 'Booking cancelled successfully'
            })
        else:
            logger.warning(f"Failed to cancel booking {booking_id} - not found or unauthorized")
            return jsonify({
                'success': False,
                'error': 'Booking not found or unauthorized'
            }), 404
        
    except Exception as e:
        logger.error(f"Error cancelling booking {booking_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@booking_bp.route('/<booking_id>/status', methods=['PUT'])
@require_auth
def update_booking_status(booking_id):
    """
    Update booking status (only if it belongs to the current user)
    """
    try:
        if not request.json:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        data = request.json
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({
                'success': False,
                'error': 'Status is required'
            }), 400
        
        logger.info(f"Updating booking {booking_id} status to {new_status}")
        
        # Update booking status
        result = Booking.update_booking_status(booking_id, new_status)
        
        if result:
            logger.info(f"Booking {booking_id} status updated successfully")
            return jsonify({
                'success': True,
                'message': 'Booking status updated successfully'
            })
        else:
            logger.warning(f"Failed to update booking {booking_id} status")
            return jsonify({
                'success': False,
                'error': 'Booking not found'
            }), 404
        
    except Exception as e:
        logger.error(f"Error updating booking {booking_id} status: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@booking_bp.route('/pending-payments', methods=['GET'])
@require_auth
def get_pending_payments():
    """
    Get all bookings that require payment for the current user
    """
    try:
        user_id = get_current_user_id()
        
        bookings = Booking.get_pending_payment_bookings_for_user(user_id)
        
        return jsonify({
            'success': True,
            'pending_payments': bookings,
            'count': len(bookings)
        })
        
    except Exception as e:
        logger.error(f"Error getting pending payments: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500 