import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import axios from '../api/axios';

const BookingPage = () => {
  const { stationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Get station data from location state or fetch it
  const [station, setStation] = useState(location.state?.station || null);
  const [loading, setLoading] = useState(!station);
  const [formData, setFormData] = useState({
    charger_type: '',
    plug_type: '',
    booking_date: '',
    booking_time: '',
    urgency_level: 'medium'
  });
  const [timeSlots, setTimeSlots] = useState([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!station && stationId) {
      fetchStationDetails();
    }
  }, [isAuthenticated, station, stationId]);

  useEffect(() => {
    if (station && !formData.charger_type) {
      // Extract charger types from chargers array
      const chargerTypes = station.chargers?.map(charger => charger.type) || ['Type 2'];
      setFormData(prev => ({
        ...prev,
        charger_type: chargerTypes[0] || 'Type 2',
        plug_type: chargerTypes[0] || 'Type 2'
      }));
    }
  }, [station]);

  // Fetch time slots when date or charger type changes
  useEffect(() => {
    if (formData.booking_date && formData.charger_type && station?.id) {
      fetchTimeSlots();
    }
  }, [formData.booking_date, formData.charger_type, station?.id]);

  const fetchStationDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/stations/${stationId}`);
      
      if (response.data.success) {
        setStation(response.data.station);
      } else {
        setError('Station not found');
      }
    } catch (err) {
      setError('Failed to load station details');
      console.error('Error fetching station:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeSlots = async () => {
    try {
      setLoadingTimeSlots(true);
      const response = await axios.post('/recommendations/get-time-slots', {
        station_id: station.id,
        charger_type: formData.charger_type,
        booking_date: formData.booking_date
      });

      if (response.data.success) {
        setTimeSlots(response.data.time_slots);
      } else {
        setError('Failed to load time slots');
      }
    } catch (err) {
      setError('Error loading time slots');
    } finally {
      setLoadingTimeSlots(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset time when date changes
    if (name === 'booking_date') {
      setFormData(prev => ({ ...prev, booking_time: '' }));
      setTimeSlots([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.booking_date || !formData.booking_time) {
      setError('Please select both date and time for your booking');
      return;
    }
    
    setBookingLoading(true);
    setError('');

    try {
      const bookingData = {
        station_id: station.id,
        charger_type: formData.charger_type,
        plug_type: formData.plug_type,
        urgency_level: formData.urgency_level,
        preferred_date: formData.booking_date,
        preferred_time: formData.booking_time,
        station_details: station
      };

      const response = await axios.post('/recommendations/book-slot', bookingData);

      if (response.data.success) {
        const booking = response.data.booking;
        
        // Check if payment is required
        if (booking.requires_payment && booking.status === 'pending_payment') {
          // Redirect to payment page
          navigate('/payment', {
            state: {
              booking: booking,
              station: station
            }
          });
        } else {
          // Booking confirmed without payment
          setSuccess(true);
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        }
      } else {
        setError(response.data.error || 'Booking failed');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError(err.response?.data?.error || 'Error creating booking');
      }
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading station details...</p>
        </div>
      </div>
    );
  }

  if (!station) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Station Not Found</h1>
          <p className="text-gray-600 mb-6">The requested charging station could not be found.</p>
          <button
            onClick={() => navigate('/recommendations')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Stations
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Booking Created! 🎉</h1>
          <p className="text-gray-600 mb-6">
            Your charging slot has been created at <strong>{station.name}</strong> for{' '}
            <strong>{formData.booking_date}</strong> at <strong>{formData.booking_time}</strong>.
            Redirecting to payment...
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View My Bookings
            </button>
            <button
              onClick={() => navigate('/recommendations')}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Book Another Station
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Redirecting to dashboard in 3 seconds...
          </p>
        </div>
      </div>
    );
  }

  const availableSlots = station.available_slots || 0;
  const totalSlots = station.total_slots || 0;
  const connectorTypes = station.chargers?.map(charger => charger.type) || ['Type 2', 'CCS', 'CHAdeMO'];
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Book Charging Slot</h1>
          <p className="text-gray-600 mt-2">Select your preferred date and time for charging</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Station Information Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">{station.name}</h2>
              
              {/* Station Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">📍</span>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium">{station.location?.address || (() => {
                      if (Array.isArray(station.location)) {
                        return `${station.location[0].toFixed(4)}, ${station.location[1].toFixed(4)}`;
                      } else if (station.location?.coordinates && Array.isArray(station.location.coordinates)) {
                        return `${station.location.coordinates[0].toFixed(4)}, ${station.location.coordinates[1].toFixed(4)}`;
                      }
                      return 'Location data unavailable';
                    })()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">💰</span>
                  <div>
                    <p className="text-sm text-gray-600">Pricing</p>
                    <p className="font-medium">{station.pricing || 'Contact for pricing'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">⏰</span>
                  <div>
                    <p className="text-sm text-gray-600">Operating Hours</p>
                    <p className="font-medium">{station.operatingHours || '24/7'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">🔌</span>
                  <div>
                    <p className="text-sm text-gray-600">Availability</p>
                    <p className="font-medium">
                      {availableSlots}/{totalSlots} slots available
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${totalSlots > 0 ? (availableSlots / totalSlots) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">⚡</span>
                  <div>
                    <p className="text-sm text-gray-600">Connector Types</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {connectorTypes.map(type => (
                        <span key={type} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                {station.amenities && station.amenities.length > 0 && (
                  <div className="flex items-start gap-3">
                    <span className="text-gray-500">🏪</span>
                    <div>
                      <p className="text-sm text-gray-600">Amenities</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {station.amenities.slice(0, 4).map(amenity => (
                          <span key={amenity} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {amenity}
                          </span>
                        ))}
                        {station.amenities.length > 4 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            +{station.amenities.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Booking Form Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Booking Details</h2>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-600 font-medium">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Charger Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Charger Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="charger_type"
                    value={formData.charger_type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {connectorTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Booking Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="booking_date"
                    value={formData.booking_date}
                    onChange={handleInputChange}
                    min={today}
                    max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">You can book up to 7 days in advance</p>
                </div>

                {/* Time Slot Selection */}
                {formData.booking_date && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Slot <span className="text-red-500">*</span>
                    </label>
                    {loadingTimeSlots ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-500">Loading available time slots...</p>
                      </div>
                    ) : timeSlots.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => slot.available && setFormData(prev => ({ ...prev, booking_time: slot.time }))}
                            disabled={!slot.available}
                            className={`p-4 rounded-lg border-2 text-sm font-medium transition-all ${
                              formData.booking_time === slot.time
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : slot.available
                                ? 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                                : 'border-red-200 bg-red-50 text-red-500 cursor-not-allowed'
                            }`}
                          >
                            <div className="font-semibold">{slot.display_time}</div>
                            <div className="text-xs mt-1">
                              {slot.available ? (
                                <span className="text-green-600">✓ {slot.available_slots}/{slot.total_slots} available</span>
                              ) : (
                                <span className="text-red-500">✗ BOOKED</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">No time slots available for this date</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Urgency Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgency Level
                  </label>
                  <select
                    name="urgency_level"
                    value={formData.urgency_level}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">🟢 Low - I can wait</option>
                    <option value="medium">🟡 Medium - Preferred time</option>
                    <option value="high">🔴 High - Urgent charging needed</option>
                  </select>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading || !formData.booking_date || !formData.booking_time || availableSlots === 0}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {bookingLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Booking...
                      </div>
                    ) : (
                      '📅 Confirm Booking'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage; 