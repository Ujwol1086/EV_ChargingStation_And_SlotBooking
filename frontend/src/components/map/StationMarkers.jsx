import { Marker, Popup } from "react-leaflet";
import { stationIcon, recommendedStationIcon, topRecommendationIcon } from "../../utils/mapIcons";
import { getStationCoordinates, formatLocationDisplay } from "../../utils/mapHelpers";

const StationMarkers = ({ 
  stations, 
  recommendations = [], 
  onStationClick,
  selectedStation 
}) => {
  const getMarkerIcon = (station) => {
    const isRecommended = recommendations.some(rec => rec.id === station.id);
    const isTopRecommendation = recommendations.length > 0 && recommendations[0].id === station.id;
    
    if (isTopRecommendation) return topRecommendationIcon;
    if (isRecommended) return recommendedStationIcon;
    return stationIcon;
  };

  const getMarkerColor = (station) => {
    const isRecommended = recommendations.some(rec => rec.id === station.id);
    const isTopRecommendation = recommendations.length > 0 && recommendations[0].id === station.id;
    
    if (isTopRecommendation) return "border-yellow-400 bg-yellow-50";
    if (isRecommended) return "border-green-400 bg-green-50";
    return "border-gray-300 bg-white";
  };

  return stations.map((station) => {
    const coordinates = getStationCoordinates(station);
    if (!coordinates) return null;

    const isSelected = selectedStation && selectedStation.id === station.id;
    const markerColor = getMarkerColor(station);

    return (
      <Marker
        key={station.id}
        position={coordinates}
        icon={getMarkerIcon(station)}
        eventHandlers={{
          click: () => onStationClick && onStationClick(station),
        }}
      >
        <Popup>
          <div className={`p-2 rounded-lg border-2 ${markerColor} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
            <h3 className="font-bold text-gray-800 text-sm mb-1">{station.name}</h3>
            <p className="text-xs text-gray-600 mb-2">{formatLocationDisplay(station)}</p>
            
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Availability:</span>
                <span className={`font-medium ${
                  station.availability === 0 ? 'text-red-600' : 
                  station.availability < 3 ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {station.availability === 0 ? 'FULL' : `${station.availability} slots`}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Price:</span>
                <span className="font-medium text-gray-800">Rs. {station.pricing || 'N/A'}/kWh</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Rating:</span>
                <span className="font-medium text-gray-800">{station.rating}/5</span>
              </div>
            </div>

            {recommendations.some(rec => rec.id === station.id) && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex items-center gap-1">
                  {recommendations[0].id === station.id ? (
                    <span className="text-yellow-600 text-xs">🏆 Top Recommendation</span>
                  ) : (
                    <span className="text-green-600 text-xs">✅ Recommended</span>
                  )}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Score: {(recommendations.find(rec => rec.id === station.id)?.score * 100).toFixed(0)}%
                </div>
              </div>
            )}

            <button
              onClick={() => onStationClick && onStationClick(station)}
              className="mt-2 w-full px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
            >
              View Details
            </button>
          </div>
        </Popup>
      </Marker>
    );
  });
};

export default StationMarkers; 