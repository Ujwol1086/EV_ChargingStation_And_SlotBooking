const EnergyAnalysis = ({ energy_analysis }) => {
  if (!energy_analysis) return null;

  return (
    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <h5 className="font-semibold text-blue-800 mb-2">⚡ Energy Analysis</h5>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-blue-700">
            <strong>Energy Needed:</strong> {energy_analysis.total_consumption_kwh} kWh
          </p>
          <p className="text-blue-700">
            <strong>Available Energy:</strong> {energy_analysis.usable_energy_kwh} kWh
          </p>
        </div>
        <div>
          <p className={`font-medium ${energy_analysis.is_reachable ? 'text-green-600' : 'text-red-600'}`}>
            {energy_analysis.is_reachable ? '✅ Reachable' : '❌ May not be reachable'}
          </p>
          <p className="text-blue-700">
            <strong>Efficiency Score:</strong> {(energy_analysis.energy_efficiency_score * 100).toFixed(0)}%
          </p>
        </div>
      </div>
      
      {(energy_analysis.ac_penalty_kwh > 0 || energy_analysis.passenger_penalty_kwh > 0 || energy_analysis.terrain_penalty_kwh > 0) && (
        <div className="mt-2 pt-2 border-t border-blue-300">
          <p className="text-xs text-blue-600 font-medium">Impact Factors:</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {energy_analysis.ac_penalty_kwh > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                AC: +{energy_analysis.ac_penalty_kwh} kWh
              </span>
            )}
            {energy_analysis.passenger_penalty_kwh > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                Passengers: +{energy_analysis.passenger_penalty_kwh} kWh
              </span>
            )}
            {energy_analysis.terrain_penalty_kwh > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                Terrain: +{energy_analysis.terrain_penalty_kwh} kWh
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnergyAnalysis; 