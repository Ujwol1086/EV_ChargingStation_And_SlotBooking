import { useState } from "react";
import LocationInput from "./forms/LocationInput";
import VehicleSettings from "./forms/VehicleSettings";
import TripSettings from "./forms/TripSettings";

const RecommendationForm = ({ onSubmit, loading = false }) => {
  // Form state
  const [location, setLocation] = useState([27.7172, 85.3240]); // Default to Kathmandu
  const [batteryPercentage, setBatteryPercentage] = useState(80);
  const [plugType, setPlugType] = useState("");
  const [acStatus, setAcStatus] = useState(false);
  const [passengers, setPassengers] = useState(1);
  const [urgencyLevel, setUrgencyLevel] = useState("medium");
  const [terrain, setTerrain] = useState("flat");
  const [trafficCondition, setTrafficCondition] = useState("light");
  const [weather, setWeather] = useState("clear");
  const [drivingMode, setDrivingMode] = useState("random");
  const [destinationCity, setDestinationCity] = useState("");
  const [maxDetourKm, setMaxDetourKm] = useState(20);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation([position.coords.latitude, position.coords.longitude]);
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Could not get your location. Please enter coordinates manually.");
          setIsGettingLocation(false);
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
      setIsGettingLocation(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formData = {
      location,
      battery_percentage: batteryPercentage,
      plug_type: plugType,
      ac_status: acStatus,
      passengers,
      urgency_level: urgencyLevel,
      terrain,
      traffic_condition: trafficCondition,
      weather,
      driving_mode: drivingMode,
      destination_city: destinationCity,
      max_detour_km: maxDetourKm
    };

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        🚗 Smart Charging Station Recommendations
      </h2>

      {/* Location Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">📍 Location & Destination</h3>
        <LocationInput
          location={location}
          onLocationChange={setLocation}
          onGetCurrentLocation={getCurrentLocation}
          isGettingLocation={isGettingLocation}
        />
        
        <div className="mt-4 space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            🎯 Destination City (Optional)
          </label>
          <input
            type="text"
            value={destinationCity}
            onChange={(e) => setDestinationCity(e.target.value)}
            placeholder="e.g., Pokhara, Chitwan"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Vehicle Settings */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">🚙 Vehicle Settings</h3>
        <VehicleSettings
          batteryPercentage={batteryPercentage}
          onBatteryChange={setBatteryPercentage}
          plugType={plugType}
          onPlugTypeChange={setPlugType}
          acStatus={acStatus}
          onAcStatusChange={setAcStatus}
          passengers={passengers}
          onPassengersChange={setPassengers}
        />
      </div>

      {/* Trip Settings */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">🗺️ Trip Conditions</h3>
        <TripSettings
          urgencyLevel={urgencyLevel}
          onUrgencyChange={setUrgencyLevel}
          terrain={terrain}
          onTerrainChange={setTerrain}
          trafficCondition={trafficCondition}
          onTrafficConditionChange={setTrafficCondition}
          weather={weather}
          onWeatherChange={setWeather}
          drivingMode={drivingMode}
          onDrivingModeChange={setDrivingMode}
        />
      </div>

      {/* Advanced Settings */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          {showAdvanced ? "▼" : "▶"} Advanced Settings
        </button>
        
        {showAdvanced && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                🛣️ Maximum Detour Distance (km)
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={maxDetourKm}
                onChange={(e) => setMaxDetourKm(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>5 km</span>
                <span className="font-medium text-blue-600">{maxDetourKm} km</span>
                <span>50 km</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Finding Recommendations...
            </span>
          ) : (
            "🔍 Get Smart Recommendations"
          )}
        </button>
      </div>

      {/* Quick Tips */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">💡 Quick Tips:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Higher urgency levels prioritize closer stations</li>
          <li>• AC usage and passengers increase energy consumption</li>
          <li>• Hilly terrain requires more energy</li>
          <li>• Set destination for route-based recommendations</li>
        </ul>
      </div>
    </form>
  );
};

export default RecommendationForm; 