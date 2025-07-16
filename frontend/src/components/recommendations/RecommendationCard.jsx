import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import axios from "../../api/axios";
import EnergyAnalysis from "./EnergyAnalysis";
import ETAAnalysis from "./ETAAnalysis";
import ScoreBreakdown from "./ScoreBreakdown";
import { formatLocationDisplay } from "../../utils/mapHelpers";

const RecommendationCard = ({ 
  station, 
  index, 
  onStationSelect, 
  onShowRoute, 
  loadingRoute,
  hasBooking,
  userContext,
  onAutoBook 
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [bookingLoading, setBookingLoading] = useState(false);
  const [expandedScores, setExpandedScores] = useState(false);

  const isEnhanced = station.energy_analysis || station.score_breakdown;

  const toggleScoreBreakdown = () => {
    setExpandedScores(!expandedScores);
  };

  const handleBookSlot = async () => {
    if (!isAuthenticated) {
      alert('Please log in to book a charging slot');
      navigate('/login');
      return;
    }
    
    // Redirect to dedicated booking page with station data
    navigate(`/booking/${station.id}`, {
      state: { 
        station: station,
        userContext: userContext 
      }
    });
  };

  const handleAutoBookRecommendation = async () => {
    if (!isAuthenticated) {
      alert('Please log in to use auto-booking feature');
      navigate('/login');
      return;
    }
    
    if (!onAutoBook) return;
    
    setBookingLoading(true);
    
    try {
      const bookingData = {
        station_id: station.id,
        charger_type: station.connector_types?.[0] || 'Type 2',
        urgency_level: 'high',
        booking_duration: 60,
        station_details: {
          name: station.name,
          location: station.location,
          pricing: station.pricing
        },
        user_location: userContext?.location || []
      };

      // Use instant booking endpoint for high urgency
      const response = await axios.post('/recommendations/instant-book', bookingData);
      
      if (response.data.success) {
        alert(`Instant booking successful! Booking ID: ${response.data.booking.booking_id}`);
        onAutoBook(response.data.booking);
        // Trigger refresh of recommendations/bookings
        if (window.location.pathname.includes('recommendations')) {
          window.location.reload();
        }
      } else {
        alert(`Instant booking failed: ${response.data.error}`);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        alert('Please log in to use auto-booking feature');
        navigate('/login');
      } else {
        alert(`Instant booking error: ${err.response?.data?.error || 'Unknown error'}`);
      }
    } finally {
      setBookingLoading(false);
    }
  };

  // Helper function to get real-time availability display
  const getAvailabilityDisplay = () => {
    if (station.charger_availability) {
      // Use real-time availability data
      const chargerType = station.connector_types?.[0] || 'Type 2';
      const availability = station.charger_availability[chargerType];
      
      if (availability) {
        return {
          available: availability.available_slots > 0,
          text: `${availability.available_slots}/${availability.total_slots} available`,
          slots: availability.available_slots
        };
      }
    }
    
    // Fallback to static availability
    return {
      available: station.availability > 0,
      text: station.availability > 0 ? `${station.availability} slots available` : 'Fully booked',
      slots: station.availability
    };
  };

  const availabilityInfo = getAvailabilityDisplay();

  return (
    <div 
      className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
        index === 0 ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm
            ${index === 0 ? 'bg-yellow-500' : 'bg-blue-600'}
          `}>
            {index + 1}
          </div>
          <div>
            <h4 className="font-bold text-gray-800 text-lg">{station.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              {index === 0 && (
                <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  🏆 Top Recommendation
                </span>
              )}
              {isEnhanced && (
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  🧠 Smart Analysis
                </span>
              )}
              {station.is_reachable === false && (
                <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                  ⚠️ Low Battery Warning
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-bold text-blue-600">
            Score: {(station.score * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-600">
            {station.distance} km away
          </div>
          {isEnhanced && (
            <button
              onClick={toggleScoreBreakdown}
              className="text-xs text-blue-600 hover:text-blue-800 mt-1"
            >
              {expandedScores ? '▼ Hide Details' : '▶ Show Details'}
            </button>
          )}
        </div>
      </div>

      {/* Enhanced Analysis */}
      <EnergyAnalysis energy_analysis={station.energy_analysis} />
      <ETAAnalysis eta_analysis={station.eta_analysis} />
      <ScoreBreakdown 
        score_breakdown={station.score_breakdown} 
        isExpanded={expandedScores} 
      />

      {/* Station Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">📍</span>
            <span className="text-sm text-gray-700">{formatLocationDisplay(station)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">💰</span>
            <span className="text-sm text-gray-700">Rs. {station.pricing || 'N/A'} per kWh</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">⭐</span>
            <span className="text-sm text-gray-700">Rating: {station.rating}/5</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">🔌</span>
            <span className={`text-sm font-medium ${
              station.availability === 0 ? 'text-red-600' : 
              station.availability < 3 ? 'text-orange-600' : 'text-green-600'
            }`}>
              {station.availability === 0 ? 'BOOKED' : 
               `${station.availability}/${station.total_slots || 0} available`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">⚡</span>
            <span className="text-sm text-gray-700">
              {station.connector_types?.join(', ') || 'Multiple types'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">🏪</span>
            <span className="text-sm text-gray-700">
              {station.features?.slice(0, 2).join(', ') || 'Basic amenities'}
              {station.features?.length > 2 && ` +${station.features.length - 2} more`}
            </span>
          </div>
        </div>
      </div>

      {/* Context Factors Display */}
      {station.context_factors && (
        <div className="mb-4 p-2 bg-gray-50 rounded">
          <p className="text-xs text-gray-600 font-medium mb-1">🚗 Trip Context Impact:</p>
          <div className="flex flex-wrap gap-1">
            {station.context_factors.ac_impact > 0 && (
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                AC: +{station.context_factors.ac_impact} kWh
              </span>
            )}
            {station.context_factors.passenger_impact > 0 && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                Passengers: +{station.context_factors.passenger_impact} kWh
              </span>
            )}
            {station.context_factors.terrain_impact > 0 && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                Terrain: +{station.context_factors.terrain_impact} kWh
              </span>
            )}
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
              Total: {station.context_factors.total_energy_needed} kWh
            </span>
          </div>
        </div>
      )}

      {/* Auto-booking status */}
      {station.auto_booking?.auto_booked && (
        <div className="mb-3 p-2 bg-green-100 border border-green-300 rounded text-sm">
          <strong className="text-green-800">✅ Auto-booked for you!</strong>
          <br />
          <span className="text-green-700">
            Booking ID: {station.auto_booking.booking_id}
          </span>
        </div>
      )}

      {/* Existing booking status */}
      {hasBooking && (
        <div className="mb-3 p-2 bg-blue-100 border border-blue-300 rounded text-sm">
          <strong className="text-blue-800">📋 You have a booking here</strong>
          <br />
          <span className="text-blue-700">
            Status: {hasBooking.status} • Type: {hasBooking.charger_type}
            {hasBooking.auto_booked && ' (Auto-booked)'}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onStationSelect(station)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
        >
          View Details
        </button>
        
        <button
          onClick={() => onShowRoute(station)}
          disabled={loadingRoute}
          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loadingRoute ? 'Loading Route...' : 'Show Route'}
        </button>

        {!hasBooking && !station.auto_booking?.auto_booked && (
          <>
            {availabilityInfo.available ? (
              <button
                onClick={handleBookSlot}
                disabled={bookingLoading}
                className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {bookingLoading ? 'Booking...' : 'Book Now'}
              </button>
            ) : (
              <button
                disabled
                className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded opacity-50 cursor-not-allowed"
              >
                BOOKED OUT
              </button>
            )}

            {/* Auto-book button for high urgency */}
            {userContext?.urgency === 'high' && index === 0 && onAutoBook && 
              availabilityInfo.available && (
                <button
                  onClick={handleAutoBookRecommendation}
                  disabled={bookingLoading}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {bookingLoading ? 'Auto-booking...' : '⚡ Instant Book'}
                </button>
              )
            }
          </>
        )}

        {/* Display real-time availability info */}
        {station.charger_availability && (
          <div className="mt-2 text-xs text-gray-600">
            <div className="flex flex-wrap gap-2">
              {Object.entries(station.charger_availability).map(([chargerType, availability]) => (
                <span 
                  key={chargerType}
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    availability.available_slots > 0 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {chargerType}: {availability.available_slots}/{availability.total_slots}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationCard; 