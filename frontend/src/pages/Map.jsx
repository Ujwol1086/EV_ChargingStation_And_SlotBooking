import { useState, useEffect } from "react";
import axios from "../api/axios";
import MapContainer from "../components/map/MapContainer";
import StationMarkers from "../components/map/StationMarkers";
import UserLocationMarker from "../components/map/UserLocationMarker";
import StationBookingModal from "../components/StationBookingModal";
import LocationConsentModal from "../components/LocationConsentModal";
import useLocationConsent from "../hooks/useLocationConsent";

const Map = ({ selectedStationType }) => {
  const [stations, setStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companyFilter, setCompanyFilter] = useState(selectedStationType);
  const [showLocationConsent, setShowLocationConsent] = useState(false);

  // Use location consent hook
  const {
    locationConsent,
    userLocation,
    isRequestingLocation,
    locationError,
    hasLocation,
    needsConsent,
    requestLocationAccess,
    setManualLocation,
    clearLocation
  } = useLocationConsent();

  // Default to Kathmandu if no location
  const mapCenter = userLocation || [27.7172, 85.324];

  // Fetch stations on mount
  useEffect(() => {
    fetchStations();
  }, []);

  // Removed auto-prompt; consent handled post-login or via explicit button

  // Update company filter when selectedStationType changes
  useEffect(() => {
    setCompanyFilter(selectedStationType);
  }, [selectedStationType]);

  // Fetch stations when company filter changes
  useEffect(() => {
    if (companyFilter && companyFilter !== "all") {
      fetchStations();
    } else if (companyFilter === "all") {
      fetchStations();
    }
  }, [companyFilter]);

  // Update map center when a station is selected
  useEffect(() => {
    if (selectedStation && selectedStation.latitude && selectedStation.longitude) {
      setMapCenter([selectedStation.latitude, selectedStation.longitude]);
    }
  }, [selectedStation]);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const url = companyFilter && companyFilter !== "all" ? `/stations?company=${companyFilter}` : '/stations';
      const response = await axios.get(url);
      if (response.data.success) {
        setStations(response.data.stations || []);
        setFilteredStations(response.data.stations || []);
      } else {
        setError("Failed to fetch stations");
      }
    } catch (err) {
      console.error("Error fetching stations:", err);
      setError("Failed to load charging stations");
    } finally {
      setLoading(false);
    }
  };

  // Handle location consent responses
  const handleLocationAccept = (position) => {
    const coords = [position.coords.latitude, position.coords.longitude];
    setManualLocation(coords);
    setShowLocationConsent(false);
  };

  const handleLocationDecline = (error) => {
    console.log("Location access declined:", error);
    setShowLocationConsent(false);
  };

  const handleLocationClose = () => {
    setShowLocationConsent(false);
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
    fetchStations(); // Refresh stations
    handleCloseBookingModal();
  };

  const getCompanyDisplayName = (companyType) => {
    const companyNames = {
      'nea': 'NEA',
      'byd': 'BYD',
      'kia': 'KIA',
      'hyundai': 'HYUNDAI',
      'tata': 'TATA',
      'mg': 'MG'
    };
    return companyNames[companyType] || 'Unknown';
  };

  if (loading)
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

  if (error)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-800 mb-2">
            Error Loading Map
          </h2>
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

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-4 mt-20">
      {/* Location Consent Modal */}
      <LocationConsentModal
        isOpen={showLocationConsent}
        onAccept={handleLocationAccept}
        onDecline={handleLocationDecline}
        onClose={handleLocationClose}
      />

      {/* Left: Station List */}
      <div className="md:w-1/3 max-h-[80vh] overflow-y-auto">
        {/* Company Filter Header */}
        {companyFilter && companyFilter !== "all" ? (
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-lg font-bold text-gray-800">
                {getCompanyDisplayName(companyFilter)} Charging Stations
              </h2>
              {!hasLocation && (
                <button
                  onClick={() => setShowLocationConsent(true)}
                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Enable Location
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Showing {filteredStations.length} stations
            </p>
          </div>
        ) : (
          <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-lg font-bold text-gray-800">
                All Charging Stations
              </h2>
              {!hasLocation && (
                <button
                  onClick={() => setShowLocationConsent(true)}
                  className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                >
                  Enable Location
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Showing {filteredStations.length} stations
            </p>
          </div>
        )}
        
        {filteredStations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No stations found for this company.</p>
          </div>
        ) : (
          filteredStations.map((station) => (
            <div
              key={station.id}
              className={`border p-3 mb-3 rounded-lg cursor-pointer transition hover:shadow-lg ${
                selectedStation?.id === station.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
              onClick={() => handleStationClick(station)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{station.name}</h3>
                {station.company && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                    {station.company}
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm">
                Chargers:{" "}
                {station.chargers && station.chargers.length > 0
                  ? station.chargers
                      .map((c) => (c.type ?? "Unknown").toString().toUpperCase())
                      .join(", ")
                  : "No chargers available"}
              </p>
              <p className="text-gray-600 text-sm">
                Available: {station.chargers ? station.chargers.filter((c) => c.available).length : 0} /{" "}
                {station.chargers ? station.chargers.length : 0}
              </p>
              <p className="text-gray-600 text-sm">
                Address: {station.address || 'Address not available'}
              </p>
              {station.amenities && station.amenities.length > 0 && (
                <p className="text-gray-500 text-xs">
                  Amenities: {station.amenities.join(", ")}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Right: Map */}
      <div className="md:w-2/3 bg-white rounded-lg shadow-lg overflow-hidden h-[80vh]">
        <MapContainer
          center={mapCenter}
          zoom={12}
          selectedStation={selectedStation}
        >
          <UserLocationMarker userLocation={userLocation} />
          <StationMarkers
            stations={filteredStations}
            onStationClick={handleStationClick}
            selectedStation={selectedStation}
          />
        </MapContainer>
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
