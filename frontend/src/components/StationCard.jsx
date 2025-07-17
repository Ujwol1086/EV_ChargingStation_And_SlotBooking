const StationCard = ({ station, onStationClick }) => {
  const getAvailabilityColor = (station) => {
    if (station.available_slots === 0) return 'text-red-600 bg-red-50';
    if (station.available_slots <= 2) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const getAvailabilityText = (station) => {
    if (station.available_slots === 0) return 'Fully Booked';
    if (station.available_slots === 1) return '1 Slot Available';
    return `${station.available_slots} Slots Available`;
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
      onClick={() => onStationClick(station)}
    >
      {/* Station Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
              {station.name}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              📍 {station.location?.address || `${station.city || 'Unknown'}, ${station.province || 'Nepal'}`}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getAvailabilityColor(station)}`}>
            {getAvailabilityText(station)}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              💰 Rs. {station.pricing || 'Contact'}
            </span>
            <span className="text-gray-600">
              ⭐ {station.rating || 4.5}/5
            </span>
          </div>
          <span className="text-gray-600">
            🔌 {station.total_slots || 1} slots
          </span>
        </div>
      </div>

      {/* Station Details */}
      <div className="p-6">
        {/* Charger Types */}
        {station.chargers && station.chargers.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">⚡ Charger Types</p>
            <div className="flex flex-wrap gap-2">
              {station.chargers.slice(0, 3).map((charger, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {charger.type} ({charger.power})
                </span>
              ))}
              {station.chargers.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{station.chargers.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Amenities */}
        {station.amenities && station.amenities.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">🏪 Amenities</p>
            <div className="flex flex-wrap gap-2">
              {station.amenities.slice(0, 4).map((amenity, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                >
                  {amenity}
                </span>
              ))}
              {station.amenities.length > 4 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{station.amenities.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Operating Hours */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-1">🕒 Operating Hours</p>
          <p className="text-sm text-gray-600">{station.operatingHours || '24/7'}</p>
        </div>

        {/* Contact Info */}
        {station.telephone && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-1">📞 Contact</p>
            <p className="text-sm text-gray-600">{station.telephone}</p>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStationClick(station);
          }}
          disabled={station.available_slots === 0}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
            station.available_slots === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg group-hover:bg-blue-700'
          }`}
        >
          {station.available_slots === 0 ? '🚫 Fully Booked' : '🚗 Book Now'}
        </button>
      </div>
    </div>
  );
};

export default StationCard; 