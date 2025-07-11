import { useState, useEffect } from 'react';
import axios from '../../api/axios';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    revenue: {
      total: 0,
      monthly: [],
      daily: []
    },
    bookings: {
      total: 0,
      byStatus: {},
      byStation: [],
      trends: []
    },
    stations: {
      total: 0,
      byStatus: {},
      performance: []
    },
    users: {
      total: 0,
      active: 0,
      newThisMonth: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/admin/analytics?range=${timeRange}`);
      if (response.data.success) {
        setAnalytics(response.data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Mock data for development
      setAnalytics({
        revenue: {
          total: 125000,
          monthly: [
            { month: 'Jan', amount: 25000 },
            { month: 'Feb', amount: 30000 },
            { month: 'Mar', amount: 35000 },
            { month: 'Apr', amount: 40000 },
            { month: 'May', amount: 45000 },
            { month: 'Jun', amount: 50000 }
          ],
          daily: [
            { date: '2024-01-01', amount: 1200 },
            { date: '2024-01-02', amount: 1500 },
            { date: '2024-01-03', amount: 1800 },
            { date: '2024-01-04', amount: 1400 },
            { date: '2024-01-05', amount: 2000 }
          ]
        },
        bookings: {
          total: 320,
          byStatus: {
            confirmed: 45,
            in_progress: 12,
            completed: 250,
            cancelled: 13
          },
          byStation: [
            { name: 'Kathmandu Central', count: 85 },
            { name: 'Pokhara Lakeside', count: 65 },
            { name: 'Thankot Highway', count: 45 },
            { name: 'Baneshwor Station', count: 35 },
            { name: 'Lalitpur Station', count: 30 }
          ],
          trends: [
            { date: '2024-01-01', count: 8 },
            { date: '2024-01-02', count: 12 },
            { date: '2024-01-03', count: 15 },
            { date: '2024-01-04', count: 10 },
            { date: '2024-01-05', count: 18 }
          ]
        },
        stations: {
          total: 25,
          byStatus: {
            active: 20,
            inactive: 3,
            maintenance: 2
          },
          performance: [
            { name: 'Kathmandu Central', utilization: 85, rating: 4.5 },
            { name: 'Pokhara Lakeside', utilization: 78, rating: 4.2 },
            { name: 'Thankot Highway', utilization: 92, rating: 4.8 },
            { name: 'Baneshwor Station', utilization: 65, rating: 3.9 },
            { name: 'Lalitpur Station', utilization: 70, rating: 4.1 }
          ]
        },
        users: {
          total: 150,
          active: 120,
          newThisMonth: 25
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'NPR'
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into your EV charging network</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(analytics.revenue.total)}</p>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-800">{formatNumber(analytics.bookings.total)}</p>
              <p className="text-sm text-gray-600">Total Bookings</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-800">{formatNumber(analytics.stations.total)}</p>
              <p className="text-sm text-gray-600">Total Stations</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-800">{formatNumber(analytics.users.total)}</p>
              <p className="text-sm text-gray-600">Total Users</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Trend</h3>
          <div className="space-y-4">
            {analytics.revenue.monthly.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.month}</span>
                <div className="flex items-center space-x-4">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(item.amount / Math.max(...analytics.revenue.monthly.map(m => m.amount))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-800">{formatCurrency(item.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Status Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Booking Status</h3>
          <div className="space-y-4">
            {Object.entries(analytics.bookings.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    status === 'confirmed' ? 'bg-green-500' :
                    status === 'in_progress' ? 'bg-blue-500' :
                    status === 'completed' ? 'bg-gray-500' :
                    'bg-red-500'
                  }`}></div>
                  <span className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        status === 'confirmed' ? 'bg-green-500' :
                        status === 'in_progress' ? 'bg-blue-500' :
                        status === 'completed' ? 'bg-gray-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${(count / analytics.bookings.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-800">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Station Performance */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Station Performance</h3>
          <div className="space-y-4">
            {analytics.stations.performance.slice(0, 5).map((station, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">{station.name}</div>
                  <div className="text-xs text-gray-500">Utilization: {station.utilization}%</div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-800 ml-1">{station.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Stations by Bookings */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Stations</h3>
          <div className="space-y-4">
            {analytics.bookings.byStation.slice(0, 5).map((station, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-800">{station.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-800">{station.count} bookings</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">User Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Users</span>
              <span className="font-medium">{formatNumber(analytics.users.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Users</span>
              <span className="font-medium">{formatNumber(analytics.users.active)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">New This Month</span>
              <span className="font-medium">{formatNumber(analytics.users.newThisMonth)}</span>
            </div>
            <div className="pt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(analytics.users.active / analytics.users.total) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Active user rate</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Station Status</h3>
          <div className="space-y-4">
            {Object.entries(analytics.stations.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    status === 'active' ? 'bg-green-500' :
                    status === 'inactive' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`}></div>
                  <span className="text-sm text-gray-600 capitalize">{status}</span>
                </div>
                <span className="text-sm font-medium text-gray-800">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(analytics.revenue.total / analytics.bookings.total)}
              </p>
              <p className="text-sm text-gray-600">Average Revenue per Booking</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {Math.round((analytics.users.active / analytics.users.total) * 100)}%
              </p>
              <p className="text-sm text-gray-600">User Engagement Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {Math.round((analytics.stations.byStatus.active / analytics.stations.total) * 100)}%
              </p>
              <p className="text-sm text-gray-600">Station Availability</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics; 