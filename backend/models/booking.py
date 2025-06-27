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
                "status": "confirmed",
                "created_at": datetime.datetime.utcnow(),
                "booking_time": datetime.datetime.utcnow(),
                "estimated_duration": booking_data.get('booking_duration', 60),
                "station_details": booking_data.get('station_details', {}),
                "user_location": booking_data.get('user_location', []),
                "distance_to_station": booking_data.get('distance_to_station', 0)
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
        """Find a booking by its booking ID"""
        try:
            logger.info(f"Finding booking by booking_id: {booking_id}")
            
            booking = mongo.db.bookings.find_one({"booking_id": booking_id})
            
            if booking:
                booking["_id"] = str(booking["_id"])
                booking["user_id"] = str(booking["user_id"])
                logger.info(f"Booking found: {booking_id}")
            else:
                logger.info(f"No booking found with booking_id: {booking_id}")
            
            return booking
            
        except Exception as e:
            logger.error(f"Error finding booking by booking_id: {e}")
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
            
            # Count existing bookings for this time slot
            existing_bookings = mongo.db.bookings.count_documents({
                "station_id": station_id,
                "charger_type": charger_type,
                "status": {"$in": ["confirmed", "in_progress"]},
                "booking_datetime": {"$gte": slot_start, "$lt": slot_end}
            })
            
            # Get total slots for this charger type at the station
            # For now, assume each station has 2 slots per charger type
            # This should be fetched from the station data in a real implementation
            total_slots = 2
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
                "status": "confirmed",
                "created_at": datetime.utcnow(),
                "estimated_duration": booking_data.get('booking_duration', 60),
                "station_details": booking_data.get('station_details', {}),
                "user_location": booking_data.get('user_location', []),
                "distance_to_station": booking_data.get('distance_to_station', 0),
                "urgency_level": booking_data.get('urgency_level', 'medium'),
                "plug_type": booking_data.get('plug_type', charger_type)
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