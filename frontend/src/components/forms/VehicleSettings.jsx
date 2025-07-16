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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Battery Level */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          🔋 Battery Level (%)
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={batteryPercentage}
          onChange={(e) => onBatteryChange(e.target.value)}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0%</span>
          <span className="font-medium text-blue-600">{batteryPercentage}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Plug Type */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          🔌 Preferred Plug Type
        </label>
        <select
          value={plugType}
          onChange={(e) => onPlugTypeChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Any Type</option>
          <option value="Type 2">Type 2 (AC)</option>
          <option value="CCS">CCS (DC Fast)</option>
          <option value="CHAdeMO">CHAdeMO</option>
          <option value="Type 1">Type 1</option>
        </select>
      </div>

      {/* AC Status */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          ❄️ AC Status
        </label>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="acStatus"
              value="true"
              checked={acStatus === true}
              onChange={() => onAcStatusChange(true)}
              className="mr-2"
            />
            <span className="text-sm">AC On</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="acStatus"
              value="false"
              checked={acStatus === false}
              onChange={() => onAcStatusChange(false)}
              className="mr-2"
            />
            <span className="text-sm">AC Off</span>
          </label>
        </div>
      </div>

      {/* Number of Passengers */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          👥 Number of Passengers
        </label>
        <select
          value={passengers}
          onChange={(e) => onPassengersChange(parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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