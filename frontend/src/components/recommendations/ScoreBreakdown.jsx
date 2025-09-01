const ScoreBreakdown = ({ score_breakdown, isExpanded }) => {
  if (!score_breakdown || !isExpanded) return null;

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-gray-500/10 to-gray-600/10 border border-gray-500/20 rounded-2xl backdrop-blur-sm">
      <h5 className="font-semibold text-gray-300 mb-3">
        Score Breakdown
      </h5>
      <div className="grid grid-cols-2 gap-3 text-sm">
        {Object.entries(score_breakdown).map(([factor, score]) => (
          <div key={factor} className="flex justify-between">
            <span className="text-gray-400 capitalize">
              {factor.replace('_', ' ')}:
            </span>
            <span className="font-medium text-gray-200">
              {(score * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScoreBreakdown; 