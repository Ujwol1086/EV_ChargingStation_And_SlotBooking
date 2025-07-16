const TripSettings = ({
  urgencyLevel,
  onUrgencyChange,
  terrain,
  onTerrainChange,
  trafficCondition,
  onTrafficConditionChange,
  weather,
  onWeatherChange,
  drivingMode,
  onDrivingModeChange
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Urgency Level */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          ⚡ Urgency Level
        </label>
        <select
          value={urgencyLevel}
          onChange={(e) => onUrgencyChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="low">Low - I can wait</option>
          <option value="medium">Medium - Normal trip</option>
          <option value="high">High - Need to charge soon</option>
          <option value="critical">Critical - Very low battery</option>
        </select>
      </div>

      {/* Terrain */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          🏔️ Terrain Type
        </label>
        <select
          value={terrain}
          onChange={(e) => onTerrainChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="flat">Flat - City/Highway</option>
          <option value="hilly">Hilly - Moderate elevation</option>
          <option value="mountainous">Mountainous - High elevation</option>
        </select>
      </div>

      {/* Traffic Condition */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          🚦 Traffic Condition
        </label>
        <select
          value={trafficCondition}
          onChange={(e) => onTrafficConditionChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="light">Light - Free flowing</option>
          <option value="moderate">Moderate - Some delays</option>
          <option value="heavy">Heavy - Significant delays</option>
          <option value="congested">Congested - Stop and go</option>
        </select>
      </div>

      {/* Weather */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          🌤️ Weather Condition
        </label>
        <select
          value={weather}
          onChange={(e) => onWeatherChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="clear">Clear - Sunny</option>
          <option value="cloudy">Cloudy - Overcast</option>
          <option value="rainy">Rainy - Wet conditions</option>
          <option value="snowy">Snowy - Winter conditions</option>
        </select>
      </div>

      {/* Driving Mode */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          🚗 Driving Mode
        </label>
        <select
          value={drivingMode}
          onChange={(e) => onDrivingModeChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="eco">Eco - Energy efficient</option>
          <option value="normal">Normal - Balanced</option>
          <option value="sport">Sport - Performance</option>
          <option value="random">Auto - System decides</option>
        </select>
      </div>
    </div>
  );
};

export default TripSettings; 