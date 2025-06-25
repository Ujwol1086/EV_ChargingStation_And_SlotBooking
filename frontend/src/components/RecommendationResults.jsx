import { useState } from "react";
import axios from "../api/axios";

const RecommendationResults = ({ 
  recommendations, 
  onStationSelect, 
  onShowRoute, 
  userBookings = [], 
  loadingRoute = false,
  metadata = null,
  autoBookings = []
}) => {
  const [bookingLoading, setBookingLoading] = useState({});

  if (!recommendations?.length) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800">No Recommendations</h3>
        <p className="text-gray-600">No charging stations found matching your criteria.</p>
      </div>
    );
  }

  const findBookingForStation = (stationId) => {
    return userBookings.find(booking => booking.station_id === stationId);
  };

  const handleBookSlot = async (station) => {
    setBookingLoading(prev => ({ ...prev, [station.id]: true }));
    
    try {
      const response = await axios.post('/recommendations/book-slot', {
        station_id: station.id,
        charger_type: station.chargers[0]?.type || 'CCS', // Default to first available charger type
        urgency_level: 'medium'
      });

      if (response.data.success) {
        alert(`Booking successful! Booking ID: ${response.data.booking_id}`);
        // You might want to trigger a refresh of user bookings here
        window.location.reload(); // Simple refresh for now
      } else {
        alert(response.data.error || 'Booking failed');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating booking');
    } finally {
      setBookingLoading(prev => ({ ...prev, [station.id]: false }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">
          Smart Recommendations ({recommendations.length})
        </h3>
        {metadata && (
          <div className="text-sm text-gray-600">
            Algorithm: {metadata.algorithm_used} • 
            Processed in {metadata.processing_time}
          </div>
        )}
      </div>

      {autoBookings.length > 0 && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 rounded">
          <h4 className="font-medium text-green-800 mb-1">✅ Auto-Booked!</h4>
          <p className="text-sm text-green-700">
            High urgency detected. We've automatically booked the top station for you.
          </p>
          {autoBookings.map((booking, index) => (
            <div key={index} className="text-xs text-green-600 mt-1">
              Booking ID: {booking.booking_id} • Station: {booking.station_name}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {recommendations.map((rec, index) => {
          const station = rec.station;
          const hasBooking = findBookingForStation(station.id);
          const isLoadingBooking = bookingLoading[station.id];
          
          return (
            <div 
              key={station.id} 
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                index === 0 ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm
                    ${index === 0 ? 'bg-yellow-500' : 'bg-blue-600'}
                  `}>
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg">{station.name}</h4>
                    {index === 0 && (
                      <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                        🏆 Top Recommendation
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">
                    Score: {rec.score}
                  </div>
                  <div className="text-sm text-gray-600">
                    {rec.distance} km away
                  </div>
                </div>
              </div>

              {/* Station Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">📍</span>
                    <span className="text-sm text-gray-700">{station.location.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">🕒</span>
                    <span className="text-sm text-gray-700">{station.operatingHours}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">💰</span>
                    <span className="text-sm text-gray-700">{station.pricing}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">🔌</span>
                    <span className="text-sm text-gray-700">
                      {Math.round(rec.availability_score * 100)}% available
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">⚡</span>
                    <span className="text-sm text-gray-700">
                      {station.chargers?.map(c => c.type).join(', ') || 'Multiple types'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">🏪</span>
                    <span className="text-sm text-gray-700">
                      {station.amenities?.slice(0, 2).join(', ') || 'Basic amenities'}
                      {station.amenities?.length > 2 && ` +${station.amenities.length - 2} more`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Auto-booking status */}
              {rec.auto_booking?.auto_booked && (
                <div className="mb-3 p-2 bg-green-100 border border-green-300 rounded text-sm">
                  <strong className="text-green-800">✅ Auto-booked for you!</strong>
                  <br />
                  <span className="text-green-700">
                    Booking ID: {rec.auto_booking.booking_id}
                  </span>
                </div>
              )}

              {/* Existing booking status */}
              {hasBooking && (
                <div className="mb-3 p-2 bg-blue-100 border border-blue-300 rounded text-sm">
                  <strong className="text-blue-800">📋 You have a booking here</strong>
                  <br />
                  <span className="text-blue-700">
                    Status: {hasBooking.status} • Type: {hasBooking.charger_type}
                    {hasBooking.auto_booked && ' (Auto-booked)'}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => onStationSelect(station)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                >
                  View Details
                </button>
                
                <button
                  onClick={() => onShowRoute(station)}
                  disabled={loadingRoute}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loadingRoute ? 'Loading Route...' : 'Show Route'}
                </button>

                {!hasBooking && !rec.auto_booking?.auto_booked && (
                  <button
                    onClick={() => handleBookSlot(station)}
                    disabled={isLoadingBooking}
                    className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoadingBooking ? 'Booking...' : 'Book Slot'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Information */}
      {metadata && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600 space-y-1">
            <div>🧠 Using hybrid algorithm combining distance, availability, and load balancing</div>
            <div>📊 Stations ranked by composite score including traffic patterns</div>
            <div>⚡ Real-time availability and pricing data</div>
            {metadata.notes && (
              <div>💡 {metadata.notes}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationResults; 