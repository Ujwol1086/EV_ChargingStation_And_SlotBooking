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
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-300">
        Current Location
      </label>
      <div className="flex gap-3">
        <input
          type="text"
          value={locationInput}
          onChange={handleLocationInputChange}
          onBlur={handleLocationInputBlur}
          placeholder="Latitude, Longitude (e.g., 27.7172, 85.3240)"
          className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300 hover:border-gray-500"
        />
        <button
          type="button"
          onClick={onGetCurrentLocation}
          disabled={isGettingLocation}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 font-medium"
        >
          {isGettingLocation ? "Getting..." : "Get Current"}
        </button>
      </div>
      <p className="text-xs text-gray-400">
        Enter coordinates or use your current location
      </p>
    </div>
  );
};

export default LocationInput; 