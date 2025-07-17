import { useState, useEffect } from "react";
import axios from "../api/axios";
import StationBookingModal from "../components/StationBookingModal";
import StationCard from "../components/StationCard";

const StationsList = () => {
  const [stations, setStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStation, setSelectedStation] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');

  useEffect(() => {
    fetchStations();
  }, []);

  useEffect(() => {
    filterAndSortStations();
  }, [stations, searchTerm, sortBy, filterBy]);

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

  const filterAndSortStations = () => {
    let filtered = [...stations];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(station =>
        station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.location?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.province?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply availability filter
    if (filterBy !== 'all') {
      if (filterBy === 'available') {
        filtered = filtered.filter(station => station.available_slots > 0);
      } else if (filterBy === 'full') {
        filtered = filtered.filter(station => station.available_slots === 0);
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'availability':
          return b.available_slots - a.available_slots;
        case 'price':
          const priceA = parseFloat(a.pricing) || 0;
          const priceB = parseFloat(b.pricing) || 0;
          return priceA - priceB;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });

    setFilteredStations(filtered);
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
          <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Stations</h2>
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">⚡ Charging Stations</h1>
        <p className="text-gray-600">
          Browse all available charging stations. Find the perfect spot for your electric vehicle.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">🔌</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Stations</p>
              <p className="text-2xl font-bold text-gray-800">{stations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Available Now</p>
              <p className="text-2xl font-bold text-green-600">
                {stations.filter(s => s.available_slots > 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <span className="text-2xl">🏙️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Cities Covered</p>
              <p className="text-2xl font-bold text-purple-600">
                {new Set(stations.map(s => s.city).filter(Boolean)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <span className="text-2xl">⭐</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Avg. Rating</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stations.length > 0 ? 
                  (stations.reduce((sum, s) => sum + (s.rating || 4.5), 0) / stations.length).toFixed(1) : 
                  0}/5
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-8 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔍 Search Stations
            </label>
            <input
              type="text"
              placeholder="Search by name, location, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📊 Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name">Name</option>
              <option value="availability">Availability</option>
              <option value="price">Price</option>
              <option value="rating">Rating</option>
            </select>
          </div>

          {/* Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔧 Filter
            </label>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Stations</option>
              <option value="available">Available Only</option>
              <option value="full">Fully Booked</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {filteredStations.length} of {stations.length} stations
            {searchTerm && ` for "${searchTerm}"`}
          </p>
        </div>
      </div>

      {/* Stations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStations.map((station) => (
          <StationCard
            key={station.id}
            station={station}
            onStationClick={handleStationClick}
          />
        ))}
      </div>

      {/* No Results */}
      {filteredStations.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔍</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No stations found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? `No stations match "${searchTerm}". Try adjusting your search or filters.`
              : 'No stations match your current filters. Try adjusting your filter criteria.'
            }
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterBy('all');
              setSortBy('name');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedStation && (
        <StationBookingModal
          station={selectedStation}
          userLocation={[27.7172, 85.3240]} // Default to Kathmandu
          onClose={handleCloseBookingModal}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

export default StationsList; 