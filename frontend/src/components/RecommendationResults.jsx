import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import axios from "../api/axios";
import RecommendationCard from "./recommendations/RecommendationCard";

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

  console.log('RecommendationResults received:', { recommendations, data, routeInfo });

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
        <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
          <p>Debug info:</p>
          <p>Recommendations type: {typeof recommendations}</p>
          <p>Recommendations length: {recommendations?.length}</p>
          <p>Data keys: {data ? Object.keys(data).join(', ') : 'No data'}</p>
          {data?.algorithm_info && (
            <div className="mt-2">
              <p><strong>Algorithm Info:</strong></p>
              <p>Algorithm: {data.algorithm_info.algorithm_used}</p>
              <p>Total stations processed: {data.algorithm_info.total_stations_processed}</p>
              <p>Route filtered: {data.algorithm_info.route_filtered || 0}</p>
              <p>Destination city: {data.algorithm_info.destination_city || 'None'}</p>
            </div>
          )}
        </div>
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
    
    // Redirect to dedicated booking page with station data
    navigate(`/booking/${station.id}`, {
      state: { 
        station: station,
        userContext: userContext 
      }
    });
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
      setBookingLoading(prev => ({ ...prev, [station.id]: false }));
    }
  };

  // Helper function to get real-time availability display
  const getAvailabilityDisplay = (station) => {
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

  const renderETAAnalysis = (station) => {
    if (!station.eta_analysis) return null;

    const { eta_analysis } = station;
    return (
      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <h5 className="font-semibold text-green-800 mb-2">⏱️ ETA Analysis</h5>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-green-700">
              <strong>Travel Time:</strong> {eta_analysis.eta_string}
            </p>
            <p className="text-green-700">
              <strong>Arrival Time:</strong> {eta_analysis.arrival_time}
            </p>
          </div>
          <div>
            <p className="text-green-700">
              <strong>Effective Speed:</strong> {eta_analysis.effective_speed_kmh} km/h
            </p>
            <p className="text-green-700">
              <strong>Distance:</strong> {eta_analysis.distance_km} km
            </p>
          </div>
        </div>
        
        {eta_analysis.factors_applied && (
          <div className="mt-2 pt-2 border-t border-green-300">
            <p className="text-xs text-green-600 font-medium">Applied Factors:</p>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                {eta_analysis.factors_applied.driving_mode}
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                {eta_analysis.factors_applied.traffic_condition} traffic
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                {eta_analysis.factors_applied.weather}
              </span>
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
          
          return (
            <RecommendationCard
              key={station.id}
              station={station}
              index={index}
              onStationSelect={onStationSelect}
              onShowRoute={onShowRoute}
              loadingRoute={loadingRoute}
              hasBooking={hasBooking}
              userContext={userContext}
              onAutoBook={onAutoBook}
            />
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationResults; 