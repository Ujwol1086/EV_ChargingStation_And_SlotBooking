import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import axios from '../api/axios';

const PaymentSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  // State for booking and station data
  const [booking, setBooking] = useState(location.state?.booking);
  const [station, setStation] = useState(location.state?.station);
  const [transaction_id, setTransactionId] = useState(location.state?.transaction_id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get data from URL parameters (when Khalti redirects back)
  const token = searchParams.get('token');
  const amount = searchParams.get('amount');
  const status = searchParams.get('status');
  
  // Get actual Khalti parameters
  const pidx = searchParams.get('pidx');
  const purchase_order_id = searchParams.get('purchase_order_id');
  const transaction_id_param = searchParams.get('transaction_id');
  const txn_id = searchParams.get('txn_id');
  const tidx = searchParams.get('tidx');

  // Add detailed logging
  console.log('PaymentSuccessPage URL params:', {
    token,
    amount,
    status,
    pidx,
    purchase_order_id,
    transaction_id_param,
    txn_id,
    tidx,
    allParams: Object.fromEntries(searchParams.entries()),
    locationState: location.state,
    currentBooking: booking,
    currentStation: station
  });

  useEffect(() => {
    console.log('PaymentSuccessPage useEffect triggered:', {
      hasBooking: !!booking,
      hasStation: !!station,
      token,
      pidx,
      transaction_id_param,
      txn_id,
      tidx,
      status,
      amount,
      purchase_order_id
    });

    // If we don't have booking data from location state, try to get it from URL params
    if (!booking) {
      // Check if this is a successful Khalti payment (status should be 'Completed')
      if (status === 'Completed' && purchase_order_id) {
        // For successful payments, booking_id is in purchase_order_id
        console.log('Khalti successful payment detected, fetching booking by ID:', purchase_order_id);
        fetchBookingById(purchase_order_id);
        // Set transaction ID for display
        const actualTransactionId = transaction_id_param || txn_id || tidx || pidx;
        if (actualTransactionId) {
          setTransactionId(actualTransactionId);
        }
      } else {
        // Fallback to old verification method for backward compatibility
        const paymentToken = token || pidx || transaction_id_param || txn_id || tidx;
        const paymentAmount = amount;
        
        if (paymentToken && paymentAmount && (status === 'success' || status === 'completed' || status === 'Completed')) {
          console.log('Attempting to fetch booking from payment verification...');
          fetchBookingFromPayment(paymentToken, paymentAmount);
        } else if (purchase_order_id) {
          // If we have booking ID but no clear status, try to fetch booking directly
          console.log('Attempting to fetch booking by booking ID without status check...');
          fetchBookingById(purchase_order_id);
        } else {
          console.log('Insufficient parameters for payment verification:', {
            paymentToken,
            paymentAmount,
            status,
            purchase_order_id
          });
        }
      }
    } else if (booking && !station) {
      // If we have booking but no station, fetch station details
      if (booking.station_id) {
        console.log('Fetching station details for existing booking...');
        fetchStationDetails(booking.station_id);
      }
    } else {
      console.log('No action needed in useEffect:', {
        reason: 'already have booking and station'
      });
    }
  }, [token, pidx, transaction_id_param, txn_id, tidx, status, amount, purchase_order_id, booking, station]);

  const fetchBookingById = async (bookingId) => {
    try {
      setLoading(true);
      setError('');

      console.log('Fetching booking by ID:', bookingId);

      // Get booking details directly
      const response = await axios.get(`/bookings/${bookingId}`);

      console.log('Booking fetch response:', response.data);

      if (response.data.success) {
        const bookingData = response.data.booking;
        console.log('Setting booking data from direct fetch:', bookingData);
        setBooking(bookingData);
        
        // Fetch station details if available
        if (bookingData.station_id) {
          console.log('Fetching station details for station_id:', bookingData.station_id);
          await fetchStationDetails(bookingData.station_id);
        }
      } else {
        console.error('Booking fetch failed:', response.data);
        setError(response.data.error || 'Failed to fetch booking details');
      }
    } catch (err) {
      console.error('Booking fetch error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.error || 'Failed to fetch booking details');
    } finally {
      setLoading(false);
    }
  };

  const triggerDashboardRefresh = () => {
    // Store a flag in localStorage to trigger dashboard refresh
    localStorage.setItem('payment_completed', 'true');
    localStorage.setItem('payment_timestamp', Date.now().toString());
    
    // Also trigger a more immediate refresh using a different flag
    localStorage.setItem('force_immediate_refresh', 'true');
    
    // Store payment completion details for dashboard notification
    if (booking && transaction_id) {
      localStorage.setItem('payment_completion_details', JSON.stringify({
        bookingId: booking.booking_id,
        transactionId: transaction_id,
        amount: booking.amount_npr,
        stationName: booking.station_details?.name || `Station ${booking.station_id}`,
        completedAt: new Date().toISOString()
      }));
    }
    
    console.log('Dashboard refresh triggered with payment completion flags');
  };

  const fetchBookingFromPayment = async (paymentToken, paymentAmount) => {
    try {
      setLoading(true);
      setError('');

      console.log('Verifying payment with token:', paymentToken, 'amount:', paymentAmount);

      // Determine if this is a pidx or token
      const isKhaltiPidx = paymentToken === pidx;
      const verificationPayload = isKhaltiPidx ? 
        { pidx: paymentToken, amount: parseInt(paymentAmount) } : 
        { token: paymentToken, amount: parseInt(paymentAmount) };

      console.log('Verification payload:', verificationPayload);

      // Verify payment and get booking details
      const response = await axios.post('/payments/verify-payment', verificationPayload);

      console.log('Payment verification response:', response.data);

      if (response.data.success) {
        const bookingId = response.data.booking_id;
        setTransactionId(response.data.transaction_id);

        console.log('Payment verification successful:', {
          bookingId,
          transactionId: response.data.transaction_id,
          hasBookingData: !!response.data.booking,
          bookingData: response.data.booking,
          testMode: response.data.test_mode,
          updateDashboard: response.data.update_dashboard,
          paymentStatus: response.data.payment_status,
          requiresPayment: response.data.requires_payment
        });

        // Use booking data from verification response
        if (response.data.booking) {
          console.log('Setting booking data:', response.data.booking);
          setBooking(response.data.booking);
          
          // Check if this is test mode
          if (response.data.test_mode) {
            // For test mode, create a mock station
            const mockStation = {
              id: 'test_station',
              name: 'Test Charging Station',
              location: {
                address: 'Test Location, Kathmandu',
                coordinates: [27.7172, 85.3240]
              },
              telephone: '+977-1-4XXXXXX',
              pricing: '₹50/hour'
            };
            console.log('Setting mock station for test mode:', mockStation);
            setStation(mockStation);
          } else {
            // Fetch station details for real payments
            console.log('Fetching station details for station_id:', response.data.booking.station_id);
            await fetchStationDetails(response.data.booking.station_id);
          }
        } else {
          console.error('No booking data in verification response');
          setError('No booking data received from payment verification');
        }

        // Enhanced dashboard refresh for successful payments
        if (response.data.payment_status === 'paid' && response.data.update_dashboard) {
          console.log('Payment confirmed as paid, triggering enhanced dashboard refresh...');
          console.log('Payment verification response:', response.data);
          
          // Store multiple completion flags for maximum reliability
          localStorage.setItem('payment_completed', 'true');
          localStorage.setItem('payment_verified', 'true');
          localStorage.setItem('payment_status_paid', 'true');
          localStorage.setItem('clear_pending_payments', 'true');
          localStorage.setItem('booking_payment_completed', bookingId);
          
          // NEW: Additional flags for immediate notification clearing
          if (response.data.clear_pending_notifications) {
            localStorage.setItem('clear_pending_notifications', 'true');
            localStorage.setItem('payment_notification_cleared', bookingId);
            localStorage.setItem('force_dashboard_refresh', 'true');
          }
          
          // NEW: Store a list of paid booking IDs for exclusion
          const existingPaidBookings = localStorage.getItem('paid_booking_ids');
          const paidBookingIds = existingPaidBookings ? JSON.parse(existingPaidBookings) : [];
          if (!paidBookingIds.includes(bookingId)) {
            paidBookingIds.push(bookingId);
            localStorage.setItem('paid_booking_ids', JSON.stringify(paidBookingIds));
          }
          
          // Store detailed payment completion info
          localStorage.setItem('payment_completion_details', JSON.stringify({
            bookingId: bookingId,
            transactionId: response.data.transaction_id,
            amount: response.data.booking?.amount_npr || 'Unknown',
            stationName: response.data.booking?.station_details?.name || 'Unknown Station',
            completedAt: new Date().toISOString(),
            paymentStatus: 'paid',
            databaseUpdated: response.data.database_updated,
            testResults: response.data.test_results
          }));
          
          // NEW: Log the success for debugging (similar to test button)
          console.log('✅ Payment verification completed successfully!');
          console.log('📊 Payment test results:', response.data.test_results);
          if (response.data.test_results?.booking_removed_from_pending) {
            console.log('✅ Booking confirmed as removed from pending payments');
          } else {
            console.log('⚠️ Booking may still appear in pending payments - will be cleared by localStorage flags');
          }
          
          triggerDashboardRefresh();
        } else {
          triggerDashboardRefresh();
        }
      } else {
        console.error('Payment verification failed:', response.data);
        setError(response.data.error || 'Payment verification failed');
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.error || 'Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  const fetchStationDetails = async (stationId) => {
    try {
      console.log('Fetching station details for:', stationId);
      const stationResponse = await axios.get(`/stations/${stationId}`);
      if (stationResponse.data.success) {
        setStation(stationResponse.data.station);
      } else {
        console.error('Failed to fetch station details:', stationResponse.data);
        setError('Failed to fetch station details');
      }
    } catch (err) {
      console.error('Station fetch error:', err);
      setError('Failed to fetch station details');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Verifying Payment</h2>
            <p className="text-gray-600">Please wait while we verify your payment...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Payment Verification Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => navigate('/recommendations')}
                className="w-full px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Book Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show invalid state if no booking data
  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Loading Payment Information...</h2>
            <p className="text-gray-600 mb-6">
              {loading ? (
                "Please wait while we verify your payment..."
              ) : (
                <>
                  Payment completed but booking details are being retrieved.
                  <div className="mt-4 text-left bg-gray-100 p-3 rounded text-xs">
                    <strong>Debug Info:</strong><br/>
                    {token && <span className="block">Token: {token}</span>}
                    {pidx && <span className="block">Payment ID (pidx): {pidx}</span>}
                    {transaction_id_param && <span className="block">Transaction ID: {transaction_id_param}</span>}
                    {txn_id && <span className="block">TXN ID: {txn_id}</span>}
                    {tidx && <span className="block">TIDX: {tidx}</span>}
                    {amount && <span className="block">Amount: {amount} paisa</span>}
                    {purchase_order_id && <span className="block">Booking ID: {purchase_order_id}</span>}
                    {status && <span className="block">Status: {status}</span>}
                  </div>
                </>
              )}
            </p>
            {!loading && (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    // Try to refetch with available data
                    if (status === 'Completed' && purchase_order_id) {
                      console.log('Retrying with Khalti Completed status...');
                      fetchBookingById(purchase_order_id);
                    } else {
                      const paymentToken = token || pidx || transaction_id_param || txn_id || tidx;
                      if (paymentToken && amount) {
                        console.log('Retrying payment verification...');
                        fetchBookingFromPayment(paymentToken, amount);
                      } else if (purchase_order_id) {
                        console.log('Retrying booking fetch...');
                        fetchBookingById(purchase_order_id);
                      }
                    }
                  }}
                  className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mb-2"
                  disabled={!token && !pidx && !transaction_id_param && !txn_id && !tidx && !purchase_order_id}
                >
                  Retry Loading Payment Details
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => navigate('/recommendations')}
                  className="w-full px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Book Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show success state even if station data is missing
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-lg w-full mx-4">
        <div className="text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-8">Your EV charging booking has been confirmed.</p>

          {/* Transaction Details */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Transaction Details</h2>
            <div className="space-y-3 text-left">
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-medium text-gray-800">{transaction_id || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-semibold text-green-600">₹{booking.amount_npr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium text-gray-800">Khalti Digital Wallet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">Confirmed</span>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Booking Details</h2>
            <div className="space-y-3 text-left">
              <div className="flex justify-between">
                <span className="text-gray-600">Station:</span>
                <span className="font-medium text-gray-800">
                  {station ? station.name : `Station ${booking.station_id}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Address:</span>
                <span className="font-medium text-gray-800">
                  {station ? (
                    station.location?.address || 
                    (station.location?.coordinates ? 
                     `${station.location.coordinates[0].toFixed(4)}, ${station.location.coordinates[1].toFixed(4)}` : 
                     'Address not available')
                  ) : (
                    'Station details loading...'
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Charger Type:</span>
                <span className="font-medium text-gray-800">{booking.charger_type}</span>
              </div>
              {booking.booking_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium text-gray-800">{booking.booking_date}</span>
                </div>
              )}
              {booking.booking_time && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium text-gray-800">{booking.booking_time}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium text-gray-800">{booking.estimated_duration} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Booking ID:</span>
                <span className="font-medium text-gray-800">{booking.booking_id}</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">What's Next?</h2>
            <div className="space-y-3 text-left text-sm">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-800">Arrive at the charging station</p>
                  <p className="text-gray-600">Please arrive 5 minutes before your scheduled time</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-800">Connect your vehicle</p>
                  <p className="text-gray-600">Use the charger type you booked ({booking.charger_type})</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-800">Start charging</p>
                  <p className="text-gray-600">Your booking is valid for {booking.estimated_duration} minutes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Need Help?</h2>
            <div className="space-y-2 text-left text-sm">
              <p className="text-gray-700">
                <span className="font-medium">Station Contact:</span> {station?.telephone || 'N/A'}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Support Email:</span> support@evconnectnepal.com
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Emergency:</span> +977-1-4XXXXXX
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                triggerDashboardRefresh();
                
                // NEW: Apply the same immediate clearing logic as test button
                console.log('🚀 Navigating to dashboard - applying immediate notification clearing...');
                
                // Force immediate localStorage flag setting (same as test button)
                localStorage.setItem('clear_pending_notifications', 'true');
                localStorage.setItem('payment_status_paid', 'true');
                localStorage.setItem('force_dashboard_refresh', 'true');
                
                // Add booking to paid list if not already there
                const bookingId = booking?.booking_id;
                if (bookingId) {
                  const existingPaidBookings = localStorage.getItem('paid_booking_ids');
                  const paidBookingIds = existingPaidBookings ? JSON.parse(existingPaidBookings) : [];
                  if (!paidBookingIds.includes(bookingId)) {
                    paidBookingIds.push(bookingId);
                    localStorage.setItem('paid_booking_ids', JSON.stringify(paidBookingIds));
                  }
                  localStorage.setItem('payment_notification_cleared', bookingId);
                }
                
                navigate('/dashboard', { 
                  state: { 
                    paymentCompleted: true, 
                    bookingId: booking?.booking_id,
                    transactionId: transaction_id,
                    forceRefresh: true // NEW: Force immediate refresh
                  } 
                });
              }}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 00-2 2m-6 9l2 2 4-4" />
              </svg>
              Go to Dashboard
            </button>
            <button
              onClick={() => {
                triggerDashboardRefresh();
                navigate('/recommendations');
              }}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Book Another Station
            </button>
          </div>

          {/* Additional Information */}
          <div className="mt-8 text-xs text-gray-500">
            <p>A confirmation email has been sent to {user?.email || 'your email'}.</p>
            <p>Keep this booking ID for reference: {booking.booking_id}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage; 