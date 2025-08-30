import { useState, useEffect } from "react";
import axios from "../api/axios";
import StationBookingModal from "../components/StationBookingModal";
import StationCard from "../components/StationCard";

const StationsList = () => {
  const [stations, setStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStation, setSelectedStation] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [filterBy, setFilterBy] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // you can adjust

  useEffect(() => {
    fetchStations();
  }, []);

  useEffect(() => {
    filterAndSortStations();
    setCurrentPage(1); // reset to first page when filters/search change
  }, [stations, searchTerm, sortBy, filterBy]);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/stations");
      if (response.data.success) {
        setStations(response.data.stations || []);
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

  const filterAndSortStations = () => {
    let filtered = [...stations];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (station) =>
          station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          station.location?.address
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          station.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          station.province?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply availability filter
    if (filterBy !== "all") {
      if (filterBy === "available") {
        filtered = filtered.filter((station) => station.available_slots > 0);
      } else if (filterBy === "full") {
        filtered = filtered.filter((station) => station.available_slots === 0);
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "availability":
          return b.available_slots - a.available_slots;
        case "price":
          const priceA = parseFloat(a.pricing) || 0;
          const priceB = parseFloat(b.pricing) || 0;
          return priceA - priceB;
        case "rating":
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredStations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentStations = filteredStations.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 ">
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
          <h2 className="text-xl font-bold text-red-800 mb-2">
            Error Loading Stations
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
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-15">
      {/* Header */}
      <div className="mb-8 ">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          ⚡ Charging Stations
        </h1>
        <p className="text-gray-600">
          Browse all available charging stations. Find the perfect spot for your
          electric vehicle.
        </p>
      </div>

      {/* Search + Sort + Filter Section (same as before) */}
      {/* ... your existing stats + controls code ... */}

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
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50 hover:bg-gray-300 transition-colors"
          >
            Prev
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentPage === i + 1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50 hover:bg-gray-300 transition-colors"
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
  );
};

export default StationsList;
