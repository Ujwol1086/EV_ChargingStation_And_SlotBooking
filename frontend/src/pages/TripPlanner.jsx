import { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import RecommendationForm from "../components/RecommendationForm";
import RecommendationResults from "../components/RecommendationResults";
import axios from "../api/axios";

const TripPlanner = () => {
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
  const [showAdvanced, setShowAdvanced] = useState(false);

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
      const response = await axios.get("/bookings/user");
      if (response.data.success) {
        setUserBookings(response.data.bookings || []);
      }
    } catch (error) {
      console.error("Error loading user bookings:", error);
    }
  };

  const handleRecommendationSubmit = async (formData) => {
    try {
      setLoadingRecommendations(true);
      setError(null);
      
      const response = await axios.post("/recommendations/enhanced", {
        user_location: formData.location,
        battery_percentage: formData.batteryPercentage,
        plug_type: formData.plugType,
        ac_status: formData.acStatus,
        passengers: formData.passengers,
        urgency: formData.urgencyLevel,
        terrain: formData.terrain,
        traffic_condition: formData.trafficCondition,
        weather: formData.weather,
        driving_mode: formData.drivingMode,
        destination_city: formData.destinationCity,
        max_detour_km: formData.maxDetourKm,
        vehicle_battery_capacity: formData.vehicleBatteryCapacity,
        filter_unreachable: formData.urgencyLevel === 'emergency' || formData.batteryPercentage <= 30
      });

      if (response.data.success) {
        setRecommendations(response.data);
        setMapCenter(formData.location);
      } else {
        setError(response.data.error || "Failed to get recommendations");
      }
    } catch (error) {
      console.error("Error getting recommendations:", error);
      setError(error.response?.data?.error || "Failed to get recommendations");
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleStationSelect = (station) => {
    setSelectedStation(station);
  };

  const handleRouteRequest = async (station) => {
    try {
      setLoadingRoute(true);
      setError(null);
      
      const response = await axios.post("/recommendations/route", {
        user_location: userLocation,
        station_location: station.location,
        station_id: station.id,
        station_name: station.name
      });

      if (response.data.success) {
        setRouteData(response.data);
        setShowRoute(true);
      } else {
        setError(response.data.error || "Failed to get route");
      }
    } catch (error) {
      console.error("Error getting route:", error);
      setError(error.response?.data?.error || "Failed to get route");
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleBookingRequest = (station) => {
    navigate(`/booking/${station.id}`, { 
      state: { station } 
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading trip planner...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-gray-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            🗺️ Trip Planner
          </h1>
          <p className="text-gray-300 text-lg">
            Plan your EV journey with intelligent charging station recommendations
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/30 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-red-300 font-semibold">Error</h3>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Trip Planning Form */}
        <div className="mb-8">
          <RecommendationForm 
            onSubmit={handleRecommendationSubmit}
            loading={loadingRecommendations}
          />
        </div>

        {/* Results */}
        {recommendations && (
          <div className="mb-8">
            <RecommendationResults
              recommendations={recommendations}
              onStationSelect={handleStationSelect}
              onRouteRequest={handleRouteRequest}
              onBookingRequest={handleBookingRequest}
              loadingRoute={loadingRoute}
              userBookings={userBookings}
              mapCenter={mapCenter}
              showRoute={showRoute}
              routeData={routeData}
            />
          </div>
        )}

        {/* Quick Stats */}
        {userBookings.length > 0 && (
          <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-white mb-4">Your Recent Bookings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                    <span className="text-cyan-400 font-bold">📅</span>
                  </div>
                  <div>
                    <p className="text-gray-300 text-sm">Total Bookings</p>
                    <p className="text-white font-bold text-lg">{userBookings.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <span className="text-green-400 font-bold">✅</span>
                  </div>
                  <div>
                    <p className="text-gray-300 text-sm">Active Bookings</p>
                    <p className="text-white font-bold text-lg">
                      {userBookings.filter(b => b.status === 'confirmed').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <span className="text-purple-400 font-bold">💰</span>
                  </div>
                  <div>
                    <p className="text-gray-300 text-sm">Total Spent</p>
                    <p className="text-white font-bold text-lg">
                      Rs. {userBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripPlanner;
