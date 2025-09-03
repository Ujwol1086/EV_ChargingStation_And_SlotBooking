import { useState, useEffect, useRef } from "react";
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { userLocationIcon, stationIcon } from "../utils/mapIcons";
import L from "leaflet";

// Component to handle map updates when center changes
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && center.length === 2) {
      map.setView(center, zoom || 15);
    }
  }, [center, zoom, map]);
  
  return null;
};

const StationsMap = ({ 
  stations = [], 
  selectedStation, 
  onStationClick, 
  userLocation = [27.7172, 85.324],
  className = "h-96 w-full rounded-lg"
}) => {
  const [mapCenter, setMapCenter] = useState(userLocation);
  const [mapZoom, setMapZoom] = useState(12);
  const mapRef = useRef(null);

  // Update map center when selectedStation changes
  useEffect(() => {
    if (selectedStation && selectedStation.latitude && selectedStation.longitude) {
      const newCenter = [selectedStation.latitude, selectedStation.longitude];
      setMapCenter(newCenter);
      setMapZoom(15); // Zoom in when a station is selected
    }
  }, [selectedStation]);

  // Update map center when userLocation changes
  useEffect(() => {
    if (userLocation && userLocation.length === 2) {
      setMapCenter(userLocation);
    }
  }, [userLocation]);

  const handleStationMarkerClick = (station) => {
    if (onStationClick) {
      onStationClick(station);
    }
  };

  return (
    <div className={className}>
      <LeafletMap
        ref={mapRef}
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%" }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Map updater component */}
        <MapUpdater center={mapCenter} zoom={mapZoom} />
        
        {/* User location marker */}
        {userLocation && userLocation.length === 2 && (
          <Marker position={userLocation} icon={userLocationIcon}>
            <Popup>
              <div className="text-center">
                <strong>📍 Your Location</strong>
                <p className="text-sm text-gray-600 mt-1">
                  {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Station markers */}
        {stations.map((station) => {
          if (!station.latitude || !station.longitude) return null;
          
          const isSelected = selectedStation && selectedStation.id === station.id;
          const markerIcon = isSelected ? 
            L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="
                background-color: #06b6d4;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 12px;
              ">⚡</div>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            }) : stationIcon;
          
          return (
            <Marker
              key={station.id}
              position={[station.latitude, station.longitude]}
              icon={markerIcon}
              eventHandlers={{
                click: () => handleStationMarkerClick(station)
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-bold text-lg text-gray-800 mb-2">
                    {station.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {station.address || `${station.city || 'Unknown'}, ${station.province || 'Nepal'}`}
                  </p>
                  
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Company:</span>
                      <span className="text-sm text-blue-600">{station.company}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Available Slots:</span>
                      <span className={`text-sm font-bold ${
                        station.available_slots === 0 ? 'text-red-600' :
                        station.available_slots <= 2 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {station.available_slots}/{station.total_slots}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Price:</span>
                      <span className="text-sm text-green-600">₹{station.pricing_per_kwh}/kWh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Rating:</span>
                      <span className="text-sm text-yellow-600">★ {station.rating || 4.0}</span>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <span className="text-sm font-medium">Connectors:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {station.connector_types?.map((type, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleStationMarkerClick(station)}
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-cyan-600 hover:to-purple-700 transition-all duration-300 font-medium"
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </LeafletMap>
    </div>
  );
};

export default StationsMap;
