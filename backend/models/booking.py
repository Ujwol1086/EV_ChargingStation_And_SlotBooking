from config.database import mongo
from bson import ObjectId
import datetime
import logging

logger = logging.getLogger(__name__)

class Booking:
    """Booking model for MongoDB"""
    
    @staticmethod
    def create_booking(user_id, station_id, charger_type, booking_data):
        """
        Create a new booking
        
        Args:
            user_id: ID of the user making the booking
            station_id: ID of the charging station
            charger_type: Type of charger (CCS, CHAdeMO, Type 2)
            booking_data: Additional booking information
        """
        try:
            logger.info(f"Creating booking for user {user_id} at station {station_id}")
            
            # Ensure database connection is established
            if mongo.db is None:
                logger.error("Database connection not established")
                return None
            
            # Create booking document
            booking = {
                "user_id": ObjectId(user_id),
                "station_id": station_id,
                "charger_type": charger_type,
                "booking_id": booking_data.get('booking_id'),
                "power": booking_data.get('power'),
                "estimated_time": booking_data.get('estimated_time'),
                "auto_booked": booking_data.get('auto_booked', False),
                "status": booking_data.get('status', 'confirmed'),
                "payment_status": booking_data.get('payment_status', 'none'),
                "payment_method": booking_data.get('payment_method', 'pay_at_station'),
                "admin_amount_set": booking_data.get('admin_amount_set', False),
                "charging_completed": booking_data.get('charging_completed', False),
                "created_at": datetime.datetime.utcnow(),
                "booking_time": datetime.datetime.utcnow(),
                "estimated_duration": booking_data.get('booking_duration', 60),
                "station_details": booking_data.get('station_details', {}),
                "user_location": booking_data.get('user_location', []),
                "distance_to_station": booking_data.get('distance_to_station', 0),
                "amount_npr": booking_data.get('amount_npr', 0),
                "amount_paisa": booking_data.get('amount_paisa', 0),
                "requires_payment": booking_data.get('requires_payment', True)
            }
            
            # Insert booking into database
            result = mongo.db.bookings.insert_one(booking)
            booking_id = result.inserted_id
            
            logger.info(f"Booking created with ID: {booking_id}")
            
            # Return the booking document
            booking_doc = mongo.db.bookings.find_one({"_id": booking_id})
            if booking_doc:
                booking_doc["_id"] = str(booking_doc["_id"])
                booking_doc["user_id"] = str(booking_doc["user_id"])
            
            return booking_doc
            
        except Exception as e:
            logger.error(f"Error creating booking: {e}")
            return None
    
    @staticmethod
    def find_by_user_id(user_id):
        """Find all bookings for a specific user"""
        try:
            logger.info(f"Finding bookings for user: {user_id}")
            
            # Query bookings for the user
            bookings = list(mongo.db.bookings.find({"user_id": ObjectId(user_id)}).sort("created_at", -1))
            
            # Convert ObjectIds to strings
            for booking in bookings:
                booking["_id"] = str(booking["_id"])
                booking["user_id"] = str(booking["user_id"])
            
            logger.info(f"Found {len(bookings)} bookings for user {user_id}")
            return bookings
            
        except Exception as e:
            logger.error(f"Error finding bookings for user: {e}")
            return []
    
    @staticmethod
    def find_by_booking_id(booking_id):
        """Find a booking by booking_id"""
        try:
            logger.info(f"Finding booking with booking_id: {booking_id}")
            booking = mongo.db.bookings.find_one({"booking_id": booking_id})
            
            if booking:
                # Convert ObjectId to string for JSON serialization
                booking["_id"] = str(booking["_id"])
                booking["user_id"] = str(booking["user_id"])
                
                logger.info(f"Booking found: {booking.get('booking_id')}")
                return booking
            else:
                logger.warning(f"No booking found with booking_id: {booking_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error finding booking: {e}")
            return None
    
    @staticmethod
    def find_by_khalti_idx(khalti_idx):
        """Find a booking by Khalti payment index (pidx)"""
        try:
            logger.info(f"Finding booking with khalti_idx: {khalti_idx}")
            booking = mongo.db.bookings.find_one({"khalti_idx": khalti_idx})
            
            if booking:
                # Convert ObjectId to string for JSON serialization
                booking["_id"] = str(booking["_id"])
                booking["user_id"] = str(booking["user_id"])
                
                logger.info(f"Booking found by khalti_idx: {booking.get('booking_id')}")
                return booking
            else:
                logger.warning(f"No booking found with khalti_idx: {khalti_idx}")
                return None
                
        except Exception as e:
            logger.error(f"Error finding booking by khalti_idx: {e}")
            return None
    
    @staticmethod
    def update_booking_status(booking_id, status):
        """Update the status of a booking"""
        try:
            logger.info(f"Updating booking {booking_id} status to {status}")
            
            result = mongo.db.bookings.update_one(
                {"booking_id": booking_id},
                {"$set": {"status": status, "updated_at": datetime.datetime.utcnow()}}
            )
            
            if result.modified_count > 0:
                logger.info(f"Booking {booking_id} status updated successfully")
                return True
            else:
                logger.warning(f"No booking found with booking_id: {booking_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error updating booking status: {e}")
            return False
    
    @staticmethod
    def delete_booking(booking_id, user_id):
        """Delete a booking (only if it belongs to the user)"""
        try:
            logger.info(f"Deleting booking {booking_id} for user {user_id}")
            
            result = mongo.db.bookings.delete_one({
                "booking_id": booking_id,
                "user_id": ObjectId(user_id)
            })
            
            if result.deleted_count > 0:
                logger.info(f"Booking {booking_id} deleted successfully")
                return True
            else:
                logger.warning(f"No booking found or user not authorized to delete booking: {booking_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error deleting booking: {e}")
            return False
    
    @staticmethod
    def find_active_bookings_by_user(user_id):
        """Find all active bookings for a user"""
        try:
            logger.info(f"Finding active bookings for user: {user_id}")
            
            # Query active bookings (status: confirmed, in_progress)
            active_statuses = ["confirmed", "in_progress"]
            bookings = list(mongo.db.bookings.find({
                "user_id": ObjectId(user_id),
                "status": {"$in": active_statuses}
            }).sort("created_at", -1))
            
            # Convert ObjectIds to strings
            for booking in bookings:
                booking["_id"] = str(booking["_id"])
                booking["user_id"] = str(booking["user_id"])
            
            logger.info(f"Found {len(bookings)} active bookings for user {user_id}")
            return bookings
            
        except Exception as e:
            logger.error(f"Error finding active bookings for user: {e}")
            return []
    
    @staticmethod
    def get_station_real_time_availability(station_id, charger_type=None):
        """
        Get real-time availability for a station by checking current bookings
        """
        try:
            from datetime import datetime, timedelta
            current_time = datetime.utcnow()
            
            # Get station info from database
            from models.charging_station import ChargingStation
            station = ChargingStation.get_by_id(station_id)
            if not station:
                logger.warning(f"Station {station_id} not found")
                return {'available_slots': 0, 'total_slots': 0}
            
            # Count chargers by type
            chargers = station.get('chargers', [])
            if charger_type:
                # Filter by specific charger type
                type_chargers = [c for c in chargers if c.get('type') == charger_type]
                total_slots = len(type_chargers)
            else:
                total_slots = len(chargers)
            
            if total_slots == 0:
                return {'available_slots': 0, 'total_slots': 0}
            
            # Count active bookings for this station and charger type
            query = {
                "station_id": station_id,
                "status": {"$in": ["confirmed", "in_progress"]},
                # Check if booking is currently active (within the estimated duration)
                "$expr": {
                    "$and": [
                        # Booking datetime exists
                        {"$ne": ["$booking_datetime", None]},
                        # Current time is after booking start
                        {"$gte": [current_time, "$booking_datetime"]},
                        # Current time is before booking end (booking_datetime + estimated_duration)
                        {"$lte": [current_time, {
                            "$add": ["$booking_datetime", {"$multiply": ["$estimated_duration", 60000]}]  # Convert minutes to milliseconds
                        }]}
                    ]
                }
            }
            
            if charger_type:
                query["charger_type"] = charger_type
            
            active_bookings = mongo.db.bookings.count_documents(query)
            available_slots = max(0, total_slots - active_bookings)
            
            logger.info(f"Station {station_id} ({charger_type or 'all types'}): {available_slots}/{total_slots} slots available")
            
            return {
                'available_slots': available_slots,
                'total_slots': total_slots,
                'active_bookings': active_bookings
            }
            
        except Exception as e:
            logger.error(f"Error getting real-time availability for station {station_id}: {e}")
            return {'available_slots': 0, 'total_slots': 0}
    
    @staticmethod
    def check_slot_availability(station_id, charger_type, booking_date, booking_time):
        """
        Check if a slot is available for the given station, charger type, date and time
        Returns the number of available slots for that time slot
        """
        try:
            logger.info(f"Checking slot availability for station {station_id} on {booking_date} at {booking_time}")
            
            # Parse the booking datetime
            from datetime import datetime, timedelta
            booking_datetime = datetime.strptime(f"{booking_date} {booking_time}", "%Y-%m-%d %H:%M")
            
            # Define time slot window (1 hour slot)
            slot_start = booking_datetime
            slot_end = booking_datetime + timedelta(hours=1)
            
            # Get station info to determine total slots
            from models.charging_station import ChargingStation
            station = ChargingStation.get_by_id(station_id)
            if not station:
                logger.warning(f"Station {station_id} not found")
                return {
                    'available': False,
                    'available_slots': 0,
                    'total_slots': 0,
                    'existing_bookings': 0
                }
            
            # Count chargers of the specified type
            chargers = station.get('chargers', [])
            type_chargers = [c for c in chargers if c.get('type') == charger_type]
            total_slots = len(type_chargers)
            
            if total_slots == 0:
                return {
                    'available': False,
                    'available_slots': 0,
                    'total_slots': 0,
                    'existing_bookings': 0
                }
            
            # Count existing bookings for this time slot
            existing_bookings = mongo.db.bookings.count_documents({
                "station_id": station_id,
                "charger_type": charger_type,
                "status": {"$in": ["confirmed", "in_progress"]},
                "booking_datetime": {"$gte": slot_start, "$lt": slot_end}
            })
            
            available_slots = total_slots - existing_bookings
            
            logger.info(f"Station {station_id}: {available_slots}/{total_slots} slots available for {booking_date} {booking_time}")
            
            return {
                'available': available_slots > 0,
                'available_slots': max(0, available_slots),
                'total_slots': total_slots,
                'existing_bookings': existing_bookings
            }
            
        except Exception as e:
            logger.error(f"Error checking slot availability: {e}")
            return {
                'available': False,
                'available_slots': 0,
                'total_slots': 0,
                'existing_bookings': 0
            }
    
    @staticmethod
    def get_available_time_slots(station_id, charger_type, booking_date):
        """
        Get all available time slots for a given station, charger type and date
        Returns a list of available time slots with their availability status
        """
        try:
            from datetime import datetime, timedelta
            
            # Generate time slots from 6 AM to 10 PM (16 hours)
            base_date = datetime.strptime(booking_date, "%Y-%m-%d")
            time_slots = []
            
            for hour in range(6, 23):  # 6 AM to 10 PM
                slot_time = f"{hour:02d}:00"
                slot_datetime = base_date.replace(hour=hour, minute=0, second=0)
                
                # Skip past time slots for today
                if booking_date == datetime.now().strftime("%Y-%m-%d") and slot_datetime < datetime.now():
                    continue
                
                # Check availability for this slot
                availability = Booking.check_slot_availability(station_id, charger_type, booking_date, slot_time)
                
                time_slots.append({
                    'time': slot_time,
                    'datetime': slot_datetime.isoformat(),
                    'available': availability['available'],
                    'available_slots': availability['available_slots'],
                    'total_slots': availability['total_slots'],
                    'display_time': f"{hour % 12 if hour % 12 != 0 else 12}:00 {'AM' if hour < 12 else 'PM'}"
                })
            
            logger.info(f"Generated {len(time_slots)} time slots for station {station_id} on {booking_date}")
            return time_slots
            
        except Exception as e:
            logger.error(f"Error generating time slots: {e}")
            return []
    
    @staticmethod
    def create_timed_booking(user_id, station_id, charger_type, booking_date, booking_time, booking_data):
        """
        Create a booking with specific date and time
        """
        try:
            from datetime import datetime
            
            # Check slot availability first
            availability = Booking.check_slot_availability(station_id, charger_type, booking_date, booking_time)
            
            if not availability['available']:
                return {
                    'success': False,
                    'error': 'No slots available for the selected time',
                    'availability': availability
                }
            
            # Parse booking datetime
            booking_datetime = datetime.strptime(f"{booking_date} {booking_time}", "%Y-%m-%d %H:%M")
            
            # Create booking document with specific datetime
            booking = {
                "user_id": ObjectId(user_id),
                "station_id": station_id,
                "charger_type": charger_type,
                "booking_id": booking_data.get('booking_id'),
                "booking_datetime": booking_datetime,
                "booking_date": booking_date,
                "booking_time": booking_time,
                "power": booking_data.get('power'),
                "estimated_time": booking_data.get('estimated_time'),
                "auto_booked": booking_data.get('auto_booked', False),
                "status": booking_data.get('status', 'confirmed'),
                "payment_status": booking_data.get('payment_status', 'none'),
                "payment_method": booking_data.get('payment_method', 'pay_at_station'),
                "admin_amount_set": booking_data.get('admin_amount_set', False),
                "charging_completed": booking_data.get('charging_completed', False),
                "created_at": datetime.utcnow(),
                "estimated_duration": booking_data.get('booking_duration', 60),
                "station_details": booking_data.get('station_details', {}),
                "user_location": booking_data.get('user_location', []),
                "distance_to_station": booking_data.get('distance_to_station', 0),
                "urgency_level": booking_data.get('urgency_level', 'medium'),
                "plug_type": booking_data.get('plug_type', charger_type),
                "amount_npr": booking_data.get('amount_npr', 0),
                "amount_paisa": booking_data.get('amount_paisa', 0),
                "requires_payment": booking_data.get('requires_payment', True)
            }
            
            # Insert booking into database
            result = mongo.db.bookings.insert_one(booking)
            booking_id = result.inserted_id
            
            logger.info(f"Timed booking created with ID: {booking_id} for {booking_date} {booking_time}")
            
            # Return the booking document
            booking_doc = mongo.db.bookings.find_one({"_id": booking_id})
            if booking_doc:
                booking_doc["_id"] = str(booking_doc["_id"])
                booking_doc["user_id"] = str(booking_doc["user_id"])
            
            return {
                'success': True,
                'booking': booking_doc
            }
            
        except Exception as e:
            logger.error(f"Error creating timed booking: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def create_instant_booking(user_id, station_id, charger_type, booking_data):
        """
        Create an instant booking for high urgency cases
        """
        try:
            from datetime import datetime, timedelta
            
            # Check real-time availability
            availability = Booking.get_station_real_time_availability(station_id, charger_type)
            
            if availability['available_slots'] <= 0:
                return {
                    'success': False,
                    'error': 'No slots currently available for instant booking',
                    'availability': availability
                }
            
            # Create booking for immediate use (current time)
            current_time = datetime.utcnow()
            
            # Create booking document
            booking = {
                "user_id": ObjectId(user_id),
                "station_id": station_id,
                "charger_type": charger_type,
                "booking_id": booking_data.get('booking_id'),
                "booking_datetime": current_time,
                "booking_date": current_time.strftime("%Y-%m-%d"),
                "booking_time": current_time.strftime("%H:%M"),
                "power": booking_data.get('power'),
                "estimated_time": booking_data.get('estimated_time'),
                "auto_booked": booking_data.get('auto_booked', False),
                "status": "confirmed",
                "created_at": current_time,
                "estimated_duration": booking_data.get('booking_duration', 60),
                "station_details": booking_data.get('station_details', {}),
                "user_location": booking_data.get('user_location', []),
                "distance_to_station": booking_data.get('distance_to_station', 0),
                "urgency_level": booking_data.get('urgency_level', 'high'),
                "plug_type": booking_data.get('plug_type', charger_type)
            }
            
            # Insert booking into database
            result = mongo.db.bookings.insert_one(booking)
            booking_id = result.inserted_id
            
            logger.info(f"Instant booking created with ID: {booking_id} for immediate use")
            
            # Return the booking document
            booking_doc = mongo.db.bookings.find_one({"_id": booking_id})
            if booking_doc:
                booking_doc["_id"] = str(booking_doc["_id"])
                booking_doc["user_id"] = str(booking_doc["user_id"])
            
            return {
                'success': True,
                'booking': booking_doc
            }
            
        except Exception as e:
            logger.error(f"Error creating instant booking: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def update_payment_info(booking_id, payment_data):
        """
        Update payment information for a booking
        
        Args:
            booking_id: The booking ID
            payment_data: Dictionary containing payment information
        """
        try:
            logger.info(f"Updating payment info for booking {booking_id}: {payment_data}")
            
            update_data = {
                "payment_data": payment_data,
                "updated_at": datetime.datetime.utcnow()
            }
            
            # Add individual payment fields for easier querying
            if 'khalti_idx' in payment_data:
                update_data['khalti_idx'] = payment_data['khalti_idx']
            if 'amount' in payment_data:
                update_data['amount'] = payment_data['amount']
            if 'payment_url' in payment_data:
                update_data['payment_url'] = payment_data['payment_url']
            if 'status' in payment_data:
                update_data['payment_status'] = payment_data['status']
            
            result = mongo.db.bookings.update_one(
                {"booking_id": booking_id},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                logger.info(f"Payment info updated successfully for booking {booking_id}")
                return True
            else:
                logger.warning(f"No booking found with booking_id: {booking_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error updating payment info: {e}")
            return False
    
    @staticmethod
    def update_payment_status(booking_id, payment_status, payment_data=None):
        """
        Update payment status for a booking with enhanced error checking and atomicity
        
        Args:
            booking_id: The booking ID
            payment_status: The new payment status
            payment_data: Additional payment data (optional)
        """
        try:
            logger.info(f"🔄 Starting payment status update for booking {booking_id} to {payment_status}")
            
            # First, check if the booking exists
            existing_booking = mongo.db.bookings.find_one({"booking_id": booking_id})
            if not existing_booking:
                logger.error(f"❌ Booking {booking_id} not found in database")
                return False
            
            logger.info(f"📋 Found existing booking: status={existing_booking.get('status')}, payment_status={existing_booking.get('payment_status')}, requires_payment={existing_booking.get('requires_payment')}")
            
            # Build update data with timestamp
            current_time = datetime.datetime.utcnow()
            update_data = {
                "payment_status": payment_status,
                "updated_at": current_time,
                "payment_status_updated_at": current_time
            }
            
            # If payment is successful, update booking status to confirmed
            if payment_status == 'paid':
                update_data.update({
                    'status': 'confirmed',
                    'requires_payment': False,  # CRITICAL: Clear payment requirement
                    'payment_completed_at': current_time,
                    'payment_verified': True
                })
                logger.info(f"💰 Setting booking {booking_id} to PAID status with requires_payment=False")
            # If payment is deferred (pay later), update booking status to confirmed but keep payment pending
            elif payment_status == 'deferred':
                update_data['status'] = 'confirmed'
                logger.info(f"⏳ Setting booking {booking_id} to confirmed status with deferred payment")
            
            # Add payment data if provided
            if payment_data:
                update_data['payment_data'] = payment_data
                # Add individual fields for easier querying
                for key, value in payment_data.items():
                    update_data[f'payment_{key}'] = value
                logger.info(f"💳 Added payment data to booking {booking_id}: {list(payment_data.keys())}")
            
            logger.info(f"📝 Final update data for booking {booking_id}: {list(update_data.keys())}")
            logger.info(f"🔍 Key update values: payment_status={update_data.get('payment_status')}, requires_payment={update_data.get('requires_payment')}, status={update_data.get('status')}")
            
            # ENHANCED: Use findOneAndUpdate for atomic operation with better error handling
            result = mongo.db.bookings.find_one_and_update(
                {"booking_id": booking_id},
                {"$set": update_data},
                return_document=True  # Return the updated document
            )
            
            if result:
                logger.info(f"✅ Atomic update successful for booking {booking_id}")
                
                # CRITICAL: Verify the update by checking the returned document
                logger.info(f"🔍 Verification: Updated booking {booking_id}")
                logger.info(f"   - status: {result.get('status')}")
                logger.info(f"   - payment_status: {result.get('payment_status')}")
                logger.info(f"   - requires_payment: {result.get('requires_payment')}")
                logger.info(f"   - payment_verified: {result.get('payment_verified')}")
                
                # Double-check the critical fields for paid status
                if payment_status == 'paid':
                    if (result.get('payment_status') == 'paid' and 
                        result.get('requires_payment') == False):
                        logger.info(f"✅ VERIFICATION PASSED: Booking {booking_id} correctly updated to paid status")
                        
                        # Additional verification: Check that this booking no longer appears in pending payments
                        user_id = result.get('user_id')
                        if user_id:
                            # ENHANCED: Use a more robust query to double-check
                            pending_query = {
                                "user_id": user_id,
                                "requires_payment": True,
                                "payment_status": {"$in": ["pending", "failed"]},
                                "admin_amount_set": True,
                                "status": {"$ne": "cancelled"}
                            }
                            test_pending = list(mongo.db.bookings.find(pending_query))
                            pending_booking_ids = [b.get('booking_id') for b in test_pending]
                            
                            if booking_id not in pending_booking_ids:
                                logger.info(f"✅ FINAL VERIFICATION: Booking {booking_id} NO LONGER appears in pending payments query")
                            else:
                                logger.error(f"❌ CRITICAL ERROR: Booking {booking_id} STILL appears in pending payments after update!")
                                logger.error(f"   Pending booking IDs: {pending_booking_ids}")
                                # Force another update to fix the inconsistency
                                retry_result = mongo.db.bookings.update_one(
                                    {"booking_id": booking_id},
                                    {"$set": {"requires_payment": False, "payment_status": "paid"}}
                                )
                                logger.info(f"🔄 Retry update result: {retry_result.modified_count}")
                                return retry_result.modified_count > 0
                    else:
                        logger.error(f"❌ VERIFICATION FAILED: Booking {booking_id} payment status update incomplete")
                        logger.error(f"   Expected: payment_status='paid', requires_payment=False")
                        logger.error(f"   Actual: payment_status='{result.get('payment_status')}', requires_payment={result.get('requires_payment')}")
                        return False
                
                return True
            else:
                logger.warning(f"⚠️ No booking found with booking_id: {booking_id} or update failed")
                return False
                
        except Exception as e:
            logger.error(f"💥 Error updating payment status for booking {booking_id}: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return False
    
    @staticmethod
    def calculate_payment_amount(booking_data):
        """
        Calculate payment amount for a booking
        
        Args:
            booking_data: Dictionary containing booking information
        """
        try:
            import os
            
            # Get rates from environment variables
            base_rate_per_hour = float(os.getenv('BASE_CHARGING_RATE', 50))  # NPR
            distance_threshold = float(os.getenv('DISTANCE_SURCHARGE_THRESHOLD', 10))
            distance_rate = float(os.getenv('DISTANCE_SURCHARGE_RATE', 2))
            max_distance_surcharge = float(os.getenv('MAX_DISTANCE_SURCHARGE', 100))
            high_urgency_surcharge = float(os.getenv('HIGH_URGENCY_SURCHARGE', 25))
            low_urgency_discount = float(os.getenv('LOW_URGENCY_DISCOUNT', 10))
            min_payment_amount = float(os.getenv('MIN_PAYMENT_AMOUNT', 25))
            
            # Get estimated duration in hours
            duration_hours = booking_data.get('booking_duration', 60) / 60.0
            
            # Calculate base amount
            base_amount = base_rate_per_hour * duration_hours
            
            # Add distance surcharge (if applicable)
            distance = booking_data.get('distance_to_station', 0)
            if distance > distance_threshold:
                distance_surcharge = min(distance * distance_rate, max_distance_surcharge)
                base_amount += distance_surcharge
            else:
                distance_surcharge = 0
            
            # Add urgency surcharge
            urgency_level = booking_data.get('urgency_level', 'medium')
            if urgency_level == 'high':
                urgency_surcharge = high_urgency_surcharge
                base_amount += urgency_surcharge
            elif urgency_level == 'low':
                urgency_surcharge = -low_urgency_discount
                base_amount += urgency_surcharge
            else:
                urgency_surcharge = 0
            
            # Ensure minimum amount
            final_amount = max(base_amount, min_payment_amount)
            
            # Convert to paisa (Khalti uses paisa)
            amount_paisa = int(final_amount * 100)
            
            return {
                'amount_npr': round(final_amount, 2),
                'amount_paisa': amount_paisa,
                'base_rate': base_rate_per_hour,
                'duration_hours': duration_hours,
                'distance_surcharge': distance_surcharge,
                'urgency_surcharge': urgency_surcharge
            }
            
        except Exception as e:
            logger.error(f"Error calculating payment amount: {e}")
            # Return default amount
            return {
                'amount_npr': 50.0,
                'amount_paisa': 5000,
                'base_rate': 50,
                'duration_hours': 1.0,
                'distance_surcharge': 0,
                'urgency_surcharge': 0
            }
    
    @staticmethod
    def admin_set_charging_amount(booking_id, amount_npr, admin_user_id, charging_duration_minutes=None, notes=None):
        """
        Admin sets the amount to be paid after charging is completed
        
        Args:
            booking_id: The booking ID
            amount_npr: Amount in NPR to be charged
            admin_user_id: ID of the admin setting the amount
            charging_duration_minutes: Actual charging duration in minutes
            notes: Optional notes about the charging session
        """
        try:
            amount_paisa = int(amount_npr * 100)
            current_time = datetime.datetime.utcnow()
            
            update_data = {
                "amount_npr": amount_npr,
                "amount_paisa": amount_paisa,
                "requires_payment": True,
                "admin_amount_set": True,
                "charging_completed": True,
                "payment_status": "pending",
                "admin_set_amount_at": current_time,
                "admin_user_id": admin_user_id,
                "updated_at": current_time
            }
            
            if charging_duration_minutes:
                update_data["actual_charging_duration"] = charging_duration_minutes
            
            if notes:
                update_data["admin_notes"] = notes
            
            result = mongo.db.bookings.update_one(
                {"booking_id": booking_id},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                logger.info(f"Admin {admin_user_id} set amount {amount_npr} NPR for booking {booking_id}")
                return True
            else:
                logger.warning(f"No booking found with booking_id: {booking_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error setting admin amount: {e}")
            return False
    
    @staticmethod
    def get_pending_payment_bookings_for_user(user_id):
        """
        Get all bookings that require payment for a specific user with enhanced filtering
        
        Args:
            user_id: User ID to get pending payments for
        """
        try:
            logger.info(f"🔍 Fetching pending payments for user {user_id}")
            
            # Enhanced query with explicit filtering and additional safety checks
            query = {
                "user_id": ObjectId(user_id),
                "requires_payment": True,
                "payment_status": {"$in": ["pending", "failed"]},  # Only truly pending payments
                "admin_amount_set": True,
                "status": {"$ne": "cancelled"},  # Exclude cancelled bookings
                # ENHANCED: Explicitly exclude 'paid' status as additional safety
                "payment_status": {"$ne": "paid"}
            }
            
            # FIXED: Correct the query - the previous query had duplicate payment_status keys
            correct_query = {
                "user_id": ObjectId(user_id),
                "requires_payment": True,
                "admin_amount_set": True,
                "status": {"$ne": "cancelled"},
                "payment_status": {"$in": ["pending", "failed"]}  # This will automatically exclude "paid"
            }
            
            logger.info(f"📋 Pending payments query: {correct_query}")
            
            bookings = list(mongo.db.bookings.find(correct_query))
            
            logger.info(f"📊 Found {len(bookings)} raw pending payment bookings for user {user_id}")
            
            # ENHANCED: Additional client-side filtering for extra safety
            filtered_bookings = []
            for booking in bookings:
                booking_id = booking.get('booking_id', 'Unknown')
                payment_status = booking.get('payment_status')
                requires_payment = booking.get('requires_payment')
                admin_amount_set = booking.get('admin_amount_set')
                
                # Triple-check that this booking truly requires payment
                is_valid_pending = (
                    requires_payment == True and 
                    payment_status in ['pending', 'failed'] and 
                    payment_status != 'paid' and  # Explicit exclusion
                    admin_amount_set == True and
                    booking.get('status') != 'cancelled'
                )
                
                if is_valid_pending:
                    # Convert ObjectId to string for JSON serialization
                    booking["_id"] = str(booking["_id"])
                    booking["user_id"] = str(booking["user_id"])
                    filtered_bookings.append(booking)
                    logger.info(f"✅ Including booking {booking_id} in pending payments")
                else:
                    logger.info(f"❌ Excluding booking {booking_id} - payment_status: {payment_status}, requires_payment: {requires_payment}, admin_amount_set: {admin_amount_set}")
            
            logger.info(f"📈 Final filtered pending payments count: {len(filtered_bookings)}")
            return filtered_bookings
            
        except Exception as e:
            logger.error(f"💥 Error getting pending payment bookings for user {user_id}: {e}")
            return []
    
    @staticmethod
    def get_completed_bookings_for_admin():
        """
        Get all completed bookings that need admin review for amount setting
        """
        try:
            bookings = list(mongo.db.bookings.find({
                "status": "completed",
                "charging_completed": True,
                "admin_amount_set": False
            }))
            
            # Convert ObjectId to string for JSON serialization
            for booking in bookings:
                booking["_id"] = str(booking["_id"])
                booking["user_id"] = str(booking["user_id"])
                
            return bookings
            
        except Exception as e:
            logger.error(f"Error getting completed bookings for admin: {e}")
            return []
    
    @staticmethod
    def cleanup_expired_bookings():
        """
        Mark bookings as completed if their estimated duration has passed
        This should be run periodically as a background task
        """
        try:
            from datetime import datetime, timedelta
            current_time = datetime.utcnow()
            
            # Find bookings that should be completed
            expired_bookings = mongo.db.bookings.find({
                "status": {"$in": ["confirmed", "in_progress"]},
                "booking_datetime": {"$ne": None},
                "$expr": {
                    "$lt": [
                        {"$add": ["$booking_datetime", {"$multiply": ["$estimated_duration", 60000]}]},
                        current_time
                    ]
                }
            })
            
            count = 0
            for booking in expired_bookings:
                # Update status to completed
                mongo.db.bookings.update_one(
                    {"_id": booking["_id"]},
                    {"$set": {"status": "completed", "completed_at": current_time}}
                )
                count += 1
            
            if count > 0:
                logger.info(f"Marked {count} expired bookings as completed")
            
            return count
            
        except Exception as e:
            logger.error(f"Error cleaning up expired bookings: {e}")
            return 0
    
    @staticmethod
    def update_booking_to_pay_later(booking_id):
        """
        Update booking status to pay later (confirmed but payment pending)
        
        Args:
            booking_id: The booking ID
        """
        try:
            logger.info(f"Updating booking {booking_id} to pay later status")
            
            update_data = {
                "status": "confirmed",
                "payment_status": "deferred",
                "updated_at": datetime.datetime.utcnow()
            }
            
            result = mongo.db.bookings.update_one(
                {"booking_id": booking_id},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                logger.info(f"Booking {booking_id} updated to pay later status successfully")
                return True
            else:
                logger.warning(f"No booking found with booking_id: {booking_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error updating booking to pay later: {e}")
            return False 