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
      <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl p-8">
        <h3 className="text-2xl font-bold mb-6 text-white">No Recommendations</h3>
        <p className="text-gray-300">
          {routeInfo 
            ? `No charging stations found along the route to ${routeInfo.destination_city}.`
            : 'No charging stations found matching your criteria.'
          }
        </p>
        <div className="mt-6 p-4 bg-gray-800/30 border border-gray-600/50 rounded-2xl text-sm">
          <p className="text-gray-400">Debug info:</p>
          <p className="text-gray-300">Recommendations type: {typeof recommendations}</p>
          <p className="text-gray-300">Recommendations length: {recommendations?.length}</p>
          <p className="text-gray-300">Data keys: {data ? Object.keys(data).join(', ') : 'No data'}</p>
          {data?.algorithm_info && (
            <div className="mt-4">
              <p className="text-gray-400"><strong>Algorithm Info:</strong></p>
              <p className="text-gray-300">Algorithm: {data.algorithm_info.algorithm_used}</p>
              <p className="text-gray-300">Total stations processed: {data.algorithm_info.total_stations_processed}</p>
              <p className="text-gray-300">Route filtered: {data.algorithm_info.route_filtered || 0}</p>
              <p className="text-gray-300">Destination city: {data.algorithm_info.destination_city || 'None'}</p>
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
      setBookingLoading(prev => ({ ...prev, [station.id]: false }));
    }
  };

  // Helper function to get real-time availability display
  const getAvailabilityDisplay = (station) => {
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

  const renderEnergyAnalysis = (station) => {
    if (!station.energy_analysis) return null;

    const { energy_analysis } = station;
    return (
      <div className="mb-6 p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl backdrop-blur-sm">
        <h5 className="font-semibold text-cyan-400 mb-3">
          Energy Analysis
        </h5>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-300">
              <strong className="text-cyan-300">Energy Needed:</strong> {energy_analysis.total_consumption_kwh} kWh
            </p>
            <p className="text-gray-300">
              <strong className="text-cyan-300">Available Energy:</strong> {energy_analysis.usable_energy_kwh} kWh
            </p>
          </div>
          <div>
            <p className={`font-medium ${energy_analysis.is_reachable ? 'text-green-400' : 'text-red-400'}`}>
              {energy_analysis.is_reachable ? '✅ Reachable' : '❌ May not be reachable'}
            </p>
            <p className="text-gray-300">
              <strong className="text-cyan-300">Efficiency Score:</strong> {(energy_analysis.energy_efficiency_score * 100).toFixed(0)}%
            </p>
          </div>
        </div>
        
        {(energy_analysis.ac_penalty_kwh > 0 || energy_analysis.passenger_penalty_kwh > 0 || energy_analysis.terrain_penalty_kwh > 0) && (
          <div className="mt-4 pt-4 border-t border-cyan-500/30">
            <p className="text-xs text-cyan-400 font-medium mb-2">Impact Factors:</p>
            <div className="flex flex-wrap gap-2">
              {energy_analysis.ac_penalty_kwh > 0 && (
                <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full border border-cyan-500/30">
                  AC: +{energy_analysis.ac_penalty_kwh} kWh
                </span>
              )}
              {energy_analysis.passenger_penalty_kwh > 0 && (
                <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full border border-cyan-500/30">
                  Passengers: +{energy_analysis.passenger_penalty_kwh} kWh
                </span>
              )}
              {energy_analysis.terrain_penalty_kwh > 0 && (
                <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full border border-cyan-500/30">
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
      <div className="mb-6 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl backdrop-blur-sm">
        <h5 className="font-semibold text-green-400 mb-3">
          ETA Analysis
        </h5>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-300">
              <strong className="text-green-300">Travel Time:</strong> {eta_analysis.eta_string}
            </p>
            <p className="text-gray-300">
              <strong className="text-green-300">Arrival Time:</strong> {eta_analysis.arrival_time}
            </p>
          </div>
          <div>
            <p className="text-gray-300">
              <strong className="text-green-300">Effective Speed:</strong> {eta_analysis.effective_speed_kmh} km/h
            </p>
            <p className="text-gray-300">
              <strong className="text-green-300">Distance:</strong> {eta_analysis.distance_km} km
            </p>
          </div>
        </div>
        
        {eta_analysis.factors_applied && (
          <div className="mt-4 pt-4 border-t border-green-500/30">
            <p className="text-xs text-green-400 font-medium mb-2">Applied Factors:</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
                {eta_analysis.factors_applied.driving_mode}
              </span>
              <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
                {eta_analysis.factors_applied.traffic_condition} traffic
              </span>
              <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
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
      <div className="mb-6 p-4 bg-gradient-to-r from-gray-500/10 to-gray-600/10 border border-gray-500/20 rounded-2xl backdrop-blur-sm">
        <h5 className="font-semibold text-gray-300 mb-3">
          Score Breakdown
        </h5>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {Object.entries(score_breakdown).map(([factor, score]) => (
            <div key={factor} className="flex justify-between">
              <span className="text-gray-400 capitalize">
                {factor.replace('_', ' ')}:
              </span>
              <span className="font-medium text-gray-200">
                {(score * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl p-8 hover:border-cyan-500/50 transition-all duration-500">
      {/* Route Information Section */}
      {routeInfo && (
        <div className="mb-8 p-6 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 rounded-2xl backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">
            Route Planning Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-800/30 rounded-2xl border border-gray-600/50">
              <div className="text-sm text-gray-400">Origin</div>
              <div className="font-semibold text-gray-200">
                {routeInfo.origin[0].toFixed(4)}, {routeInfo.origin[1].toFixed(4)}
              </div>
            </div>
            <div className="text-center p-4 bg-gray-800/30 rounded-2xl border border-gray-600/50">
              <div className="text-sm text-gray-400">Destination</div>
              <div className="font-semibold text-cyan-400 text-lg">
                {routeInfo.destination_city}
              </div>
            </div>
            <div className="text-center p-4 bg-gray-800/30 rounded-2xl border border-gray-600/50">
              <div className="text-sm text-gray-400">Direct Distance</div>
              <div className="font-semibold text-green-400">
                {routeInfo.direct_distance_km} km
              </div>
            </div>
          </div>
          
          {userContext?.max_detour_km && (
            <div className="mt-4 text-center">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                Max detour: {userContext.max_detour_km} km
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">
          {routeInfo ? 'Route Charging Stations' : 'Smart Recommendations'} ({recommendations.length})
        </h3>
        <div className="text-right">
          {/* Enhanced Context Display */}
          {userContext && (
            <div className="flex flex-wrap justify-end gap-2 mb-3">
              {userContext.battery_percentage && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                  {userContext.battery_percentage}%
                </span>
              )}
              {userContext.ac_status && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  AC On
                </span>
              )}
              {userContext.passengers > 1 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {userContext.passengers} passengers
                </span>
              )}
              {userContext.terrain !== 'flat' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  {userContext.terrain} terrain
                </span>
              )}
              {userContext.urgency && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                  {userContext.urgency} urgency
                </span>
              )}
              {userContext.route_mode && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Route Mode
                </span>
              )}
            </div>
          )}
          {(metadata || algorithmInfo) && (
            <div className="text-sm text-gray-400">
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
        <div className="mb-6 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl backdrop-blur-sm">
          <h4 className="font-medium text-green-300 mb-2">
            Auto-Booked!
          </h4>
          <p className="text-sm text-green-200">
            High urgency detected. We've automatically booked the top station for you.
          </p>
          {autoBookings.map((booking, index) => (
            <div key={index} className="text-xs text-green-300 mt-2">
              Booking ID: {booking.booking_id} • Station: {booking.station_name}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-6">
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