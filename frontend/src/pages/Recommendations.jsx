import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import { useNavigate } from "react-router-dom";
import { getStationCoordinates } from "../utils/mapHelpers";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import RecommendationForm from "../components/RecommendationForm";
import RecommendationResults from "../components/RecommendationResults";
import { useAuth } from "../context/useAuth";
import axios from "../api/axios";
import {
  userLocationIcon,
  recommendedStationIcon,
  topRecommendationIcon,
} from "../utils/mapIcons";

// Fix for the default marker icon issue in react-leaflet
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
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
        ...recommendations.map((rec) => rec.location),
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
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
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
      const response = await axios.get("/recommendations/my-bookings");
      if (response.data.success) {
        setUserBookings(response.data.bookings);
      }
    } catch (err) {
      console.error("Error loading bookings:", err);
    }
  };

  const handleRecommendations = async (formData) => {
    console.log("Form data received:", formData);

    setLoadingRecommendations(true);
    setError(null);

    try {
      // Choose the appropriate endpoint based on whether destination is set
      const endpoint = formData.destination_city
        ? "/recommendations/route-to-city"
        : "/recommendations/enhanced";

      console.log("Sending request to:", endpoint);
      console.log("Request data:", formData);

      const response = await axios.post(endpoint, formData);

      console.log("Response received:", response.data);

      if (response.data && response.data.success !== false) {
        setRecommendations(response.data);
        setSelectedStation(null);
        setRouteData(null);
        setShowRoute(false);
        setError(null);
        // Reload bookings to get any new auto-bookings
        loadUserBookings();
      } else {
        console.error("Recommendation error:", response.data);
        setError(response.data.error || "Failed to get recommendations");
      }
    } catch (error) {
      console.error("Error getting recommendations:", error);
      setError("Failed to get recommendations. Please try again.");
    } finally {
      setLoadingRecommendations(false);
    }
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
      setError("User location not available");
      return;
    }

    setLoadingRoute(true);
    setError(null);

    try {
      const stationCoords = getStationCoordinates(station);
      if (!stationCoords) {
        setError("Invalid station location format");
        setLoadingRoute(false);
        return;
      }

      const response = await axios.post("/recommendations/route-to-station", {
        user_location: userLocation,
        station_location: stationCoords,
        booking_id: findBookingForStation(station.id)?.booking_id,
      });

      if (response.data.success) {
        setRouteData(response.data);
        setShowRoute(true);
        setSelectedStation(station);
      } else {
        setError(response.data.error || "Failed to calculate route");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Error calculating route");
    } finally {
      setLoadingRoute(false);
    }
  };

  const findBookingForStation = (stationId) => {
    return userBookings.find((booking) => booking.station_id === stationId);
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      const response = await axios.delete(
        `/recommendations/cancel-booking/${bookingId}`
      );
      if (response.data.success) {
        loadUserBookings(); // Reload bookings
        alert("Booking cancelled successfully");
      } else {
        alert(response.data.error || "Failed to cancel booking");
      }
    } catch (err) {
      alert(err.response?.data?.error || "Error cancelling booking");
    }
  };

  const handleAutoBook = (booking) => {
    // Add the auto-booking to the userBookings state
    setUserBookings((prev) => [...prev, booking]);

    // Show success message with details
    alert(
      `Auto-booking successful!\nStation: ${booking.station_details?.name}\nBooking ID: ${booking.booking_id}`
    );

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
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-gray-950 mt-15">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Smart Charging Station Recommendations
          </h1>
          <p className="text-gray-300 text-lg">
            Find the best charging stations based on your location, battery
            level, and urgency.
          </p>

          {error && (
            <div className="mt-6 p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 text-red-300 rounded-2xl backdrop-blur-sm">
              {error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form and Results */}
          <div className="space-y-8">
            {/* Recommendation Form */}
            <RecommendationForm
              onSubmit={handleRecommendations}
              loading={loadingRecommendations}
            />

            {/* User Bookings */}
            {userBookings.length > 0 && (
              <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl p-8 hover:border-cyan-500/50 transition-all duration-500">
                <h3 className="text-2xl font-bold mb-6 text-white">
                  Your Bookings
                </h3>
                <div className="space-y-4">
                  {userBookings.slice(0, 3).map((booking) => (
                    <div
                      key={booking._id}
                      className="flex items-center justify-between p-4 bg-gray-800/30 rounded-2xl border border-gray-600/50 backdrop-blur-sm"
                    >
                      <div>
                        <div className="font-medium text-white">
                          {booking.station_details?.name || "Unknown Station"}
                        </div>
                        <div className="text-sm text-gray-300">
                          {booking.charger_type} • {booking.status}
                          {booking.auto_booked && " (Auto-booked)"}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() =>
                            handleShowRoute(booking.station_details)
                          }
                          disabled={loadingRoute}
                          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm rounded-xl hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
                        >
                          {loadingRoute ? "Loading..." : "Show Route"}
                        </button>
                        <button
                          onClick={() =>
                            handleCancelBooking(booking.booking_id)
                          }
                          className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white text-sm rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-red-500/25"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {userBookings.length > 3 && (
                  <div className="text-center mt-4">
                    <span className="text-sm text-gray-400">
                      +{userBookings.length - 3} more bookings
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Recommendation Results */}
            {recommendations && (
              <RecommendationResults
                recommendations={
                  Array.isArray(recommendations.recommendations)
                    ? recommendations.recommendations
                    : Array.isArray(recommendations)
                    ? recommendations
                    : []
                }
                onStationSelect={handleStationSelect}
                onShowRoute={handleShowRoute}
                userBookings={userBookings}
                loadingRoute={loadingRoute}
                metadata={
                  recommendations.algorithm_info || recommendations.metadata
                }
                autoBookings={recommendations.auto_bookings || []}
                data={recommendations}
                onAutoBook={handleAutoBook}
              />
            )}

            {/* Route Information */}
            {showRoute && routeData && (
              <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl p-8 hover:border-cyan-500/50 transition-all duration-500">
                <h3 className="text-2xl font-bold mb-6 text-white">
                  Route Information
                </h3>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="text-center p-4 bg-gray-800/30 rounded-2xl border border-gray-600/50">
                    <span className="text-sm text-gray-400 block mb-2">
                      Total Distance
                    </span>
                    <div className="font-medium text-cyan-400 text-lg">
                      {routeData.metrics.total_distance} km
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-800/30 rounded-2xl border border-gray-600/50">
                    <span className="text-sm text-gray-400 block mb-2">
                      Estimated Time
                    </span>
                    <div className="font-medium text-green-400 text-lg">
                      {routeData.metrics.estimated_time}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-sm text-gray-400 block mb-3">
                    Route Instructions
                  </span>
                  <ol className="text-sm text-gray-300 space-y-2">
                    {routeData.instructions.map((instruction, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        {instruction}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="text-xs text-gray-400">
                  Algorithm: {routeData.algorithm_used} •{" "}
                  {routeData.metrics.waypoint_count} waypoints
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Map */}
          <div className="lg:sticky lg:top-8">
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl overflow-hidden hover:border-cyan-500/50 transition-all duration-500">
              <div className="p-6 border-b border-gray-600/50">
                <h3 className="text-xl font-semibold text-white">
                  {showRoute
                    ? "Route to Station"
                    : recommendations
                    ? "Recommended Stations Map"
                    : "Your Location"}
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
                      color="#06b6d4"
                      weight={4}
                      opacity={0.8}
                    />
                  )}

                  {/* User Location Marker */}
                  {userLocation && (
                    <Marker position={userLocation} icon={userLocationIcon}>
                      <Popup>
                        <div className="text-center">
                          <strong>Your Location</strong>
                          <br />
                          {userLocation[0].toFixed(4)},{" "}
                          {userLocation[1].toFixed(4)}
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Recommended Station Markers */}
                  {recommendations?.recommendations?.map((rec, index) => {
                    const station = rec; // rec itself contains the station data, not rec.station
                    const icon =
                      index === 0
                        ? topRecommendationIcon
                        : recommendedStationIcon;
                    const hasBooking = findBookingForStation(station.id);

                    return (
                      <Marker
                        key={station.id}
                        position={getStationCoordinates(station) || [0, 0]}
                        icon={icon}
                      >
                        <Popup>
                          <div className="min-w-[250px]">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </div>
                              <strong className="text-gray-800">{station.name}</strong>
                            </div>

                            <div className="space-y-2 text-sm text-gray-700">
                              <div>
                                {station.location?.address ||
                                  (() => {
                                    const coords =
                                      getStationCoordinates(station);
                                    return coords
                                      ? `${coords[0].toFixed(
                                          4
                                        )}, ${coords[1].toFixed(4)}`
                                      : "Location data unavailable";
                                  })()}
                              </div>
                              <div>{rec.distance} km away</div>
                              <div>Score: {rec.score}</div>
                              <div>
                                {station.availability || 0}/
                                {station.total_slots || 0} available
                              </div>
                              <div>
                                Rs. {station.pricing || "N/A"} per kWh
                              </div>
                              <div>Rating: {station.rating}/5</div>
                            </div>

                            {rec.auto_booking?.auto_booked && (
                              <div className="mt-3 p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl text-xs backdrop-blur-sm">
                                <strong className="text-green-800">Auto-booked!</strong>
                                <br />
                                <span className="text-green-700">ID: {rec.auto_booking.booking_id}</span>
                              </div>
                            )}

                            {hasBooking && (
                              <div className="mt-3 p-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl text-xs backdrop-blur-sm">
                                <strong className="text-cyan-800">You have a booking here</strong>
                                <br />
                                <span className="text-cyan-700">Status: {hasBooking.status}</span>
                              </div>
                            )}

                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => handleStationSelect(station)}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => handleShowRoute(station)}
                                disabled={loadingRoute}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25"
                              >
                                {loadingRoute ? "Loading..." : "Show Route"}
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
              <div className="mt-6 bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl p-6 hover:border-cyan-500/50 transition-all duration-500">
                <h4 className="font-semibold text-white mb-4">
                  Map Legend
                </h4>
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"></div>
                    <span>Your Location</span>
                  </div>
                  {recommendations && (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"></div>
                        <span>Top Recommendation</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                        <span>Recommended Stations</span>
                      </div>
                    </>
                  )}
                  {showRoute && (
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"></div>
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
