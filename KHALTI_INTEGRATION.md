# Khalti Payment Integration for EVConnectNepal

This document describes the complete Khalti payment integration implementation for the EVConnectNepal project.

## Overview

The payment system integrates Khalti's digital wallet payment gateway to handle EV charging station bookings. Users can securely pay for their charging sessions using Khalti's payment platform.

## Features

- **Secure Payment Processing**: Integration with Khalti's official API
- **Real-time Payment Verification**: Automatic payment status verification
- **Webhook Support**: Server-to-server payment notifications
- **User-friendly Interface**: Clean payment flow with status updates
- **Error Handling**: Comprehensive error handling and user feedback
- **Test Mode Support**: Mock payment URLs for development

## Backend Implementation

### Files Created/Modified

1. **`backend/routes/payment_routes.py`** - Main payment API endpoints
2. **`backend/models/booking.py`** - Updated with payment methods
3. **`backend/server.py`** - Added payment routes registration

### API Endpoints

#### 1. Initiate Payment
```
POST /api/payments/initiate-payment
```

**Request Body:**
```json
{
  "booking_id": "string",
  "amount": 1500,
  "return_url": "http://localhost:5173/payment-success",
  "name": "User Name",
  "email": "user@example.com",
  "phone": "9800000000"
}
```

**Response:**
```json
{
  "success": true,
  "payment_url": "https://test-pay.khalti.com/?pidx=LAcainjoMtM9UVbca9FC5f",
  "idx": "LAcainjoMtM9UVbca9FC5f",
  "booking_id": "TIMED_cs001_1234567890_1234567890"
}
```

#### 2. Verify Payment
```
POST /api/payments/verify-payment
```

**Request Body:**
```json
{
  "token": "string",
  "amount": 1500
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "booking_id": "TIMED_cs001_1234567890_1234567890",
  "transaction_id": "LAcainjoMtM9UVbca9FC5f"
}
```

#### 3. Payment Status
```
GET /api/payments/payment-status/{booking_id}
```

**Response:**
```json
{
  "success": true,
  "booking_status": "pending_payment",
  "payment_status": "pending",
  "payment_data": {}
}
```

#### 4. Payment Webhook
```
POST /api/payments/webhook
```

Handles server-to-server payment notifications from Khalti.

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Khalti Configuration
KHALTI_SECRET_KEY=your_secret_key_here
KHALTI_PUBLIC_KEY=your_public_key_here
KHALTI_BASE_URL=https://a.khalti.com/api/v2

# For testing (optional)
KHALTI_SECRET_KEY=test_secret_key_12345
KHALTI_PUBLIC_KEY=test_public_key_12345
```

## Frontend Implementation

### Files Created/Modified

1. **`frontend/src/pages/PaymentPage.jsx`** - Payment initiation and processing
2. **`frontend/src/pages/PaymentSuccessPage.jsx`** - Payment success confirmation
3. **`frontend/src/pages/BookingDetailsPage.jsx`** - Booking details before payment
4. **`frontend/src/App.jsx`** - Added payment routes

### Payment Flow

1. **Booking Creation**: User creates a booking through recommendations
2. **Booking Details**: User reviews booking details on BookingDetailsPage
3. **Payment Initiation**: User clicks "Proceed to Payment" → PaymentPage
4. **Khalti Redirect**: User is redirected to Khalti payment page
5. **Payment Processing**: User completes payment on Khalti
6. **Return to App**: User is redirected back to PaymentSuccessPage
7. **Payment Verification**: Backend verifies payment with Khalti
8. **Booking Confirmation**: Booking status updated to "confirmed"

### Route Configuration

Add these routes to your React Router configuration:

```jsx
import PaymentPage from './pages/PaymentPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import BookingDetailsPage from './pages/BookingDetailsPage';

// In your Routes component
<Route path="/payment" element={<PaymentPage />} />
<Route path="/payment-success" element={<PaymentSuccessPage />} />
<Route path="/booking-details/:bookingId" element={<BookingDetailsPage />} />
```

## Database Schema Updates

### Booking Model Updates

The booking model now includes payment-related fields:

```javascript
{
  // ... existing fields
  "payment_status": "pending", // pending, paid, failed
  "payment_data": {
    "khalti_idx": "LAcainjoMtM9UVbca9FC5f",
    "amount": 1500,
    "payment_url": "https://test-pay.khalti.com/?pidx=...",
    "status": "pending",
    "verified_at": 1234567890,
    "transaction_id": "LAcainjoMtM9UVbca9FC5f"
  }
}
```

## Testing

### Test Scripts

1. **`backend/test_khalti_debug.py`** - Test Khalti API directly
2. **`backend/test_booking_debug.py`** - Test booking and payment flow
3. **`backend/test_complete_flow.py`** - End-to-end testing

### Manual Testing

1. **Create a booking** through the frontend
2. **Navigate to payment** from booking details
3. **Complete payment** on Khalti test page
4. **Verify success** on payment success page
5. **Check booking status** in dashboard

## Error Handling

### Common Errors

1. **500 Internal Server Error**: Usually indicates missing environment variables or API key issues
2. **401 Unauthorized**: Invalid or missing Khalti API keys
3. **400 Bad Request**: Invalid payload structure
4. **Booking not found**: Booking ID mismatch or database issues

### Debugging

1. Check backend logs for detailed error messages
2. Verify environment variables are set correctly
3. Test Khalti API directly using test scripts
4. Check database connection and booking data

## Security Considerations

1. **API Key Security**: Store Khalti API keys in environment variables
2. **Webhook Verification**: Implement proper signature verification for webhooks
3. **User Authorization**: Verify booking ownership before payment operations
4. **HTTPS**: Ensure all payment communications use HTTPS
5. **Input Validation**: Validate all payment-related inputs

## Production Deployment

### Requirements

1. **Valid Khalti Account**: Register with Khalti for production API keys
2. **SSL Certificate**: HTTPS is required for payment processing
3. **Webhook URL**: Configure webhook URL in Khalti dashboard
4. **Error Monitoring**: Set up error tracking and logging

### Configuration

1. Update environment variables with production Khalti keys
2. Configure webhook URL in Khalti dashboard
3. Set up proper logging and monitoring
4. Test payment flow in production environment

## Troubleshooting

### Payment Not Initiating

1. Check Khalti API keys in environment variables
2. Verify booking exists in database
3. Check network connectivity to Khalti API
4. Review backend logs for error details

### Payment Verification Failing

1. Verify token and amount match original payment
2. Check Khalti API response for status
3. Ensure booking ID matches in verification
4. Review payment data in database

### Frontend Issues

1. Check React Router configuration
2. Verify API endpoint URLs
3. Check browser console for JavaScript errors
4. Ensure authentication state is correct

## Support

For issues related to:

- **Khalti API**: Contact Khalti support
- **Backend Integration**: Check logs and test scripts
- **Frontend Issues**: Review browser console and network tab
- **Database Issues**: Verify MongoDB connection and data

## Future Enhancements

1. **Multiple Payment Methods**: Add support for other payment gateways
2. **Refund Processing**: Implement automatic refund handling
3. **Payment Analytics**: Add payment success rate tracking
4. **SMS Notifications**: Send payment status updates via SMS
5. **Email Receipts**: Generate and send payment receipts via email 