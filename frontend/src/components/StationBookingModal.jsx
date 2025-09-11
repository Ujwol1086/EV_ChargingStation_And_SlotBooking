import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import axios from '../api/axios';

const StationBookingModal = ({ station, isOpen, onClose, onBookingSuccess }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    charger_type: station?.connector_types?.[0] || 'CCS2',
    plug_type: station?.connector_types?.[0] || 'CCS2',
    booking_date: '',
    booking_time: '',
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
        alert('Booking confirmed! You will pay at the station based on actual usage.');
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
  const connectorTypes = station.connector_types || ['CCS2', 'GBT'];

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-br from-gray-800/50 to-gray-700/50 backdrop-blur-xl border-b border-gray-600/50 px-6 py-4 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Book Charging Slot</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-cyan-400 transition-colors duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Station Information */}
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-4 backdrop-blur-sm">
            <h3 className="font-bold text-white text-lg mb-2">{station.name}</h3>
            <p className="text-gray-300 text-sm mb-2">{station.address || station.location?.address}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Pricing:</span>
              <span className="font-medium text-cyan-400">{station.pricing}</span>
            </div>
          </div>

          {/* Current Slot Availability */}
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-4 backdrop-blur-sm">
            <h4 className="font-semibold text-white mb-2">Current Availability</h4>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Available Slots:</span>
              <div className="flex items-center">
                <span className="text-2xl font-bold text-green-400">{availableSlots}</span>
                <span className="text-gray-400 ml-1">/ {totalSlots}</span>
              </div>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${totalSlots > 0 ? (availableSlots / totalSlots) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Charger Types */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Charger Type <span className="text-red-400">*</span>
            </label>
            <select
              name="charger_type"
              value={formData.charger_type}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white transition-all duration-300 hover:border-gray-500"
            >
              {connectorTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Booking Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              name="booking_date"
              value={formData.booking_date}
              onChange={handleInputChange}
              min={today}
              max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // Max 7 days ahead
              required
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white transition-all duration-300 hover:border-gray-500"
            />
          </div>

          {/* Time Slot Picker */}
          {formData.booking_date && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Time Slot <span className="text-red-400">*</span>
              </label>
              {loadingTimeSlots ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500 mx-auto"></div>
                  <p className="text-sm text-gray-400 mt-2">Loading time slots...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => slot.available && setFormData(prev => ({ ...prev, booking_time: slot.time }))}
                      disabled={!slot.available}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all duration-300 ${
                        formData.booking_time === slot.time
                          ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                          : slot.available
                          ? 'border-gray-600 bg-gray-800/30 text-gray-300 hover:border-cyan-400 hover:bg-cyan-500/10'
                          : 'border-red-500/30 bg-red-500/10 text-red-400 cursor-not-allowed'
                      }`}
                    >
                      <div className="font-semibold">{slot.display_time}</div>
                      <div className="text-xs">
                        {slot.available ? (
                          <span className="text-green-400">✓ {slot.available_slots}/{slot.total_slots} available</span>
                        ) : (
                          <span className="text-red-400">✗ BOOKED</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Urgency Level */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Urgency Level
            </label>
            <select
              name="urgency_level"
              value={formData.urgency_level}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white transition-all duration-300 hover:border-gray-500"
            >
              <option value="low">Low - I can wait</option>
              <option value="medium">Medium - Preferred time</option>
              <option value="high">High - Urgent charging needed</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-2xl p-3 backdrop-blur-sm">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-2xl hover:bg-gray-700/50 transition-all duration-300 hover:border-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.booking_date || !formData.booking_time}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-2xl hover:from-cyan-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/25"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Booking...
                </div>
              ) : (
                'Book Slot'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StationBookingModal; 