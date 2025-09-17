const TripSettings = ({
  urgencyLevel,
  onUrgencyChange,
  terrain,
  onTerrainChange,
  trafficCondition,
  onTrafficConditionChange,
  drivingMode,
  onDrivingModeChange
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Urgency Level */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          Urgency Level
        </label>
        <select
          value={urgencyLevel}
          onChange={(e) => onUrgencyChange(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white transition-all duration-300 hover:border-gray-500"
        >
          <option value="low">Low - I can wait</option>
          <option value="medium">Medium - Normal trip</option>
          <option value="high">High - Need to charge soon</option>
          <option value="critical">Critical - Very low battery</option>
        </select>
      </div>

      {/* Terrain */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          Terrain Type
        </label>
        <select
          value={terrain}
          onChange={(e) => onTerrainChange(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white transition-all duration-300 hover:border-gray-500"
        >
          <option value="flat">Flat - City/Highway</option>
          <option value="hilly">Hilly - Moderate elevation</option>
          <option value="mountainous">Mountainous - High elevation</option>
        </select>
      </div>

      {/* Traffic Condition */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          Traffic Condition
        </label>
        <select
          value={trafficCondition}
          onChange={(e) => onTrafficConditionChange(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white transition-all duration-300 hover:border-gray-500"
        >
          <option value="light">Light - Free flowing</option>
          <option value="moderate">Moderate - Some delays</option>
          <option value="heavy">Heavy - Significant delays</option>
          <option value="congested">Congested - Stop and go</option>
        </select>
      </div>


      {/* Driving Mode */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          Driving Mode
        </label>
        <select
          value={drivingMode}
          onChange={(e) => onDrivingModeChange(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white transition-all duration-300 hover:border-gray-500"
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