const EnergyAnalysis = ({ energy_analysis }) => {
  if (!energy_analysis) return null;

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl backdrop-blur-sm">
      <h5 className="font-semibold text-cyan-400 mb-3">
        Energy Analysis
      </h5>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-300">
            <strong className="text-cyan-300">Energy Needed:</strong> {energy_analysis.total_consumption_kwh} kWh
          </p>
          <p className="text-gray-300">
            <strong className="text-cyan-300">Available Energy:</strong> {energy_analysis.usable_energy_kwh} kWh
          </p>
        </div>
        <div>
          <p className={`font-medium ${energy_analysis.is_reachable ? 'text-green-400' : 'text-red-400'}`}>
            {energy_analysis.is_reachable ? '✅ Reachable' : '❌ May not be reachable'}
          </p>
          <p className="text-gray-300">
            <strong className="text-cyan-300">Efficiency Score:</strong> {(energy_analysis.energy_efficiency_score * 100).toFixed(0)}%
          </p>
        </div>
      </div>
      
      {(energy_analysis.ac_penalty_kwh > 0 || energy_analysis.passenger_penalty_kwh > 0 || energy_analysis.terrain_penalty_kwh > 0) && (
        <div className="mt-4 pt-4 border-t border-cyan-500/30">
          <p className="text-xs text-cyan-400 font-medium mb-2">Impact Factors:</p>
          <div className="flex flex-wrap gap-2">
            {energy_analysis.ac_penalty_kwh > 0 && (
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full border border-cyan-500/30">
                AC: +{energy_analysis.ac_penalty_kwh} kWh
              </span>
            )}
            {energy_analysis.passenger_penalty_kwh > 0 && (
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full border border-cyan-500/30">
                Passengers: +{energy_analysis.passenger_penalty_kwh} kWh
              </span>
            )}
            {energy_analysis.terrain_penalty_kwh > 0 && (
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full border border-cyan-500/30">
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