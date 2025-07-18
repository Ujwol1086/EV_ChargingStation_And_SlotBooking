import { useState, useEffect } from "react";

const LocationInput = ({ 
  location, 
  onLocationChange, 
  onGetCurrentLocation,
  isGettingLocation = false 
}) => {
  const [locationInput, setLocationInput] = useState("");

  useEffect(() => {
    if (location && location.length === 2) {
      setLocationInput(`${location[0].toFixed(6)}, ${location[1].toFixed(6)}`);
    }
  }, [location]);

  const handleLocationInputChange = (e) => {
    setLocationInput(e.target.value);
  };

  const handleLocationInputBlur = () => {
    // Parse coordinates from input
    const coords = locationInput.split(',').map(coord => parseFloat(coord.trim()));
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      onLocationChange(coords);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        📍 Current Location
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={locationInput}
          onChange={handleLocationInputChange}
          onBlur={handleLocationInputBlur}
          placeholder="Latitude, Longitude (e.g., 27.7172, 85.3240)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={onGetCurrentLocation}
          disabled={isGettingLocation}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGettingLocation ? "Getting..." : "Get Current"}
        </button>
      </div>
      <p className="text-xs text-gray-500">
        Enter coordinates or use your current location
      </p>
    </div>
  );
};

export default LocationInput; 