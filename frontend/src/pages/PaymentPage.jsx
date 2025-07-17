import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../context/useAuth';

const PaymentPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [paymentUrl, setPaymentUrl] = useState('');

  const [booking, setBooking] = useState(null);
  const [station, setStation] = useState(null);
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Initialize booking and station data from location state if available
  useEffect(() => {
    if (location.state?.booking) {
      setBooking(location.state.booking);
    }
    if (location.state?.station) {
      setStation(location.state.station);
    }
  }, [location.state]);

  const fetchBookingForPayment = async (bookingId) => {
    try {
      setLoading(true);
      setError('');

      console.log('Fetching booking details for ID:', bookingId);
      const response = await axios.get(`/bookings/${bookingId}`);
      console.log('Booking API response:', response.data);
      
      if (response.data.success) {
        const bookingData = response.data.booking;
        setBooking(bookingData);
        
        // Fetch station details if available
        if (bookingData.station_id) {
          try {
            const stationResponse = await axios.get(`/stations/${bookingData.station_id}`);
            if (stationResponse.data.success) {
              setStation(stationResponse.data.station);
            }
          } catch (err) {
            console.log('Could not fetch station details');
          }
        }
        
        // Check if payment is ready
        if (bookingData.admin_amount_set && bookingData.requires_payment) {
          // Payment is ready, show payment options
          console.log('Payment ready for booking:', bookingData.booking_id);
          setLoading(false);
        } else {
          setError('Payment amount not yet set by admin');
          setLoading(false);
        }
      } else {
        console.error('Booking API returned success=false:', response.data);
        setError(response.data.error || 'Booking not found');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.error || 'Failed to fetch booking details');
      setLoading(false);
    }
  };

  const initiatePayment = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.post('/payments/initiate-payment', {
        booking_id: booking.booking_id,
        amount: booking.amount_paisa,
        return_url: `${window.location.origin}/payment-success`,
        name: booking.user_name || 'EV User',
        email: booking.user_email || 'user@example.com',
        phone: booking.user_phone || '9800000000'
      });

      if (response.data.success) {
        setPaymentUrl(response.data.payment_url);
        setPaymentStatus('redirecting');
        
        // Redirect to Khalti payment page
        window.location.href = response.data.payment_url;
      } else {
        setError(response.data.error || 'Failed to initiate payment');
        setPaymentStatus('failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Payment initiation failed');
      setPaymentStatus('failed');
    } finally {
      setLoading(false);
    }
  }, [booking]);



  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Handle booking from URL parameters for admin-set amounts
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('booking_id');
    
    console.log('PaymentPage: bookingId from URL:', bookingId);
    console.log('PaymentPage: current booking:', booking);
    
    if (bookingId && !booking) {
      console.log('PaymentPage: Fetching booking for ID:', bookingId);
      fetchBookingForPayment(bookingId);
      return;
    }

    if (!booking) {
      setError('No booking information found');
      setLoading(false);
      return;
    }

    // Check if payment is ready but don't auto-initiate
    if (booking.admin_amount_set && booking.requires_payment) {
      console.log('PaymentPage: Payment ready, displaying payment options');
      setLoading(false);
    } else {
      console.log('PaymentPage: Payment not ready. admin_amount_set:', booking.admin_amount_set, 'requires_payment:', booking.requires_payment);
      setError('Payment not yet available for this booking');
      setLoading(false);
    }
  }, [booking, isAuthenticated, navigate]);

  const handlePaymentSuccess = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get payment token from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const amount = urlParams.get('amount');

      if (!token || !amount) {
        setError('Invalid payment response');
        return;
      }

      // Verify payment with backend
      const response = await axios.post('/payments/verify-payment', {
        token: token,
        amount: parseInt(amount)
      });

      if (response.data.success) {
        setPaymentStatus('success');
        // Redirect to success page or dashboard
        setTimeout(() => {
          navigate('/payment-success', { 
            state: { 
              booking: booking,
              station: station,
              transaction_id: response.data.transaction_id
            }
          });
        }, 2000);
      } else {
        setError(response.data.error || 'Payment verification failed');
        setPaymentStatus('failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Payment verification failed');
      setPaymentStatus('failed');
    } finally {
      setLoading(false);
    }
  }, [booking, station, navigate]);

  const handlePaymentCancel = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  // Check if this is a return from Khalti payment
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const status = urlParams.get('status');

    if (token && status === 'success') {
      handlePaymentSuccess();
    } else if (status === 'cancelled') {
      handlePaymentCancel();
    }
  }, [handlePaymentSuccess, handlePaymentCancel]);

  if (!booking || !station) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
          <div className="text-center">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Loading Payment Information</h2>
                <p className="text-gray-600 mb-6">Please wait while we fetch your booking details...</p>
              </>
            ) : error ? (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Payment Error</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setError('');
                      setLoading(false);
                      const urlParams = new URLSearchParams(window.location.search);
                      const bookingId = urlParams.get('booking_id');
                      if (bookingId) {
                        fetchBookingForPayment(bookingId);
                      }
                    }}
                    className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Retry Loading
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Booking Information Missing</h2>
                <p className="text-gray-600 mb-6">
                  We couldn't find the booking information needed for payment. 
                  This might happen if you accessed this page directly or if the session expired.
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={() => navigate('/recommendations')}
                    className="w-full px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Find Stations to Book
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Payment Status */}
          {paymentStatus === 'pending' && (
            <>
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">💰 Pay for Charging Session</h2>
                <p className="text-gray-600">
                  Your charging session is complete! 
                  <br />
                  <span className="text-sm text-blue-600">Amount set by admin based on actual usage</span>
                </p>
              </div>

              {/* Booking Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-gray-800 mb-3">Booking Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Station:</span>
                    <span className="font-medium">{station.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Charger Type:</span>
                    <span className="font-medium">{booking.charger_type}</span>
                  </div>
                  {booking.booking_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{booking.booking_date}</span>
                    </div>
                  )}
                  {booking.booking_time && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium">{booking.booking_time}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{booking.estimated_duration} minutes</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total Amount:</span>
                      <span className="text-green-600">₹{booking.amount_npr}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Payment Method</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <img 
                      src="https://khalti.com/static/images/logo.png" 
                      alt="Khalti" 
                      className="w-8 h-8 mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-800">Khalti Digital Wallet</p>
                      <p className="text-sm text-gray-600">Secure payment gateway</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={initiatePayment}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    `Pay with Khalti - ₹${booking.amount_npr}`
                  )}
                </button>
                
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {/* Loading State */}
          {loading && paymentStatus === 'redirecting' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Redirecting to Payment</h2>
              <p className="text-gray-600">Please wait while we redirect you to Khalti...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Payment Failed</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="space-y-2">
                <button
                  onClick={initiatePayment}
                  className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}

          {/* Success State */}
          {paymentStatus === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Payment Successful!</h2>
              <p className="text-gray-600">Redirecting to success page...</p>
            </div>
          )}


        </div>
      </div>
    </div>
  );
};

export default PaymentPage; 