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
    maxDetourKm: 20
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            🔋 Current Battery Level: {formData.batteryPercentage}%
          </label>
          <input
            type="range"
            name="batteryPercentage"
            min="5"
            max="100"
            value={formData.batteryPercentage}
            onChange={handleInputChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>5%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            🔌 Plug Type
          </label>
          <select
            name="plugType"
            value={formData.plugType}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ⚡ Urgency Level
          </label>
          <select
            name="urgencyLevel"
            value={formData.urgencyLevel}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {urgencyLevels.map(level => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            🚗 Vehicle Context (Affects Energy Consumption)
          </h3>
          
          <div className="flex items-center mb-3">
            <input
              type="checkbox"
              name="acStatus"
              id="ac_status"
              checked={formData.acStatus}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="ac_status" className="ml-2 block text-sm text-gray-700">
              ❄️ Air Conditioning is ON (+15% energy consumption)
            </label>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              👥 Number of Passengers (including driver): {formData.passengers}
            </label>
            <input
              type="range"
              name="passengers"
              min="1"
              max="8"
              value={formData.passengers}
              onChange={handleInputChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>4</span>
              <span>8</span>
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🏔️ Terrain Type
            </label>
            <select
              name="terrain"
              value={formData.terrain}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {terrainTypes.map(terrain => (
                <option key={terrain.value} value={terrain.value}>
                  {terrain.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>⚡ Energy Impact:</strong> {energyImpact ? energyImpact.factors.join(", ") : "Calculating..."}
            </p>
          </div>
        </div>

        <div className="form-section">
          <h3>🎯 Trip Planning</h3>
          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                checked={routeMode}
                onChange={(e) => {
                  setRouteMode(e.target.checked);
                  if (!e.target.checked) {
                    setDestinationCity('');
                  }
                }}
                className="checkbox-input"
              />
              Plan route to destination city
            </label>
            <small className="form-hint">
              Get recommendations for charging stations along your route
            </small>
          </div>

          {routeMode && (
            <div className="form-group">
              <label className="form-label">Destination City (Optional)</label>
              <select
                value={destinationCity}
                onChange={(e) => setDestinationCity(e.target.value)}
                className="form-input"
              >
                <option value="">Select destination city (optional)</option>
                {supportedCities.map((city) => (
                  <option key={city.name} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
              <small className="form-hint">
                Optional: Choose your destination for route-optimized recommendations
              </small>
            </div>
          )}

          {routeMode && (
            <div className="form-group">
              <label className="form-label">Maximum Detour</label>
              <div className="slider-container">
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={formData.maxDetourKm}
                  onChange={(e) => setFormData({...formData, maxDetourKm: parseInt(e.target.value)})}
                  className="form-slider"
                />
                <span className="slider-value">{formData.maxDetourKm} km</span>
              </div>
              <small className="form-hint">
                Maximum distance you're willing to detour from direct route
              </small>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          className={`submit-button ${isLoading ? 'loading' : ''}`}
          disabled={isLoading || !userLocation}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              {routeMode ? 'Finding Route Stations...' : 'Finding Stations...'}
            </>
          ) : (
            <>
              🔍 {routeMode ? 
                (destinationCity ? `Find Stations to ${destinationCity}` : 'Find Route Stations') : 
                'Find Charging Stations'
              }
            </>
          )}
        </button>

        {!userLocation && (
          <p className="text-sm text-amber-600 text-center">
            📍 Waiting for location access...
          </p>
        )}
      </form>

      {locationError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{locationError}</p>
        </div>
      )}
    </div>
  );
};

export default RecommendationForm; 