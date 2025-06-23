import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "../api/axios";
import L from "leaflet";
import BookingForm from "../components/BookingForm";

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

const Map = () => {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  // Center of Nepal
  const nepalCenter = [27.7172, 85.324];
  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/stations/list");
        if (response.data.success) {
          setStations(response.data.stations);
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
  const handleStationClick = async (stationId) => {
    try {
      const response = await axios.get(`/stations/${stationId}`);
      if (response.data.success) {
        setSelectedStation(response.data.station);
        setShowBookingForm(false);
      }
    } catch (err) {
      console.error("Error fetching station details:", err);
    }
  };

  const handleBookingComplete = () => {
    setShowBookingForm(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">EV Charging Stations in Nepal</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Map */}
        <div className="md:col-span-2">
          <div className="h-[600px] rounded-lg overflow-hidden shadow-lg">
            <MapContainer
              center={nepalCenter}
              zoom={7}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {stations.map((station) => (
                <Marker
                  key={station.id}
                  position={[
                    station.location.coordinates[0],
                    station.location.coordinates[1],
                  ]}
                  eventHandlers={{
                    click: () => handleStationClick(station.id),
                  }}
                >
                  <Popup>
                    <div>
                      <h3 className="font-bold">{station.name}</h3>
                      <p>{station.location.address}</p>
                      <button
                        onClick={() => handleStationClick(station.id)}
                        className="text-blue-500 underline"
                      >
                        View Details
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Station Details */}
        <div
          className="bg-white p-4 rounded-lg shadow-lg overflow-y-auto"
          style={{ maxHeight: "600px" }}
        >
          {selectedStation ? (
            <>
              {showBookingForm ? (
                <BookingForm
                  stationId={selectedStation.id}
                  stationName={selectedStation.name}
                  onBookingComplete={handleBookingComplete}
                />
              ) : (
                <div>
                  <h2 className="text-xl font-bold mb-2">
                    {selectedStation.name}
                  </h2>
                  <p className="text-gray-600 mb-2">
                    {selectedStation.location.address}
                  </p>

                  <div className="mb-4">
                    <h3 className="font-semibold">Operating Hours</h3>
                    <p>{selectedStation.operatingHours}</p>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-semibold">Pricing</h3>
                    <p>{selectedStation.pricing}</p>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-semibold">Available Chargers</h3>
                    <ul className="list-disc pl-5">
                      {selectedStation.chargers.map((charger, index) => (
                        <li
                          key={index}
                          className={
                            charger.available
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {charger.type} ({charger.power}) -{" "}
                          {charger.available ? "Available" : "In Use"}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-semibold">Amenities</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedStation.amenities.map((amenity, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    onClick={() => setShowBookingForm(true)}
                  >
                    Book a Slot
                  </button>
                </div>
              )}
              {showBookingForm && (
                <button
                  className="mt-4 text-blue-600 hover:underline"
                  onClick={() => setShowBookingForm(false)}
                >
                  ← Back to station details
                </button>
              )}
            </>
          ) : (
            <div className="flex justify-center items-center h-full text-gray-500">
              <p>Select a station on the map to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Map;
