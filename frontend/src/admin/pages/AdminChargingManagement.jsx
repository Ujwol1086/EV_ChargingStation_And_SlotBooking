import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';

const AdminChargingManagement = () => {
  const [completedBookings, setCompletedBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('completed');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [amountForm, setAmountForm] = useState({
    amount_npr: '',
    charging_duration_minutes: '',
    notes: ''
  });
  const [settingAmount, setSettingAmount] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all bookings
      const allBookingsResponse = await axios.get('/admin/bookings');
      
      // Fetch completed bookings that need amount setting
      const completedBookingsResponse = await axios.get('/admin/bookings/completed');

      if (allBookingsResponse.data.success) {
        setAllBookings(allBookingsResponse.data.bookings || []);
      }

      if (completedBookingsResponse.data.success) {
        setCompletedBookings(completedBookingsResponse.data.bookings || []);
      }

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleSetAmount = (booking) => {
    setSelectedBooking(booking);
    setAmountForm({
      amount_npr: '',
      charging_duration_minutes: '',
      notes: ''
    });
    setShowAmountModal(true);
  };

  const handleAmountSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedBooking || !amountForm.amount_npr) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setSettingAmount(true);
      setError('');

      const response = await axios.post(`/admin/bookings/${selectedBooking.booking_id}/set-amount`, {
        amount_npr: parseFloat(amountForm.amount_npr),
        charging_duration_minutes: amountForm.charging_duration_minutes ? parseInt(amountForm.charging_duration_minutes) : null,
        notes: amountForm.notes
      });

      if (response.data.success) {
        alert('💰 Charging amount set successfully! The user will now see a payment notification in their dashboard and can pay with Khalti.');
        setShowAmountModal(false);
        setSelectedBooking(null);
        // Refresh bookings
        fetchBookings();
      } else {
        alert(response.data.error || 'Failed to set amount');
      }

    } catch (err) {
      alert(err.response?.data?.error || 'Failed to set charging amount');
    } finally {
      setSettingAmount(false);
    }
  };

  const handleMarkCompleted = async (bookingId) => {
    try {
      const response = await axios.post(`/admin/bookings/${bookingId}/mark-completed`);
      
      if (response.data.success) {
        alert('✅ Booking marked as completed! Status updated to "completed". Now you can set the charging amount.');
        fetchBookings();
      } else {
        alert(response.data.error || 'Failed to mark as completed');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to mark booking as completed');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBookings = activeTab === 'completed' ? completedBookings : allBookings;
  const activeBookings = allBookings.filter(b => b.status === 'confirmed' && !b.charging_completed);
  // Use the completedBookings from API since it's already filtered for "needs amount setting"
  const completedNeedingAmount = completedBookings;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Charging Management</h1>
          <p className="text-gray-600">Manage charging sessions and set payment amounts</p>
        </div>
        <button
          onClick={fetchBookings}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-800">{activeBookings.length}</p>
              <p className="text-sm text-gray-600">Active Sessions</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-800">{completedBookings.length}</p>
              <p className="text-sm text-gray-600">Need Amount Setting</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-800">{allBookings.length}</p>
              <p className="text-sm text-gray-600">Total Bookings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('completed')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'completed'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Needs Amount Setting ({completedBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'active'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Active Sessions ({activeBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Bookings ({allBookings.length})
          </button>
        </nav>
      </div>

      {/* Completed Sessions Needing Amount Setting */}
      {completedBookings.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-white">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h3 className="text-lg font-bold">⚡ Charging Completed - Amount Setting Required</h3>
                                     <p className="text-orange-100 text-sm">
                     {completedBookings.length} session{completedBookings.length > 1 ? 's' : ''} completed and ready for amount setting
                   </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {completedBookings.map((booking) => (
                <div key={booking.booking_id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {booking.station_details?.name || booking.station_id}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Booking: {booking.booking_id} • User: {booking.user_id}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Charger:</span>
                          <span className="ml-1 font-medium">{booking.charger_type}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Completed:</span>
                          <span className="ml-1 font-medium">
                            {booking.charging_completed_at ? formatDate(booking.charging_completed_at) : 'Just now'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            Completed - Awaiting Amount
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <button
                        onClick={() => handleSetAmount(booking)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        Set Amount
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Priority Alert for Completed Sessions */}
      {completedBookings.length > 0 && activeTab !== 'completed' && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-4 text-white">
          <div className="flex items-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="flex-1">
              <p className="font-bold">Action Required!</p>
              <p className="text-orange-100">
                {completedBookings.length} charging session{completedBookings.length > 1 ? 's' : ''} need amount setting
              </p>
            </div>
            <button
              onClick={() => setActiveTab('completed')}
              className="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
            >
              Review Now
            </button>
          </div>
        </div>
      )}

      {/* Bookings Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Station Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(activeTab === 'active' ? activeBookings : 
                activeTab === 'completed' ? completedBookings : allBookings).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-medium text-gray-600">No bookings found</p>
                      <p className="text-sm text-gray-500">
                        {activeTab === 'completed' && 'No charging sessions need amount setting. When users complete charging, mark them as "completed" first, then set the amount.'}
                        {activeTab === 'active' && 'No active charging sessions. Users with confirmed bookings will appear here.'}
                        {activeTab === 'all' && 'No bookings available in the system.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                (activeTab === 'active' ? activeBookings : 
                 activeTab === 'completed' ? completedBookings : allBookings).map((booking) => (
                  <tr key={booking.booking_id || booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">#{booking.booking_id}</p>
                        <p className="text-gray-500">User: {booking.user_id}</p>
                        <p className="text-gray-500">Charger: {booking.charger_type}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">
                          {booking.station_details?.name || booking.station_id}
                        </p>
                        <p className="text-gray-500">
                          {booking.station_details?.location?.address || 'Address not available'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status === 'confirmed' ? 'Active' : booking.status === 'completed' ? 'Completed' : booking.status}
                      </span>
                      {booking.charging_completed && !booking.admin_amount_set && (
                        <div className="text-xs text-orange-600 mt-1 font-medium bg-orange-50 px-2 py-1 rounded">
                          ⏳ Needs Amount Setting
                        </div>
                      )}
                      {booking.admin_amount_set && (
                        <div className="text-xs text-blue-600 mt-1 font-medium bg-blue-50 px-2 py-1 rounded">
                          💰 Amount Set - User Notified
                        </div>
                      )}
                      {booking.status === 'confirmed' && !booking.charging_completed && (
                        <div className="text-xs text-green-600 mt-1 font-medium bg-green-50 px-2 py-1 rounded">
                          ⚡ In Progress
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>
                        <p>Created: {formatDate(booking.created_at)}</p>
                        {booking.booking_date && booking.booking_time && (
                          <p>Scheduled: {booking.booking_date} {booking.booking_time}</p>
                        )}
                        {booking.charging_completed_at && (
                          <p>Completed: {formatDate(booking.charging_completed_at)}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {booking.amount_npr ? (
                        <div className="text-sm">
                          <p className="font-semibold text-green-600">Rs. {booking.amount_npr}</p>
                          {booking.actual_charging_duration && (
                            <p className="text-xs text-gray-500">
                              Duration: {booking.actual_charging_duration}min
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm space-y-2">
                      {booking.status === 'confirmed' && !booking.charging_completed && (
                        <button
                          onClick={() => handleMarkCompleted(booking.booking_id)}
                          className="block w-full px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-xs font-medium"
                        >
                          ⚡ Mark Completed
                        </button>
                      )}
                      
                      {booking.status === 'completed' && booking.charging_completed && !booking.admin_amount_set && (
                        <button
                          onClick={() => handleSetAmount(booking)}
                          className="block w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
                        >
                          💰 Set Amount
                        </button>
                      )}
                      
                      {booking.admin_amount_set && (
                        <div className="text-xs text-blue-600 font-medium bg-blue-50 p-2 rounded">
                          ✅ Amount Set - User Notified
                        </div>
                      )}
                      
                      {booking.status === 'confirmed' && booking.charging_completed && (
                        <div className="text-xs text-green-600 font-medium bg-green-50 p-2 rounded">
                          ✅ Charging Completed
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Amount Setting Modal */}
      {showAmountModal && selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 border w-full max-w-md shadow-2xl rounded-xl bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Set Charging Amount
                </h3>
              </div>
              
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-blue-800">What happens after setting amount:</p>
                </div>
                <ul className="text-xs text-blue-700 space-y-1 ml-7">
                  <li>• User will see payment notification in their dashboard</li>
                  <li>• User can pay the exact amount via Khalti</li>
                  <li>• Amount is based on actual usage/charging time</li>
                </ul>
              </div>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Booking ID:</strong> {selectedBooking.booking_id}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Station:</strong> {selectedBooking.station_details?.name || selectedBooking.station_id}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Charger Type:</strong> {selectedBooking.charger_type}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>User ID:</strong> {selectedBooking.user_id}
                </p>
              </div>

              <form onSubmit={handleAmountSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (NPR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amountForm.amount_npr}
                    onChange={(e) => setAmountForm({ ...amountForm, amount_npr: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="Enter amount to charge"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Amount to be charged to the user for this charging session
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Charging Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={amountForm.charging_duration_minutes}
                    onChange={(e) => setAmountForm({ ...amountForm, charging_duration_minutes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Actual charging time"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How long did the charging session take?
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={amountForm.notes}
                    onChange={(e) => setAmountForm({ ...amountForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Additional notes about the charging session (energy consumed, any issues, etc.)"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowAmountModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={settingAmount}
                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
                  >
                    {settingAmount ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Setting Amount...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        Set Amount & Notify User
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminChargingManagement; 