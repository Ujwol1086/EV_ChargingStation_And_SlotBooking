import { useState, useEffect } from "react";
import axios from "../api/axios";

const RecommendationForm = ({ onRecommendations, userLocation }) => {
  const [formData, setFormData] = useState({
    batteryPercentage: 80,
    plugType: '',
    urgencyLevel: 'medium',
    acStatus: false,
    passengers: 1,
    terrain: 'flat',
    maxDetourKm: 20,
    drivingMode: 'random',
    trafficCondition: 'light',
    weather: 'clear'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [energyImpact, setEnergyImpact] = useState(null);
  const [supportedCities, setSupportedCities] = useState([]);
  const [destinationCity, setDestinationCity] = useState('');
  const [routeMode, setRouteMode] = useState(false);

  const plugTypes = [
    { value: "Type 1", label: "Type 1 (J1772)" },
    { value: "Type 2", label: "Type 2 (Mennekes)" },
    { value: "CHAdeMO", label: "CHAdeMO" },
    { value: "CCS", label: "CCS (Combined Charging System)" },
    { value: "Tesla Supercharger", label: "Tesla Supercharger" }
  ];

  const urgencyLevels = [
    { value: "low", label: "Low - Planning ahead" },
    { value: "medium", label: "Medium - Need to charge soon" },
    { value: "high", label: "High - Battery getting low" },
    { value: "emergency", label: "Emergency - Critical battery level" }
  ];

  const terrainTypes = [
    { value: "flat", label: "Flat - City roads, highways" },
    { value: "hilly", label: "Hilly - Some elevation changes" },
    { value: "steep", label: "Steep - Mountain roads, steep hills" }
  ];

  const drivingModes = [
    { value: "economy", label: "Economy - 30 km/h (Energy efficient)" },
    { value: "sports", label: "Sports - 60 km/h (Performance)" },
    { value: "random", label: "Random - 45 km/h (Mixed)" }
  ];

  const trafficConditions = [
    { value: "light", label: "Light - Minimal traffic" },
    { value: "medium", label: "Medium - Normal traffic" },
    { value: "heavy", label: "Heavy - Congested traffic" }
  ];

  const weatherConditions = [
    { value: "clear", label: "Clear - Good weather" },
    { value: "rain", label: "Rain - Wet conditions" },
    { value: "fog", label: "Fog - Reduced visibility" },
    { value: "snow", label: "Snow - Winter conditions" }
  ];



  // Fetch supported cities on component mount
  useEffect(() => {
    const fetchSupportedCities = async () => {
      try {
        const response = await axios.get('/recommendations/cities');
        if (response.data.success) {
          setSupportedCities(response.data.cities || []);
        }
      } catch (error) {
        console.error('Error fetching supported cities:', error);
      }
    };

    fetchSupportedCities();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Calculate estimated energy impact
  useEffect(() => {
    const calculateEnergyImpact = () => {
      let baseConsumption = 100; // Base consumption percentage
      const impacts = [];
      
      if (formData.acStatus) {
        impacts.push("AC (+15% energy)");
        baseConsumption += 15;
      }
      
      if (formData.passengers > 2) {
        impacts.push(`${formData.passengers} passengers (+${(formData.passengers - 2) * 3}% energy)`);
        baseConsumption += (formData.passengers - 2) * 3;
      }
      
      if (formData.terrain === 'hilly') {
        impacts.push("Hilly terrain (+10% energy)");
        baseConsumption += 10;
      } else if (formData.terrain === 'steep') {
        impacts.push("Steep terrain (+25% energy)");
        baseConsumption += 25;
      }
      
      setEnergyImpact({
        totalImpact: baseConsumption,
        factors: impacts
      });
    };

    calculateEnergyImpact();
  }, [formData.acStatus, formData.passengers, formData.terrain]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userLocation) {
      setLocationError('Please enable location access first');
      return;
    }

    setIsLoading(true);

    try {
      // Choose the appropriate endpoint based on route mode
      const endpoint = routeMode 
        ? '/recommendations/route-to-city'
        : '/recommendations/enhanced';  // Use the correct enhanced endpoint
      
      const requestData = {
        location: userLocation,
        battery_percentage: formData.batteryPercentage,
        plug_type: formData.plugType,
        urgency_level: formData.urgencyLevel,
        ac_status: formData.acStatus,
        passengers: formData.passengers,
        terrain: formData.terrain,
        driving_mode: formData.drivingMode,
        traffic_condition: formData.trafficCondition,
        weather: formData.weather,
        ...(routeMode && {
          destination_city: destinationCity || null, // Allow null/empty destination
          max_detour_km: formData.maxDetourKm
        })
      };

      console.log('Sending request:', requestData);
      
      const response = await axios.post(endpoint, requestData);
      
      if (response.data) {
        onRecommendations(response.data);
      } else {
        console.error('Recommendation error:', response.data);
        alert(response.data.error || 'Failed to get recommendations');
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      alert('Failed to get recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        🔋 Smart Charging Recommendations
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🔋 Current Battery Level
          </label>
          <div className="relative">
            <input
              type="number"
              name="batteryPercentage"
              min="5"
              max="100"
              value={formData.batteryPercentage}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
              placeholder="Enter battery percentage"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">%</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Min: 5%</span>
            <span>Max: 100%</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🔌 Plug Type
          </label>
          <select
            name="plugType"
            value={formData.plugType}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select plug type (optional)</option>
            {plugTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ⚡ Urgency Level
          </label>
          <select
            name="urgencyLevel"
            value={formData.urgencyLevel}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {urgencyLevels.map(level => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span className="bg-blue-100 p-2 rounded-lg mr-3">🚗</span>
            Vehicle Context (Affects Energy Consumption)
          </h3>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                name="acStatus"
                id="ac_status"
                checked={formData.acStatus}
                onChange={handleInputChange}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="ac_status" className="ml-3 block text-sm font-medium text-gray-700">
                ❄️ Air Conditioning is ON (+15% energy consumption)
              </label>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                👥 Number of Passengers (including driver)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="passengers"
                  min="1"
                  max="8"
                  value={formData.passengers}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  placeholder="Enter number of passengers"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">people</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Min: 1</span>
                <span>Max: 8</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏔️ Terrain Type
              </label>
              <select
                name="terrain"
                value={formData.terrain}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {terrainTypes.map(terrain => (
                  <option key={terrain.value} value={terrain.value}>
                    {terrain.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="text-blue-600 text-lg mr-2">⚡</span>
              <h4 className="font-semibold text-blue-800">Energy Impact Analysis</h4>
            </div>
            <p className="text-sm text-blue-700">
              {energyImpact ? energyImpact.factors.join(", ") : "Calculating energy impact..."}
            </p>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span className="bg-green-100 p-2 rounded-lg mr-3">⏱️</span>
            ETA Calculation Settings
          </h3>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🚗 Driving Mode
              </label>
              <select
                name="drivingMode"
                value={formData.drivingMode}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {drivingModes.map(mode => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🚦 Traffic Condition
                </label>
                <select
                  name="trafficCondition"
                  value={formData.trafficCondition}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {trafficConditions.map(condition => (
                    <option key={condition.value} value={condition.value}>
                      {condition.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🌤️ Weather Condition
                </label>
                <select
                  name="weather"
                  value={formData.weather}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {weatherConditions.map(weather => (
                    <option key={weather.value} value={weather.value}>
                      {weather.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span className="bg-purple-100 p-2 rounded-lg mr-3">🎯</span>
            Trip Planning
          </h3>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="route_mode"
                checked={routeMode}
                onChange={(e) => {
                  setRouteMode(e.target.checked);
                  if (!e.target.checked) {
                    setDestinationCity('');
                  }
                }}
                className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="route_mode" className="ml-3 block text-sm font-medium text-gray-700">
                Plan route to destination city
              </label>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Get recommendations for charging stations along your route
            </p>

            {routeMode && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏙️ Destination City (Optional)
                  </label>
                  <select
                    value={destinationCity}
                    onChange={(e) => setDestinationCity(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select destination city (optional)</option>
                    {supportedCities.map((city) => (
                      <option key={city.name} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: Choose your destination for route-optimized recommendations
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🛣️ Maximum Detour Distance
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={formData.maxDetourKm}
                      onChange={(e) => setFormData({...formData, maxDetourKm: parseInt(e.target.value)})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                      placeholder="Enter detour distance"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">km</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Min: 5 km</span>
                    <span>Max: 50 km</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum distance you're willing to detour from direct route
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !userLocation}
          className={`w-full py-4 px-6 text-lg font-semibold text-white rounded-lg transition-all duration-200 ${
            isLoading || !userLocation 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
              {routeMode ? 'Finding Route Stations...' : 'Finding Stations...'}
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <span className="text-xl mr-2">🔍</span>
              {routeMode ? 
                (destinationCity ? `Find Stations to ${destinationCity}` : 'Find Route Stations') : 
                'Find Charging Stations'
              }
            </div>
          )}
        </button>
        
        {!userLocation && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-center">
              <span className="text-amber-600 text-lg mr-2">📍</span>
              <p className="text-sm text-amber-700 font-medium">
                Waiting for location access...
              </p>
            </div>
          </div>
        )}
      </form>

      {locationError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-600 text-lg mr-2">⚠️</span>
            <p className="text-sm text-red-800 font-medium">{locationError}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationForm; 