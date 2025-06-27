import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import axios from "../api/axios";

const RecommendationResults = ({ 
  recommendations, 
  onStationSelect, 
  onShowRoute, 
  userBookings = [], 
  loadingRoute = false,
  metadata = null,
  autoBookings = [],
  data = null,  // Add data prop to handle complete response
  onAutoBook = null // Add callback for automated booking
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [bookingLoading, setBookingLoading] = useState({});
  const [expandedScores, setExpandedScores] = useState({});

  // Extract route info and user context from data prop
  const routeInfo = data?.route_info;
  const userContext = data?.user_context;
  const algorithmInfo = data?.algorithm_info;

  if (!recommendations?.length) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800">No Recommendations</h3>
        <p className="text-gray-600">
          {routeInfo 
            ? `No charging stations found along the route to ${routeInfo.destination_city}.`
            : 'No charging stations found matching your criteria.'
          }
        </p>
      </div>
    );
  }

  const findBookingForStation = (stationId) => {
    return userBookings.find(booking => booking.station_id === stationId);
  };

  const toggleScoreBreakdown = (stationId) => {
    setExpandedScores(prev => ({
      ...prev,
      [stationId]: !prev[stationId]
    }));
  };

  const handleBookSlot = async (station) => {
    if (!isAuthenticated) {
      alert('Please log in to book a charging slot');
      navigate('/login');
      return;
    }
    
    setBookingLoading(prev => ({ ...prev, [station.id]: true }));
    
    try {
      const response = await axios.post('/recommendations/book-slot', {
        station_id: station.id,
        charger_type: station.connector_types?.[0] || 'Type 2',
        urgency_level: userContext?.urgency || 'medium',
        booking_duration: 60,
        station_details: {
          name: station.name,
          location: station.location,
          pricing: station.pricing
        },
        user_location: userContext?.location || []
      });

      if (response.data.success) {
        alert(`Booking successful! Booking ID: ${response.data.booking.booking_id}`);
        // Trigger refresh of recommendations/bookings
        if (window.location.pathname.includes('recommendations')) {
          window.location.reload();
        }
      } else {
        alert(response.data.error || 'Booking failed');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        alert('Please log in to book a charging slot');
        navigate('/login');
      } else {
        alert(err.response?.data?.error || 'Error creating booking');
      }
    } finally {
      setBookingLoading(prev => ({ ...prev, [station.id]: false }));
    }
  };

  const handleAutoBookRecommendation = async (station) => {
    if (!isAuthenticated) {
      alert('Please log in to use auto-booking feature');
      navigate('/login');
      return;
    }
    
    if (!onAutoBook) return;
    
    setBookingLoading(prev => ({ ...prev, [station.id]: true }));
    
    try {
      const bookingData = {
        station_id: station.id,
        charger_type: station.connector_types?.[0] || 'Type 2',
        urgency_level: 'high',
        auto_booked: true,
        booking_duration: 60,
        station_details: {
          name: station.name,
          location: station.location,
          pricing: station.pricing
        },
        user_location: userContext?.location || []
      };

      const response = await axios.post('/recommendations/auto-book-slot', bookingData);
      
      if (response.data.success) {
        alert(`Auto-booking successful! Booking ID: ${response.data.booking.booking_id}`);
        onAutoBook(response.data.booking);
      } else {
        alert(`Auto-booking failed: ${response.data.error}`);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        alert('Please log in to use auto-booking feature');
        navigate('/login');
      } else {
        alert(`Auto-booking error: ${err.response?.data?.error || 'Unknown error'}`);
      }
    } finally {
      setBookingLoading(prev => ({ ...prev, [station.id]: false }));
    }
  };

  const renderEnergyAnalysis = (station) => {
    if (!station.energy_analysis) return null;

    const { energy_analysis } = station;
    return (
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h5 className="font-semibold text-blue-800 mb-2">⚡ Energy Analysis</h5>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-blue-700">
              <strong>Energy Needed:</strong> {energy_analysis.total_consumption_kwh} kWh
            </p>
            <p className="text-blue-700">
              <strong>Available Energy:</strong> {energy_analysis.usable_energy_kwh} kWh
            </p>
          </div>
          <div>
            <p className={`font-medium ${energy_analysis.is_reachable ? 'text-green-600' : 'text-red-600'}`}>
              {energy_analysis.is_reachable ? '✅ Reachable' : '❌ May not be reachable'}
            </p>
            <p className="text-blue-700">
              <strong>Efficiency Score:</strong> {(energy_analysis.energy_efficiency_score * 100).toFixed(0)}%
            </p>
          </div>
        </div>
        
        {(energy_analysis.ac_penalty_kwh > 0 || energy_analysis.passenger_penalty_kwh > 0 || energy_analysis.terrain_penalty_kwh > 0) && (
          <div className="mt-2 pt-2 border-t border-blue-300">
            <p className="text-xs text-blue-600 font-medium">Impact Factors:</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {energy_analysis.ac_penalty_kwh > 0 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  AC: +{energy_analysis.ac_penalty_kwh} kWh
                </span>
              )}
              {energy_analysis.passenger_penalty_kwh > 0 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  Passengers: +{energy_analysis.passenger_penalty_kwh} kWh
                </span>
              )}
              {energy_analysis.terrain_penalty_kwh > 0 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  Terrain: +{energy_analysis.terrain_penalty_kwh} kWh
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderScoreBreakdown = (station) => {
    if (!station.score_breakdown || !expandedScores[station.id]) return null;

    const { score_breakdown } = station;
    return (
      <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <h5 className="font-semibold text-gray-800 mb-2">📊 Score Breakdown</h5>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(score_breakdown).map(([factor, score]) => (
            <div key={factor} className="flex justify-between">
              <span className="text-gray-600 capitalize">
                {factor.replace('_', ' ')}:
              </span>
              <span className="font-medium text-gray-800">
                {(score * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Route Information Section */}
      {routeInfo && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <h2 className="text-xl font-bold text-blue-800 mb-3 flex items-center">
            🗺️ Route Planning Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-gray-600">Origin</div>
              <div className="font-semibold text-gray-800">
                {routeInfo.origin[0].toFixed(4)}, {routeInfo.origin[1].toFixed(4)}
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-gray-600">Destination</div>
              <div className="font-semibold text-blue-600 text-lg">
                📍 {routeInfo.destination_city}
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-gray-600">Direct Distance</div>
              <div className="font-semibold text-green-600">
                {routeInfo.direct_distance_km} km
              </div>
            </div>
          </div>
          
          {userContext?.max_detour_km && (
            <div className="mt-3 text-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                ⚠️ Max detour: {userContext.max_detour_km} km
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">
          {routeInfo ? '🛣️ Route Charging Stations' : '🎯 Smart Recommendations'} ({recommendations.length})
        </h3>
        <div className="text-right">
          {/* Enhanced Context Display */}
          {userContext && (
            <div className="flex flex-wrap justify-end gap-1 mb-2">
              {userContext.battery_percentage && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  🔋 {userContext.battery_percentage}%
                </span>
              )}
              {userContext.ac_status && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  ❄️ AC On
                </span>
              )}
              {userContext.passengers > 1 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  👥 {userContext.passengers} passengers
                </span>
              )}
              {userContext.terrain !== 'flat' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  🏔️ {userContext.terrain} terrain
                </span>
              )}
              {userContext.urgency && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  ⚡ {userContext.urgency} urgency
                </span>
              )}
              {userContext.route_mode && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  🗺️ Route Mode
                </span>
              )}
            </div>
          )}
          {(metadata || algorithmInfo) && (
            <div className="text-sm text-gray-600">
              <div>Algorithm: {algorithmInfo?.algorithm_used || metadata?.type || 'hybrid'}</div>
              {(algorithmInfo?.factors_considered || metadata?.factors_considered) && (
                <div className="text-xs text-gray-500">
                  Factors: {(algorithmInfo?.factors_considered || metadata?.factors_considered).join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {autoBookings.length > 0 && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 rounded">
          <h4 className="font-medium text-green-800 mb-1">✅ Auto-Booked!</h4>
          <p className="text-sm text-green-700">
            High urgency detected. We've automatically booked the top station for you.
          </p>
          {autoBookings.map((booking, index) => (
            <div key={index} className="text-xs text-green-600 mt-1">
              Booking ID: {booking.booking_id} • Station: {booking.station_name}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {recommendations.map((rec, index) => {
          const station = rec;
          const hasBooking = findBookingForStation(station.id);
          const isLoadingBooking = bookingLoading[station.id];
          const isEnhanced = station.energy_analysis || station.score_breakdown;
          
          return (
            <div 
              key={station.id} 
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
                      onClick={() => toggleScoreBreakdown(station.id)}
                      className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                    >
                      {expandedScores[station.id] ? '▼ Hide Details' : '▶ Show Details'}
                    </button>
                  )}
                </div>
              </div>

              {/* Enhanced Analysis */}
              {renderEnergyAnalysis(station)}
              {renderScoreBreakdown(station)}

              {/* Station Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">📍</span>
                    <span className="text-sm text-gray-700">{station.location?.address || `${station.location?.[0]?.toFixed(4)}, ${station.location?.[1]?.toFixed(4)}`}</span>
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
              {rec.auto_booking?.auto_booked && (
                <div className="mb-3 p-2 bg-green-100 border border-green-300 rounded text-sm">
                  <strong className="text-green-800">✅ Auto-booked for you!</strong>
                  <br />
                  <span className="text-green-700">
                    Booking ID: {rec.auto_booking.booking_id}
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

                {!hasBooking && !rec.auto_booking?.auto_booked && (
                  <>
                    {station.availability > 0 ? (
                      <button
                        onClick={() => handleBookSlot(station)}
                        disabled={isLoadingBooking}
                        className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isLoadingBooking ? 'Booking...' : 'Book Now'}
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
                    {userContext?.urgency === 'high' && index === 0 && onAutoBook && station.availability > 0 && (
                      <button
                        onClick={() => handleAutoBookRecommendation(station)}
                        disabled={isLoadingBooking}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isLoadingBooking ? 'Auto-booking...' : '⚡ Auto-Book'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationResults; 