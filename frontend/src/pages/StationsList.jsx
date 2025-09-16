import { useState, useEffect } from "react";
import axios from "../api/axios";
import StationBookingModal from "../components/StationBookingModal";
import StationCard from "../components/StationCard";
import StationFilterDropdown from "../components/StationFilterDropdown";
import StationsMap from "../components/StationsMap";
import LocationConsentModal from "../components/LocationConsentModal";
import useLocationConsent from "../hooks/useLocationConsent";

const StationsList = () => {
  const [stations, setStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showMap, setShowMap] = useState(false);
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
  const defaultLocation = userLocation || [27.7172, 85.324];

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // you can adjust

  useEffect(() => {
    fetchStations();
  }, []);

  // Removed auto-prompt; consent handled post-login or via explicit button

  useEffect(() => {
    filterAndSortStations();
    setCurrentPage(1); // reset to first page when filters/search change
  }, [stations, filters, sortBy]);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/stations");
      if (response.data.success) {
        const stationsWithAvailability = response.data.stations || [];
        setStations(stationsWithAvailability);
        console.log(`Loaded ${stationsWithAvailability.length} stations with real-time availability`);
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

  const filterAndSortStations = async () => {
    try {
      // Build query parameters for the search API
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '' && value !== false) {
          queryParams.append(key, value);
        }
      });

      // Use the search API if filters are applied, otherwise use all stations
      let stationsToFilter = stations;
      
      if (Object.keys(filters).some(key => filters[key] && filters[key] !== '' && filters[key] !== false)) {
        const response = await axios.get(`/stations/search?${queryParams.toString()}`);
        if (response.data.success) {
          stationsToFilter = response.data.stations;
        }
      }

      // Apply sorting
      const sorted = [...stationsToFilter].sort((a, b) => {
        switch (sortBy) {
          case "name":
            return a.name.localeCompare(b.name);
          case "availability":
            return b.available_slots - a.available_slots;
          case "price":
            const priceA = parseFloat(a.pricing_per_kwh) || 0;
            const priceB = parseFloat(b.pricing_per_kwh) || 0;
            return priceA - priceB;
          case "rating":
            return (b.rating || 0) - (a.rating || 0);
          default:
            return 0;
        }
      });

      setFilteredStations(sorted);
    } catch (error) {
      console.error('Error filtering stations:', error);
      setFilteredStations(stations);
    }
  };

  const handleStationClick = (station) => {
    setSelectedStation(station);
    setShowBookingModal(true);
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

  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
    setSelectedStation(null);
  };

  const handleBookingSuccess = () => {
    fetchStations();
    handleCloseBookingModal();
  };

  const refreshStations = () => {
    fetchStations();
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSearchChange = (searchValue) => {
    setSearchTerm(searchValue);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredStations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentStations = filteredStations.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-gray-950 mt-15">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
              <p className="text-gray-300">Loading charging stations...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-gray-950 mt-15">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-3xl p-6 text-center backdrop-blur-sm">
            <h2 className="text-xl font-bold text-red-300 mb-2">
              Error Loading Stations
            </h2>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchStations}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl hover:from-red-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-red-500/25"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-gray-950 mt-15">
      {/* Location Consent Modal */}
      <LocationConsentModal
        isOpen={showLocationConsent}
        onAccept={handleLocationAccept}
        onDecline={handleLocationDecline}
        onClose={handleLocationClose}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Charging Stations
              </h1>
              <p className="text-gray-300 text-lg">
                Browse all available charging stations. Find the perfect spot for your
                electric vehicle.
              </p>
            </div>
            <div className="flex gap-3">
              {!hasLocation && (
                <button
                  onClick={() => setShowLocationConsent(true)}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-xl hover:from-cyan-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 text-sm font-medium"
                >
                  Enable Location
                </button>
              )}
              <button
                onClick={() => setShowMap(!showMap)}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 flex items-center gap-2"
              >
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                {showMap ? 'Hide Map' : 'Show Map'}
              </button>
              <button
                onClick={refreshStations}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-2xl hover:from-cyan-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg 
                  className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Filter Dropdown */}
        <StationFilterDropdown 
          onFiltersChange={handleFiltersChange}
          onSearchChange={handleSearchChange}
        />

        {/* Map Component */}
        {showMap && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Interactive Map</h3>
              <div className="h-96 w-full">
                <StationsMap
                  stations={filteredStations}
                  selectedStation={selectedStation}
                  onStationClick={handleStationClick}
                  userLocation={userLocation}
                  className="h-full w-full rounded-2xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* Sort Controls */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-gray-300 text-sm">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300"
              >
                <option value="name">Name</option>
                <option value="availability">Availability</option>
                <option value="price">Price</option>
                <option value="rating">Rating</option>
              </select>
            </div>
            
            <div className="text-gray-300 text-sm">
              Showing {filteredStations.length} of {stations.length} stations
            </div>
          </div>
        </div>

        {/* Stations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentStations.map((station) => (
            <StationCard
              key={station.id}
              station={station}
              onStationClick={handleStationClick}
            />
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-8 space-x-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="px-4 py-2 rounded-2xl bg-gray-700/50 text-gray-300 disabled:opacity-50 hover:bg-gray-600/50 transition-all duration-300 border border-gray-600/50"
            >
              Prev
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2 rounded-2xl transition-all duration-300 ${
                  currentPage === i + 1
                    ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-2xl shadow-cyan-500/25"
                    : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border border-gray-600/50"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="px-4 py-2 rounded-2xl bg-gray-700/50 text-gray-300 disabled:opacity-50 hover:bg-gray-600/50 transition-all duration-300 border border-gray-600/50"
            >
              Next
            </button>
          </div>
        )}

        {/* Booking Modal */}
        {showBookingModal && selectedStation && (
          <StationBookingModal
            station={selectedStation}
            userLocation={[27.7172, 85.324]} // Default to Kathmandu
            onClose={handleCloseBookingModal}
            onBookingSuccess={handleBookingSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default StationsList;
