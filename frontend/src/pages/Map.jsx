import { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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

// Create a custom icon for user location
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
        console.log("Location found:", e.latlng);
      });

      map.on("locationerror", (e) => {
        console.error("Location error:", e.message);
        // Fall back to Nepal center if location access is denied
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
      <Popup>You are here</Popup>
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
            // Fall back to Nepal center if location access is denied
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
          setFilteredStations(response.data.stations); // Initialize filteredStations
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

  useEffect(() => {
    // Filter stations by distance whenever userPosition or maxDistance changes
    if (userPosition) {
      const filtered = stations.filter((station) => {
        const distance = calculateDistance(
          userPosition[0],
          userPosition[1],
          station.location.coordinates[0],
          station.location.coordinates[1]
        );
        return distance <= maxDistance;
      });
      setFilteredStations(filtered);
    } else {
      setFilteredStations(stations); // Reset filter if userPosition is not available
    }
  }, [userPosition, maxDistance, stations]);

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

      {/* Filters */}
      {userPosition && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Filter Stations</h2>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-full md:w-1/2">
              <label
                htmlFor="distance-filter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Maximum Distance: {maxDistance} km
              </label>
              <input
                id="distance-filter"
                type="range"
                min="5"
                max="300"
                step="5"
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="w-full md:w-1/2">
              <p className="text-sm text-gray-600">
                Showing {filteredStations.length} of {stations.length} stations
                within {maxDistance} km
              </p>
              {filteredStations.length === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  No stations found within this distance. Try increasing the
                  range.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Map */}
        <div className="md:col-span-2">
          <div className="h-[600px] rounded-lg overflow-hidden shadow-lg">
            {" "}
            <MapContainer
              center={mapCenter || nepalCenter}
              zoom={mapCenter ? 14 : 7}
              style={{ height: "100%", width: "100%" }}
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* User location marker */}
              <LocationMarker
                position={userPosition}
                setPosition={setUserPosition}
              />

              {filteredStations.map((station) => (
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
                  {" "}
                  <Popup>
                    <div>
                      <h3 className="font-bold">{station.name}</h3>
                      <p>{station.location.address}</p>
                      {userPosition && (
                        <p className="text-green-600 text-sm mt-1">
                          {calculateDistance(
                            userPosition[0],
                            userPosition[1],
                            station.location.coordinates[0],
                            station.location.coordinates[1]
                          ).toFixed(1)}{" "}
                          km away
                        </p>
                      )}
                      <button
                        onClick={() => handleStationClick(station.id)}
                        className="text-blue-500 underline mt-2"
                      >
                        View Details
                      </button>
                    </div>{" "}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Location button */}
          <button
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserPosition([latitude, longitude]);
                  },
                  (error) => {
                    console.error("Error getting location:", error);
                    alert(
                      "Unable to access your location. Please check your device settings."
                    );
                  }
                );
              } else {
                alert("Geolocation is not supported by your browser");
              }
            }}
            className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            Find My Location
          </button>
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

                  {userPosition && (
                    <div className="mb-4 text-green-600 font-medium">
                      <p>
                        Distance:{" "}
                        {calculateDistance(
                          userPosition[0],
                          userPosition[1],
                          selectedStation.location.coordinates[0],
                          selectedStation.location.coordinates[1]
                        ).toFixed(1)}{" "}
                        km from your location
                      </p>
                    </div>
                  )}

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
              )}{" "}
            </>
          ) : (
            <div className="h-full flex flex-col">
              <h2 className="text-xl font-semibold mb-4">
                Nearby Charging Stations
              </h2>

              {userPosition ? (
                filteredStations.length > 0 ? (
                  <div className="overflow-y-auto flex-grow">
                    {filteredStations.slice(0, 10).map((station) => (
                      <div
                        key={station.id}
                        className="border-b border-gray-200 py-3 px-2 hover:bg-blue-50 cursor-pointer"
                        onClick={() => handleStationClick(station.id)}
                      >
                        <h3 className="font-medium text-blue-700">
                          {station.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {station.location.address}
                        </p>{" "}
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-green-600 font-medium">
                            {station.distance !== undefined
                              ? station.distance.toFixed(1)
                              : "N/A"}{" "}
                            km away
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-800 py-1 px-2 rounded-full">
                            {station.chargers.filter((c) => c.available).length}
                            /{station.chargers.length} available
                          </span>
                        </div>
                      </div>
                    ))}
                    {filteredStations.length > 10 && (
                      <p className="text-center text-sm text-gray-500 mt-3">
                        Showing 10 of {filteredStations.length} stations
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 flex-grow flex flex-col justify-center">
                    <p>No charging stations found within {maxDistance} km</p>
                    <button
                      onClick={() => setMaxDistance(maxDistance + 50)}
                      className="mt-2 text-blue-500 underline"
                    >
                      Increase search radius
                    </button>
                  </div>
                )
              ) : (
                <div className="text-center text-gray-500 flex-grow flex flex-col justify-center">
                  <p>Enable location services to see nearby stations</p>
                  <button
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            const { latitude, longitude } = position.coords;
                            setUserPosition([latitude, longitude]);
                          },
                          (error) => {
                            console.error("Error getting location:", error);
                            alert(
                              "Unable to access your location. Please check your device settings."
                            );
                          }
                        );
                      } else {
                        alert("Geolocation is not supported by your browser");
                      }
                    }}
                    className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mx-auto"
                  >
                    Share My Location
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Map;
