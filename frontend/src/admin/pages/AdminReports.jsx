import { useState, useEffect } from 'react';
import axios from '../../api/axios';

const AdminReports = () => {
  const [reports, setReports] = useState({
    comprehensive: null,
    userClustering: null,
    userHierarchy: null,
    behaviorPatterns: null,
    statistics: null,
    insights: null
  });
  const [loading, setLoading] = useState(false);
  const [activeReport, setActiveReport] = useState('comprehensive');
  const [reportParams, setReportParams] = useState({
    k_clusters: 3,
    min_support: 0.1,
    min_confidence: 0.5
  });

  const reportTypes = [
    { id: 'comprehensive', name: 'Comprehensive Report', description: 'Complete analysis using all algorithms' },
    { id: 'userClustering', name: 'User Clustering', description: 'K-Means clustering of user behavior' },
    { id: 'userHierarchy', name: 'User Hierarchy', description: 'Hierarchical clustering relationships' },
    { id: 'behaviorPatterns', name: 'Behavior Patterns', description: 'Apriori algorithm patterns' },
    { id: 'statistics', name: 'Basic Statistics', description: 'Statistical analysis and trends' },
    { id: 'insights', name: 'Insights & Recommendations', description: 'Actionable business insights' }
  ];

  const generateReport = async (reportType) => {
    try {
      setLoading(true);
      let endpoint = '';
      let params = {};

      switch (reportType) {
        case 'comprehensive':
          endpoint = '/reports/comprehensive';
          break;
        case 'userClustering':
          endpoint = '/reports/user-clustering';
          params = { k: reportParams.k_clusters };
          break;
        case 'userHierarchy':
          endpoint = '/reports/user-hierarchy';
          break;
        case 'behaviorPatterns':
          endpoint = '/reports/behavior-patterns';
          params = { 
            min_support: reportParams.min_support, 
            min_confidence: reportParams.min_confidence 
          };
          break;
        case 'statistics':
          endpoint = '/reports/statistics';
          break;
        case 'insights':
          endpoint = '/reports/insights';
          break;
        default:
          return;
      }

      const response = await axios.get(endpoint, { params });
      
      if (response.data.success) {
        const reportData = response.data.report || 
                          response.data.clustering_report || 
                          response.data.hierarchy_report || 
                          response.data.behavior_patterns_report || 
                          response.data.statistics_report || 
                          response.data.insights_report;
        
        setReports(prev => ({
          ...prev,
          [reportType]: reportData
        }));
        
        setActiveReport(reportType);
      }
    } catch (error) {
      console.error(`Error generating ${reportType} report:`, error);
      alert(`Failed to generate ${reportType} report`);
    } finally {
      setLoading(false);
    }
  };

  const renderComprehensiveReport = (report) => {
    if (!report) return <div>No comprehensive report available</div>;
    
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Report Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{report.summary?.total_users || 0}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{report.summary?.total_bookings || 0}</div>
              <div className="text-sm text-gray-600">Total Bookings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{report.summary?.total_stations || 0}</div>
              <div className="text-sm text-gray-600">Total Stations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{report.algorithms_used?.length || 0}</div>
              <div className="text-sm text-gray-600">Algorithms Used</div>
            </div>
          </div>
        </div>

        {report.basic_statistics && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Basic Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Overview</h4>
                <div className="space-y-2 text-sm">
                  <div>Total Bookings: {report.basic_statistics.overview?.total_bookings || 0}</div>
                  <div>Total Users: {report.basic_statistics.overview?.total_users || 0}</div>
                  <div>Total Stations: {report.basic_statistics.overview?.total_stations || 0}</div>
                  <div>Avg Booking Amount: NPR {report.basic_statistics.overview?.avg_booking_amount || 0}</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Growth Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div>Recent Bookings (30d): {report.basic_statistics.growth_metrics?.recent_bookings_30d || 0}</div>
                  <div>Avg Bookings per User: {report.basic_statistics.growth_metrics?.avg_bookings_per_user || 0}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {report.user_clustering && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">User Clustering Analysis</h3>
            <div className="space-y-4">
              {report.user_clustering.clusters?.map((cluster, index) => (
                <div key={index} className="border p-4 rounded">
                  <h4 className="font-medium mb-2">Cluster {cluster.cluster_id + 1} - {cluster.segment_type}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                    <div>Size: {cluster.size}</div>
                    <div>Avg Bookings: {cluster.characteristics?.avg_total_bookings}</div>
                    <div>Avg Amount: NPR {cluster.characteristics?.avg_amount}</div>
                    <div>Avg Frequency: {cluster.characteristics?.avg_frequency}</div>
                    <div>Avg Duration: {cluster.characteristics?.avg_duration} min</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {report.behavior_patterns && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Behavior Pattern Analysis</h3>
            <div className="space-y-4">
              {report.behavior_patterns.pattern_analysis?.map((pattern, index) => (
                <div key={index} className="border p-4 rounded">
                  <p className="font-medium mb-2">{pattern.description}</p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>Confidence: {(pattern.confidence * 100).toFixed(1)}%</div>
                    <div>Support: {(pattern.support * 100).toFixed(1)}%</div>
                    <div>Lift: {pattern.lift.toFixed(2)}</div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{pattern.business_implication}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {report.insights && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Business Insights & Recommendations</h3>
            <div className="space-y-3">
              {report.insights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderUserClusteringReport = (report) => {
    if (!report) return <div>No user clustering report available</div>;
    
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">User Clustering Analysis</h3>
          <div className="mb-4">
            <p className="text-gray-600">Algorithm: {report.algorithm}</p>
            <p className="text-gray-600">Number of Clusters: {report.num_clusters}</p>
            <p className="text-gray-600">Total Users Analyzed: {report.total_users_analyzed}</p>
          </div>
          
          <div className="space-y-4">
            {report.clusters?.map((cluster, index) => (
              <div key={index} className="border p-4 rounded bg-gray-50">
                <h4 className="font-medium mb-2">Cluster {cluster.cluster_id + 1} - {cluster.segment_type}</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Size:</span> {cluster.size}
                  </div>
                  <div>
                    <span className="font-medium">Avg Bookings:</span> {cluster.characteristics?.avg_total_bookings}
                  </div>
                  <div>
                    <span className="font-medium">Avg Amount:</span> NPR {cluster.characteristics?.avg_amount}
                  </div>
                  <div>
                    <span className="font-medium">Avg Frequency:</span> {cluster.characteristics?.avg_frequency}
                  </div>
                  <div>
                    <span className="font-medium">Avg Duration:</span> {cluster.characteristics?.avg_duration} min
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderBehaviorPatternsReport = (report) => {
    if (!report) return <div>No behavior patterns report available</div>;
    
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Behavior Pattern Analysis</h3>
          <div className="mb-4">
            <p className="text-gray-600">Algorithm: {report.algorithm}</p>
            <p className="text-gray-600">Min Support: {report.min_support}</p>
            <p className="text-gray-600">Min Confidence: {report.min_confidence}</p>
            <p className="text-gray-600">Total Transactions: {report.total_transactions}</p>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium">Discovered Patterns</h4>
            {report.pattern_analysis?.map((pattern, index) => (
              <div key={index} className="border p-4 rounded bg-gray-50">
                <p className="font-medium mb-2">{pattern.description}</p>
                <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                  <div>
                    <span className="font-medium">Confidence:</span> {(pattern.confidence * 100).toFixed(1)}%
                  </div>
                  <div>
                    <span className="font-medium">Support:</span> {(pattern.support * 100).toFixed(1)}%
                  </div>
                  <div>
                    <span className="font-medium">Lift:</span> {pattern.lift.toFixed(2)}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{pattern.business_implication}</p>
              </div>
            ))}
          </div>
          
          {report.cross_selling_opportunities && report.cross_selling_opportunities.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">Cross-Selling Opportunities</h4>
              <div className="space-y-3">
                {report.cross_selling_opportunities.map((opportunity, index) => (
                  <div key={index} className="border p-3 rounded bg-green-50">
                    <p className="font-medium mb-1">{opportunity.recommendation}</p>
                    <p className="text-sm text-gray-600">Expected Success Rate: {opportunity.expected_success_rate}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReport = () => {
    switch (activeReport) {
      case 'comprehensive':
        return renderComprehensiveReport(reports.comprehensive);
      case 'userClustering':
        return renderUserClusteringReport(reports.userClustering);
      case 'behaviorPatterns':
        return renderBehaviorPatternsReport(reports.behaviorPatterns);
      case 'userHierarchy':
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">User Hierarchy Report</h3>
            <p>User hierarchy analysis will be displayed here.</p>
          </div>
        );
      case 'statistics':
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Statistics Report</h3>
            <p>Basic statistics will be displayed here.</p>
          </div>
        );
      case 'insights':
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Insights Report</h3>
            <p>Business insights will be displayed here.</p>
          </div>
        );
      default:
        return <div>Select a report type to view</div>;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics & Reports</h1>
        <p className="text-gray-600 mt-2">
          Generate comprehensive reports using machine learning algorithms and statistical analysis
        </p>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {reportTypes.map((type) => (
          <div
            key={type.id}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              activeReport === type.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setActiveReport(type.id)}
          >
            <h3 className="font-semibold text-gray-900">{type.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{type.description}</p>
          </div>
        ))}
      </div>

      {/* Report Parameters */}
      {activeReport === 'userClustering' && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h3 className="font-medium mb-3">Clustering Parameters</h3>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <span className="text-sm">Number of Clusters (K):</span>
              <input
                type="number"
                min="2"
                max="10"
                value={reportParams.k_clusters}
                onChange={(e) => setReportParams(prev => ({ ...prev, k_clusters: parseInt(e.target.value) }))}
                className="border rounded px-2 py-1 w-20"
              />
            </label>
          </div>
        </div>
      )}

      {activeReport === 'behaviorPatterns' && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h3 className="font-medium mb-3">Pattern Mining Parameters</h3>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <span className="text-sm">Min Support:</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="1.0"
                value={reportParams.min_support}
                onChange={(e) => setReportParams(prev => ({ ...prev, min_support: parseFloat(e.target.value) }))}
                className="border rounded px-2 py-1 w-20"
              />
            </label>
            <label className="flex items-center space-x-2">
              <span className="text-sm">Min Confidence:</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="1.0"
                value={reportParams.min_confidence}
                onChange={(e) => setReportParams(prev => ({ ...prev, min_confidence: parseFloat(e.target.value) }))}
                className="border rounded px-2 py-1 w-20"
              />
            </label>
          </div>
        </div>
      )}

      {/* Generate Report Button */}
      <div className="mb-6">
        <button
          onClick={() => generateReport(activeReport)}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : `Generate ${reportTypes.find(t => t.id === activeReport)?.name}`}
        </button>
      </div>

      {/* Report Display */}
      <div className="min-h-96">
        {renderReport()}
      </div>
    </div>
  );
};

export default AdminReports;
