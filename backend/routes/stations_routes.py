from flask import Blueprint, jsonify, request
import logging

logger = logging.getLogger(__name__)
stations_bp = Blueprint('stations', __name__)



@stations_bp.route('', methods=['GET'])
def get_charging_stations():
    """Get all charging stations with real-time availability or filter by company type"""
    try:
        from models.charging_station import ChargingStation
        from models.booking import Booking
        
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
        
        # Apply company filter first
        filtered_stations = []
        for station in stations:
            should_include = False
            
            if company_filter and company_filter.lower() != 'all':
                # Special case: For any brand other than NEA, also include NEA stations
                if company_filter.lower() != 'nea':
                    # Include both the selected brand and NEA stations
                    if (station.get('company') and station['company'].lower() == company_filter.lower()) or \
                       (station.get('company') and station['company'].lower() == 'nea'):
                        should_include = True
                else:
                    # For NEA filter, only show NEA stations
                    if station.get('company') and station['company'].lower() == 'nea':
                        should_include = True
            else:
                # Show all stations
                should_include = True
            
            if should_include:
                filtered_stations.append(station)
        
        # Batch availability calculation for better performance
        if filtered_stations:
            try:
                from config.database import mongo
                from datetime import datetime, timedelta
                
                # Get all station IDs
                station_ids = [station.get('id') for station in filtered_stations if station.get('id')]
                
                if station_ids:
                    # Get all active bookings for all stations in one query
                    current_time = datetime.utcnow()
                    active_bookings = list(mongo.db.bookings.find({
                        "station_id": {"$in": station_ids},
                        "status": {"$in": ["confirmed", "in_progress"]}
                    }))
                    
                    # Group bookings by station_id
                    bookings_by_station = {}
                    for booking in active_bookings:
                        station_id = booking.get('station_id')
                        if station_id not in bookings_by_station:
                            bookings_by_station[station_id] = []
                        bookings_by_station[station_id].append(booking)
                    
                    # Calculate availability for each station
                    for station in filtered_stations:
                        station_id = station.get('id')
                        if not station_id:
                            station['available_slots'] = 0
                            station['total_slots'] = 0
                            station['active_bookings'] = 0
                            continue
                        
                        # Get chargers from station data
                        chargers = station.get('chargers', [])
                        total_slots = len(chargers)
                        
                        if total_slots == 0:
                            station['available_slots'] = 0
                            station['total_slots'] = 0
                            station['active_bookings'] = 0
                            continue
                        
                        # Count active bookings for this station
                        active_bookings_count = 0
                        station_bookings = bookings_by_station.get(station_id, [])
                        
                        for booking in station_bookings:
                            booking_datetime = booking.get('booking_datetime')
                            estimated_duration = booking.get('estimated_duration', 60)
                            
                            if booking_datetime:
                                booking_end = booking_datetime + timedelta(minutes=estimated_duration)
                                if current_time >= booking_datetime and current_time <= booking_end:
                                    active_bookings_count += 1
                            else:
                                # Legacy bookings without specific datetime
                                if booking.get('status') in ['confirmed', 'in_progress']:
                                    active_bookings_count += 1
                        
                        available_slots = max(0, total_slots - active_bookings_count)
                        station['available_slots'] = available_slots
                        station['total_slots'] = total_slots
                        station['active_bookings'] = active_bookings_count
                
            except Exception as availability_error:
                logger.warning(f"Error calculating batch availability: {availability_error}")
                # Fallback to individual calculation for each station
                for station in filtered_stations:
                    station_id = station.get('id')
                    if station_id:
                        try:
                            availability_info = Booking.get_station_real_time_availability(station_id)
                            station['available_slots'] = availability_info.get('available_slots', 0)
                            station['total_slots'] = availability_info.get('total_slots', 0)
                            station['active_bookings'] = availability_info.get('active_bookings', 0)
                        except Exception as individual_error:
                            logger.warning(f"Error getting availability for station {station_id}: {individual_error}")
                            station['available_slots'] = 0
                            station['total_slots'] = 0
                            station['active_bookings'] = 0
                    else:
                        station['available_slots'] = 0
                        station['total_slots'] = 0
                        station['active_bookings'] = 0
        
        return jsonify({
            'success': True,
            'stations': filtered_stations,
            'total_count': len(filtered_stations),
            'company_filter': company_filter
        })
    except Exception as e:
        logger.error(f"Error fetching stations: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@stations_bp.route('/<station_id>', methods=['GET'])
def get_station_by_id(station_id):
    """Get a specific charging station by ID with real-time availability"""
    try:
        from models.charging_station import ChargingStation
        from models.booking import Booking
        
        # Get station from database
        station = ChargingStation.get_by_id(station_id)
        
        if not station:
            return jsonify({
                'success': False,
                'error': 'Station not found'
            }), 404
        
        # Add real-time availability
        try:
            availability_info = Booking.get_station_real_time_availability(station_id)
            station['available_slots'] = availability_info.get('available_slots', 0)
            station['total_slots'] = availability_info.get('total_slots', 0)
            station['active_bookings'] = availability_info.get('active_bookings', 0)
        except Exception as availability_error:
            logger.warning(f"Error getting availability for station {station_id}: {availability_error}")
            station['available_slots'] = 0
            station['total_slots'] = 0
            station['active_bookings'] = 0
        
        return jsonify({
            'success': True,
            'station': station
        })
    except Exception as e:
        logger.error(f"Error fetching station {station_id}: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@stations_bp.route('/<station_id>/availability', methods=['GET'])
def get_station_availability(station_id):
    """Get real-time availability for a specific station"""
    try:
        from models.booking import Booking
        
        charger_type = request.args.get('charger_type', None)
        
        # Get real-time availability
        availability_info = Booking.get_station_real_time_availability(station_id, charger_type)
        
        return jsonify({
            'success': True,
            'station_id': station_id,
            'charger_type': charger_type,
            'availability': availability_info
        })
    except Exception as e:
        logger.error(f"Error getting availability for station {station_id}: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@stations_bp.route('/filter-options', methods=['GET'])
def get_filter_options():
    """Get available filter options for charging stations"""
    try:
        from models.charging_station import ChargingStation
        
        # Get all stations
        stations = ChargingStation.get_all()
        
        # Extract unique values for filtering
        companies = list(set(station.get('company', 'Independent') for station in stations))
        cities = list(set(station.get('city', 'Unknown') for station in stations))
        provinces = list(set(station.get('province', 'Unknown') for station in stations))
        connector_types = []
        features = []
        
        for station in stations:
            # Collect connector types
            for connector in station.get('connector_types', []):
                if connector not in connector_types:
                    connector_types.append(connector)
            
            # Collect features
            for feature in station.get('features', []):
                if feature not in features:
                    features.append(feature)
        
        # Sort lists for better UX
        companies.sort()
        cities.sort()
        provinces.sort()
        connector_types.sort()
        features.sort()
        
        return jsonify({
            'success': True,
            'filter_options': {
                'companies': companies,
                'cities': cities,
                'provinces': provinces,
                'connector_types': connector_types,
                'features': features,
                'total_stations': len(stations)
            }
        })
    except Exception as e:
        logger.error(f"Error getting filter options: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@stations_bp.route('/search', methods=['GET'])
def search_stations():
    """Search and filter charging stations with advanced options"""
    try:
        from models.charging_station import ChargingStation
        from models.booking import Booking
        
        # Get query parameters
        company = request.args.get('company', None)
        city = request.args.get('city', None)
        province = request.args.get('province', None)
        connector_type = request.args.get('connector_type', None)
        feature = request.args.get('feature', None)
        min_rating = request.args.get('min_rating', None)
        max_price = request.args.get('max_price', None)
        available_only = request.args.get('available_only', 'false').lower() == 'true'
        search_term = request.args.get('search', None)
        
        # Get all stations
        stations = ChargingStation.get_all()
        
        # Apply filters
        filtered_stations = []
        for station in stations:
            # Company filter with special NEA logic
            if company:
                should_include_company = False
                if company.lower() != 'nea':
                    # For any brand other than NEA, include both the brand and NEA stations
                    if (station.get('company', '').lower() == company.lower()) or \
                       (station.get('company', '').lower() == 'nea'):
                        should_include_company = True
                else:
                    # For NEA filter, only show NEA stations
                    if station.get('company', '').lower() == 'nea':
                        should_include_company = True
                
                if not should_include_company:
                    continue
            
            # City filter
            if city and station.get('city', '').lower() != city.lower():
                continue
            
            # Province filter
            if province and station.get('province', '').lower() != province.lower():
                continue
            
            # Connector type filter
            if connector_type and connector_type not in station.get('connector_types', []):
                continue
            
            # Feature filter
            if feature and feature not in station.get('features', []):
                continue
            
            # Rating filter
            if min_rating:
                try:
                    min_rating_float = float(min_rating)
                    if station.get('rating', 0) < min_rating_float:
                        continue
                except ValueError:
                    pass
            
            # Price filter
            if max_price:
                try:
                    max_price_float = float(max_price)
                    if station.get('pricing_per_kwh', 0) > max_price_float:
                        continue
                except ValueError:
                    pass
            
            # Search term filter
            if search_term:
                search_lower = search_term.lower()
                station_name = station.get('name', '').lower()
                station_address = station.get('address', '').lower()
                station_city = station.get('city', '').lower()
                
                if not (search_lower in station_name or 
                       search_lower in station_address or 
                       search_lower in station_city):
                    continue
            
            # Add basic availability info (will be calculated in batch later)
            station['available_slots'] = 0
            station['total_slots'] = 0
            station['active_bookings'] = 0
            
            # Available only filter
            if available_only and station.get('available_slots', 0) <= 0:
                continue
            
            filtered_stations.append(station)
        
        # Batch availability calculation for better performance
        if filtered_stations:
            try:
                from config.database import mongo
                from datetime import datetime, timedelta
                
                # Get all station IDs
                station_ids = [station.get('id') for station in filtered_stations if station.get('id')]
                
                if station_ids:
                    # Get all active bookings for all stations in one query
                    current_time = datetime.utcnow()
                    active_bookings = list(mongo.db.bookings.find({
                        "station_id": {"$in": station_ids},
                        "status": {"$in": ["confirmed", "in_progress"]}
                    }))
                    
                    # Group bookings by station_id
                    bookings_by_station = {}
                    for booking in active_bookings:
                        station_id = booking.get('station_id')
                        if station_id not in bookings_by_station:
                            bookings_by_station[station_id] = []
                        bookings_by_station[station_id].append(booking)
                    
                    # Calculate availability for each station
                    for station in filtered_stations:
                        station_id = station.get('id')
                        if not station_id:
                            continue
                        
                        # Get chargers from station data
                        chargers = station.get('chargers', [])
                        total_slots = len(chargers)
                        
                        if total_slots == 0:
                            station['available_slots'] = 0
                            station['total_slots'] = 0
                            station['active_bookings'] = 0
                            continue
                        
                        # Count active bookings for this station
                        active_bookings_count = 0
                        station_bookings = bookings_by_station.get(station_id, [])
                        
                        for booking in station_bookings:
                            booking_datetime = booking.get('booking_datetime')
                            estimated_duration = booking.get('estimated_duration', 60)
                            
                            if booking_datetime:
                                booking_end = booking_datetime + timedelta(minutes=estimated_duration)
                                if current_time >= booking_datetime and current_time <= booking_end:
                                    active_bookings_count += 1
                            else:
                                # Legacy bookings without specific datetime
                                if booking.get('status') in ['confirmed', 'in_progress']:
                                    active_bookings_count += 1
                        
                        available_slots = max(0, total_slots - active_bookings_count)
                        station['available_slots'] = available_slots
                        station['total_slots'] = total_slots
                        station['active_bookings'] = active_bookings_count
                
            except Exception as availability_error:
                logger.warning(f"Error calculating batch availability: {availability_error}")
                # Fallback to individual calculation for each station
                for station in filtered_stations:
                    station_id = station.get('id')
                    if station_id:
                        try:
                            availability_info = Booking.get_station_real_time_availability(station_id)
                            station['available_slots'] = availability_info.get('available_slots', 0)
                            station['total_slots'] = availability_info.get('total_slots', 0)
                            station['active_bookings'] = availability_info.get('active_bookings', 0)
                        except Exception as individual_error:
                            logger.warning(f"Error getting availability for station {station_id}: {individual_error}")
                            station['available_slots'] = 0
                            station['total_slots'] = 0
                            station['active_bookings'] = 0
        
        return jsonify({
            'success': True,
            'stations': filtered_stations,
            'total_count': len(filtered_stations),
            'filters_applied': {
                'company': company,
                'city': city,
                'province': province,
                'connector_type': connector_type,
                'feature': feature,
                'min_rating': min_rating,
                'max_price': max_price,
                'available_only': available_only,
                'search_term': search_term
            }
        })
    except Exception as e:
        logger.error(f"Error searching stations: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
