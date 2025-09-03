from flask import Blueprint, jsonify, request, make_response
from models.user import User
from models.booking import Booking
from models.charging_station import ChargingStation
from config.database import mongo
from bson import ObjectId
from datetime import datetime, timedelta
import logging
from middleware.admin_middleware import require_admin

logger = logging.getLogger(__name__)
admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# Remove custom CORS handling - let Flask-CORS handle it

# Flask-CORS will handle CORS preflight requests automatically

@admin_bp.route('/stats', methods=['GET'])
@require_admin
def get_admin_stats():
    """Get admin dashboard statistics"""
    try:
        # Get total stations
        stations = ChargingStation.get_all()
        total_stations = len(stations)
        
        # Get total users
        total_users = mongo.db.users.count_documents({})
        
        # Get total bookings
        total_bookings = mongo.db.bookings.count_documents({})
        
        # Get active bookings (confirmed or in_progress)
        active_bookings = mongo.db.bookings.count_documents({
            "status": {"$in": ["confirmed", "in_progress"]}
        })
        
        # Calculate total revenue from completed bookings
        completed_bookings = mongo.db.bookings.find({"status": "completed"})
        total_revenue = sum(booking.get('total_cost', 0) for booking in completed_bookings)
        
        # Calculate average rating from stations
        station_ratings = [station.get('rating', 0) for station in stations if station.get('rating')]
        average_rating = sum(station_ratings) / len(station_ratings) if station_ratings else 0
        
        return jsonify({
            'success': True,
            'stats': {
                'totalStations': total_stations,
                'totalUsers': total_users,
                'totalBookings': total_bookings,
                'activeBookings': active_bookings,
                'revenue': total_revenue,
                'averageRating': round(average_rating, 1)
            }
        })
    except Exception as e:
        logger.error(f"Error getting admin stats: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/stations', methods=['GET'])
@require_admin
def get_admin_stations():
    """Get all stations for admin management"""
    try:
        stations = ChargingStation.get_all()
        
        # Format stations for admin view
        formatted_stations = []
        for station in stations:
            formatted_station = {
                'id': station.get('id'),
                'name': station.get('name'),
                'company': station.get('company', 'Independent'),
                'latitude': station.get('latitude', 0),
                'longitude': station.get('longitude', 0),
                'address': station.get('address', ''),
                'available_slots': station.get('available_slots', 0),
                'total_slots': station.get('total_slots', 0),
                'pricing_per_kwh': station.get('pricing_per_kwh', 0),
                'rating': station.get('rating', 0),
                'status': station.get('status', 'active'),
                'connector_types': station.get('connector_types', []),
                'features': station.get('features', []),
                'operating_hours': station.get('operating_hours', '24/7')
            }
            formatted_stations.append(formatted_station)
        
        return jsonify({
            'success': True,
            'stations': formatted_stations
        })
    except Exception as e:
        logger.error(f"Error getting admin stations: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/stations', methods=['POST'])
@require_admin
def create_station():
    """Create a new charging station"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['name', 'address', 'latitude', 'longitude', 'total_slots', 'pricing_per_kwh']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'{field} is required'}), 400
        
        # Format station data
        station_data = {
            'id': f"cs{str(mongo.db.charging_stations.count_documents({}) + 1).zfill(3)}",
            'name': data['name'],
            'company': data.get('company', 'Independent'),
            'latitude': float(data['latitude']),
            'longitude': float(data['longitude']),
            'address': data['address'],
            'total_slots': int(data['total_slots']),
            'available_slots': int(data['total_slots']),  # Initially all slots are available
            'pricing_per_kwh': float(data['pricing_per_kwh']),
            'connector_types': data.get('connector_types', ['Type 2']),
            'features': data.get('features', []),
            'operating_hours': data.get('operating_hours', '24/7'),
            'status': data.get('status', 'active'),
            'rating': 4.0,  # Default rating
            'chargers': [],
            'photos': [],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Create chargers based on total slots
        for i in range(int(data['total_slots'])):
            station_data['chargers'].append({
                'type': data.get('connector_types', ['Type 2'])[0] if data.get('connector_types') else 'Type 2',
                'power': '22kW',  # Default power
                'available': True,
                'connector_id': f"{station_data['id']}_charger_{i+1}"
            })
        
        # Insert into database
        result = mongo.db.charging_stations.insert_one(station_data)
        
        if result.inserted_id:
            logger.info(f"Created new station: {station_data['name']} with ID: {station_data['id']}")
            return jsonify({
                'success': True,
                'message': 'Station created successfully',
                'station_id': station_data['id']
            })
        else:
            return jsonify({'success': False, 'error': 'Failed to create station'}), 500
            
    except Exception as e:
        logger.error(f"Error creating station: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500



@admin_bp.route('/users', methods=['GET'])
@require_admin
def get_admin_users():
    """Get all users for admin management"""
    try:
        users = list(mongo.db.users.find())
        
        # Format users for admin view
        formatted_users = []
        for user in users:
            # Get user's booking statistics
            user_id = str(user['_id'])
            total_bookings = mongo.db.bookings.count_documents({"user_id": ObjectId(user_id)})
            
            # Calculate total spent from completed bookings
            completed_bookings = mongo.db.bookings.find({
                "user_id": ObjectId(user_id),
                "status": "completed"
            })
            total_spent = sum(booking.get('total_cost', 0) for booking in completed_bookings)
            
            # Handle datetime fields safely
            created_at = user.get('created_at')
            if created_at and hasattr(created_at, 'isoformat'):
                created_at_str = created_at.isoformat()
            else:
                created_at_str = datetime.utcnow().isoformat()
            
            last_login = user.get('last_login')
            if last_login and hasattr(last_login, 'isoformat'):
                last_login_str = last_login.isoformat()
            else:
                last_login_str = datetime.utcnow().isoformat()
            
            formatted_user = {
                '_id': user_id,
                'username': user.get('username', ''),
                'email': user.get('email', ''),
                'role': user.get('role', 'user'),
                'status': user.get('status', 'active'),
                'created_at': created_at_str,
                'last_login': last_login_str,
                'total_bookings': total_bookings,
                'total_spent': total_spent
            }
            formatted_users.append(formatted_user)
        
        return jsonify({
            'success': True,
            'users': formatted_users
        })
    except Exception as e:
        logger.error(f"Error getting admin users: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/bookings', methods=['GET'])
@require_admin
def get_admin_bookings():
    """Get all bookings for admin management"""
    try:
        bookings = list(mongo.db.bookings.find().sort("created_at", -1))
        
        # Format bookings for admin view
        formatted_bookings = []
        for booking in bookings:
            # Get user details
            user = mongo.db.users.find_one({"_id": ObjectId(booking.get('user_id'))})
            user_details = {
                'username': user.get('username', 'Unknown') if user else 'Unknown',
                'email': user.get('email', 'Unknown') if user else 'Unknown'
            }
            
            # Get station details
            station = ChargingStation.get_by_id(booking.get('station_id'))
            station_details = {
                'name': station.get('name', 'Unknown Station') if station else 'Unknown Station',
                'address': station.get('address', 'Unknown Address') if station else 'Unknown Address'
            }
            
            # Handle datetime fields safely
            created_at = booking.get('created_at')
            if created_at and hasattr(created_at, 'isoformat'):
                created_at_str = created_at.isoformat()
            else:
                created_at_str = datetime.utcnow().isoformat()
            
            # Handle charging_completed_at datetime
            charging_completed_at = booking.get('charging_completed_at')
            if charging_completed_at and hasattr(charging_completed_at, 'isoformat'):
                charging_completed_at_str = charging_completed_at.isoformat()
            else:
                charging_completed_at_str = None
            
            formatted_booking = {
                '_id': str(booking['_id']),
                'booking_id': booking.get('booking_id', ''),
                'user_id': str(booking.get('user_id', '')),
                'user_details': user_details,
                'station_details': station_details,
                'status': booking.get('status', 'confirmed'),
                'charger_type': booking.get('charger_type', ''),
                'booking_date': booking.get('booking_date', ''),
                'booking_time': booking.get('booking_time', ''),
                'booking_duration': booking.get('estimated_duration', 60),
                'total_cost': booking.get('total_cost', 0),
                'amount_npr': booking.get('amount_npr', 0),
                'admin_amount_set': booking.get('admin_amount_set', False),
                'charging_completed': booking.get('charging_completed', False),
                'charging_completed_at': charging_completed_at_str,
                'actual_charging_duration': booking.get('actual_charging_duration'),
                'created_at': created_at_str,
                'auto_booked': booking.get('auto_booked', False),
                'payment_status': booking.get('payment_status', 'none'),
                'requires_payment': booking.get('requires_payment', False)
            }
            formatted_bookings.append(formatted_booking)
        
        return jsonify({
            'success': True,
            'bookings': formatted_bookings
        })
    except Exception as e:
        logger.error(f"Error getting admin bookings: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/recent-bookings', methods=['GET'])
@require_admin
def get_recent_bookings():
    """Get recent bookings for admin dashboard"""
    try:
        # Get the 5 most recent bookings
        recent_bookings = list(mongo.db.bookings.find().sort("created_at", -1).limit(5))
        
        # Format bookings for admin view
        formatted_bookings = []
        for booking in recent_bookings:
            # Get user details
            user = mongo.db.users.find_one({"_id": ObjectId(booking.get('user_id'))})
            user_details = {
                'username': user.get('username', 'Unknown') if user else 'Unknown',
                'email': user.get('email', 'Unknown') if user else 'Unknown'
            }
            
            # Get station details
            station = ChargingStation.get_by_id(booking.get('station_id'))
            station_details = {
                'name': station.get('name', 'Unknown Station') if station else 'Unknown Station',
                'address': station.get('address', 'Unknown Address') if station else 'Unknown Address'
            }
            
            # Handle datetime fields safely
            created_at = booking.get('created_at')
            if created_at and hasattr(created_at, 'isoformat'):
                created_at_str = created_at.isoformat()
            else:
                created_at_str = datetime.utcnow().isoformat()
            
            formatted_booking = {
                '_id': str(booking['_id']),
                'booking_id': booking.get('booking_id', ''),
                'user_id': str(booking.get('user_id', '')),
                'user_details': user_details,
                'station_details': station_details,
                'status': booking.get('status', 'confirmed'),
                'charger_type': booking.get('charger_type', ''),
                'total_cost': booking.get('total_cost', 0),
                'amount_npr': booking.get('amount_npr', 0),
                'admin_amount_set': booking.get('admin_amount_set', False),
                'charging_completed': booking.get('charging_completed', False),
                'created_at': created_at_str,
                'payment_status': booking.get('payment_status', 'none'),
                'requires_payment': booking.get('requires_payment', False)
            }
            formatted_bookings.append(formatted_booking)
        
        return jsonify({
            'success': True,
            'bookings': formatted_bookings
        })
    except Exception as e:
        logger.error(f"Error getting recent bookings: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/recent-stations', methods=['GET'])
@require_admin
def get_recent_stations():
    """Get recent stations for admin dashboard"""
    try:
        # Get all stations and sort by creation date (if available) or limit to 5
        stations = ChargingStation.get_all()
        
        # For now, just take the first 5 stations
        recent_stations = stations[:5]
        
        # Format stations for admin view
        formatted_stations = []
        for station in recent_stations:
            formatted_station = {
                'id': station.get('id'),
                'name': station.get('name'),
                'available_slots': station.get('available_slots', 0),
                'total_slots': station.get('total_slots', 0),
                'pricing_per_kwh': station.get('pricing_per_kwh', 0),
                'rating': station.get('rating', 0)
            }
            formatted_stations.append(formatted_station)
        
        return jsonify({
            'success': True,
            'stations': formatted_stations
        })
    except Exception as e:
        logger.error(f"Error getting recent stations: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/analytics', methods=['GET'])
@require_admin
def get_admin_analytics():
    """Get analytics data for admin dashboard"""
    try:
        # Get time range from query parameter
        time_range = request.args.get('range', '30d')
        
        # Calculate date range
        end_date = datetime.utcnow()
        if time_range == '7d':
            start_date = end_date - timedelta(days=7)
        elif time_range == '30d':
            start_date = end_date - timedelta(days=30)
        elif time_range == '90d':
            start_date = end_date - timedelta(days=90)
        elif time_range == '1y':
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=30)
        
        # Revenue analytics
        completed_bookings = list(mongo.db.bookings.find({
            "status": "completed",
            "created_at": {"$gte": start_date, "$lte": end_date}
        }))
        
        total_revenue = sum(booking.get('total_cost', 0) for booking in completed_bookings)
        
        # Monthly revenue breakdown
        monthly_revenue = []
        current_date = start_date
        while current_date <= end_date:
            month_start = current_date.replace(day=1)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            month_bookings = list(mongo.db.bookings.find({
                "status": "completed",
                "created_at": {"$gte": month_start, "$lte": month_end}
            }))
            
            month_amount = sum(booking.get('total_cost', 0) for booking in month_bookings)
            monthly_revenue.append({
                'month': current_date.strftime('%b'),
                'amount': month_amount
            })
            
            current_date = (current_date + timedelta(days=32)).replace(day=1)
        
        # Booking analytics
        all_bookings = list(mongo.db.bookings.find({"created_at": {"$gte": start_date, "$lte": end_date}}))
        
        # Status breakdown
        status_counts = {}
        for booking in all_bookings:
            status = booking.get('status', 'unknown')
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Station breakdown
        station_counts = {}
        for booking in all_bookings:
            station_id = booking.get('station_id')
            if station_id:
                station = ChargingStation.get_by_id(station_id)
                station_name = station.get('name', 'Unknown') if station else 'Unknown'
                station_counts[station_name] = station_counts.get(station_name, 0) + 1
        
        # Convert to list format
        station_breakdown = [{'name': name, 'count': count} for name, count in station_counts.items()]
        
        # User analytics
        total_users = mongo.db.users.count_documents({})
        active_users = mongo.db.users.count_documents({"status": "active"})
        new_users_this_month = mongo.db.users.count_documents({
            "created_at": {"$gte": start_date, "$lte": end_date}
        })
        
        # Station analytics
        stations = ChargingStation.get_all()
        total_stations = len(stations)
        
        # Station status breakdown (assuming all are active for now)
        station_status = {
            'active': total_stations,
            'inactive': 0,
            'maintenance': 0
        }
        
        # Station performance
        station_performance = []
        for station in stations[:5]:  # Top 5 stations
            station_performance.append({
                'name': station.get('name', 'Unknown'),
                'utilization': station.get('available_slots', 0) / max(station.get('total_slots', 1), 1) * 100,
                'rating': station.get('rating', 0)
            })
        
        return jsonify({
            'success': True,
            'analytics': {
                'revenue': {
                    'total': total_revenue,
                    'monthly': monthly_revenue,
                    'daily': []  # Could be implemented similarly
                },
                'bookings': {
                    'total': len(all_bookings),
                    'byStatus': status_counts,
                    'byStation': station_breakdown,
                    'trends': []  # Could be implemented with daily breakdown
                },
                'stations': {
                    'total': total_stations,
                    'byStatus': station_status,
                    'performance': station_performance
                },
                'users': {
                    'total': total_users,
                    'active': active_users,
                    'newThisMonth': new_users_this_month
                }
            }
        })
    except Exception as e:
        logger.error(f"Error getting admin analytics: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Additional admin endpoints for CRUD operations

@admin_bp.route('/stations/<station_id>', methods=['PUT'])
@require_admin
def update_station(station_id):
    """Update a charging station"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        # Prepare update data
        update_data = {}
        
        if 'name' in data:
            update_data['name'] = data['name']
        if 'company' in data:
            update_data['company'] = data['company']
        if 'address' in data:
            update_data['address'] = data['address']
        if 'total_slots' in data:
            update_data['total_slots'] = int(data['total_slots'])
            # Update available slots proportionally
            current_station = mongo.db.charging_stations.find_one({'id': station_id})
            if current_station:
                current_available = current_station.get('available_slots', 0)
                current_total = current_station.get('total_slots', 1)
                if current_total > 0:
                    ratio = current_available / current_total
                    update_data['available_slots'] = max(0, int(int(data['total_slots']) * ratio))
                else:
                    update_data['available_slots'] = int(data['total_slots'])
        if 'pricing_per_kwh' in data:
            update_data['pricing_per_kwh'] = float(data['pricing_per_kwh'])
        if 'status' in data:
            update_data['status'] = data['status']
        if 'operating_hours' in data:
            update_data['operating_hours'] = data['operating_hours']
        if 'connector_types' in data:
            update_data['connector_types'] = data['connector_types']
        if 'features' in data:
            update_data['features'] = data['features']
        
        update_data['updated_at'] = datetime.utcnow()
        
        # Update in database
        result = mongo.db.charging_stations.update_one(
            {'id': station_id},
            {'$set': update_data}
        )
        
        if result.modified_count > 0:
            logger.info(f"Updated station: {station_id}")
            return jsonify({'success': True, 'message': 'Station updated successfully'})
        else:
            return jsonify({'success': False, 'error': 'Station not found or no changes made'}), 404
            
    except Exception as e:
        logger.error(f"Error updating station: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/stations/<station_id>', methods=['DELETE'])
@require_admin
def delete_station(station_id):
    """Delete a charging station"""
    try:
        # Check if station exists
        station = mongo.db.charging_stations.find_one({'id': station_id})
        if not station:
            return jsonify({'success': False, 'error': 'Station not found'}), 404
        
        # Check if station has active bookings
        active_bookings = mongo.db.bookings.count_documents({
            'station_id': station_id,
            'status': {'$in': ['confirmed', 'in_progress']}
        })
        
        if active_bookings > 0:
            return jsonify({
                'success': False, 
                'error': f'Cannot delete station with {active_bookings} active bookings'
            }), 400
        
        # Delete the station
        result = mongo.db.charging_stations.delete_one({'id': station_id})
        
        if result.deleted_count > 0:
            logger.info(f"Deleted station: {station_id}")
            return jsonify({'success': True, 'message': 'Station deleted successfully'})
        else:
            return jsonify({'success': False, 'error': 'Failed to delete station'}), 500
            
    except Exception as e:
        logger.error(f"Error deleting station: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/users/<user_id>/status', methods=['PUT'])
@require_admin
def update_user_status(user_id):
    """Update user status"""
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({'success': False, 'error': 'Status is required'}), 400
        
        result = mongo.db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"status": new_status}}
        )
        
        if result.modified_count > 0:
            return jsonify({'success': True, 'message': 'User status updated successfully'})
        else:
            return jsonify({'success': False, 'error': 'User not found'}), 404
    except Exception as e:
        logger.error(f"Error updating user status: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@require_admin
def delete_user(user_id):
    """Delete a user"""
    try:
        result = mongo.db.users.delete_one({"_id": ObjectId(user_id)})
        
        if result.deleted_count > 0:
            return jsonify({'success': True, 'message': 'User deleted successfully'})
        else:
            return jsonify({'success': False, 'error': 'User not found'}), 404
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/bookings/<booking_id>/status', methods=['PUT'])
@require_admin
def update_booking_status(booking_id):
    """Update booking status"""
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({'success': False, 'error': 'Status is required'}), 400
        
        # Try to update by booking_id first
        result = Booking.update_booking_status(booking_id, new_status)
        
        if not result:
            # If that fails, try to update by _id (MongoDB ObjectId)
            try:
                result = mongo.db.bookings.update_one(
                    {"_id": ObjectId(booking_id)},
                    {"$set": {"status": new_status, "updated_at": datetime.utcnow()}}
                )
                result = result.modified_count > 0
            except:
                result = False
        
        if result:
            return jsonify({'success': True, 'message': 'Booking status updated successfully'})
        else:
            return jsonify({'success': False, 'error': 'Booking not found'}), 404
    except Exception as e:
        logger.error(f"Error updating booking status: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/bookings/<booking_id>', methods=['DELETE'])
@require_admin
def delete_booking(booking_id):
    """Delete a booking"""
    try:
        # Try to delete by booking_id first
        result = mongo.db.bookings.delete_one({"booking_id": booking_id})
        
        if result.deleted_count == 0:
            # If that fails, try to delete by _id (MongoDB ObjectId)
            try:
                result = mongo.db.bookings.delete_one({"_id": ObjectId(booking_id)})
            except:
                result = mongo.db.bookings.delete_one({"booking_id": booking_id})
        
        if result.deleted_count > 0:
            return jsonify({'success': True, 'message': 'Booking deleted successfully'})
        else:
            return jsonify({'success': False, 'error': 'Booking not found'}), 404
    except Exception as e:
        logger.error(f"Error deleting booking: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/bookings/completed', methods=['GET'])
@require_admin
def get_completed_bookings():
    """Get all completed bookings that need admin review for amount setting"""
    try:
        bookings = Booking.get_completed_bookings_for_admin()
        
        logger.info(f"Found {len(bookings)} completed bookings for admin")
        if bookings:
            logger.info(f"Sample booking data: {bookings[0] if len(bookings) > 0 else 'No bookings'}")
        
        return jsonify({
            'success': True,
            'bookings': bookings,
            'count': len(bookings)
        })
    except Exception as e:
        logger.error(f"Error fetching completed bookings: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/bookings/<booking_id>/set-amount', methods=['POST'])
@require_admin
def set_charging_amount(booking_id):
    """Admin sets the charging amount for a completed booking"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        amount_npr = data.get('amount_npr')
        charging_duration_minutes = data.get('charging_duration_minutes')
        notes = data.get('notes', '')
        
        if not amount_npr or amount_npr <= 0:
            return jsonify({'success': False, 'error': 'Valid amount is required'}), 400
        
        # Get admin user ID from current session
        from middleware.auth_middleware import get_current_user_id
        admin_user_id = get_current_user_id()
        
        success = Booking.admin_set_charging_amount(
            booking_id=booking_id,
            amount_npr=float(amount_npr),
            admin_user_id=admin_user_id,
            charging_duration_minutes=charging_duration_minutes,
            notes=notes
        )
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Charging amount of Rs. {amount_npr} set successfully',
                'booking_id': booking_id
            })
        else:
            return jsonify({'success': False, 'error': 'Failed to set charging amount'}), 500
            
    except Exception as e:
        logger.error(f"Error setting charging amount: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/bookings/<booking_id>/mark-completed', methods=['POST'])
@require_admin
def mark_charging_completed(booking_id):
    """Admin marks a booking as charging completed (ready for amount setting)"""
    try:
        from middleware.auth_middleware import get_current_user_id
        admin_user_id = get_current_user_id()
        
        result = mongo.db.bookings.update_one(
            {"booking_id": booking_id},
            {"$set": {
                "status": "completed",  # Update status to completed
                "charging_completed": True,
                "charging_completed_at": datetime.utcnow(),
                "charging_completed_by": admin_user_id,
                "updated_at": datetime.utcnow()
            }}
        )
        
        if result.modified_count > 0:
            return jsonify({
                'success': True,
                'message': 'Booking marked as completed and ready for amount setting',
                'booking_id': booking_id
            })
        else:
            return jsonify({'success': False, 'error': 'Booking not found'}), 404
            
    except Exception as e:
        logger.error(f"Error marking charging completed: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500 