import { useState, useEffect } from "react";
import axios from "../api/axios";
import MapContainer from "../components/map/MapContainer";
import StationMarkers from "../components/map/StationMarkers";
import UserLocationMarker from "../components/map/UserLocationMarker";
import StationBookingModal from "../components/StationBookingModal";

const Map = () => {
  const [stations, setStations] = useState([]);
  const [userLocation, setUserLocation] = useState([27.7172, 85.3240]); // Default to Kathmandu
  const [recommendations, setRecommendations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all stations on component mount
  useEffect(() => {
    fetchStations();
    getCurrentLocation();
  }, []);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/stations');
      if (response.data.success) {
        setStations(response.data.stations || []);
      } else {
        setError('Failed to fetch stations');
      }
    } catch (err) {
      console.error('Error fetching stations:', err);
      setError('Failed to load charging stations');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Keep default location
        }
      );
    }
  };

  const handleStationClick = (station) => {
    setSelectedStation(station);
    setShowBookingModal(true);
  };

  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
    setSelectedStation(null);
  };

  const handleBookingSuccess = () => {
    // Refresh stations to update availability
    fetchStations();
    handleCloseBookingModal();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading charging stations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Map</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchStations}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🗺️ Charging Station Map</h1>
        <p className="text-gray-600">
          Explore all available charging stations in your area. Click on any station to view details and book a slot.
        </p>
      </div>

      {/* Map Stats */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🔌</span>
            <div>
              <p className="text-sm text-gray-600">Total Stations</p>
              <p className="text-xl font-bold text-gray-800">{stations.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <span className="text-2xl mr-3">✅</span>
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-xl font-bold text-green-600">
                {stations.filter(s => s.availability > 0).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <span className="text-2xl mr-3">💰</span>
            <div>
              <p className="text-sm text-gray-600">Avg. Price</p>
              <p className="text-xl font-bold text-blue-600">
                Rs. {stations.length > 0 ? 
                  Math.round(stations.reduce((sum, s) => sum + (s.pricing || 0), 0) / stations.length) : 
                  0}/kWh
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⭐</span>
            <div>
              <p className="text-sm text-gray-600">Avg. Rating</p>
              <p className="text-xl font-bold text-yellow-600">
                {stations.length > 0 ? 
                  (stations.reduce((sum, s) => sum + (s.rating || 0), 0) / stations.length).toFixed(1) : 
                  0}/5
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <MapContainer center={userLocation} zoom={12}>
          <UserLocationMarker userLocation={userLocation} />
          <StationMarkers
            stations={stations}
            recommendations={recommendations}
            onStationClick={handleStationClick}
            selectedStation={selectedStation}
          />
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Map Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>Your Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span>Available Stations</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span>Fully Booked</span>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedStation && (
        <StationBookingModal
          station={selectedStation}
          userLocation={userLocation}
          onClose={handleCloseBookingModal}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

export default Map;
