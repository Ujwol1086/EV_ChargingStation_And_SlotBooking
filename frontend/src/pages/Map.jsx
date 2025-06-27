import { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "../api/axios";
import L from "leaflet";
import BookingForm from "../components/BookingForm";
import RecommendationForm from "../components/RecommendationForm";
import RecommendationResults from "../components/RecommendationResults";

// Fix for the default marker icon issue in react-leaflet
// This is needed because webpack doesn't handle Leaflet's assets correctly
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix missing icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Create custom icons
const userLocationIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
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
const LocationMarker = ({ position, setPosition }) => {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 14);
    }
  }, [position, map]);

  useEffect(() => {
    // Get user's current position when component mounts
    if (!position) {
      map.locate({ setView: true, maxZoom: 14 });

      map.on("locationfound", (e) => {
        setPosition([e.latlng.lat, e.latlng.lng]);
      });

      map.on("locationerror", (e) => {
        console.error("Location error:", e.message);
      });
    }

    // Clean up event listeners on unmount
    return () => {
      map.off("locationfound");
      map.off("locationerror");
    };
  }, [map, position, setPosition]);

  return position ? (
    <Marker position={position} icon={userLocationIcon}>
      <Popup>📍 You are here</Popup>
    </Marker>
  ) : null;
};

// Function to calculate distance between two coordinates in kilometers
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

// Convert degrees to radians
const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

const Map = () => {
  const [stations, setStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [userPosition, setUserPosition] = useState(null);
  const [maxDistance, setMaxDistance] = useState(100); // Default max distance filter (km)
  const [mapCenter, setMapCenter] = useState(null);
  
  // NEW: Smart Recommendations State
  const [recommendations, setRecommendations] = useState(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [viewMode, setViewMode] = useState('explore'); // 'explore' or 'recommendations'
  
  const mapRef = useRef(null);

  // Center of Nepal as fallback
  const nepalCenter = useMemo(() => [27.7172, 85.324], []);

  // Request user's location immediately when component mounts
  useEffect(() => {
    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserPosition([latitude, longitude]);
            setMapCenter([latitude, longitude]);
          },
          (error) => {
            console.error("Error getting location:", error);
            setMapCenter(nepalCenter);
          },
          { enableHighAccuracy: true }
        );
      } else {
        console.error("Geolocation is not supported by this browser");
        setMapCenter(nepalCenter);
      }
    };
    getUserLocation();
  }, [nepalCenter]);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/stations/list");
        if (response.data.success) {
          setStations(response.data.stations);
          setFilteredStations(response.data.stations);
        } else {
          setError("Failed to load charging stations");
        }
      } catch (err) {
        setError("Error connecting to the server");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  // Filter and sort stations based on user position
  useEffect(() => {
    if (userPosition && stations.length > 0) {
      // Calculate distance for each station
      const stationsWithDistance = stations.map((station) => {
        const distance = calculateDistance(
          userPosition[0],
          userPosition[1],
          station.location.coordinates[0],
          station.location.coordinates[1]
        );
        return { ...station, distance };
      });

      // Filter by max distance and sort by proximity
      const filtered = stationsWithDistance
        .filter((station) => station.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance);

      setFilteredStations(filtered);
    }
  }, [userPosition, stations, maxDistance]);

  const handleStationClick = async (stationId) => {
    try {
      const response = await axios.get(`/stations/${stationId}`);
      if (response.data.success) {
        setSelectedStation(response.data.station);
      }
    } catch (err) {
      console.error("Error fetching station details:", err);
    }
  };

  const handleBookingComplete = () => {
    setShowBookingForm(false);
    setSelectedStation(null);
    // Optionally refresh stations data
  };

  // NEW: Handle smart recommendations
  const handleRecommendations = (data) => {
    setRecommendations(data);
    setShowRecommendations(true);
    setViewMode('recommendations');
  };

  const handleStationSelect = (station) => {
    setSelectedStation(station);
    // Focus map on selected station
    if (mapRef.current && station.location) {
      const map = mapRef.current;
      map.setView(station.location, 15);
    }
  };

  const handleShowRoute = async (station) => {
    // This would integrate with your existing route functionality
    console.log("Show route to station:", station);
    // You can implement route display logic here
  };

  // Get stations to display on map
  const getDisplayStations = () => {
    if (viewMode === 'recommendations' && recommendations?.recommendations) {
      return recommendations.recommendations;
    }
    return filteredStations;
  };

  // Get station icon based on context
  const getStationIcon = (station, index) => {
    if (viewMode === 'recommendations' && recommendations?.recommendations) {
      if (index === 0) return topRecommendationIcon;
      return recommendedStationIcon;
    }
    return new L.Icon({
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading charging stations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-gray-900">
              🗺️ EV Charging Station Map
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewMode('explore')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'explore'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🔍 Explore
              </button>
              <button
                onClick={() => setViewMode('recommendations')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'recommendations'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🎯 Smart Recommendations
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Forms and Results */}
          <div className="lg:col-span-1 space-y-6">
            {viewMode === 'recommendations' ? (
              <>
                {/* Smart Recommendation Form */}
                <RecommendationForm
                  onRecommendations={handleRecommendations}
                  userLocation={userPosition}
                />
                
                {/* Smart Recommendation Results */}
                {showRecommendations && recommendations && (
                  <RecommendationResults
                    recommendations={recommendations.recommendations}
                    onStationSelect={handleStationSelect}
                    onShowRoute={handleShowRoute}
                    metadata={recommendations.algorithm_info}
                  />
                )}
              </>
            ) : (
              <>
                {/* Explore Mode - Distance Filter */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    🔍 Explore Stations
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Distance: {maxDistance} km
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="200"
                        value={maxDistance}
                        onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>5 km</span>
                        <span>100 km</span>
                        <span>200 km</span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <p>📍 Showing {getDisplayStations().length} stations within {maxDistance} km</p>
                      {userPosition && (
                        <p className="text-xs text-gray-500 mt-1">
                          Your location: {userPosition[0].toFixed(4)}, {userPosition[1].toFixed(4)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Station List */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    Nearby Stations
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {getDisplayStations().map((station, index) => (
                      <div
                        key={station.id}
                        className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleStationClick(station.id)}
                      >
                        <h4 className="font-medium text-gray-800">{station.name}</h4>
                        <p className="text-sm text-gray-600">
                          {station.distance?.toFixed(1)} km away
                        </p>
                        <p className="text-xs text-gray-500">
                          {station.available_slots || 0}/{station.total_slots || 0} slots available
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Panel - Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: "600px" }}>
              {mapCenter && (
                <MapContainer
                  center={mapCenter}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                  ref={mapRef}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {/* User Location Marker */}
                  <LocationMarker position={userPosition} setPosition={setUserPosition} />
                  
                  {/* Station Markers */}
                  {getDisplayStations().map((station, index) => {
                    const position = station.location?.coordinates 
                      ? [station.location.coordinates[0], station.location.coordinates[1]]
                      : station.location;
                    
                    if (!position || position.length !== 2) return null;
                    
                    return (
                      <Marker
                        key={station.id}
                        position={position}
                        icon={getStationIcon(station, index)}
                        eventHandlers={{
                          click: () => handleStationClick(station.id),
                        }}
                      >
                        <Popup>
                          <div className="min-w-48">
                            <h3 className="font-bold text-gray-800 mb-2">{station.name}</h3>
                            
                            {viewMode === 'recommendations' && station.score && (
                              <div className="mb-2">
                                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                  Score: {(station.score * 100).toFixed(0)}%
                                </span>
                                {index === 0 && (
                                  <span className="inline-block ml-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                                    🏆 Top Choice
                                  </span>
                                )}
                              </div>
                            )}
                            
                            <div className="space-y-1 text-sm">
                              <p><strong>Distance:</strong> {station.distance?.toFixed(1) || 'N/A'} km</p>
                              <p><strong>Available:</strong> {station.availability || station.available_slots || 0}/{station.total_slots || 0} slots</p>
                              <p><strong>Price:</strong> Rs. {station.pricing || station.pricing_per_kwh || 'N/A'} per kWh</p>
                              
                              {station.energy_analysis?.is_reachable === false && (
                                <p className="text-red-600 font-medium text-xs">
                                  ⚠️ May not be reachable with current battery
                                </p>
                              )}
                            </div>
                            
                            <button
                              onClick={() => setShowBookingForm(true)}
                              className="mt-2 w-full px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              View Details
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && selectedStation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-screen overflow-y-auto">
            <BookingForm
              station={selectedStation}
              onComplete={handleBookingComplete}
              onCancel={() => setShowBookingForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;
