import { useState } from "react";
import axios from "../api/axios";

const RecommendationForm = ({ onRecommendations, userLocation }) => {
  const [formData, setFormData] = useState({
    battery_percentage: "",
    plug_type: "",
    urgency_level: "medium",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userLocation) {
      setError("Location access is required for recommendations");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const requestData = {
        latitude: userLocation[0],
        longitude: userLocation[1],
        battery_percentage: parseInt(formData.battery_percentage),
        plug_type: formData.plug_type,
        urgency_level: formData.urgency_level,
      };

      const response = await axios.post("/recommendations/get-recommendations", requestData);
      
      if (response.data.success) {
        onRecommendations(response.data);
      } else {
        setError(response.data.error || "Failed to get recommendations");
      }
    } catch (err) {
      console.error("Error getting recommendations:", err);
      if (err.response?.status === 401) {
        setError("Authentication required. Please log in again.");
      } else {
        setError(err.response?.data?.error || "Failed to get recommendations. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Get Recommendations</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Battery Percentage
          </label>
          <input
            type="number"
            name="battery_percentage"
            value={formData.battery_percentage}
            onChange={handleChange}
            min="0"
            max="100"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your current battery %"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Charger Plug Type
          </label>
          <select
            name="plug_type"
            value={formData.plug_type}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select your plug type</option>
            <option value="Type A">Type A (Level 1)</option>
            <option value="Type B">Type B (Level 2)</option>
            <option value="CHAdeMO">CHAdeMO (DC Fast)</option>
            <option value="CCS">CCS (DC Fast)</option>
            <option value="Tesla Supercharger">Tesla Supercharger</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Urgency Level
          </label>
          <select
            name="urgency_level"
            value={formData.urgency_level}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low - Can wait for best price</option>
            <option value="medium">Medium - Balance of speed and cost</option>
            <option value="high">High - Need charging ASAP</option>
          </select>
        </div>

        {userLocation && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            📍 Using your current location: {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !userLocation}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? "Finding Stations..." : "Find Stations"}
        </button>
        
        {!userLocation && (
          <p className="text-sm text-red-600 text-center">
            Please allow location access to get personalized recommendations
          </p>
        )}
      </form>
    </div>
  );
};

export default RecommendationForm; 