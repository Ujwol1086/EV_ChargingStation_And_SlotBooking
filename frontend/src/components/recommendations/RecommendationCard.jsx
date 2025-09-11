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
        charger_type: station.connector_types?.[0] || 'CCS2',
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
      const chargerType = station.connector_types?.[0] || 'CCS2';
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
      className={`border rounded-3xl p-6 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 ${
        index === 0 
          ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-sm' 
          : 'border-gray-600/50 bg-gradient-to-br from-gray-800/30 to-gray-700/30 backdrop-blur-sm'
      } hover:border-cyan-500/50`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`
            w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-lg shadow-lg
            ${index === 0 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' : 'bg-gradient-to-br from-cyan-500 to-blue-600'}
          `}>
            {index + 1}
          </div>
          <div>
            <h4 className="font-bold text-white text-xl">{station.name}</h4>
            <div className="flex items-center gap-3 mt-2">
              {index === 0 && (
                <span className="inline-block px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 text-xs font-medium rounded-full border border-yellow-500/30">
                  Top Recommendation
                </span>
              )}
              {isEnhanced && (
                <span className="inline-block px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 text-xs font-medium rounded-full border border-cyan-500/30">
                  Smart Analysis
                </span>
              )}
              {station.is_reachable === false && (
                <span className="inline-block px-3 py-1 bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 text-xs font-medium rounded-full border border-red-500/30">
                  Low Battery Warning
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            {(station.score * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-400">
            {station.distance} km away
          </div>
          {isEnhanced && (
            <button
              onClick={toggleScoreBreakdown}
              className="text-xs text-cyan-400 hover:text-cyan-300 mt-2 transition-colors duration-300"
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 text-lg">📍</span>
            <span className="text-sm text-gray-300">{formatLocationDisplay(station)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-green-400 text-lg">💰</span>
            <span className="text-sm text-gray-300">Rs. {station.pricing || 'N/A'} per kWh</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-yellow-400 text-lg">⭐</span>
            <span className="text-sm text-gray-300">Rating: {station.rating}/5</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-purple-400 text-lg">🔌</span>
            <span className={`text-sm font-medium ${
              station.availability === 0 ? 'text-red-400' : 
              station.availability < 3 ? 'text-orange-400' : 'text-green-400'
            }`}>
              {station.availability === 0 ? 'BOOKED' : 
               `${station.availability}/${station.total_slots || 0} available`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-blue-400 text-lg">⚡</span>
            <span className="text-sm text-gray-300">
              {station.connector_types?.join(', ') || 'Multiple types'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-indigo-400 text-lg">🏪</span>
            <span className="text-sm text-gray-300">
              {station.features?.slice(0, 2).join(', ') || 'Basic amenities'}
              {station.features?.length > 2 && ` +${station.features.length - 2} more`}
            </span>
          </div>
        </div>
      </div>

      {/* Context Factors Display */}
      {station.context_factors && (
        <div className="mb-6 p-4 bg-gradient-to-r from-gray-700/30 to-gray-600/30 rounded-2xl border border-gray-600/50 backdrop-blur-sm">
          <p className="text-xs text-gray-400 font-medium mb-2">
            Trip Context Impact:
          </p>
          <div className="flex flex-wrap gap-2">
            {station.context_factors.ac_impact > 0 && (
              <span className="px-3 py-1 bg-orange-500/20 text-orange-300 text-xs rounded-full border border-orange-500/30">
                AC: +{station.context_factors.ac_impact} kWh
              </span>
            )}
            {station.context_factors.passenger_impact > 0 && (
              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
                Passengers: +{station.context_factors.passenger_impact} kWh
              </span>
            )}
            {station.context_factors.terrain_impact > 0 && (
              <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
                Terrain: +{station.context_factors.terrain_impact} kWh
              </span>
            )}
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full border border-cyan-500/30">
              Total: {station.context_factors.total_energy_needed} kWh
            </span>
          </div>
        </div>
      )}

      {/* Auto-booking status */}
      {station.auto_booking?.auto_booked && (
        <div className="mb-4 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl backdrop-blur-sm">
          <strong className="text-green-300">
            Auto-booked for you!
          </strong>
          <br />
          <span className="text-green-200">
            Booking ID: {station.auto_booking.booking_id}
          </span>
        </div>
      )}

      {/* Existing booking status */}
      {hasBooking && (
        <div className="mb-4 p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-2xl backdrop-blur-sm">
          <strong className="text-cyan-300">
            You have a booking here
          </strong>
          <br />
          <span className="text-cyan-200">
            Status: {hasBooking.status} • Type: {hasBooking.charger_type}
            {hasBooking.auto_booked && ' (Auto-booked)'}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => onStationSelect(station)}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
        >
          View Details
        </button>
        
        <button
          onClick={() => onShowRoute(station)}
          disabled={loadingRoute}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25"
        >
          {loadingRoute ? 'Loading Route...' : 'Show Route'}
        </button>

        {!hasBooking && !station.auto_booking?.auto_booked && (
          <>
            {availabilityInfo.available ? (
              <button
                onClick={handleBookSlot}
                disabled={bookingLoading}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-medium rounded-xl hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25"
              >
                {bookingLoading ? 'Booking...' : 'Book Now'}
              </button>
            ) : (
              <button
                disabled
                className="px-6 py-3 bg-red-500/50 text-white text-sm font-medium rounded-xl opacity-50 cursor-not-allowed"
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
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white text-sm font-medium rounded-xl hover:from-red-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-red-500/25"
                >
                  {bookingLoading ? 'Auto-booking...' : 'Instant Book'}
                </button>
              )
            }
          </>
        )}

        {/* Display real-time availability info */}
        {station.charger_availability && (
          <div className="mt-4 text-xs text-gray-400">
            <div className="flex flex-wrap gap-2">
              {Object.entries(station.charger_availability).map(([chargerType, availability]) => (
                <span 
                  key={chargerType}
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    availability.available_slots > 0 
                      ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                      : 'bg-red-500/20 text-red-300 border-red-500/30'
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