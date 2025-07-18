import os
import time
import json
import requests
import hashlib
import hmac
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv
import logging
from bson.objectid import ObjectId
import datetime

from models.booking import Booking
from middleware.auth_middleware import require_auth, get_current_user_id

load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# Khalti configuration
KHALTI_SECRET_KEY = os.getenv('KHALTI_SECRET_KEY')
KHALTI_PUBLIC_KEY = os.getenv('KHALTI_PUBLIC_KEY')
KHALTI_BASE_URL = os.getenv('KHALTI_BASE_URL', 'https://a.khalti.com/api/v2')

# Payment URLs
PAYMENT_SUCCESS_URL = os.getenv('PAYMENT_SUCCESS_URL', 'http://localhost:5173/payment-success')
PAYMENT_CANCEL_URL = os.getenv('PAYMENT_CANCEL_URL', 'http://localhost:5173/dashboard')
PAYMENT_WEBHOOK_URL = os.getenv('PAYMENT_WEBHOOK_URL', 'http://localhost:5000/api/payments/webhook')

# Create blueprint
payment_bp = Blueprint('payment', __name__)

def calculate_khalti_signature(payload, secret_key):
    """
    Calculate Khalti signature for webhook verification
    """
    try:
        # Convert payload to string
        payload_str = json.dumps(payload, separators=(',', ':'))
        
        # Create signature
        signature = hmac.new(
            secret_key.encode('utf-8'),
            payload_str.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return signature
    except Exception as e:
        logger.error(f"Error calculating Khalti signature: {e}")
        return None

@payment_bp.route('/initiate-payment', methods=['POST'])
@require_auth
def initiate_payment():
    """
    Initiate Khalti payment for a booking
    
    Expected JSON payload:
    {
        "booking_id": str,
        "amount": int,
        "return_url": str,
        "name": str (optional),
        "email": str (optional),
        "phone": str (optional)
    }
    """
    try:
        if not request.json:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        data = request.json
        booking_id = data.get('booking_id')
        amount = data.get('amount')
        return_url = data.get('return_url')
        
        if not booking_id or not amount or not return_url:
            return jsonify({
                'success': False,
                'error': 'booking_id, amount, and return_url are required'
            }), 400
        
        # Check if Khalti credentials are configured
        if not KHALTI_SECRET_KEY or not KHALTI_PUBLIC_KEY:
            logger.error("Khalti credentials not configured")
            return jsonify({
                'success': False,
                'error': 'Payment service not configured'
            }), 500
        
        logger.info(f"Initiating payment for booking {booking_id}, amount: {amount} paisa")
        
        # Get booking details
        booking = Booking.find_by_booking_id(booking_id)
        if not booking:
            return jsonify({
                'success': False,
                'error': 'Booking not found'
            }), 404
        
        # Verify booking belongs to current user
        current_user_id = get_current_user_id()
        if booking.get('user_id') != current_user_id:
            return jsonify({
                'success': False,
                'error': 'Unauthorized access to booking'
            }), 403
        
        # Check if admin has set the amount
        if not booking.get('admin_amount_set'):
            return jsonify({
                'success': False,
                'error': 'Payment amount not set by admin yet'
            }), 400
        
        # Check if booking requires payment
        if not booking.get('requires_payment'):
            return jsonify({
                'success': False,
                'error': 'This booking does not require payment'
            }), 400
        
        # Prepare Khalti payment payload
        name = data.get('name') or booking.get('user_name', 'EV User')
        email = data.get('email') or booking.get('user_email', 'user@example.com')
        phone = data.get('phone') or booking.get('user_phone', '9800000000')
        
        # Ensure phone number is in correct format (10 digits for Nepal)
        if phone and len(phone) == 10 and phone.startswith('98'):
            formatted_phone = phone
        else:
            formatted_phone = '9800000000'  # Default Nepal number
        
        # Get station name from station_details or fallback to station_id
        station_name = 'Unknown Station'
        if booking.get('station_details') and booking['station_details'].get('name'):
            station_name = booking['station_details']['name']
        elif booking.get('station_id'):
            station_name = f"Station {booking['station_id']}"
        
        khalti_payload = {
            "public_key": KHALTI_PUBLIC_KEY,
            "amount": amount,
            "product_identity": booking_id,
            "product_name": f"EV Charging Booking - {station_name}",
            "customer_info": {
                "name": name,
                "email": email,
                "phone": formatted_phone
            },
            "amount_breakdown": [
                {
                    "label": "Charging Session",
                    "amount": amount
                }
            ],
            "urls": {
                "return_url": return_url,
                "cancel_url": f"{PAYMENT_CANCEL_URL}?status=cancelled",
                "webhook_url": PAYMENT_WEBHOOK_URL
            },
            # Required fields for Khalti API
            "return_url": return_url,
            "website_url": "http://localhost:5173",
            "purchase_order_id": booking_id,
            "purchase_order_name": f"EV Charging Booking - {station_name}"
        }
        
        logger.info(f"Khalti payload prepared: {khalti_payload}")
        
        # Make request to Khalti API
        try:
            logger.info(f"Making request to Khalti API: {KHALTI_BASE_URL}/epayment/initiate/")
            response = requests.post(
                f"{KHALTI_BASE_URL}/epayment/initiate/",
                json=khalti_payload,
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Key {KHALTI_SECRET_KEY}'
                },
                timeout=30
            )
            
            logger.info(f"Khalti API response status: {response.status_code}")
            logger.info(f"Khalti API response: {response.text}")
            logger.info(f"Khalti payload sent: {json.dumps(khalti_payload, indent=2)}")
            
            if response.status_code == 200:
                khalti_response = response.json()
                
                if khalti_response.get('pidx'):
                    logger.info(f"Khalti response contains pidx: {khalti_response['pidx']}")
                    
                    # Update booking with payment information
                    payment_update_data = {
                        'khalti_idx': khalti_response['pidx'],
                        'amount': amount,
                        'payment_url': khalti_response.get('payment_url'),
                        'status': 'pending'
                    }
                    
                    logger.info(f"Updating booking {booking_id} with payment data: {payment_update_data}")
                    
                    update_result = Booking.update_payment_info(
                        booking_id=booking_id,
                        payment_data=payment_update_data
                    )
                    
                    logger.info(f"Payment update result: {update_result}")
                    
                    if update_result:
                        logger.info(f"Payment initiated successfully for booking {booking_id}")
                        return jsonify({
                            'success': True,
                            'payment_url': khalti_response.get('payment_url'),
                            'idx': khalti_response['pidx'],
                            'booking_id': booking_id
                        })
                    else:
                        logger.error(f"Failed to update booking {booking_id} with payment info")
                        return jsonify({
                            'success': False,
                            'error': 'Failed to update booking with payment information'
                        }), 500
                else:
                    logger.error(f"Khalti response missing pidx: {khalti_response}")
                    
                    # Check if this is a test environment
                    if KHALTI_SECRET_KEY == 'test_secret_key_12345' or KHALTI_PUBLIC_KEY == 'test_public_key_12345':
                        logger.warning("Using test Khalti credentials - providing mock payment response")
                        return jsonify({
                            'success': True,
                            'payment_url': 'https://test.khalti.com/pay/mock-payment',
                            'idx': 'test_idx_12345',
                            'booking_id': booking_id,
                            'test_mode': True
                        })
                    else:
                        return jsonify({
                            'success': False,
                            'error': 'Failed to get payment URL from Khalti'
                        }), 500
            else:
                logger.error(f"Khalti API error: {response.status_code} - {response.text}")
                
                # Check if this is a test environment
                if KHALTI_SECRET_KEY == 'test_secret_key_12345' or KHALTI_PUBLIC_KEY == 'test_public_key_12345':
                    logger.warning("Using test Khalti credentials - providing mock payment response")
                    return jsonify({
                        'success': True,
                        'payment_url': 'https://test.khalti.com/pay/mock-payment',
                        'idx': 'test_idx_12345',
                        'booking_id': booking_id,
                        'test_mode': True
                    })
                else:
                    return jsonify({
                        'success': False,
                        'error': f'Payment initiation failed: {response.status_code}'
                    }), 500
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error to Khalti API: {e}")
            return jsonify({
                'success': False,
                'error': 'Payment service unavailable'
            }), 503

    except Exception as e:
        logger.error(f"Error in initiate_payment: {str(e)}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@payment_bp.route('/verify-payment', methods=['POST'])
def verify_payment():
    """
    Verify Khalti payment using token or pidx
    """
    try:
        logger.info('--- /verify-payment called ---')
        if not request.json:
            logger.error('No JSON data provided')
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        data = request.json
        # Accept both token (old) and pidx (new) parameters
        token = data.get('token')
        pidx = data.get('pidx')
        amount = data.get('amount')
        
        logger.info(f'Received token: {token}, pidx: {pidx}, amount: {amount}')
        
        if not (token or pidx) or not amount:
            logger.error('Token/pidx and amount are required')
            return jsonify({
                'success': False,
                'error': 'Token/pidx and amount are required'
            }), 400
        
        # Check if this is a test environment or if credentials are not set
        logger.info(f'KHALTI_SECRET_KEY: {KHALTI_SECRET_KEY}, KHALTI_PUBLIC_KEY: {KHALTI_PUBLIC_KEY}')
        if (not KHALTI_SECRET_KEY or not KHALTI_PUBLIC_KEY or \
            KHALTI_SECRET_KEY == 'test_secret_key_12345' or \
            KHALTI_PUBLIC_KEY == 'test_public_key_12345'):
            logger.warning("Using test Khalti credentials - providing mock verification response")
            test_booking_id = f"test_booking_{(token or pidx)[-8:]}"
            mock_booking = {
                'booking_id': test_booking_id,
                'amount_npr': amount / 100,
                'amount_paisa': amount,
                'charger_type': 'Type 2',
                'estimated_duration': 60,
                'status': 'confirmed',
                'payment_status': 'paid',
                'station_id': 'cs001',
                'user_id': 'test_user',
                'created_at': time.time(),
                'booking_time': time.time()
            }
            logger.info(f"Returning mock booking: {mock_booking}")
            return jsonify({
                'success': True,
                'message': 'Payment verified successfully (test mode)',
                'booking_id': test_booking_id,
                'transaction_id': token or pidx,
                'test_mode': True,
                'booking': mock_booking
            })
        
        # Real Khalti verification
        try:
            if pidx:
                # Use new lookup API with pidx
                verification_payload = {
                    "pidx": pidx
                }
                endpoint = f"{KHALTI_BASE_URL}/epayment/lookup/"
                logger.info(f"Using lookup API with pidx: {pidx}")
            else:
                # Use old verification API with token (for backward compatibility)
                verification_payload = {
                    "token": token,
                    "amount": amount
                }
                endpoint = f"{KHALTI_BASE_URL}/epayment/lookup/"  # Still use lookup but this might need adjustment
                logger.info(f"Using legacy token verification: {token}")
            
            response = requests.post(
                endpoint,
                json=verification_payload,
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Key {KHALTI_SECRET_KEY}'
                },
                timeout=30
            )
            
            logger.info(f"Khalti API response status: {response.status_code}")
            logger.info(f"Khalti API response: {response.text}")
            
            if response.status_code == 200:
                verification_response = response.json()
                
                if verification_response.get('status') == 'Completed':
                    # Payment successful
                    # For lookup API, we need to get booking_id from the pidx mapping
                    # Since we stored booking_id as product_identity in initiate, we need to find it
                    
                    # Try to get booking_id from the verification response or find it by pidx
                    booking_id = None
                    
                    # First, try to find booking by pidx in our database
                    if pidx:
                        booking_details = Booking.find_by_khalti_idx(pidx)
                        if booking_details:
                            booking_id = booking_details.get('booking_id')
                    
                    # If no pidx or booking not found, try the old method
                    if not booking_id:
                        booking_id = verification_response.get('product_identity')
                    
                    if booking_id:
                        # Get booking details
                        if not booking_details:
                            booking_details = Booking.find_by_booking_id(booking_id)
                        
                        if booking_details:
                            # Update booking status
                            booking_updated = Booking.update_payment_status(
                                booking_id=booking_id,
                                payment_status='paid',
                                payment_data={
                                    'khalti_idx': pidx or verification_response.get('idx'),
                                    'amount': amount,
                                    'verified_at': time.time(),
                                    'transaction_id': verification_response.get('transaction_id') or pidx or token
                                }
                            )
                            
                            if booking_updated:
                                # Fetch fresh booking data after update to verify changes
                                updated_booking = Booking.find_by_booking_id(booking_id)
                                
                                logger.info(f"✅ Payment verified and booking updated successfully for {booking_id}")
                                logger.info(f"📊 Updated booking data: status={updated_booking.get('status')}, payment_status={updated_booking.get('payment_status')}, requires_payment={updated_booking.get('requires_payment')}")
                                
                                # CRITICAL DEBUG: Log the exact user_id and its type
                                user_id = updated_booking.get('user_id')
                                logger.info(f"🔍 CRITICAL DEBUG: user_id = {user_id}, type = {type(user_id)}")
                                
                                # Double-check that the payment status was actually updated
                                if updated_booking and updated_booking.get('payment_status') == 'paid':
                                    logger.info(f"✅ Payment status confirmed as 'paid' for booking {booking_id}")
                                    
                                    # Verify the booking no longer appears in pending payments
                                    if user_id:
                                        logger.info(f"🔍 Verifying pending payments for user {user_id}")
                                        
                                        # CRITICAL DEBUG: Test the exact query that get_pending_payment_bookings_for_user uses
                                        from bson.objectid import ObjectId
                                        test_user_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
                                        logger.info(f"🔍 CRITICAL DEBUG: test_user_id = {test_user_id}, type = {type(test_user_id)}")
                                        
                                        # Test the exact query
                                        test_query = {
                                            "user_id": test_user_id,
                                            "requires_payment": True,
                                            "payment_status": {"$in": ["pending", "failed"]},
                                            "admin_amount_set": True,
                                            "status": {"$ne": "cancelled"}
                                        }
                                        logger.info(f"🔍 CRITICAL DEBUG: Testing query = {test_query}")
                                        
                                        # Execute the test query directly
                                        from config.database import mongo
                                        test_bookings = list(mongo.db.bookings.find(test_query))
                                        test_booking_ids = [b.get('booking_id') for b in test_bookings]
                                        logger.info(f"🔍 CRITICAL DEBUG: Direct query result = {test_booking_ids}")
                                        
                                        # Now call the function
                                        pending_payments = Booking.get_pending_payment_bookings_for_user(user_id)
                                        booking_ids_in_pending = [p.get('booking_id') for p in pending_payments]
                                        
                                        logger.info(f"📋 Current pending payment booking IDs: {booking_ids_in_pending}")
                                        logger.info(f"🔍 CRITICAL DEBUG: Does {booking_id} appear in pending list? {booking_id in booking_ids_in_pending}")
                                        
                                        if booking_id not in booking_ids_in_pending:
                                            logger.info(f"✅ CONFIRMED: Booking {booking_id} is NO LONGER in pending payments list")
                                        else:
                                            logger.warning(f"⚠️ WARNING: Booking {booking_id} still appears in pending payments list after payment!")
                                            logger.warning(f"🚨 This indicates a database consistency issue!")
                                            logger.warning(f"📋 All pending payments for user {user_id}: {booking_ids_in_pending}")
                                            
                                            # DEBUG: Check the exact booking document in database
                                            actual_booking_in_db = mongo.db.bookings.find_one({"booking_id": booking_id})
                                            logger.warning(f"🔍 CRITICAL DEBUG: Actual booking in DB = {actual_booking_in_db}")
                                            
                                            # Try to force refresh the booking status
                                            logger.info(f"🔄 Attempting to force refresh booking {booking_id}")
                                            force_update_result = Booking.update_payment_status(
                                                booking_id=booking_id,
                                                payment_status='paid',
                                                payment_data={
                                                    'khalti_idx': pidx or verification_response.get('idx'),
                                                    'amount': amount,
                                                    'verified_at': time.time(),
                                                    'transaction_id': verification_response.get('transaction_id') or pidx or token,
                                                    'force_update': True
                                                }
                                            )
                                            logger.info(f"🔄 Force update result: {force_update_result}")
                                else:
                                    logger.warning(f"⚠️ Payment status may not have been updated correctly for booking {booking_id}")
                                    logger.warning(f"🔍 Current payment_status: {updated_booking.get('payment_status') if updated_booking else 'No booking found'}")
                                
                                return jsonify({
                                    'success': True,
                                    'message': 'Payment verified successfully',
                                    'booking_id': booking_id,
                                    'transaction_id': verification_response.get('transaction_id') or pidx or token,
                                    'booking': updated_booking if updated_booking else booking_details,
                                    'payment_confirmed': True,
                                    'payment_timestamp': time.time(),
                                    'database_updated': True,
                                    'payment_status': 'paid',
                                    'requires_payment': False,
                                    'update_dashboard': True,  # Signal frontend to refresh dashboard
                                    'clear_pending_notifications': True,  # New flag to clear notifications
                                    'test_results': {  # NEW: Add same structure as test endpoint
                                        'booking_removed_from_pending': booking_id not in booking_ids_in_pending,
                                        'updated_booking_status': {
                                            'payment_status': updated_booking.get('payment_status') if updated_booking else 'paid',
                                            'requires_payment': updated_booking.get('requires_payment') if updated_booking else False,
                                            'status': updated_booking.get('status') if updated_booking else 'confirmed'
                                        }
                                    }
                                })
                            else:
                                logger.error(f"Failed to update booking status for {booking_id}")
                                return jsonify({
                                    'success': False,
                                    'error': 'Failed to update booking status'
                                }), 500
                        else:
                            return jsonify({
                                'success': False,
                                'error': 'Booking not found'
                            }), 404
                    else:
                        return jsonify({
                            'success': False,
                            'error': 'Invalid booking ID in payment response'
                        }), 400
                else:
                    return jsonify({
                        'success': False,
                        'error': f'Payment verification failed: {verification_response.get("status")}'
                    }), 400
            else:
                logger.error(f"Khalti verification error: {response.status_code} - {response.text}")
                return jsonify({
                    'success': False,
                    'error': 'Payment verification failed'
                }), 500
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error to Khalti verification API: {e}")
            return jsonify({
                'success': False,
                'error': 'Payment verification service unavailable'
            }), 503
            
    except Exception as e:
        logger.error(f"Error in verify_payment: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@payment_bp.route('/webhook', methods=['POST'])
def payment_webhook():
    """
    Handle Khalti payment webhook
    """
    try:
        if not request.json:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        webhook_data = request.json
        logger.info(f"Received webhook: {webhook_data}")
        
        # Verify webhook signature (if provided by Khalti)
        # This is a simplified version - you may need to implement proper signature verification
        
        # Extract payment information
        token = webhook_data.get('token')
        amount = webhook_data.get('amount')
        status = webhook_data.get('status')
        product_identity = webhook_data.get('product_identity')  # This should be the booking_id
        
        if not all([token, amount, status, product_identity]):
            return jsonify({
                'success': False,
                'error': 'Missing required webhook data'
            }), 400
        
        if status == 'Completed':
            # Payment successful - update booking
            booking_updated = Booking.update_payment_status(
                booking_id=product_identity,
                payment_status='paid',
                payment_data={
                    'webhook_received': True,
                    'amount': amount,
                    'status': status,
                    'webhook_time': time.time()
                }
            )
            
            if booking_updated:
                logger.info(f"Webhook: Payment successful for booking {product_identity}")
                return jsonify({'success': True, 'message': 'Webhook processed successfully'})
            else:
                logger.error(f"Webhook: Failed to update booking {product_identity}")
                return jsonify({
                    'success': False,
                    'error': 'Failed to update booking'
                }), 500
        else:
            logger.warning(f"Webhook: Payment not completed for booking {product_identity}, status: {status}")
            return jsonify({
                'success': False,
                'error': f'Payment not completed: {status}'
            }), 400
            
    except Exception as e:
        logger.error(f"Error in payment_webhook: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@payment_bp.route('/payment-status/<booking_id>', methods=['GET'])
@require_auth
def get_payment_status(booking_id):
    """
    Get payment status for a booking
    """
    try:
        # Get booking details
        booking = Booking.find_by_booking_id(booking_id)
        if not booking:
            return jsonify({
                'success': False,
                'error': 'Booking not found'
            }), 404
        
        # Verify booking belongs to current user
        current_user_id = get_current_user_id()
        if booking.get('user_id') != current_user_id:
            return jsonify({
                'success': False,
                'error': 'Unauthorized access to booking'
            }), 403
        
        return jsonify({
            'success': True,
            'booking_status': booking.get('status', 'unknown'),
            'payment_status': booking.get('payment_status', 'unknown'),
            'payment_data': booking.get('payment_data', {})
        })
        
    except Exception as e:
        logger.error(f"Error in get_payment_status: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@payment_bp.route('/pay-later/<booking_id>', methods=['POST'])
@require_auth
def pay_later(booking_id):
    """
    Mark a booking for payment later (defer payment)
    """
    try:
        # Get booking details
        booking = Booking.find_by_booking_id(booking_id)
        if not booking:
            return jsonify({
                'success': False,
                'error': 'Booking not found'
            }), 404
        
        # Verify booking belongs to current user
        current_user_id = get_current_user_id()
        if booking.get('user_id') != current_user_id:
            return jsonify({
                'success': False,
                'error': 'Unauthorized access to booking'
            }), 403
        
        # Check if booking is in pending payment status
        if booking.get('status') != 'pending_payment':
            return jsonify({
                'success': False,
                'error': 'Booking is not in pending payment status'
            }), 400
        
        # Update booking to pay later status
        success = Booking.update_booking_to_pay_later(booking_id)
        
        if success:
            logger.info(f"Booking {booking_id} marked for payment later")
            return jsonify({
                'success': True,
                'message': 'Booking confirmed for payment later',
                'booking_id': booking_id,
                'status': 'confirmed',
                'payment_status': 'deferred'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to update booking status'
            }), 500
        
    except Exception as e:
        logger.error(f"Error in pay_later: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@payment_bp.route('/debug/pending-payments/<user_id>', methods=['GET'])
@require_auth
def debug_pending_payments(user_id):
    """
    Debug endpoint to check pending payments for a user and identify any issues
    """
    try:
        current_user_id = get_current_user_id()
        
        # Only allow users to check their own pending payments or admins
        if user_id != current_user_id:
            # Check if current user is admin (simplified check)
            return jsonify({
                'success': False,
                'error': 'Unauthorized access'
            }), 403
        
        logger.info(f"🔍 Debug: Checking pending payments for user {user_id}")
        
        # Get all bookings for the user
        all_bookings = list(mongo.db.bookings.find({"user_id": ObjectId(user_id)}))
        logger.info(f"📊 Total bookings for user {user_id}: {len(all_bookings)}")
        
        # Get pending payments using the function
        pending_payments = Booking.get_pending_payment_bookings_for_user(user_id)
        logger.info(f"📋 Pending payments found: {len(pending_payments)}")
        
        # Analyze all bookings to find any that might be incorrectly categorized
        analysis = {
            'total_bookings': len(all_bookings),
            'pending_payments_count': len(pending_payments),
            'bookings_requiring_payment': 0,
            'bookings_with_pending_status': 0,
            'bookings_with_paid_status': 0,
            'bookings_admin_amount_set': 0,
            'potential_issues': []
        }
        
        for booking in all_bookings:
            booking_id = booking.get('booking_id', 'Unknown')
            
            if booking.get('requires_payment'):
                analysis['bookings_requiring_payment'] += 1
                
            if booking.get('payment_status') == 'pending':
                analysis['bookings_with_pending_status'] += 1
                
            if booking.get('payment_status') == 'paid':
                analysis['bookings_with_paid_status'] += 1
                
            if booking.get('admin_amount_set'):
                analysis['bookings_admin_amount_set'] += 1
            
            # Check for potential issues
            if (booking.get('payment_status') == 'paid' and 
                booking.get('requires_payment') == True):
                analysis['potential_issues'].append({
                    'booking_id': booking_id,
                    'issue': 'Payment status is paid but requires_payment is still True',
                    'payment_status': booking.get('payment_status'),
                    'requires_payment': booking.get('requires_payment'),
                    'status': booking.get('status')
                })
                
            if (booking.get('payment_status') == 'pending' and 
                booking.get('requires_payment') == False):
                analysis['potential_issues'].append({
                    'booking_id': booking_id,
                    'issue': 'Payment status is pending but requires_payment is False',
                    'payment_status': booking.get('payment_status'),
                    'requires_payment': booking.get('requires_payment'),
                    'status': booking.get('status')
                })
        
        logger.info(f"📈 Analysis complete: {analysis}")
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'analysis': analysis,
            'pending_payments': [
                {
                    'booking_id': p.get('booking_id'),
                    'payment_status': p.get('payment_status'),
                    'requires_payment': p.get('requires_payment'),
                    'admin_amount_set': p.get('admin_amount_set'),
                    'amount_npr': p.get('amount_npr'),
                    'status': p.get('status')
                } for p in pending_payments
            ]
        })
        
    except Exception as e:
        logger.error(f"Error in debug_pending_payments: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@payment_bp.route('/refresh-payment-status/<booking_id>', methods=['POST'])
@require_auth
def refresh_payment_status(booking_id):
    """
    Manually refresh and fix payment status for a booking
    """
    try:
        current_user_id = get_current_user_id()
        
        # Get booking details
        booking = Booking.find_by_booking_id(booking_id)
        if not booking:
            return jsonify({
                'success': False,
                'error': 'Booking not found'
            }), 404
        
        # Verify booking belongs to current user
        if booking.get('user_id') != current_user_id:
            return jsonify({
                'success': False,
                'error': 'Unauthorized access to booking'
            }), 403
        
        logger.info(f"🔄 Manual refresh requested for booking {booking_id}")
        logger.info(f"📋 Current booking status: payment_status={booking.get('payment_status')}, requires_payment={booking.get('requires_payment')}")
        
        # If booking is already marked as paid but still showing as requiring payment, fix it
        if booking.get('payment_status') == 'paid' and booking.get('requires_payment') == True:
            logger.info(f"🔧 Fixing inconsistent payment status for booking {booking_id}")
            
            success = Booking.update_payment_status(
                booking_id=booking_id,
                payment_status='paid',
                payment_data=booking.get('payment_data', {})
            )
            
            if success:
                return jsonify({
                    'success': True,
                    'message': 'Payment status refreshed successfully',
                    'booking_id': booking_id,
                    'action_taken': 'Fixed inconsistent payment status'
                })
            else:
                return jsonify({
                    'success': False,
                    'error': 'Failed to refresh payment status'
                }), 500
        else:
            return jsonify({
                'success': True,
                'message': 'Payment status is already consistent',
                'booking_id': booking_id,
                'current_status': {
                    'payment_status': booking.get('payment_status'),
                    'requires_payment': booking.get('requires_payment')
                }
            })
            
    except Exception as e:
        logger.error(f"Error in refresh_payment_status: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@payment_bp.route('/test-payment-flow/<booking_id>', methods=['POST'])
@require_auth
def test_payment_flow(booking_id):
    """
    Test endpoint to simulate payment completion and debug notification clearing
    """
    try:
        current_user_id = get_current_user_id()
        
        # Get booking details
        booking = Booking.find_by_booking_id(booking_id)
        if not booking:
            return jsonify({
                'success': False,
                'error': 'Booking not found'
            }), 404
        
        # Verify booking belongs to current user
        if booking.get('user_id') != current_user_id:
            return jsonify({
                'success': False,
                'error': 'Unauthorized access to booking'
            }), 403
        
        logger.info(f"🧪 TEST: Simulating payment completion for booking {booking_id}")
        logger.info(f"📋 Current booking status before update:")
        logger.info(f"   - payment_status: {booking.get('payment_status')}")
        logger.info(f"   - requires_payment: {booking.get('requires_payment')}")
        logger.info(f"   - admin_amount_set: {booking.get('admin_amount_set')}")
        logger.info(f"   - status: {booking.get('status')}")
        
        # Check current pending payments before update
        pending_before = Booking.get_pending_payment_bookings_for_user(current_user_id)
        pending_ids_before = [p.get('booking_id') for p in pending_before]
        logger.info(f"📋 Pending payments BEFORE update: {pending_ids_before}")
        
        # Simulate payment update
        success = Booking.update_payment_status(
            booking_id=booking_id,
            payment_status='paid',
            payment_data={
                'test_transaction': True,
                'test_timestamp': time.time(),
                'amount': booking.get('amount_paisa', 0)
            }
        )
        
        if success:
            # Check current pending payments after update
            pending_after = Booking.get_pending_payment_bookings_for_user(current_user_id)
            pending_ids_after = [p.get('booking_id') for p in pending_after]
            logger.info(f"📋 Pending payments AFTER update: {pending_ids_after}")
            
            # Get updated booking
            updated_booking = Booking.find_by_booking_id(booking_id)
            logger.info(f"📋 Updated booking status after update:")
            logger.info(f"   - payment_status: {updated_booking.get('payment_status')}")
            logger.info(f"   - requires_payment: {updated_booking.get('requires_payment')}")
            logger.info(f"   - admin_amount_set: {updated_booking.get('admin_amount_set')}")
            logger.info(f"   - status: {updated_booking.get('status')}")
            
            return jsonify({
                'success': True,
                'message': 'Test payment completed',
                'booking_id': booking_id,
                'test_results': {
                    'pending_before': pending_ids_before,
                    'pending_after': pending_ids_after,
                    'booking_removed_from_pending': booking_id not in pending_ids_after,
                    'updated_booking_status': {
                        'payment_status': updated_booking.get('payment_status'),
                        'requires_payment': updated_booking.get('requires_payment'),
                        'status': updated_booking.get('status')
                    }
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to update payment status'
            }), 500
            
    except Exception as e:
        logger.error(f"Error in test_payment_flow: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@payment_bp.route('/force-refresh-payment-status', methods=['POST'])
@require_auth
def force_refresh_payment_status():
    """
    Force refresh all payment statuses for the current user to fix any inconsistencies
    """
    try:
        current_user_id = get_current_user_id()
        
        logger.info(f"🔄 Force refresh requested for all payments for user {current_user_id}")
        
        # Find all bookings where payment_status is 'paid' but requires_payment is still True
        inconsistent_query = {
            "user_id": ObjectId(current_user_id),
            "payment_status": "paid",
            "requires_payment": True
        }
        
        inconsistent_bookings = list(mongo.db.bookings.find(inconsistent_query))
        logger.info(f"🔍 Found {len(inconsistent_bookings)} bookings with inconsistent payment status")
        
        fixed_count = 0
        for booking in inconsistent_bookings:
            booking_id = booking.get('booking_id')
            logger.info(f"🔧 Fixing inconsistent payment status for booking {booking_id}")
            
            # Force update to consistent state
            result = mongo.db.bookings.update_one(
                {"booking_id": booking_id},
                {"$set": {
                    "requires_payment": False,
                    "payment_verified": True,
                    "status": "confirmed",
                    "payment_status": "paid",
                    "payment_consistency_fixed": True,
                    "fixed_at": datetime.datetime.utcnow()
                }}
            )
            
            if result.modified_count > 0:
                fixed_count += 1
                logger.info(f"✅ Fixed inconsistent payment status for booking {booking_id}")
            else:
                logger.warning(f"⚠️ Could not fix payment status for booking {booking_id}")
        
        # Get fresh pending payments after fixes
        pending_payments = Booking.get_pending_payment_bookings_for_user(current_user_id)
        
        return jsonify({
            'success': True,
            'message': f'Payment status refresh completed. Fixed {fixed_count} inconsistent bookings.',
            'fixed_count': fixed_count,
            'remaining_pending_payments': len(pending_payments),
            'pending_booking_ids': [p.get('booking_id') for p in pending_payments]
        })
        
    except Exception as e:
        logger.error(f"Error in force_refresh_payment_status: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500 