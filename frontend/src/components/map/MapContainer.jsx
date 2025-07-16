import { MapContainer as LeafletMap, TileLayer, useMap } from "react-leaflet";
import { userLocationIcon, stationIcon, recommendedStationIcon, topRecommendationIcon } from "../../utils/mapIcons";

const MapContainer = ({ 
  center, 
  zoom, 
  children,
  className = "h-96 w-full rounded-lg"
}) => {
  return (
    <LeafletMap
      center={center}
      zoom={zoom}
      className={className}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </LeafletMap>
  );
};

export default MapContainer; 