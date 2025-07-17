import { useState, useEffect } from 'react';
import axios from '../../api/axios';
import Notification from '../../components/Notification';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [notification, setNotification] = useState(null);
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
      setNotification(null);

      // Fetch all bookings
      const allBookingsResponse = await axios.get('/admin/bookings');
      
      // Fetch completed bookings that need amount setting
      const completedBookingsResponse = await axios.get('/admin/bookings/completed');

      if (allBookingsResponse.data.success) {
        setBookings(allBookingsResponse.data.bookings || []);
      }

      if (completedBookingsResponse.data.success) {
        setCompletedBookings(completedBookingsResponse.data.bookings || []);
      }

    } catch (err) {
      console.error('Error fetching bookings:', err);
      setNotification({
        message: 'Failed to fetch bookings. Please try again later.',
        type: 'error'
      });
      setBookings([]);
      setCompletedBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      const response = await axios.put(`/admin/bookings/${bookingId}/status`, { status: newStatus });
      if (response.data.success) {
        // Update the local state immediately for better UX
        setBookings(prevBookings => 
          prevBookings.map(booking => 
            booking._id === bookingId 
              ? { ...booking, status: newStatus }
              : booking
          )
        );
        setNotification({
          message: 'Booking status updated successfully!',
          type: 'success'
        });
      } else {
        console.error('Failed to update booking status:', response.data.error);
        setNotification({
          message: 'Failed to update booking status. Please try again.',
          type: 'error'
        });
        // Refresh to get the latest data
        fetchBookings();
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      setNotification({
        message: 'Failed to update booking status. Please try again.',
        type: 'error'
      });
      // Refresh to get the latest data
      fetchBookings();
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      try {
        const response = await axios.delete(`/admin/bookings/${bookingId}`);
        if (response.data.success) {
          // Update the local state immediately for better UX
          setBookings(prevBookings => 
            prevBookings.filter(booking => booking._id !== bookingId)
          );
          setNotification({
            message: 'Booking deleted successfully!',
            type: 'success'
          });
        } else {
          console.error('Failed to delete booking:', response.data.error);
          setNotification({
            message: 'Failed to delete booking. Please try again.',
            type: 'error'
          });
          // Refresh to get the latest data
          fetchBookings();
        }
      } catch (error) {
        console.error('Error deleting booking:', error);
        setNotification({
          message: 'Failed to delete booking. Please try again.',
          type: 'error'
        });
        // Refresh to get the latest data
        fetchBookings();
      }
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
      setNotification(null);

      const response = await axios.post(`/admin/bookings/${selectedBooking.booking_id}/set-amount`, {
        amount_npr: parseFloat(amountForm.amount_npr),
        charging_duration_minutes: amountForm.charging_duration_minutes ? parseInt(amountForm.charging_duration_minutes) : null,
        notes: amountForm.notes
      });

      if (response.data.success) {
        alert('Charging amount set successfully! User will be notified.');
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
        alert('Booking marked as charging completed');
        fetchBookings();
      } else {
        alert(response.data.error || 'Failed to mark as completed');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to mark booking as completed');
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.booking_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.user_details.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.station_details.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || booking.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'pending_payment': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'deferred': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid': return 'Paid';
      case 'pending': return 'Payment Pending';
      case 'deferred': return 'Pay at Station';
      case 'failed': return 'Payment Failed';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'NPR'
    }).format(amount);
  };

  const getStatusCounts = () => {
    const counts = {
      confirmed: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0
    };
    bookings.forEach(booking => {
      counts[booking.status] = (counts[booking.status] || 0) + 1;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

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
          <h1 className="text-3xl font-bold text-gray-800">Bookings Management</h1>
          <p className="text-gray-600">Monitor and manage all charging bookings</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Bookings</p>
            <p className="text-2xl font-bold text-gray-800">{bookings.length}</p>
          </div>
        </div>
      </div>

      {/* Recent Payment Confirmations Alert */}
      {bookings.filter(b => b.payment_status === 'paid' && 
        b.payment_data?.verified_at && 
        (Date.now() - (b.payment_data.verified_at * 1000)) < 60000 // Last 1 minute
      ).length > 0 && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold">💰 Payment Received!</h3>
              <p className="text-green-100">
                {bookings.filter(b => b.payment_status === 'paid' && 
                  b.payment_data?.verified_at && 
                  (Date.now() - (b.payment_data.verified_at * 1000)) < 60000
                ).length} payment{bookings.filter(b => b.payment_status === 'paid' && 
                  b.payment_data?.verified_at && 
                  (Date.now() - (b.payment_data.verified_at * 1000)) < 60000
                ).length > 1 ? 's' : ''} confirmed in the last minute.
                <br />
                <span className="text-sm">Database automatically updated.</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-lg font-bold text-gray-800">{statusCounts.confirmed}</p>
              <p className="text-xs text-gray-600">Confirmed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-lg font-bold text-gray-800">{statusCounts.in_progress}</p>
              <p className="text-xs text-gray-600">In Progress</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-lg font-bold text-gray-800">{statusCounts.completed}</p>
              <p className="text-xs text-gray-600">Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-lg font-bold text-gray-800">{statusCounts.cancelled}</p>
              <p className="text-xs text-gray-600">Cancelled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchBookings}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Station
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{booking.booking_id}</div>
                      <div className="text-sm text-gray-500">{formatDateTime(booking.created_at)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{booking.user_details.username}</div>
                      <div className="text-sm text-gray-500">{booking.user_details.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{booking.station_details.name}</div>
                      <div className="text-sm text-gray-500">{booking.station_details.address}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div>{booking.booking_date} at {booking.booking_time}</div>
                      <div>{booking.booking_duration} min • {booking.charger_type}</div>
                      <div className="font-medium">{formatCurrency(booking.total_cost)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                      {booking.payment_status && (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(booking.payment_status)}`}>
                          {getPaymentStatusText(booking.payment_status)}
                    </span>
                      )}
                    {booking.auto_booked && (
                        <div className="text-xs text-blue-600">Auto-booked</div>
                    )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowBookingModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      <select
                        value={booking.status}
                        onChange={(e) => handleUpdateBookingStatus(booking._id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button
                        onClick={() => handleDeleteBooking(booking._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredBookings.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Booking Details Modal */}
      {showBookingModal && selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedBooking(null);
          }}
        />
      )}

      {/* Amount Setting Modal */}
      {showAmountModal && selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Set Charging Amount
              </h3>
              
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">
                  <strong>Booking:</strong> {selectedBooking.booking_id}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Station:</strong> {selectedBooking.station_details?.name || selectedBooking.station_id}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Charger:</strong> {selectedBooking.charger_type}
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
                    placeholder="Additional notes about the charging session"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAmountModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={settingAmount}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {settingAmount ? 'Setting...' : 'Set Amount'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

// Booking Details Modal Component
const BookingDetailsModal = ({ booking, onClose }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'NPR'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'pending_payment': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'deferred': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid': return 'Paid';
      case 'pending': return 'Payment Pending';
      case 'deferred': return 'Pay at Station';
      case 'failed': return 'Payment Failed';
      default: return 'Unknown';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Booking Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Booking Header */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{booking.booking_id}</h3>
                  <p className="text-gray-600">Created on {formatDateTime(booking.created_at)}</p>
                </div>
                <div className="text-right">
                  <div className="space-y-1">
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                    {booking.payment_status && (
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPaymentStatusColor(booking.payment_status)}`}>
                        {getPaymentStatusText(booking.payment_status)}
                    </span>
                      )}
                  {booking.auto_booked && (
                      <div className="text-xs text-blue-600">Auto-booked</div>
                  )}
                  </div>
                </div>
              </div>
            </div>

            {/* User and Station Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">User Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Username:</span>
                    <span className="font-medium">{booking.user_details.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{booking.user_details.email}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Station Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Station:</span>
                    <span className="font-medium">{booking.station_details.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Address:</span>
                    <span className="font-medium">{booking.station_details.address}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Booking Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{formatDate(booking.booking_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{booking.booking_time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{booking.booking_duration} minutes</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Charger Type:</span>
                    <span className="font-medium">{booking.charger_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Cost:</span>
                    <span className="font-medium">{formatCurrency(booking.total_cost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booking Type:</span>
                    <span className="font-medium">{booking.auto_booked ? 'Auto-booked' : 'Manual'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            {booking.payment_status && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Payment Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Status:</span>
                      <span className={`font-medium ${getPaymentStatusColor(booking.payment_status)}`}>
                        {getPaymentStatusText(booking.payment_status)}
                      </span>
                    </div>
                    {booking.amount_npr && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-medium">{formatCurrency(booking.amount_npr)}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {booking.payment_data && (
                      <>
                        {booking.payment_data.khalti_idx && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Transaction ID:</span>
                            <span className="font-medium">{booking.payment_data.khalti_idx}</span>
                          </div>
                        )}
                        {booking.payment_data.verified_at && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Verified At:</span>
                            <span className="font-medium">{formatDateTime(new Date(booking.payment_data.verified_at * 1000))}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBookings; 