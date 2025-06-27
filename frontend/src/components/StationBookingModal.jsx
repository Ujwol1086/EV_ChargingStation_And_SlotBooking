import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import axios from '../api/axios';

const StationBookingModal = ({ station, isOpen, onClose, onBookingSuccess }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    charger_type: station?.connector_types?.[0] || 'Type 2',
    plug_type: station?.connector_types?.[0] || 'Type 2',
    booking_date: '',
    booking_time: '',
    user_battery_percentage: 50,
    urgency_level: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeSlots, setTimeSlots] = useState([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);

  // Fetch time slots when date or charger type changes
  useEffect(() => {
    if (formData.booking_date && formData.charger_type && station?.id) {
      fetchTimeSlots();
    }
  }, [formData.booking_date, formData.charger_type, station?.id]);

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
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('Please log in to book a charging slot');
      navigate('/login');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const bookingData = {
        station_id: station.id,
        charger_type: formData.charger_type,
        plug_type: formData.plug_type,
        urgency_level: formData.urgency_level,
        user_battery_percentage: formData.user_battery_percentage,
        station_details: station
      };

      // Add date/time if provided
      if (formData.booking_date) {
        bookingData.preferred_date = formData.booking_date;
      }
      if (formData.booking_time) {
        bookingData.preferred_time = formData.booking_time;
      }

      const response = await axios.post('/recommendations/book-slot', bookingData);

      if (response.data.success) {
        onBookingSuccess(response.data.booking);
        onClose();
      } else {
        setError(response.data.error || 'Booking failed');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        alert('Please log in to book a charging slot');
        navigate('/login');
      } else {
        setError(err.response?.data?.error || 'Error creating booking');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !station) return null;

  const availableSlots = station.available_slots || 0;
  const totalSlots = station.total_slots || 0;
  const connectorTypes = station.connector_types || ['Type 2', 'CCS', 'CHAdeMO'];

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Book Charging Slot</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Station Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-800 text-lg mb-2">{station.name}</h3>
            <p className="text-gray-600 text-sm mb-2">📍 {station.location?.address}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">💰 Pricing:</span>
              <span className="font-medium">{station.pricing}</span>
            </div>
          </div>

          {/* Current Slot Availability */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Current Availability</h4>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Available Slots:</span>
              <div className="flex items-center">
                <span className="text-2xl font-bold text-green-600">{availableSlots}</span>
                <span className="text-gray-500 ml-1">/ {totalSlots}</span>
              </div>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${totalSlots > 0 ? (availableSlots / totalSlots) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Charger Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Charger Type <span className="text-red-500">*</span>
            </label>
            <select
              name="charger_type"
              value={formData.charger_type}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {connectorTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
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
              max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // Max 7 days ahead
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Time Slot Picker */}
          {formData.booking_date && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Slot <span className="text-red-500">*</span>
              </label>
              {loadingTimeSlots ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading time slots...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => slot.available && setFormData(prev => ({ ...prev, booking_time: slot.time }))}
                      disabled={!slot.available}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        formData.booking_time === slot.time
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : slot.available
                          ? 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                          : 'border-red-200 bg-red-50 text-red-500 cursor-not-allowed'
                      }`}
                    >
                      <div className="font-semibold">{slot.display_time}</div>
                      <div className="text-xs">
                        {slot.available ? (
                          <span className="text-green-600">✓ {slot.available_slots}/{slot.total_slots} available</span>
                        ) : (
                          <span className="text-red-500">✗ BOOKED</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Battery Percentage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Battery: {formData.user_battery_percentage}%
            </label>
            <input
              type="range"
              name="user_battery_percentage"
              min="0"
              max="100"
              value={formData.user_battery_percentage}
              onChange={handleInputChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Empty</span>
              <span>Full</span>
            </div>
          </div>

          {/* Urgency Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Urgency Level
            </label>
            <select
              name="urgency_level"
              value={formData.urgency_level}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">🟢 Low - I can wait</option>
              <option value="medium">🟡 Medium - Preferred time</option>
              <option value="high">🔴 High - Urgent charging needed</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.booking_date || !formData.booking_time}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Booking...
                </div>
              ) : (
                '📅 Book Slot'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StationBookingModal; 