import { useAuth } from "../context/useAuth";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "../api/axios";

export default function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeBookings: 0,
    completedBookings: 0,
    totalBookings: 0,
    totalSpent: 0,
    totalCost: 0,
    pendingPayments: 0
  });
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookingData();
    
    // Check for payment completion flag
    const checkPaymentCompletion = () => {
      const paymentCompleted = localStorage.getItem('payment_completed');
      const paymentTimestamp = localStorage.getItem('payment_timestamp');
      const forceRefresh = localStorage.getItem('force_immediate_refresh');
      
      // Also check navigation state for immediate payment completion
      const navigationPaymentCompleted = location.state?.paymentCompleted;
      
      if ((paymentCompleted === 'true' && paymentTimestamp) || navigationPaymentCompleted || forceRefresh === 'true') {
        const timestamp = paymentTimestamp ? parseInt(paymentTimestamp) : Date.now();
        const now = Date.now();
        
        // If payment was completed within the last 5 minutes, refresh data
        if (now - timestamp < 5 * 60 * 1000 || navigationPaymentCompleted || forceRefresh === 'true') {
          console.log('Payment recently completed, refreshing dashboard data...', {
            fromLocalStorage: paymentCompleted === 'true',
            fromNavigation: navigationPaymentCompleted,
            forceRefresh: forceRefresh === 'true',
            bookingId: location.state?.bookingId,
            transactionId: location.state?.transactionId
          });
          
          // Force refresh with a small delay to ensure backend has updated
          setTimeout(() => {
            fetchBookingData();
          }, forceRefresh === 'true' ? 500 : 1000); // Shorter delay for force refresh
          
          // Clear the flags after refresh
          localStorage.removeItem('payment_completed');
          localStorage.removeItem('payment_timestamp');
          localStorage.removeItem('force_immediate_refresh');
          
          // Clear navigation state
          if (navigationPaymentCompleted) {
            navigate('/dashboard', { replace: true, state: {} });
          }
        }
      }
    };
    
    checkPaymentCompletion();
  }, []); // Initial load only

  const fetchBookingData = async () => {
    try {
      setLoading(true);
      
      // Fetch all bookings
      const allBookingsResponse = await axios.get('/recommendations/my-bookings');
      const activeBookingsResponse = await axios.get('/recommendations/active-bookings');
      const pendingPaymentsResponse = await axios.get('/bookings/pending-payments');

      if (allBookingsResponse.data.success) {
        const allBookings = allBookingsResponse.data.bookings;
        setBookings(allBookings);

        // Calculate statistics
        const completed = allBookings.filter(b => b.status === 'completed').length;
        
        // Calculate total cost (amount from all bookings)
        const totalCost = allBookings.reduce((sum, booking) => {
          return sum + (booking.amount_npr || 0);
        }, 0);

        // Set pending payments
        if (pendingPaymentsResponse.data.success) {
          setPendingPayments(pendingPaymentsResponse.data.pending_payments);
        }

        setStats({
          activeBookings: activeBookingsResponse.data.success ? activeBookingsResponse.data.bookings.length : 0,
          completedBookings: completed,
          totalBookings: allBookings.length,
          totalSpent: totalCost, // Keep for backward compatibility
          totalCost: totalCost,
          pendingPayments: pendingPaymentsResponse.data.success ? pendingPaymentsResponse.data.count : 0
        });
      }

      if (activeBookingsResponse.data.success) {
        setActiveBookings(activeBookingsResponse.data.bookings);
      }

    } catch (error) {
      console.error('Error fetching booking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      const response = await axios.delete(`/recommendations/cancel-booking/${bookingId}`);
      if (response.data.success) {
        alert('Booking cancelled successfully');
        fetchBookingData(); // Refresh data
      } else {
        alert(response.data.error || 'Failed to cancel booking');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Error cancelling booking');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-gray-600 bg-gray-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'pending_payment': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPaymentStatusColor = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'deferred': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'none': return 'text-blue-600 bg-blue-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getPaymentStatusText = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid': return 'Paid';
      case 'pending': return 'Payment Pending';
      case 'deferred': return 'Pay at Station';
      case 'failed': return 'Payment Failed';
      case 'none': return 'Completed';
      default: return 'Completed';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-6 py-8">
        {/* Payment Success Notification */}
        {location.state?.paymentCompleted && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 mb-6 text-white shadow-lg">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold">🎉 Payment Successful!</h3>
                <p className="text-green-100">
                  Your payment has been confirmed and processed successfully.
                  <br />
                  <span className="text-sm">
                    Booking ID: {location.state?.bookingId} • Transaction ID: {location.state?.transactionId}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pending Payments Notification */}
        {pendingPayments.length > 0 && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 mb-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                                     <h3 className="text-lg font-bold">💰 Payment Required!</h3>
                   <p className="text-orange-100">
                     You have {pendingPayments.length} completed charging session{pendingPayments.length > 1 ? 's' : ''} ready for payment.
                     <br />
                     <span className="text-sm">Amounts set by admin based on actual usage.</span>
                   </p>
                </div>
              </div>
              {/* <Link
                to="/payment-center"
                className="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
              >
                Pay with Khalti
              </Link> */}
            </div>
            
            {/* Show pending payment details */}
            <div className="mt-4 space-y-2">
              {pendingPayments.slice(0, 3).map((payment) => (
                                 <div key={payment.booking_id} className="bg-white/10 rounded-lg p-3 flex justify-between items-center">
                   <div className="flex-1">
                     <p className="font-medium">{payment.station_details?.name || `Station ${payment.station_id}`}</p>
                     <p className="text-sm text-orange-100">
                       {payment.booking_id} • Completed: {new Date(payment.admin_set_amount_at).toLocaleDateString()}
                     </p>
                     {payment.actual_charging_duration && (
                       <p className="text-xs text-orange-200">
                         Charging time: {payment.actual_charging_duration} minutes
                       </p>
                     )}
                   </div>
                   <div className="text-right">
                     <p className="font-bold text-lg">₹{payment.amount_npr}</p>
                     <p className="text-xs text-orange-200 mb-2">Amount set by admin</p>
                     <button
                       onClick={() => window.location.href = `/payment?booking_id=${payment.booking_id}`}
                       className="text-sm bg-white text-orange-600 px-3 py-2 rounded font-semibold hover:bg-orange-50 transition-colors"
                     >
                       Pay with Khalti
                     </button>
                   </div>
                 </div>
              ))}
              {pendingPayments.length > 3 && (
                <p className="text-center text-orange-100 text-sm">
                  +{pendingPayments.length - 3} more pending payment{pendingPayments.length - 3 > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Welcome back, {user?.username}! 👋
              </h1>
              <p className="text-blue-100 text-lg">
                Manage your EV charging experience from your personal dashboard
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => {
                  console.log('Manual refresh triggered');
                  fetchBookingData();
                }}
                className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors font-medium flex items-center gap-2"
                disabled={loading}
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-green-900">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-800">{loading ? '...' : stats.activeBookings}</p>
                <p className="text-sm text-gray-600">Active Bookings</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-800">{loading ? '...' : stats.completedBookings}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-800">{loading ? '...' : stats.totalBookings}</p>
                <p className="text-sm text-gray-600">Total Bookings</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-red-600">Rs. {loading ? '...' : stats.totalCost.toFixed(0)}</p>
                <p className="text-sm text-gray-600">Total Cost</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Payments Stats */}
        {stats.pendingPayments > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-2xl font-bold">
                    {loading ? '...' : stats.pendingPayments} Payment{stats.pendingPayments > 1 ? 's' : ''} Pending
                  </p>
                  <p className="text-orange-100">
                    Rs. {pendingPayments.reduce((sum, p) => sum + (p.amount_npr || 0), 0)} total due
                  </p>
                </div>
                <button
                  onClick={() => window.location.href = '/payment?booking_id=' + pendingPayments[0]?.booking_id}
                  className="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
                >
                  Pay with Khalti
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Bookings */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Recent Bookings</h2>
                <Link
                  to="/recommendations"
                  className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center"
                >
                  View All
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading bookings...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No bookings yet</h3>
                  <p className="text-gray-500 mb-6">Start by finding charging stations near you</p>
                  <Link
                    to="/map"
                    className="inline-flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Find Stations
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.slice(0, 5).map((booking) => (
                    <div key={booking.booking_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-800">
                            {booking.station_details?.name || `Station ${booking.station_id}`}
                          </h4>
                          {/* Show appropriate status based on booking state */}
                          {booking.status === 'completed' && booking.admin_amount_set && booking.requires_payment ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor('pending')}`}>
                              Payment Pending
                            </span>
                          ) : booking.status === 'completed' && !booking.admin_amount_set ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor('completed')}`}>
                              Charging Completed
                            </span>
                          ) : booking.payment_status && booking.payment_status !== 'none' ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.payment_status)}`}>
                              {getPaymentStatusText(booking.payment_status)}
                            </span>
                          ) : (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {booking.status === 'confirmed' ? 'Active' : booking.status === 'completed' ? 'Completed' : booking.status.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>🔌 {booking.charger_type} • 📅 {formatDate(booking.created_at)}</p>
                          {booking.amount_npr && <p className="text-green-600">💰 ₹{booking.amount_npr}</p>}
                          {booking.auto_booked && <p className="text-green-600">🤖 Auto-booked</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {booking.status === 'confirmed' && booking.payment_status !== 'deferred' && (
                          <button
                            onClick={() => handleCancelBooking(booking.booking_id)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        {booking.status === 'pending_payment' && (
                          <Link
                            to={`/booking-details/${booking.booking_id}`}
                            className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors"
                          >
                            Pay with Khalti
                          </Link>
                        )}
                        <Link
                          to={`/route/${booking.station_id}`}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          View Station
                        </Link>
                      </div>
                    </div>
                  ))}
                  {bookings.length > 5 && (
                    <div className="text-center pt-4">
                      <Link
                        to="/recommendations"
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View {bookings.length - 5} more bookings →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/map"
                  className="flex items-center w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-700 transition-colors">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Find Stations</h4>
                    <p className="text-sm text-gray-600">Explore nearby charging stations</p>
                  </div>
                </Link>

                <Link
                  to="/recommendations"
                  className="flex items-center w-full p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
                >
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-700 transition-colors">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Smart Recommendations</h4>
                    <p className="text-sm text-gray-600">Get personalized suggestions</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Active Bookings Summary */}
            {activeBookings.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Active Bookings</h3>
                <div className="space-y-3">
                  {activeBookings.slice(0, 3).map((booking) => (
                    <div key={booking.booking_id} className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-gray-800">
                        {booking.station_details?.name || `Station ${booking.station_id}`}
                      </div>
                      <div className="text-sm text-gray-600">
                        {booking.charger_type} • {formatDate(booking.created_at)}
                      </div>
                    </div>
                  ))}
                  {activeBookings.length > 3 && (
                    <div className="text-center">
                      <Link to="/recommendations" className="text-blue-600 text-sm hover:underline">
                        +{activeBookings.length - 3} more active bookings
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
