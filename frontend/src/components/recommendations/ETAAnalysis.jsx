const ETAAnalysis = ({ eta_analysis }) => {
  if (!eta_analysis) return null;

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl backdrop-blur-sm">
      <h5 className="font-semibold text-green-400 mb-3">
        ETA Analysis
      </h5>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-300">
            <strong className="text-green-300">Travel Time:</strong> {eta_analysis.eta_string}
          </p>
          <p className="text-gray-300">
            <strong className="text-green-300">Arrival Time:</strong> {eta_analysis.arrival_time}
          </p>
        </div>
        <div>
          <p className="text-gray-300">
            <strong className="text-green-300">Effective Speed:</strong> {eta_analysis.effective_speed_kmh} km/h
          </p>
          <p className="text-gray-300">
            <strong className="text-green-300">Distance:</strong> {eta_analysis.distance_km} km
          </p>
        </div>
      </div>
      
      {eta_analysis.factors_applied && (
        <div className="mt-4 pt-4 border-t border-green-500/30">
          <p className="text-xs text-green-400 font-medium mb-2">Applied Factors:</p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
              {eta_analysis.factors_applied.driving_mode}
            </span>
            <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
              {eta_analysis.factors_applied.traffic_condition} traffic
            </span>
            <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
              {eta_analysis.factors_applied.weather}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ETAAnalysis; 