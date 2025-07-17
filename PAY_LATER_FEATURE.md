# Pay Later Feature Implementation

## Overview

The Pay Later feature allows users to confirm their charging station bookings without making an immediate online payment. Instead, they can pay the amount at the station when they arrive. This provides flexibility for users who prefer to pay in cash or don't have access to online payment methods.

## Features

### User-Facing Features

1. **Dual Payment Options**: Users can choose between "Pay Now" (online payment) and "Pay Later at Station"
2. **Booking Confirmation**: Pay later bookings are immediately confirmed and show as "confirmed" status
3. **Payment Status Tracking**: Clear indication of payment status (Paid, Payment Pending, Pay at Station, Payment Failed)
4. **Dashboard Integration**: Payment status is visible in the user dashboard
5. **Admin Panel Support**: Admins can view and manage pay later bookings

### Technical Features

1. **New Booking Status**: Support for "deferred" payment status
2. **Backend API**: New endpoint for handling pay later requests
3. **Database Updates**: Enhanced booking model with payment status tracking
4. **Frontend Integration**: Updated UI components to support both payment options

## Implementation Details

### Backend Changes

#### 1. Booking Model Updates (`backend/models/booking.py`)

**New Method Added:**
```python
@staticmethod
def update_booking_to_pay_later(booking_id):
    """
    Update booking status to pay later (confirmed but payment pending)
    """
    update_data = {
        "status": "confirmed",
        "payment_status": "deferred",
        "updated_at": datetime.datetime.utcnow()
    }
    # Updates the booking in the database
```

**Enhanced Payment Status Method:**
```python
@staticmethod
def update_payment_status(booking_id, payment_status, payment_data=None):
    # Now supports 'deferred' payment status
    if payment_status == 'deferred':
        update_data['status'] = 'confirmed'
```

#### 2. Payment Routes (`backend/routes/payment_routes.py`)

**New Endpoint:**
```python
@payment_bp.route('/pay-later/<booking_id>', methods=['POST'])
@require_auth
def pay_later(booking_id):
    """
    Mark a booking for payment later (defer payment)
    """
    # Validates booking ownership
    # Updates booking status to confirmed with deferred payment
    # Returns success response
```

### Frontend Changes

#### 1. Payment Page (`frontend/src/pages/PaymentPage.jsx`)

**New Features:**
- Two prominent buttons: "Pay Now" and "Pay Later at Station"
- Loading states for both payment options
- Success state for pay later confirmation
- Clear messaging about payment at station

**Key Functions:**
```javascript
const handlePayLater = async () => {
    // Calls the pay later API endpoint
    // Shows success message
    // Redirects to dashboard
};
```

#### 2. Booking Details Page (`frontend/src/pages/BookingDetailsPage.jsx`)

**Enhanced Features:**
- Both payment options available for pending payments
- Clear payment status display
- Updated important notes section

#### 3. Dashboard (`frontend/src/pages/Dashboard.jsx`)

**New Features:**
- Payment status badges for each booking
- "Pay Now" button for pending payments
- Amount display for each booking
- Enhanced status color coding

**New Helper Functions:**
```javascript
const getPaymentStatusColor = (paymentStatus) => {
    // Returns appropriate CSS classes for payment status
};

const getPaymentStatusText = (paymentStatus) => {
    // Returns human-readable payment status text
};
```

#### 4. Admin Panel (`frontend/src/admin/pages/AdminBookings.jsx`)

**Enhanced Features:**
- Payment status display in booking table
- Payment information in booking details modal
- Support for all payment statuses

## API Endpoints

### Pay Later Endpoint

**URL:** `POST /api/payments/pay-later/<booking_id>`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Response (Success):**
```json
{
    "success": true,
    "message": "Booking confirmed for payment later",
    "booking_id": "TIMED_cs001_1234567890_1234567890",
    "status": "confirmed",
    "payment_status": "deferred"
}
```

**Response (Error):**
```json
{
    "success": false,
    "error": "Booking not found"
}
```

## Database Schema

### Booking Document Structure

```javascript
{
    "_id": ObjectId,
    "booking_id": "TIMED_cs001_1234567890_1234567890",
    "user_id": ObjectId,
    "station_id": "cs001",
    "status": "confirmed",           // confirmed, pending_payment, etc.
    "payment_status": "deferred",    // paid, pending, deferred, failed
    "amount_npr": 45.0,             // Amount in NPR
    "amount_paisa": 4500,           // Amount in paisa (for Khalti)
    "payment_data": {               // Payment transaction details
        "khalti_idx": "LAcainjoMtM9UVbca9FC5f",
        "amount": 4500,
        "status": "pending"
    },
    "created_at": ISODate,
    "updated_at": ISODate
}
```

## User Flow

### Pay Later Flow

1. **Booking Creation**: User creates a booking through recommendations
2. **Payment Page**: User is redirected to payment page
3. **Payment Choice**: User selects "Pay Later at Station"
4. **Confirmation**: Booking is immediately confirmed
5. **Dashboard**: User sees booking with "Pay at Station" status
6. **Station Visit**: User pays at station when they arrive

### Pay Now Flow (Existing)

1. **Booking Creation**: User creates a booking through recommendations
2. **Payment Page**: User is redirected to payment page
3. **Payment Choice**: User selects "Pay Now"
4. **Khalti Redirect**: User is redirected to Khalti payment page
5. **Payment Processing**: User completes payment on Khalti
6. **Confirmation**: Payment is verified and booking is confirmed

## Status Mapping

### Booking Status
- `pending_payment`: Booking created, payment required
- `confirmed`: Booking confirmed (either paid or deferred)
- `in_progress`: Charging session in progress
- `completed`: Charging session completed
- `cancelled`: Booking cancelled

### Payment Status
- `pending`: Payment initiated but not completed
- `paid`: Payment completed successfully
- `deferred`: Payment deferred to station
- `failed`: Payment failed

## UI/UX Enhancements

### Color Coding
- **Green**: Paid/Confirmed
- **Blue**: Pay at Station (Deferred)
- **Yellow**: Payment Pending
- **Red**: Payment Failed/Cancelled

### Button Styling
- **Pay Now**: Green gradient button
- **Pay Later**: Blue gradient button
- **Cancel**: Gray button

### Success Messages
- Clear confirmation messages
- Important information about station payment
- Redirect instructions

## Testing

### Manual Testing Steps

1. **Create a Booking:**
   - Navigate to recommendations
   - Select a station and create booking
   - Verify redirect to payment page

2. **Test Pay Later:**
   - Click "Pay Later at Station"
   - Verify booking confirmation
   - Check dashboard for "Pay at Station" status

3. **Test Pay Now:**
   - Click "Pay Now"
   - Verify Khalti redirect
   - Complete payment flow

4. **Admin Panel:**
   - Login as admin
   - Check booking management
   - Verify payment status display

### Automated Testing

Run the test script:
```bash
python test_pay_later.py
```

## Security Considerations

1. **Authentication**: All pay later requests require valid user authentication
2. **Authorization**: Users can only defer payment for their own bookings
3. **Validation**: Booking must be in pending_payment status to be deferred
4. **Audit Trail**: All payment status changes are logged with timestamps

## Future Enhancements

1. **Payment Reminders**: Send reminders for deferred payments
2. **Station Integration**: Direct integration with station payment systems
3. **Payment History**: Detailed payment history for users
4. **Refund Support**: Support for refunds on deferred payments
5. **Analytics**: Payment method analytics and reporting

## Troubleshooting

### Common Issues

1. **Booking Not Found**: Ensure booking exists and belongs to user
2. **Invalid Status**: Booking must be in pending_payment status
3. **Authentication Error**: Ensure user is logged in
4. **Database Error**: Check MongoDB connection and permissions

### Debug Steps

1. Check backend logs for error messages
2. Verify booking status in database
3. Test API endpoint directly
4. Check frontend console for errors

## Conclusion

The Pay Later feature provides users with flexible payment options while maintaining the security and reliability of the booking system. The implementation follows best practices for user experience, security, and maintainability. 