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

  useEffect(() => {
    // If we don't have booking data from location state, try to get it from URL params
    if (!booking && token && status === 'success') {
      fetchBookingFromPayment(token, amount);
    } else if (booking && !station) {
      // If we have booking but no station, fetch station details
      if (booking.station_id) {
        fetchStationDetails(booking.station_id);
      }
    }
  }, [token, status, booking, station]);

  const fetchBookingFromPayment = async (paymentToken, paymentAmount) => {
    try {
      setLoading(true);
      setError('');

      console.log('Verifying payment with token:', paymentToken, 'amount:', paymentAmount);

      // Verify payment and get booking details
      const response = await axios.post('/payments/verify-payment', {
        token: paymentToken,
        amount: parseInt(paymentAmount)
      });

      console.log('Payment verification response:', response.data);

      if (response.data.success) {
        const bookingId = response.data.booking_id;
        setTransactionId(response.data.transaction_id);

        // Use booking data from verification response
        if (response.data.booking) {
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
            setStation(mockStation);
          } else {
            // Fetch station details for real payments
            await fetchStationDetails(response.data.booking.station_id);
          }
        } else {
          setError('No booking data received from payment verification');
        }
      } else {
        setError(response.data.error || 'Payment verification failed');
      }
    } catch (err) {
      console.error('Payment verification error:', err);
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
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Invalid Success Page</h2>
            <p className="text-gray-600 mb-6">
              No booking information found. 
              {token && <span className="block text-sm mt-2">Token: {token}</span>}
              {amount && <span className="block text-sm">Amount: {amount}</span>}
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
              onClick={() => navigate('/dashboard')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Go to Dashboard
            </button>
            
            <button
              onClick={() => navigate('/map')}
              className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              View All Stations
            </button>
            
            <button
              onClick={() => window.print()}
              className="w-full px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Print Receipt
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