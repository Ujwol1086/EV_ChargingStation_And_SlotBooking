const VehicleSettings = ({ 
  batteryPercentage, 
  onBatteryChange,
  plugType,
  onPlugTypeChange,
  acStatus,
  onAcStatusChange,
  passengers,
  onPassengersChange
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Battery Level */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          Battery Level (%)
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={batteryPercentage}
          onChange={(e) => onBatteryChange(e.target.value)}
          className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-sm text-gray-400">
          <span>0%</span>
          <span className="font-medium text-cyan-400">{batteryPercentage}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Plug Type */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          Preferred Plug Type
        </label>
        <select
          value={plugType}
          onChange={(e) => onPlugTypeChange(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white transition-all duration-300 hover:border-gray-500"
        >
          <option value="">Any Type</option>
          <option value="CCS2">CCS2 (DC Fast)</option>
          <option value="GBT">GBT (DC Fast)</option>
        </select>
      </div>

      {/* AC Status */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          AC Status
        </label>
        <div className="flex items-center space-x-6">
          <label className="flex items-center">
            <input
              type="radio"
              name="acStatus"
              value="true"
              checked={acStatus === true}
              onChange={() => onAcStatusChange(true)}
              className="mr-3 text-cyan-500 focus:ring-cyan-500"
            />
            <span className="text-sm text-gray-300">AC On</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="acStatus"
              value="false"
              checked={acStatus === false}
              onChange={() => onAcStatusChange(false)}
              className="mr-3 text-cyan-500 focus:ring-cyan-500"
            />
            <span className="text-sm text-gray-300">AC Off</span>
          </label>
        </div>
      </div>

      {/* Number of Passengers */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          Number of Passengers
        </label>
        <select
          value={passengers}
          onChange={(e) => onPassengersChange(parseInt(e.target.value))}
          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white transition-all duration-300 hover:border-gray-500"
        >
          <option value={1}>1 (Driver only)</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
          <option value={5}>5+</option>
        </select>
      </div>
    </div>
  );
};

export default VehicleSettings; 