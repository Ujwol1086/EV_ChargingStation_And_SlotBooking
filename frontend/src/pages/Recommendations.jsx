import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import RecommendationForm from "../components/RecommendationForm";
import RecommendationResults from "../components/RecommendationResults";
import { useAuth } from "../context/useAuth";
import axios from "../api/axios";

// Fix for the default marker icon issue in react-leaflet
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Create custom icons
const userLocationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const recommendedStationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const topRecommendationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -40],
  shadowSize: [49, 49],
});

// Component to handle map view updates
const MapController = ({ userLocation, recommendations, routeData }) => {
  const map = useMap();

  useEffect(() => {
    if (routeData?.waypoints?.length > 0) {
      // Fit map to route
      const bounds = L.latLngBounds(routeData.waypoints);
      map.fitBounds(bounds, { padding: [20, 20] });
    } else if (userLocation && recommendations?.length > 0) {
      // Create bounds that include user location and all recommended stations
      const allPoints = [
        userLocation,
        ...recommendations.map(rec => rec.location)
      ];
      
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [20, 20] });
    } else if (userLocation) {
      map.setView(userLocation, 13);
    }
  }, [map, userLocation, recommendations, routeData]);

  return null;
};

const Recommendations = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [userLocation, setUserLocation] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [mapCenter, setMapCenter] = useState([27.7172, 85.324]); // Nepal center
  const [userBookings, setUserBookings] = useState([]);
  const [routeData, setRouteData] = useState(null);
  const [showRoute, setShowRoute] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Get user's location on component mount
  useEffect(() => {
    if (isAuthenticated) {
      const getUserLocation = () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              const location = [latitude, longitude];
              setUserLocation(location);
              setMapCenter(location);
            },
            (error) => {
              console.error("Error getting location:", error);
              // Fall back to Nepal center if location access is denied
              setMapCenter([27.7172, 85.324]);
            },
            { enableHighAccuracy: true }
          );
        } else {
          console.error("Geolocation is not supported by this browser");
          setMapCenter([27.7172, 85.324]);
        }
      };

      getUserLocation();
      loadUserBookings();
    }
  }, [isAuthenticated]);

  const loadUserBookings = async () => {
    try {
      const response = await axios.get('/recommendations/my-bookings');
      if (response.data.success) {
        setUserBookings(response.data.bookings);
      }
    } catch (err) {
      console.error('Error loading bookings:', err);
    }
  };

  const handleRecommendations = (data) => {
    console.log('Setting recommendations:', data);
    setRecommendations(data);
    setSelectedStation(null);
    setRouteData(null);
    setShowRoute(false);
    // Reload bookings to get any new auto-bookings
    loadUserBookings();
  };

  // Helper function to get station coordinates
  const getStationCoordinates = (station) => {
    if (!station.location) return null;
    
    if (Array.isArray(station.location)) {
      return station.location;
    } else if (station.location.coordinates && Array.isArray(station.location.coordinates)) {
      return station.location.coordinates;
    }
    return null;
  };

  const handleStationSelect = (station) => {
    setSelectedStation(station);
    // Focus map on selected station
    if (mapRef.current) {
      const map = mapRef.current;
      const stationCoords = getStationCoordinates(station);
      if (stationCoords) {
        map.setView(stationCoords, 15);
      }
    }
  };

  const handleShowRoute = async (station) => {
    if (!userLocation) {
      setError('User location not available');
      return;
    }

    setLoadingRoute(true);
    setError(null);

    try {
      const stationCoords = getStationCoordinates(station);
      if (!stationCoords) {
        setError('Invalid station location format');
        setLoadingRoute(false);
        return;
      }

      const response = await axios.post('/recommendations/route-to-station', {
        user_location: userLocation,
        station_location: stationCoords,
        booking_id: findBookingForStation(station.id)?.booking_id
      });

      if (response.data.success) {
        setRouteData(response.data);
        setShowRoute(true);
        setSelectedStation(station);
      } else {
        setError(response.data.error || 'Failed to calculate route');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error calculating route');
    } finally {
      setLoadingRoute(false);
    }
  };

  const findBookingForStation = (stationId) => {
    return userBookings.find(booking => booking.station_id === stationId);
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      const response = await axios.delete(`/recommendations/cancel-booking/${bookingId}`);
      if (response.data.success) {
        loadUserBookings(); // Reload bookings
        alert('Booking cancelled successfully');
      } else {
        alert(response.data.error || 'Failed to cancel booking');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Error cancelling booking');
    }
  };

  const handleAutoBook = (booking) => {
    // Add the auto-booking to the userBookings state
    setUserBookings(prev => [...prev, booking]);
    
    // Show success message with details
    alert(`Auto-booking successful!\nStation: ${booking.station_details?.name}\nBooking ID: ${booking.booking_id}`);
    
    // Reload recommendations to update availability
    if (recommendations) {
      handleRecommendations(recommendations);
    }
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Smart Charging Station Recommendations</h1>
          <p className="text-gray-600">Find the best charging stations based on your location, battery level, and urgency.</p>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form and Results */}
          <div className="space-y-6">
            {/* Recommendation Form */}
            <RecommendationForm 
              onRecommendations={handleRecommendations}
              userLocation={userLocation}
            />

            {/* User Bookings */}
            {userBookings.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Your Bookings</h3>
                <div className="space-y-3">
                  {userBookings.slice(0, 3).map((booking) => (
                    <div key={booking._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-800">
                          {booking.station_details?.name || 'Unknown Station'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {booking.charger_type} • {booking.status}
                          {booking.auto_booked && ' (Auto-booked)'}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleShowRoute(booking.station_details)}
                          disabled={loadingRoute}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {loadingRoute ? 'Loading...' : 'Show Route'}
                        </button>
                        <button
                          onClick={() => handleCancelBooking(booking.booking_id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {userBookings.length > 3 && (
                  <div className="text-center mt-3">
                    <span className="text-sm text-gray-500">
                      +{userBookings.length - 3} more bookings
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Recommendation Results */}
            {recommendations && (
              <RecommendationResults 
                recommendations={recommendations.recommendations || recommendations}
                onStationSelect={handleStationSelect}
                onShowRoute={handleShowRoute}
                userBookings={userBookings}
                loadingRoute={loadingRoute}
                metadata={recommendations.algorithm_info || recommendations.metadata}
                autoBookings={recommendations.auto_bookings || []}
                data={recommendations}
                onAutoBook={handleAutoBook}
              />
            )}

            {/* Route Information */}
            {showRoute && routeData && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Route Information</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-500">Total Distance</span>
                    <div className="font-medium text-gray-800">{routeData.metrics.total_distance} km</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Estimated Time</span>
                    <div className="font-medium text-gray-800">{routeData.metrics.estimated_time}</div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <span className="text-sm text-gray-500 block mb-2">Route Instructions</span>
                  <ol className="text-sm text-gray-700 space-y-1">
                    {routeData.instructions.map((instruction, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        {instruction}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="text-xs text-gray-500">
                  Algorithm: {routeData.algorithm_used} • {routeData.metrics.waypoint_count} waypoints
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Map */}
          <div className="lg:sticky lg:top-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">
                  {showRoute ? 'Route to Station' : 
                   recommendations ? 'Recommended Stations Map' : 'Your Location'}
                </h3>
              </div>
              
              <div className="h-96 lg:h-[600px]">
                <MapContainer
                  center={mapCenter}
                  zoom={13}
                  className="h-full w-full"
                  ref={mapRef}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* Map Controller */}
                  <MapController 
                    userLocation={userLocation}
                    recommendations={recommendations?.recommendations}
                    routeData={routeData}
                  />

                  {/* Route Polyline */}
                  {showRoute && routeData?.waypoints && (
                    <Polyline
                      positions={routeData.waypoints}
                      color="blue"
                      weight={4}
                      opacity={0.7}
                    />
                  )}

                  {/* User Location Marker */}
                  {userLocation && (
                    <Marker position={userLocation} icon={userLocationIcon}>
                      <Popup>
                        <div className="text-center">
                          <strong>Your Location</strong>
                          <br />
                          {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Recommended Station Markers */}
                  {recommendations?.recommendations?.map((rec, index) => {
                    const station = rec; // rec itself contains the station data, not rec.station
                    const icon = index === 0 ? topRecommendationIcon : recommendedStationIcon;
                    const hasBooking = findBookingForStation(station.id);
                    
                    return (
                      <Marker
                        key={station.id}
                        position={getStationCoordinates(station) || [0, 0]}
                        icon={icon}
                      >
                        <Popup>
                          <div className="min-w-[250px]">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">
                                {index + 1}
                              </div>
                              <strong>{station.name}</strong>
                            </div>
                            
                            <div className="space-y-1 text-sm">
                              <div>📍 {station.location?.address || (() => {
                  const coords = getStationCoordinates(station);
                  return coords ? `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}` : 'Location data unavailable';
                })()}</div>
                              <div>🚗 {rec.distance} km away</div>
                              <div>⭐ Score: {rec.score}</div>
                              <div>🔌 {station.availability || 0}/{station.total_slots || 0} available</div>
                              <div>💰 Rs. {station.pricing || 'N/A'} per kWh</div>
                              <div>⚡ Rating: {station.rating}/5</div>
                            </div>

                            {rec.auto_booking?.auto_booked && (
                              <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded text-xs">
                                <strong>✅ Auto-booked!</strong>
                                <br />
                                ID: {rec.auto_booking.booking_id}
                              </div>
                            )}

                            {hasBooking && (
                              <div className="mt-2 p-2 bg-blue-100 border border-blue-300 rounded text-xs">
                                <strong>📋 You have a booking here</strong>
                                <br />
                                Status: {hasBooking.status}
                              </div>
                            )}

                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => handleStationSelect(station)}
                                className="flex-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => handleShowRoute(station)}
                                disabled={loadingRoute}
                                className="flex-1 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                {loadingRoute ? 'Loading...' : 'Show Route'}
                              </button>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
            </div>

            {/* Map Legend */}
            {(recommendations || showRoute) && (
              <div className="mt-4 bg-white rounded-lg shadow-md p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Map Legend</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <span>Your Location</span>
                  </div>
                  {recommendations && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                        <span>Top Recommendation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <span>Recommended Stations</span>
                      </div>
                    </>
                  )}
                  {showRoute && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-1 bg-blue-500"></div>
                      <span>Route to Station</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recommendations; 