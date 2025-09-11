const StationCard = ({ station, onStationClick }) => {
  const getAvailabilityColor = (station) => {
    // Check if station is unavailable
    if (station.status === 'unavailable') return 'text-red-400 bg-red-500/20 border border-red-500/30';
    if (station.available_slots === 0) return 'text-red-400 bg-red-500/20 border border-red-500/30';
    if (station.available_slots <= 2) return 'text-orange-400 bg-orange-500/20 border border-orange-500/30';
    return 'text-green-400 bg-green-500/20 border border-green-500/30';
  };

  const getAvailabilityText = (station) => {
    // Check if station is unavailable
    if (station.status === 'unavailable') return 'Station Unavailable';
    if (station.available_slots === 0) return 'Fully Booked';
    if (station.available_slots === 1) return '1 Slot Available';
    return `${station.available_slots} Slots Available`;
  };

  const isStationUnavailable = station.status === 'unavailable' || station.name?.includes('(Not Found)');

  return (
    <div 
      className={`bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl overflow-hidden hover:shadow-2xl hover:shadow-cyan-500/10 hover:border-cyan-500/50 transition-all duration-500 cursor-pointer group transform hover:-translate-y-2 ${
        isStationUnavailable ? 'opacity-75' : ''
      }`}
      onClick={() => onStationClick(station)}
    >
      {/* Station Header */}
      <div className="p-6 border-b border-gray-600/50">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className={`text-lg font-bold group-hover:text-cyan-400 transition-colors ${
              isStationUnavailable ? 'text-gray-500' : 'text-white'
            }`}>
              {station.name}
            </h3>
            <p className="text-sm text-gray-300 mt-1">
              {station.address || station.location?.address || `${station.city || 'Unknown'}, ${station.province || 'Nepal'}`}
            </p>
            {station.note && (
              <p className="text-xs text-red-400 mt-1 italic">
                {station.note}
              </p>
            )}
          </div>
          <div className={`px-4 py-2 rounded-2xl text-sm font-semibold ${getAvailabilityColor(station)} backdrop-blur-sm`}>
            <div className="flex items-center gap-2">
              {station.status === 'unavailable' || station.available_slots === 0 ? (
                <>
                  <span className="w-3 h-3 bg-red-400 rounded-full animate-pulse shadow-lg shadow-red-400/50"></span>
                  <span>{getAvailabilityText(station)}</span>
                </>
              ) : station.available_slots <= 2 ? (
                <>
                  <span className="w-3 h-3 bg-orange-400 rounded-full animate-pulse shadow-lg shadow-orange-400/50"></span>
                  <span>{getAvailabilityText(station)}</span>
                </>
              ) : (
                <>
                  <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></span>
                  <span>{getAvailabilityText(station)}</span>
                </>
              )}
            </div>
          </div>
        </div>

                 {/* Quick Stats */}
         <div className="flex items-center justify-between text-sm">
           <div className="flex items-center gap-2">
             <span className="text-white font-medium text-sm">{station.pricing || 'Contact'}</span>
           </div>
           <div className="flex items-center gap-2">
             <span className="text-yellow-400 font-medium text-sm">★</span>
             <span className="text-white font-medium text-sm">{station.rating || 4.5}</span>
             <span className="text-yellow-300 text-xs">/5</span>
           </div>
         </div>
      </div>

             {/* Station Details */}
       <div className="p-6 min-h-[400px] flex flex-col">
         {/* Charger Types */}
         {station.chargers && station.chargers.length > 0 ? (
           <div className="mb-6">
             <p className="text-sm font-medium text-cyan-400 mb-3 flex items-center gap-2">
               <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
               Charger Types
             </p>
             <div className="flex flex-wrap gap-2">
               {station.chargers.slice(0, 3).map((charger, index) => (
                 <span 
                   key={index}
                   className="px-3 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 text-xs rounded-xl border border-cyan-500/30 backdrop-blur-sm hover:from-cyan-500/30 hover:to-blue-500/30 transition-all duration-300"
                 >
                   <span className="font-semibold">{charger.type}</span>
                   <span className="text-cyan-200"> ({charger.power})</span>
                 </span>
               ))}
               {station.chargers.length > 3 && (
                 <span className="px-3 py-2 bg-gradient-to-r from-gray-500/20 to-gray-600/20 text-gray-300 text-xs rounded-xl border border-gray-500/30 backdrop-blur-sm">
                   +{station.chargers.length - 3} more
                 </span>
               )}
             </div>
           </div>
         ) : (
           <div className="mb-6">
             <p className="text-sm font-medium text-cyan-400 mb-3 flex items-center gap-2">
               <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
               Charger Types
             </p>
             <div className="px-3 py-2 bg-gradient-to-r from-gray-500/10 to-gray-600/10 border border-gray-500/20 rounded-xl backdrop-blur-sm">
               <p className="text-sm text-gray-400 font-medium">No charger info available</p>
             </div>
           </div>
         )}

         {/* Amenities */}
         {station.amenities && station.amenities.length > 0 ? (
           <div className="mb-6">
             <p className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
               <span className="w-2 h-2 bg-green-400 rounded-full"></span>
               Amenities
             </p>
             <div className="flex flex-wrap gap-2">
               {station.amenities.slice(0, 4).map((amenity, index) => (
                 <span 
                   key={index}
                   className="px-3 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 text-xs rounded-xl border border-green-500/30 backdrop-blur-sm hover:from-green-500/30 hover:to-emerald-500/30 transition-all duration-300"
                 >
                   {amenity}
                 </span>
               ))}
               {station.amenities.length > 4 && (
                 <span className="px-3 py-2 bg-gradient-to-r from-gray-500/20 to-gray-600/20 text-gray-300 text-xs rounded-xl border border-gray-500/30 backdrop-blur-sm">
                   +{station.amenities.length - 4} more
                 </span>
               )}
             </div>
           </div>
         ) : (
           <div className="mb-6">
             <p className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
               <span className="w-2 h-2 bg-green-400 rounded-full"></span>
               Amenities
             </p>
             <div className="px-3 py-2 bg-gradient-to-r from-gray-500/10 to-gray-600/10 border border-gray-500/20 rounded-xl backdrop-blur-sm">
               <p className="text-sm text-gray-400 font-medium">No amenities listed</p>
             </div>
           </div>
         )}

         {/* Operating Hours */}
         <div className="mb-6">
           <p className="text-sm font-medium text-purple-400 mb-3 flex items-center gap-2">
             <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
             Operating Hours
           </p>
           <div className="px-3 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl backdrop-blur-sm">
             <p className="text-sm text-gray-200 font-medium">{station.operatingHours || '24/7'}</p>
           </div>
         </div>

         {/* Contact Info */}
         {station.telephone ? (
           <div className="mb-6">
             <p className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
               <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
               Contact
             </p>
             <div className="px-3 py-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-xl backdrop-blur-sm">
               <p className="text-sm text-gray-200 font-medium">{station.telephone}</p>
             </div>
           </div>
         ) : (
           <div className="mb-6">
             <p className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
               <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
               Contact
             </p>
             <div className="px-3 py-2 bg-gradient-to-r from-gray-500/10 to-gray-600/10 border border-gray-500/20 rounded-xl backdrop-blur-sm">
               <p className="text-sm text-gray-400 font-medium">No contact info</p>
             </div>
           </div>
         )}

         {/* Spacer to push button to bottom */}
         <div className="flex-1"></div>

         {/* Action Button */}
         <button
           onClick={(e) => {
             e.stopPropagation();
             onStationClick(station);
           }}
           disabled={station.available_slots === 0}
           className={`w-full py-3 px-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
             station.available_slots === 0
               ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed border border-gray-600/50'
               : 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-600 hover:to-purple-700 hover:shadow-2xl hover:shadow-cyan-500/25'
           }`}
         >
           {station.available_slots === 0 ? 'Fully Booked' : 'Book Now'}
         </button>
       </div>
    </div>
  );
};

export default StationCard; 