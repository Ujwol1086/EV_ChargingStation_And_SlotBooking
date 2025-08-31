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
    <form onSubmit={handleSubmit} className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl p-8 hover:border-cyan-500/50 transition-all duration-500">
      <h2 className="text-3xl font-bold text-white mb-8 text-center bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
        Smart Charging Station Recommendations
      </h2>

      {/* Location Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-cyan-400 mb-4">
          Location & Destination
        </h3>
        <LocationInput
          location={location}
          onLocationChange={setLocation}
          onGetCurrentLocation={getCurrentLocation}
          isGettingLocation={isGettingLocation}
        />
        
        <div className="mt-6 space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            Destination City (Optional)
          </label>
          <input
            type="text"
            value={destinationCity}
            onChange={(e) => setDestinationCity(e.target.value)}
            placeholder="e.g., Pokhara, Chitwan"
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300 hover:border-gray-500"
          />
        </div>
      </div>

      {/* Vehicle Settings */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-cyan-400 mb-4">
          Vehicle Settings
        </h3>
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
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-cyan-400 mb-4">
          Trip Conditions
        </h3>
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
      <div className="mb-8">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-cyan-400 hover:text-cyan-300 font-medium transition-colors duration-300"
        >
          <span className="mr-2">{showAdvanced ? "▼" : "▶"}</span>
          Advanced Settings
        </button>
        
        {showAdvanced && (
          <div className="mt-6 p-6 bg-gray-800/30 border border-gray-600/50 rounded-2xl backdrop-blur-sm">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-300">
                Maximum Detour Distance (km)
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={maxDetourKm}
                onChange={(e) => setMaxDetourKm(parseInt(e.target.value))}
                className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-sm text-gray-400">
                <span>5 km</span>
                <span className="font-medium text-cyan-400">{maxDetourKm} km</span>
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
          className="px-10 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-2xl hover:from-cyan-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/25"
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
            "Get Smart Recommendations"
          )}
        </button>
      </div>

      {/* Quick Tips */}
      <div className="mt-8 p-6 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-2xl backdrop-blur-sm">
        <h4 className="font-medium text-cyan-400 mb-3">
          Quick Tips:
        </h4>
        <ul className="text-sm text-gray-300 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-cyan-400 mt-1">•</span>
            <span>Higher urgency levels prioritize closer stations</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400 mt-1">•</span>
            <span>AC usage and passengers increase energy consumption</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400 mt-1">•</span>
            <span>Hilly terrain requires more energy</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400 mt-1">•</span>
            <span>Set destination for route-based recommendations</span>
          </li>
        </ul>
      </div>
    </form>
  );
};

export default RecommendationForm; 