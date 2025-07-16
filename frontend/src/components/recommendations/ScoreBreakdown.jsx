const ScoreBreakdown = ({ score_breakdown, isExpanded }) => {
  if (!score_breakdown || !isExpanded) return null;

  return (
    <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
      <h5 className="font-semibold text-gray-800 mb-2">📊 Score Breakdown</h5>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {Object.entries(score_breakdown).map(([factor, score]) => (
          <div key={factor} className="flex justify-between">
            <span className="text-gray-600 capitalize">
              {factor.replace('_', ' ')}:
            </span>
            <span className="font-medium text-gray-800">
              {(score * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScoreBreakdown; 