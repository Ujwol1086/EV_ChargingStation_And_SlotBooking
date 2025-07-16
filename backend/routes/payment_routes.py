import os
import time
import json
import requests
import hashlib
import hmac
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv
import logging

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
        
        # Prepare Khalti payment payload
        name = data.get('name') or booking.get('user_name', 'EV User')
        email = data.get('email') or booking.get('user_email', 'user@example.com')
        phone = data.get('phone') or booking.get('user_phone', '9800000000')
        
        # Ensure phone number is in correct format (10 digits for Nepal)
        if phone and len(phone) == 10 and phone.startswith('98'):
            formatted_phone = phone
        else:
            formatted_phone = '9800000000'  # Default Nepal number
        
        khalti_payload = {
            "public_key": KHALTI_PUBLIC_KEY,
            "amount": amount,
            "product_identity": booking_id,
            "product_name": f"EV Charging Booking - {booking.get('station_id', 'Unknown Station')}",
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
            "purchase_order_name": f"EV Charging Booking - {booking.get('station_id', 'Unknown Station')}"
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
    Verify Khalti payment using token
    
    Expected JSON payload:
    {
        "token": str,
        "amount": int
    }
    """
    try:
        if not request.json:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        data = request.json
        token = data.get('token')
        amount = data.get('amount')
        
        if not token or not amount:
            return jsonify({
                'success': False,
                'error': 'Token and amount are required'
            }), 400
        
        # Verify payment with Khalti
        verification_payload = {
            "token": token,
            "amount": amount
        }
        
        try:
            # Check if this is a test environment or if credentials are not set
            if (not KHALTI_SECRET_KEY or not KHALTI_PUBLIC_KEY or 
                KHALTI_SECRET_KEY == 'test_secret_key_12345' or 
                KHALTI_PUBLIC_KEY == 'test_public_key_12345'):
                
                logger.warning("Using test Khalti credentials - providing mock verification response")
                
                # For test mode, we'll use the token as booking_id (since it's passed from frontend)
                # In a real scenario, you'd get the booking_id from the Khalti response
                test_booking_id = f"test_booking_{token[-8:]}"  # Use last 8 chars of token
                
                # Create mock booking details for test mode
                mock_booking = {
                    'booking_id': test_booking_id,
                    'amount_npr': amount / 100,  # Convert paisa to NPR
                    'amount_paisa': amount,
                    'charger_type': 'Type 2',
                    'estimated_duration': 60,
                    'status': 'confirmed',
                    'payment_status': 'paid',
                    'station_id': 'cs001',  # Use a real station ID
                    'user_id': 'test_user',
                    'created_at': time.time(),
                    'booking_time': time.time()
                }
                
                # Update booking status for test
                booking_updated = Booking.update_payment_status(
                    booking_id=test_booking_id,
                    payment_status='paid',
                    payment_data={
                        'khalti_idx': token,
                        'amount': amount,
                        'verified_at': time.time(),
                        'transaction_id': token,
                        'test_mode': True
                    }
                )
                
                return jsonify({
                    'success': True,
                    'message': 'Payment verified successfully (test mode)',
                    'booking_id': test_booking_id,
                    'transaction_id': token,
                    'test_mode': True,
                    'booking': mock_booking
                })
            
            # Real Khalti verification
            response = requests.post(
                f"{KHALTI_BASE_URL}/epayment/lookup/",
                json=verification_payload,
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Key {KHALTI_SECRET_KEY}'
                },
                timeout=30
            )
            
            if response.status_code == 200:
                verification_response = response.json()
                
                if verification_response.get('status') == 'Completed':
                    # Payment successful
                    booking_id = verification_response.get('product_identity')
                    
                    if booking_id:
                        # Get booking details
                        booking_details = Booking.find_by_booking_id(booking_id)
                        
                        if booking_details:
                            # Update booking status
                            booking_updated = Booking.update_payment_status(
                                booking_id=booking_id,
                                payment_status='paid',
                                payment_data={
                                    'khalti_idx': verification_response.get('idx'),
                                    'amount': amount,
                                    'verified_at': time.time(),
                                    'transaction_id': verification_response.get('idx')
                                }
                            )
                            
                            if booking_updated:
                                return jsonify({
                                    'success': True,
                                    'message': 'Payment verified successfully',
                                    'booking_id': booking_id,
                                    'transaction_id': verification_response.get('idx'),
                                    'booking': booking_details
                                })
                            else:
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