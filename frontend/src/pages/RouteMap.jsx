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

const RouteMap = () => {
  const { stationId } = useParams();
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);
  const [station, setStation] = useState(null);
  const [route, setRoute] = useState(null);
  const [routeInfo, setRouteInfo] = useState({ distance: null, duration: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
          const stationLocation = stationData.location.coordinates 
            ? stationData.location.coordinates 
            : [stationData.location[0], stationData.location[1]];

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

  const mapCenter = [
    (userLocation[0] + (station.location.coordinates ? station.location.coordinates[0] : station.location[0])) / 2,
    (userLocation[1] + (station.location.coordinates ? station.location.coordinates[1] : station.location[1])) / 2
  ];

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
            <Marker position={userLocation} icon={userLocationIcon}>
              <Popup>📍 Your Location</Popup>
            </Marker>
            
            {/* Station marker */}
            <Marker position={station.location.coordinates || station.location} icon={stationIcon}>
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