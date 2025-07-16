import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "../api/axios";
import L from "leaflet";

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
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const stationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Create directional user icon for live tracking
const createDirectionalIcon = (heading) => {
  const svgIcon = `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="#3B82F6" stroke="#FFFFFF" stroke-width="4"/>
      <circle cx="20" cy="20" r="12" fill="#1E40AF" opacity="0.8"/>
      <polygon points="20,8 26,24 20,20 14,24" fill="#FFFFFF" transform="rotate(${heading} 20 20)"/>
      <circle cx="20" cy="20" r="3" fill="#FFFFFF"/>
    </svg>
  `;
  
  return new L.DivIcon({
    html: svgIcon,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    className: 'custom-directional-icon'
  });
};

// Custom CSS for directional icon
const customStyles = `
  .custom-directional-icon {
    background: none !important;
    border: none !important;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
    transition: all 0.3s ease;
  }
  .custom-directional-icon svg {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  }
  .custom-directional-icon:hover {
    transform: scale(1.1);
  }
`;

// Inject custom styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = customStyles;
  document.head.appendChild(styleElement);
}

const RouteMap = () => {
  const { stationId } = useParams();
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);
  const [station, setStation] = useState(null);
  const [route, setRoute] = useState(null);
  const [routeInfo, setRouteInfo] = useState({ distance: null, duration: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [userHeading, setUserHeading] = useState(0);
  const [watchId, setWatchId] = useState(null);
  const [previousLocation, setPreviousLocation] = useState(null);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [etaInfo, setEtaInfo] = useState(null);
  const [etaSettings, setEtaSettings] = useState({
    drivingMode: 'random',
    trafficCondition: 'light',
    weather: 'clear'
  });
  const mapRef = useRef(null);

  useEffect(() => {
    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation([latitude, longitude]);
          },
          (error) => {
            console.error("Error getting location:", error);
            setError("Unable to get your location");
          },
          { enableHighAccuracy: true }
        );
      } else {
        setError("Geolocation is not supported by this browser");
      }
    };

    getUserLocation();
  }, []);

  useEffect(() => {
    const fetchStationAndRoute = async () => {
      if (!userLocation || !stationId) return;

      try {
        setLoading(true);
        
        // Fetch station details - use correct API endpoint
        const stationResponse = await axios.get(`/stations/${stationId}`);
        if (stationResponse.data.success) {
          const stationData = stationResponse.data.station;
          setStation(stationData);

          // Handle location coordinates correctly based on backend format
          let stationLocation;
          if (stationData.location && stationData.location.coordinates) {
            stationLocation = stationData.location.coordinates;
          } else if (Array.isArray(stationData.location)) {
            stationLocation = stationData.location;
          } else {
            console.error('Invalid station location format:', stationData.location);
            setError("Invalid station location format");
            return;
          }

          // Calculate route using OSRM
          await calculateRoute(userLocation, stationLocation);
        } else {
          setError("Station not found");
        }
      } catch (err) {
        console.error("Error fetching station:", err);
        if (err.response?.status === 404) {
          setError("Station not found");
        } else {
          setError("Error loading station details");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStationAndRoute();
  }, [userLocation, stationId]);

  // Calculate initial ETA when route is loaded
  useEffect(() => {
    if (routeInfo.distance && userLocation && station) {
      updateETA();
    }
  }, [routeInfo.distance, userLocation, station]);

  // Function to calculate route using OSRM API
  const calculateRoute = async (start, end) => {
    try {
      // Use OSRM API for routing
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coordinates = route.geometry.coordinates;
          
          // Convert from [lng, lat] to [lat, lng] format for Leaflet
          const routePoints = coordinates.map(coord => [coord[1], coord[0]]);
          setRoute(routePoints);
          
          // Set route information
          setRouteInfo({
            distance: (route.distance / 1000).toFixed(1), // Convert from meters to km
            duration: Math.round(route.duration / 60) // Convert from seconds to minutes
          });
        } else {
          // Fallback to straight line
          setRoute([start, end]);
          const straightDistance = calculateStraightLineDistance(start[0], start[1], end[0], end[1]);
          setRouteInfo({
            distance: straightDistance.toFixed(1),
            duration: Math.round(straightDistance * 2) // Rough estimate: 2 minutes per km
          });
        }
      } else {
        // Fallback to straight line if routing service fails
        setRoute([start, end]);
        const straightDistance = calculateStraightLineDistance(start[0], start[1], end[0], end[1]);
        setRouteInfo({
          distance: straightDistance.toFixed(1),
          duration: Math.round(straightDistance * 2) // Rough estimate: 2 minutes per km
        });
      }
    } catch (error) {
      console.warn("Routing service unavailable, using straight line:", error);
      // Fallback to straight line
      setRoute([start, end]);
      const straightDistance = calculateStraightLineDistance(start[0], start[1], end[0], end[1]);
      setRouteInfo({
        distance: straightDistance.toFixed(1),
        duration: Math.round(straightDistance * 2) // Rough estimate: 2 minutes per km
      });
    }
  };

  // Calculate straight line distance between two points
  const calculateStraightLineDistance = (lat1, lon1, lat2, lon2) => {
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
    const distance = R * c;
    return distance;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  // Calculate bearing between two points (for movement direction)
  const calculateBearing = (lat1, lon1, lat2, lon2) => {
    const dLon = deg2rad(lon2 - lon1);
    const lat1Rad = deg2rad(lat1);
    const lat2Rad = deg2rad(lat2);
    
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    
    let bearing = Math.atan2(y, x);
    bearing = bearing * (180 / Math.PI); // Convert to degrees
    bearing = (bearing + 360) % 360; // Normalize to 0-360
    
    return bearing;
  };

  // Calculate ETA based on distance and speed
  const calculateETA = (distanceKm, speedKmh) => {
    if (speedKmh <= 0) return null;
    
    const travelTimeHours = distanceKm / speedKmh;
    const travelTimeMinutes = travelTimeHours * 60;
    
    if (travelTimeMinutes < 1) {
      return `${Math.round(travelTimeMinutes * 60)} seconds`;
    } else if (travelTimeMinutes < 60) {
      return `${Math.round(travelTimeMinutes)} minutes`;
    } else {
      const hours = Math.floor(travelTimeMinutes / 60);
      const minutes = Math.round(travelTimeMinutes % 60);
      return `${hours}h ${minutes}m`;
    }
  };

  // Helper function to get station coordinates
  const getStationCoordinates = (station) => {
    if (!station || !station.location) return null;
    
    if (station.location.coordinates && Array.isArray(station.location.coordinates)) {
      return station.location.coordinates;
    } else if (Array.isArray(station.location)) {
      return station.location;
    }
    return null;
  };

  // Update ETA information during live tracking
  const updateETA = () => {
    if (!userLocation || !station || !route) return;

    // Get station coordinates
    const stationCoords = getStationCoordinates(station);
    if (!stationCoords) {
      console.error('Invalid station location format:', station.location);
      return;
    }

    // Calculate remaining distance to station
    const remainingDistance = calculateStraightLineDistance(
      userLocation[0], userLocation[1],
      stationCoords[0], stationCoords[1]
    );
      
    // Use current speed if available, otherwise use driving mode speed
    const drivingModeSpeeds = {
      'economy': 30,
      'sports': 60,
      'random': 45
    };
    const effectiveSpeed = currentSpeed > 0 ? currentSpeed : drivingModeSpeeds[etaSettings.drivingMode];
    
    const eta = calculateETA(remainingDistance, effectiveSpeed);
    
    if (eta) {
      setEtaInfo({
        remainingDistance: remainingDistance.toFixed(1),
        effectiveSpeed: effectiveSpeed.toFixed(1),
        eta: eta,
        currentSpeed: currentSpeed > 0 ? currentSpeed.toFixed(1) : 'N/A'
      });
    }
  };

  // Live tracking functions
  const startLiveTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser");
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000
    };

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading, speed } = position.coords;
        const newLocation = [latitude, longitude];
        
        // Update speed if available
        if (speed !== null && speed !== undefined) {
          setCurrentSpeed(speed * 3.6); // Convert m/s to km/h
        }
        
        // Calculate movement direction if we have a previous location
        let calculatedHeading = userHeading;
        if (previousLocation && speed && speed > 0.5) { // Only update if moving (0.5 m/s threshold)
          calculatedHeading = calculateBearing(
            previousLocation[0], previousLocation[1],
            latitude, longitude
          );
        }
        
        // Use device heading if available and device is moving, otherwise use calculated heading
        let finalHeading = calculatedHeading;
        if (heading !== null && heading !== undefined && speed && speed > 1) {
          finalHeading = heading;
        } else if (previousLocation && speed && speed > 0.5) {
          finalHeading = calculatedHeading;
        }
        
        setUserLocation(newLocation);
        setPreviousLocation(newLocation);
        setUserHeading(finalHeading);

        // Update map view to follow user
        if (mapRef.current && isLiveTracking) {
          const map = mapRef.current;
          map.setView(newLocation, 16, {
            animate: true,
            duration: 0.5
          });
        }

        // Recalculate route with new position
        if (station) {
          const stationLocation = getStationCoordinates(station);
          if (stationLocation) {
            calculateRoute(newLocation, stationLocation);
          }
        }

        // Update ETA information
        updateETA();
      },
      (error) => {
        console.error("Live tracking error:", error);
        setError("Unable to get live location updates");
        stopLiveTracking();
      },
      options
    );

    setWatchId(id);
    setIsLiveTracking(true);
  };

  const stopLiveTracking = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsLiveTracking(false);
    
    // Reset map orientation
    if (mapRef.current) {
      const map = mapRef.current;
              // Return to overview of both user and station
        if (userLocation && station) {
          const stationLocation = getStationCoordinates(station);
          if (stationLocation) {
            const bounds = L.latLngBounds([userLocation, stationLocation]);
            map.fitBounds(bounds, { padding: [50, 50] });
          }
        }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading route...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!userLocation || !station) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Unable to load route information</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const stationCoords = getStationCoordinates(station);
  const mapCenter = stationCoords ? [
    (userLocation[0] + stationCoords[0]) / 2,
    (userLocation[1] + stationCoords[1]) / 2
  ] : userLocation;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-900">
                🗺️ Route to {station.name}
              </h1>
            </div>
            <div className="text-sm text-gray-600">
              {routeInfo.distance ? (
                <div className="flex items-center gap-4">
                  <span>📍 {routeInfo.distance} km</span>
                  <span>⏱️ {routeInfo.duration} min</span>
                  <button
                    onClick={isLiveTracking ? stopLiveTracking : startLiveTracking}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isLiveTracking
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isLiveTracking ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        Stop Live Tracking
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        🧭 Start Live Tracking
                      </div>
                    )}
                  </button>
                </div>
              ) : (
                <span>📍 Calculating route...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Station Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800">{station.name}</h2>
              <p className="text-sm text-gray-600">
                📍 {station.location?.address || `${station.location.coordinates ? station.location.coordinates[0].toFixed(4) : station.location[0].toFixed(4)}, ${station.location.coordinates ? station.location.coordinates[1].toFixed(4) : station.location[1].toFixed(4)}`}
              </p>
              <p className="text-sm text-gray-600">
                💰 Rs. {station.pricing || 'N/A'} per kWh
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                🔌 {station.available_slots || 0}/{station.total_slots || 0} slots available
              </p>
              <p className="text-sm text-gray-600">
                ⭐ {station.rating || 'N/A'}/5
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Route Information Panel */}
      {routeInfo.distance && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">🛣️ Route Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">📍</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Distance</p>
                  <p className="font-semibold text-gray-800">{routeInfo.distance} km</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">⏱️</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estimated Time</p>
                  <p className="font-semibold text-gray-800">{routeInfo.duration} minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">🚗</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Route Type</p>
                  <p className="font-semibold text-gray-800">
                    {route && route.length > 2 ? 'Optimized Route' : 'Direct Route'}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <span className="font-medium">💡 Tip:</span> {' '}
                {route && route.length > 2 
                  ? 'This route follows actual roads and considers traffic conditions for the most efficient path.'
                  : 'Showing direct route as fallback. The actual driving route follows roads and may be longer.'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Live Tracking Status Panel */}
      {isLiveTracking && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">🧭 Live Navigation Active</h3>
                  <p className="text-blue-100 text-sm">
                    Your location is being tracked in real-time
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-100">Current Speed</p>
                <p className="text-lg font-bold">{currentSpeed.toFixed(1)} km/h</p>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white bg-opacity-10 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎯</span>
                  <div>
                    <p className="text-xs text-blue-100">Distance to Destination</p>
                    <p className="font-semibold">{etaInfo ? etaInfo.remainingDistance : routeInfo.distance} km</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white bg-opacity-10 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⏰</span>
                  <div>
                    <p className="text-xs text-blue-100">Real-time ETA</p>
                    <p className="font-semibold">{etaInfo ? etaInfo.eta : `${routeInfo.duration} min`}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white bg-opacity-10 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🚗</span>
                  <div>
                    <p className="text-xs text-blue-100">Current Speed</p>
                    <p className="font-semibold">{etaInfo ? etaInfo.currentSpeed : currentSpeed.toFixed(1)} km/h</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white bg-opacity-10 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧭</span>
                  <div>
                    <p className="text-xs text-blue-100">Heading</p>
                    <p className="font-semibold">
                      {userHeading > 0 ? `${Math.round(userHeading)}°` : 'Detecting...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ETA Settings Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">⚙️ ETA Calculation Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Driving Mode</label>
              <select
                value={etaSettings.drivingMode}
                onChange={(e) => setEtaSettings({...etaSettings, drivingMode: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="economy">Economy (30 km/h)</option>
                <option value="sports">Sports (60 km/h)</option>
                <option value="random">Random (45 km/h)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Traffic</label>
              <select
                value={etaSettings.trafficCondition}
                onChange={(e) => setEtaSettings({...etaSettings, trafficCondition: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="light">Light</option>
                <option value="medium">Medium</option>
                <option value="heavy">Heavy</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weather</label>
              <select
                value={etaSettings.weather}
                onChange={(e) => setEtaSettings({...etaSettings, weather: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="clear">Clear</option>
                <option value="rain">Rain</option>
                <option value="fog">Fog</option>
                <option value="snow">Snow</option>
              </select>
            </div>
            

          </div>
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">💡 ETA Info:</span> {' '}
              Real-time ETA is calculated using your current speed when available, otherwise uses the driving mode speed above.
              Traffic conditions already consider time of day patterns (peak hours, off-peak, night).
            </p>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: "600px" }}>
          <MapContainer
            center={mapCenter}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* User location marker */}
            <Marker 
              position={userLocation} 
              icon={isLiveTracking ? createDirectionalIcon(userHeading) : userLocationIcon}
            >
              <Popup>
                <div>
                  <strong>📍 Your Location</strong>
                  {isLiveTracking && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-green-600 font-medium">Live Tracking Active</span>
                      </div>
                      {userHeading > 0 && (
                        <p className="text-xs text-gray-600 mt-1">
                          Heading: {Math.round(userHeading)}°
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
            
            {/* Station marker */}
                            <Marker position={getStationCoordinates(station) || [0, 0]} icon={stationIcon}>
              <Popup>
                <div>
                  <h3 className="font-bold">{station.name}</h3>
                  <p>💰 Rs. {station.pricing || 'N/A'} per kWh</p>
                  <p>🔌 {station.available_slots || 0}/{station.total_slots || 0} available</p>
                </div>
              </Popup>
            </Marker>
            
            {/* Route Polyline */}
            {route && (
              <Polyline
                pathOptions={{ 
                  color: '#2563eb', 
                  weight: 6, 
                  opacity: 0.8,
                  dashArray: route.length > 2 ? null : '10, 10' // Solid line for road routes, dashed for direct
                }}
                positions={route}
              />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default RouteMap; 