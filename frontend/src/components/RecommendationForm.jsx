import { useState, useEffect } from "react";
import axios from "../api/axios";

const RecommendationForm = ({ onRecommendations, userLocation }) => {
  const [formData, setFormData] = useState({
    battery_percentage: 50,
    plug_type: "",
    urgency_level: "medium",
    ac_status: false,
    passengers: 1,
    terrain: "flat"
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userLocation) {
      setError("Location not available. Please enable location services.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const requestData = {
        location: userLocation,
        battery_percentage: parseInt(formData.battery_percentage),
        plug_type: formData.plug_type,
        urgency_level: formData.urgency_level,
        ac_status: formData.ac_status,
        passengers: parseInt(formData.passengers),
        terrain: formData.terrain
      };

      console.log("Sending enhanced recommendation request:", requestData);

      const response = await axios.post("/recommendations/recommendations", requestData);
      
      if (response.data.success) {
        onRecommendations(response.data);
      } else {
        setError(response.data.error || "Failed to get recommendations");
      }
    } catch (err) {
      console.error("Error getting recommendations:", err);
      setError(
        err.response?.data?.error || 
        err.response?.data?.message || 
        "Error connecting to server"
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateEnergyImpact = () => {
    let impact = "Base consumption";
    const impacts = [];
    
    if (formData.ac_status) {
      impacts.push("AC (+15% energy)");
    }
    
    const additionalPassengers = Math.max(0, formData.passengers - 1);
    if (additionalPassengers > 0) {
      impacts.push(`+${additionalPassengers} passengers (+${additionalPassengers * 3}% energy)`);
    }
    
    if (formData.terrain !== "flat") {
      const terrainPenalty = formData.terrain === "hilly" ? 20 : 50;
      impacts.push(`${formData.terrain} terrain (+${terrainPenalty}% energy)`);
    }
    
    return impacts.length > 0 ? impacts.join(", ") : impact;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        🔋 Smart Charging Recommendations
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            🔋 Current Battery Level: {formData.battery_percentage}%
          </label>
          <input
            type="range"
            name="battery_percentage"
            min="5"
            max="100"
            value={formData.battery_percentage}
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
            name="plug_type"
            value={formData.plug_type}
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
            name="urgency_level"
            value={formData.urgency_level}
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
              name="ac_status"
              id="ac_status"
              checked={formData.ac_status}
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
              <strong>⚡ Energy Impact:</strong> {calculateEnergyImpact()}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !userLocation}
          className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
            loading || !userLocation
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing Smart Recommendations...
            </span>
          ) : (
            "🎯 Get Smart Recommendations"
          )}
        </button>

        {!userLocation && (
          <p className="text-sm text-amber-600 text-center">
            📍 Waiting for location access...
          </p>
        )}
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
};

export default RecommendationForm; 