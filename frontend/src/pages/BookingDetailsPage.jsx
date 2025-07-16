import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../context/useAuth';

const BookingDetailsPage = () => {
  const [booking, setBooking] = useState(null);
  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId } = useParams();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Get booking data from location state or fetch by ID
    if (location.state?.booking) {
      setBooking(location.state.booking);
      setStation(location.state.station);
      setLoading(false);
    } else if (bookingId) {
      fetchBookingDetails(bookingId);
    } else {
      setError('No booking information found');
      setLoading(false);
    }
  }, [isAuthenticated, navigate, location.state, bookingId]);

  const fetchBookingDetails = async (id) => {
    try {
      setLoading(true);
      
      // Fetch booking details
      const bookingResponse = await axios.get(`/bookings/${id}`);
      
      if (bookingResponse.data.success) {
        const bookingData = bookingResponse.data.booking;
        setBooking(bookingData);
        
        // Fetch station details
        const stationResponse = await axios.get(`/stations/${bookingData.station_id}`);
        if (stationResponse.data.success) {
          setStation(stationResponse.data.station);
        }
      } else {
        setError('Booking not found');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPayment = () => {
    if (booking && station) {
      navigate('/payment', {
        state: {
          booking: booking,
          station: station
        }
      });
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;

    try {
      const response = await axios.delete(`/bookings/${booking.booking_id}`);
      
      if (response.data.success) {
        navigate('/dashboard', { 
          state: { 
            message: 'Booking cancelled successfully' 
          } 
        });
      } else {
        setError(response.data.error || 'Failed to cancel booking');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel booking');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Booking Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'No booking information found.'}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Booking Details</h1>
              <p className="text-gray-600 mt-2">Review your booking before payment</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Booking ID</div>
              <div className="font-mono text-lg font-semibold text-gray-800">{booking.booking_id}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Booking Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Booking Information</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  booking.status === 'pending_payment' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : booking.status === 'confirmed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {booking.status.replace('_', ' ').toUpperCase()}
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
                <span className="text-gray-600">Distance:</span>
                <span className="font-medium text-gray-800">{booking.distance_to_station} km</span>
              </div>
            </div>
          </div>

          {/* Station Information */}
          {station && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Station Information</h2>
              <div className="space-y-4">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <div className="font-medium text-gray-800">{station.name}</div>
                </div>
                
                <div>
                  <span className="text-gray-600">Address:</span>
                  <div className="font-medium text-gray-800">{station.address}</div>
                </div>
                
                {station.contact && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contact:</span>
                    <span className="font-medium text-gray-800">{station.contact}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Available Chargers:</span>
                  <span className="font-medium text-gray-800">{station.chargers?.length || 0}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Rating:</span>
                  <span className="font-medium text-gray-800">{station.rating || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Charging Session:</span>
                <span className="font-medium text-gray-800">₹{booking.amount_npr}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium text-gray-800">{booking.estimated_duration} minutes</span>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span className="text-green-600">₹{booking.amount_npr}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Payment Method</h3>
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
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {booking.status === 'pending_payment' && (
              <button
                onClick={handleProceedToPayment}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors font-medium"
              >
                Proceed to Payment - ₹{booking.amount_npr}
              </button>
            )}
            
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Back to Dashboard
            </button>
            
            {booking.status === 'pending_payment' && (
              <button
                onClick={handleCancelBooking}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Cancel Booking
              </button>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-gray-800 mb-2">Important Notes</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Please arrive 5 minutes before your scheduled time</li>
            <li>• Bring your own charging cable if required</li>
            <li>• Payment is required to confirm your booking</li>
            <li>• Cancellation is free up to 1 hour before the booking time</li>
            <li>• Contact station staff if you need assistance</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsPage; 