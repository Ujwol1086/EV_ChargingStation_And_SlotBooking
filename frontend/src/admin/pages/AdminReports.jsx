import React, { useState } from 'react';
import axios from '../../api/axios';

const AdminReports = () => {
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const [charts, setCharts] = useState({});
  const [showCharts, setShowCharts] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Algorithm parameters
  const [kMeansK, setKMeansK] = useState(3);
  const [minSupport, setMinSupport] = useState(0.1);
  const [minConfidence, setMinConfidence] = useState(0.5);

  const reportTypes = [
    {
      id: 'comprehensive',
      name: 'Comprehensive Report',
      description: 'Complete analysis using all algorithms (K-Means, Hierarchical, Apriori, Statistics)',
      endpoint: '/reports/comprehensive'
    },
    {
      id: 'user-clustering',
      name: 'User Clustering Analysis',
      description: 'K-Means clustering to segment users by behavior patterns',
      endpoint: '/reports/user-clustering',
      params: { k: kMeansK }
    },
    {
      id: 'user-hierarchy',
      name: 'User Hierarchy Analysis',
      description: 'Hierarchical clustering to show relationships between user groups',
      endpoint: '/reports/user-hierarchy'
    },
    {
      id: 'behavior-patterns',
      name: 'Behavior Pattern Analysis',
      description: 'Apriori algorithm to discover hidden behavior patterns',
      endpoint: '/reports/behavior-patterns',
      params: { min_support: minSupport, min_confidence: minConfidence }
    },
    {
      id: 'statistics',
      name: 'Basic Statistics',
      description: 'Fundamental statistics and growth metrics',
      endpoint: '/reports/statistics'
    },
    {
      id: 'insights',
      name: 'Business Insights',
      description: 'Key insights and strategic recommendations',
      endpoint: '/reports/insights'
    }
  ];

  const chartTypes = [
    {
      id: 'usage-patterns',
      name: 'Usage Patterns Chart',
      description: 'Station utilization, monthly trends, user activity distribution',
      endpoint: '/reports/charts/usage-patterns'
    },
    {
      id: 'user-clustering',
      name: 'User Clustering Chart',
      description: 'Cluster distribution and characteristics visualization',
      endpoint: '/reports/charts/user-clustering'
    },
    {
      id: 'behavior-patterns',
      name: 'Behavior Patterns Chart',
      description: 'Pattern confidence, support, and lift analysis',
      endpoint: '/reports/charts/behavior-patterns',
      params: { min_support: minSupport, min_confidence: minConfidence }
    },
    {
      id: 'dashboard',
      name: 'Comprehensive Dashboard',
      description: 'All charts combined in one view',
      endpoint: '/reports/charts/dashboard'
    }
  ];

  const pdfTypes = [
    {
      id: 'comprehensive',
      name: 'Comprehensive PDF Report',
      description: 'Full detailed report with all analysis and charts',
      endpoint: '/reports/pdf/comprehensive'
    },
    {
      id: 'executive-summary',
      name: 'Executive Summary PDF',
      description: 'Concise summary for stakeholders',
      endpoint: '/reports/pdf/executive-summary'
    }
  ];

  const generateReport = async (reportType) => {
    setLoading(true);
    setActiveReport(reportType);
    
    try {
      const reportConfig = reportTypes.find(rt => rt.id === reportType);
      if (!reportConfig) {
        throw new Error('Invalid report type');
      }

      let url = reportConfig.endpoint;
      if (reportConfig.params) {
        const params = new URLSearchParams(reportConfig.params);
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url);
      
      if (response.data.success) {
        setReports(prev => ({
          ...prev,
          [reportType]: response.data.report || response.data.clusters || response.data.patterns || response.data.statistics || response.data.insights
        }));
      } else {
        console.error('Report generation failed:', response.data.error);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateChart = async (chartType) => {
    setLoading(true);
    
    try {
      const chartConfig = chartTypes.find(ct => ct.id === chartType);
      if (!chartConfig) {
        throw new Error('Invalid chart type');
      }

      let url = chartConfig.endpoint;
      if (chartConfig.params) {
        const params = new URLSearchParams(chartConfig.params);
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url);
      
      if (response.data.success) {
        setCharts(prev => ({
          ...prev,
          [chartType]: response.data.chart || response.data.dashboard
        }));
        setShowCharts(true);
      } else {
        console.error('Chart generation failed:', response.data.error);
      }
    } catch (error) {
      console.error('Error generating chart:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async (pdfType) => {
    setPdfLoading(true);
    
    try {
      const pdfConfig = pdfTypes.find(pt => pt.id === pdfType);
      if (!pdfConfig) {
        throw new Error('Invalid PDF type');
      }

      let url = pdfConfig.endpoint;
      if (pdfConfig.params) {
        const params = new URLSearchParams(pdfConfig.params);
        url += `?${params.toString()}`;
      }

      // For PDF download, we need to handle the response as a blob
      const response = await axios.get(url, {
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url_blob = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url_blob;
      link.download = `${pdfType}_report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url_blob);

    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setPdfLoading(false);
    }
  };

  const renderComprehensiveReport = (report) => {
    if (!report) return null;
    
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Summary</h3>
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
              <div className="text-2xl font-bold text-orange-600">{report.summary?.analysis_period || 'N/A'}</div>
              <div className="text-sm text-gray-600">Analysis Period</div>
            </div>
          </div>
        </div>

        {report.insights && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Key Insights</h3>
            <ul className="space-y-2">
              {report.insights.map((insight, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.user_clustering && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">User Clustering Analysis</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">Cluster</th>
                    <th className="px-4 py-2 text-left">Size</th>
                    <th className="px-4 py-2 text-left">Segment Type</th>
                    <th className="px-4 py-2 text-left">Avg Bookings</th>
                    <th className="px-4 py-2 text-left">Avg Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {report.user_clustering.clusters?.map((cluster, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2">Cluster {cluster.cluster_id + 1}</td>
                      <td className="px-4 py-2">{cluster.size}</td>
                      <td className="px-4 py-2">{cluster.segment_type}</td>
                      <td className="px-4 py-2">{cluster.characteristics.avg_total_bookings?.toFixed(1)}</td>
                      <td className="px-4 py-2">₹{cluster.characteristics.avg_amount?.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {report.behavior_patterns && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Behavior Pattern Analysis</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">Pattern</th>
                    <th className="px-4 py-2 text-left">Confidence</th>
                    <th className="px-4 py-2 text-left">Support</th>
                    <th className="px-4 py-2 text-left">Business Implication</th>
                  </tr>
                </thead>
                <tbody>
                  {report.behavior_patterns.pattern_analysis?.slice(0, 5).map((pattern, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2">{pattern.description}</td>
                      <td className="px-4 py-2">{(pattern.confidence * 100).toFixed(1)}%</td>
                      <td className="px-4 py-2">{(pattern.support * 100).toFixed(1)}%</td>
                      <td className="px-4 py-2">{pattern.business_implication}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderUserClusteringReport = (clusters) => {
    if (!clusters || !clusters.clusters) return null;
    
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">User Clustering Results</h3>
        <div className="mb-4">
          <p className="text-gray-600">
            Analysis using K-Means clustering with {clusters.num_clusters} clusters. 
            Total users analyzed: {clusters.total_users_analyzed}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Cluster</th>
                <th className="px-4 py-2 text-left">Size</th>
                <th className="px-4 py-2 text-left">Segment Type</th>
                <th className="px-4 py-2 text-left">Avg Bookings</th>
                <th className="px-4 py-2 text-left">Avg Amount</th>
              </tr>
            </thead>
            <tbody>
              {clusters.clusters.map((cluster, index) => (
                <tr key={index} className="border-b">
                  <td className="px-4 py-2">Cluster {cluster.cluster_id + 1}</td>
                  <td className="px-4 py-2">{cluster.size}</td>
                  <td className="px-4 py-2">{cluster.segment_type}</td>
                  <td className="px-4 py-2">{cluster.characteristics.avg_total_bookings?.toFixed(1)}</td>
                  <td className="px-4 py-2">₹{cluster.characteristics.avg_amount?.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderBehaviorPatternsReport = (patterns) => {
    if (!patterns || !patterns.pattern_analysis) return null;
    
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Behavior Pattern Analysis</h3>
        <div className="mb-4">
          <p className="text-gray-600">
            Analysis using Apriori algorithm with {patterns.total_transactions} transactions. 
            Patterns discovered: {patterns.pattern_analysis.length}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Pattern</th>
                <th className="px-4 py-2 text-left">Confidence</th>
                <th className="px-4 py-2 text-left">Support</th>
                <th className="px-4 py-2 text-left">Business Implication</th>
              </tr>
            </thead>
            <tbody>
              {patterns.pattern_analysis.slice(0, 10).map((pattern, index) => (
                <tr key={index} className="border-b">
                  <td className="px-4 py-2">{pattern.description}</td>
                  <td className="px-4 py-2">{(pattern.confidence * 100).toFixed(1)}%</td>
                  <td className="px-4 py-2">{(pattern.support * 100).toFixed(1)}%</td>
                  <td className="px-4 py-2">{pattern.business_implication}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderReport = () => {
    if (!activeReport) return null;

    const report = reports[activeReport];
    if (!report) return null;

    switch (activeReport) {
      case 'comprehensive':
        return renderComprehensiveReport(report);
      case 'user-clustering':
        return renderUserClusteringReport(report);
      case 'behavior-patterns':
        return renderBehaviorPatternsReport(report);
      case 'statistics':
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Statistics Report</h3>
            <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(report, null, 2)}</pre>
          </div>
        );
      case 'insights':
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Business Insights</h3>
            <ul className="space-y-2">
              {report.map((insight, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      default:
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(report, null, 2)}</pre>
          </div>
        );
    }
  };

  const renderCharts = () => {
    if (!showCharts || Object.keys(charts).length === 0) return null;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Data Visualizations</h2>
          <button
            onClick={() => setShowCharts(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Hide Charts
          </button>
        </div>
        
        {Object.entries(charts).map(([chartType, chartData]) => {
          if (!chartData) return null;
          
          return (
            <div key={chartType} className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4 capitalize">
                {chartType.replace('-', ' ')} Analysis
              </h3>
              <div className="flex justify-center">
                <img
                  src={`data:image/png;base64,${chartData}`}
                  alt={`${chartType} chart`}
                  className="max-w-full h-auto"
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Analytics & Reports</h1>
        <p className="text-gray-600">
          Generate comprehensive reports using advanced algorithms including K-Means clustering, 
          hierarchical clustering, Apriori pattern mining, and statistical analysis.
        </p>
      </div>

      {/* Algorithm Parameters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Algorithm Parameters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              K-Means Clusters (k)
            </label>
            <input
              type="number"
              min="2"
              max="10"
              value={kMeansK}
              onChange={(e) => setKMeansK(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Support
            </label>
            <input
              type="number"
              min="0.01"
              max="1"
              step="0.01"
              value={minSupport}
              onChange={(e) => setMinSupport(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Confidence
            </label>
            <input
              type="number"
              min="0.01"
              max="1"
              step="0.01"
              value={minConfidence}
              onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Report Generation */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Generate Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((reportType) => (
            <div key={reportType.id} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">{reportType.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{reportType.description}</p>
              <button
                onClick={() => generateReport(reportType.id)}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading && activeReport === reportType.id ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Generation */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Generate Charts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {chartTypes.map((chartType) => (
            <div key={chartType.id} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">{chartType.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{chartType.description}</p>
              <button
                onClick={() => generateChart(chartType.id)}
                disabled={loading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate Chart'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* PDF Generation */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Generate PDF Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pdfTypes.map((pdfType) => (
            <div key={pdfType.id} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">{pdfType.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{pdfType.description}</p>
              <button
                onClick={() => generatePDF(pdfType.id)}
                disabled={pdfLoading}
                className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {pdfLoading ? 'Generating...' : 'Download PDF'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Display */}
      {renderCharts()}

      {/* Report Display */}
      {renderReport()}
    </div>
  );
};

export default AdminReports;
