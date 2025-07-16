const ETAAnalysis = ({ eta_analysis }) => {
  if (!eta_analysis) return null;

  return (
    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
      <h5 className="font-semibold text-green-800 mb-2">⏱️ ETA Analysis</h5>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-green-700">
            <strong>Travel Time:</strong> {eta_analysis.eta_string}
          </p>
          <p className="text-green-700">
            <strong>Arrival Time:</strong> {eta_analysis.arrival_time}
          </p>
        </div>
        <div>
          <p className="text-green-700">
            <strong>Effective Speed:</strong> {eta_analysis.effective_speed_kmh} km/h
          </p>
          <p className="text-green-700">
            <strong>Distance:</strong> {eta_analysis.distance_km} km
          </p>
        </div>
      </div>
      
      {eta_analysis.factors_applied && (
        <div className="mt-2 pt-2 border-t border-green-300">
          <p className="text-xs text-green-600 font-medium">Applied Factors:</p>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
              {eta_analysis.factors_applied.driving_mode}
            </span>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
              {eta_analysis.factors_applied.traffic_condition} traffic
            </span>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
              {eta_analysis.factors_applied.weather}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ETAAnalysis; 