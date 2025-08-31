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
    pendingPayments: 0,
  });

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookingData();

    // Check for payment completion flag
    const checkPaymentCompletion = () => {
      const paymentCompleted = localStorage.getItem("payment_completed");
      const paymentTimestamp = localStorage.getItem("payment_timestamp");
      const forceRefresh = localStorage.getItem("force_immediate_refresh");
      const paymentDetails = localStorage.getItem("payment_completion_details");

      // Check for enhanced payment completion flags
      const paymentVerified = localStorage.getItem("payment_verified");
      const paymentStatusPaid = localStorage.getItem("payment_status_paid");
      const clearPendingPayments = localStorage.getItem(
        "clear_pending_payments"
      );
      const bookingPaymentCompleted = localStorage.getItem(
        "booking_payment_completed"
      );

      // NEW: Additional notification clearing flags
      const clearPendingNotifications = localStorage.getItem(
        "clear_pending_notifications"
      );
      const paymentNotificationCleared = localStorage.getItem(
        "payment_notification_cleared"
      );
      const forceDashboardRefresh = localStorage.getItem(
        "force_dashboard_refresh"
      );

      // Also check navigation state for immediate payment completion
      const navigationPaymentCompleted = location.state?.paymentCompleted;
      const navigationForceRefresh = location.state?.forceRefresh;

      // Enhanced payment completion detection
      const isPaymentCompleted =
        (paymentCompleted === "true" && paymentTimestamp) ||
        navigationPaymentCompleted ||
        forceRefresh === "true" ||
        paymentVerified === "true" ||
        paymentStatusPaid === "true" ||
        clearPendingPayments === "true" ||
        clearPendingNotifications === "true" ||
        forceDashboardRefresh === "true" ||
        navigationForceRefresh === true;

      if (isPaymentCompleted) {
        const timestamp = paymentTimestamp
          ? parseInt(paymentTimestamp)
          : Date.now();
        const now = Date.now();

        // If payment was completed within the last 5 minutes, refresh data
        if (
          now - timestamp < 5 * 60 * 1000 ||
          navigationPaymentCompleted ||
          forceRefresh === "true" ||
          paymentVerified === "true" ||
          clearPendingNotifications === "true" ||
          navigationForceRefresh === true
        ) {
          console.log(
            "Payment recently completed, refreshing dashboard data...",
            {
              fromLocalStorage: paymentCompleted === "true",
              fromNavigation: navigationPaymentCompleted,
              navigationForceRefresh: navigationForceRefresh,
              forceRefresh: forceRefresh === "true",
              paymentVerified: paymentVerified === "true",
              paymentStatusPaid: paymentStatusPaid === "true",
              clearPendingPayments: clearPendingPayments === "true",
              clearPendingNotifications: clearPendingNotifications === "true",
              forceDashboardRefresh: forceDashboardRefresh === "true",
              bookingId:
                location.state?.bookingId ||
                bookingPaymentCompleted ||
                paymentNotificationCleared,
              transactionId: location.state?.transactionId,
              paymentDetails: paymentDetails
                ? JSON.parse(paymentDetails)
                : null,
            }
          );

          // Immediately clear pending payments from UI if payment is confirmed as paid
          if (
            paymentStatusPaid === "true" ||
            clearPendingPayments === "true" ||
            clearPendingNotifications === "true" ||
            navigationForceRefresh === true
          ) {
            console.log(
              "Payment confirmed as paid, immediately clearing pending payments from UI..."
            );
            clearPendingPaymentsFromUI();
          }

          // Force refresh with a small delay to ensure backend has updated
          setTimeout(
            () => {
              fetchBookingData();
            },
            navigationForceRefresh === true
              ? 200
              : forceRefresh === "true" || clearPendingNotifications === "true"
              ? 500
              : 1000
          ); // Even faster for navigation force refresh

          // Additional refresh after 2 seconds to ensure backend has processed
          setTimeout(() => {
            console.log(
              "Performing additional refresh to ensure payment status is updated..."
            );
            fetchBookingData();
          }, 2000);

          // Clear pending payments from UI immediately if we have payment details
          if (paymentDetails) {
            try {
              const details = JSON.parse(paymentDetails);
              console.log(
                "Clearing pending payments for completed payment:",
                details.bookingId
              );
              clearPendingPaymentsFromUI();
            } catch (e) {
              console.error("Error parsing payment details for clearing:", e);
            }
          }

          // Clear the flags after refresh
          localStorage.removeItem("payment_completed");
          localStorage.removeItem("payment_timestamp");
          localStorage.removeItem("force_immediate_refresh");
          localStorage.removeItem("payment_completion_details");
          localStorage.removeItem("payment_verified");
          localStorage.removeItem("payment_status_paid");
          localStorage.removeItem("clear_pending_payments");
          localStorage.removeItem("booking_payment_completed");

          // NEW: Clear additional flags
          localStorage.removeItem("clear_pending_notifications");
          localStorage.removeItem("payment_notification_cleared");
          localStorage.removeItem("force_dashboard_refresh");

          // Clear navigation state
          if (navigationPaymentCompleted || navigationForceRefresh) {
            navigate("/dashboard", { replace: true, state: {} });
          }
        }
      }
    };

    checkPaymentCompletion();
  }, []); // Initial load only

  const clearPendingPaymentsFromUI = () => {
    console.log("Clearing pending payments from UI...");
    setPendingPayments([]);
    setStats((prevStats) => ({
      ...prevStats,
      pendingPayments: 0,
    }));
  };

  const handleManualRefresh = async () => {
    console.log(
      "Manual refresh triggered - clearing cached flags but preserving payment history..."
    );

    // IMPROVED: Preserve paid booking IDs to prevent them from reappearing
    const paidBookingIds = localStorage.getItem("paid_booking_ids");

    // Clear completion flags but preserve payment history
    localStorage.removeItem("payment_completed");
    localStorage.removeItem("payment_timestamp");
    localStorage.removeItem("force_immediate_refresh");
    localStorage.removeItem("payment_completion_details");
    localStorage.removeItem("payment_verified");
    localStorage.removeItem("payment_status_paid");
    localStorage.removeItem("clear_pending_payments");
    localStorage.removeItem("booking_payment_completed");
    localStorage.removeItem("clear_pending_notifications");
    localStorage.removeItem("payment_notification_cleared");
    localStorage.removeItem("force_dashboard_refresh");

    // FIXED: Restore paid booking IDs to prevent reappearance
    if (paidBookingIds) {
      localStorage.setItem("paid_booking_ids", paidBookingIds);
      console.log("Preserved paid booking IDs during refresh:", paidBookingIds);
    }

    // Clear pending payments from UI immediately
    clearPendingPaymentsFromUI();

    try {
      // ENHANCED: Call backend force refresh to fix any payment status inconsistencies
      console.log(
        "🔧 Calling backend force refresh to fix payment inconsistencies..."
      );
      const forceRefreshResponse = await axios.post(
        "/payments/force-refresh-payment-status"
      );

      if (forceRefreshResponse.data.success) {
        console.log(
          "✅ Backend force refresh completed:",
          forceRefreshResponse.data
        );
        if (forceRefreshResponse.data.fixed_count > 0) {
          console.log(
            `🔧 Fixed ${forceRefreshResponse.data.fixed_count} inconsistent payment statuses`
          );
        }
      } else {
        console.warn(
          "⚠️ Backend force refresh failed:",
          forceRefreshResponse.data
        );
      }
    } catch (error) {
      console.error("❌ Error during backend force refresh:", error);
      // Continue with normal refresh even if force refresh fails
    }

    // Force refresh booking data
    await fetchBookingData();

    // Additional refresh after a short delay to ensure backend consistency
    setTimeout(() => {
      console.log(
        "Manual refresh - additional check for payment status updates..."
      );
      fetchBookingData();
    }, 1000);
  };

  const fetchBookingData = async () => {
    try {
      setLoading(true);

      // DEBUG: Log user object to check ID format
      console.log("📊 DEBUG: Current user object:", user);
      console.log("📊 DEBUG: User ID:", user?.id, "Type:", typeof user?.id);
      console.log("📊 DEBUG: User _ID:", user?._id, "Type:", typeof user?._id);

      // Fetch all bookings
      const allBookingsResponse = await axios.get(
        "/recommendations/my-bookings"
      );
      const activeBookingsResponse = await axios.get(
        "/recommendations/active-bookings"
      );
      const pendingPaymentsResponse = await axios.get(
        "/bookings/pending-payments"
      );

      if (allBookingsResponse.data.success) {
        const allBookings = allBookingsResponse.data.bookings;

        // DEBUG: Log booking payment statuses to verify updates
        console.log("📊 DEBUG: All bookings payment status:");
        allBookings.forEach((booking) => {
          console.log(
            `  ${booking.booking_id}: payment_status=${booking.payment_status}, requires_payment=${booking.requires_payment}, admin_amount_set=${booking.admin_amount_set}`
          );
        });

        setBookings(allBookings);

        // Calculate statistics
        const completed = allBookings.filter(
          (b) => b.status === "completed"
        ).length;

        // Calculate total cost (amount from all bookings)
        const totalCost = allBookings.reduce((sum, booking) => {
          return sum + (booking.amount_npr || 0);
        }, 0);

        // Set pending payments - filter out any that might have been paid recently
        let validPendingPayments = [];
        if (pendingPaymentsResponse.data.success) {
          const pendingPayments = pendingPaymentsResponse.data.pending_payments;
          console.log("Fetched pending payments:", pendingPayments);
          console.log("Raw pending payments count:", pendingPayments.length);

          // Get list of paid booking IDs for exclusion
          const paidBookingIdsStr = localStorage.getItem("paid_booking_ids");
          const paidBookingIds = paidBookingIdsStr
            ? JSON.parse(paidBookingIdsStr)
            : [];

          // ENHANCED: Always filter pending payments regardless of localStorage flags
          validPendingPayments = pendingPayments.filter((payment) => {
            const bookingId = payment.booking_id;

            // Check multiple conditions to ensure this is truly a pending payment
            const isValidPending =
              payment.payment_status !== "paid" &&
              payment.requires_payment === true &&
              payment.admin_amount_set === true &&
              payment.status !== "cancelled" &&
              !paidBookingIds.includes(bookingId); // Exclude from localStorage cache

            if (!isValidPending) {
              console.log(`Filtering out payment for booking ${bookingId}:`, {
                payment_status: payment.payment_status,
                requires_payment: payment.requires_payment,
                admin_amount_set: payment.admin_amount_set,
                status: payment.status,
                is_in_paid_list: paidBookingIds.includes(bookingId),
              });
            }

            return isValidPending;
          });

          // Check if any recent payment completion flags are set
          const clearPaymentsFlag = localStorage.getItem(
            "clear_pending_payments"
          );
          const paymentStatusPaid = localStorage.getItem("payment_status_paid");
          const clearPendingNotifications = localStorage.getItem(
            "clear_pending_notifications"
          );
          const paymentNotificationCleared = localStorage.getItem(
            "payment_notification_cleared"
          );

          // If payment flags are set, additionally clear all pending payments from UI
          if (
            clearPaymentsFlag === "true" ||
            paymentStatusPaid === "true" ||
            clearPendingNotifications === "true"
          ) {
            console.log(
              "Payment completion flag detected, forcefully clearing pending payments..."
            );
            validPendingPayments = [];

            // Additional check: if a specific booking was just paid, remove it from pending
            if (paymentNotificationCleared) {
              validPendingPayments = validPendingPayments.filter(
                (payment) => payment.booking_id !== paymentNotificationCleared
              );
            }
          }

          console.log(
            "Final validated pending payments:",
            validPendingPayments
          );
          console.log(
            "Valid pending payments count:",
            validPendingPayments.length
          );

          setPendingPayments(validPendingPayments);
        } else {
          console.log(
            "Failed to fetch pending payments:",
            pendingPaymentsResponse.data
          );
          setPendingPayments([]);
        }

        setStats({
          activeBookings: activeBookingsResponse.data.success
            ? activeBookingsResponse.data.bookings.length
            : 0,
          completedBookings: completed,
          totalBookings: allBookings.length,
          totalSpent: totalCost, // Keep for backward compatibility
          totalCost: totalCost,
          pendingPayments: validPendingPayments.length,
        });
      }

      if (activeBookingsResponse.data.success) {
        setActiveBookings(activeBookingsResponse.data.bookings);
      }
    } catch (error) {
      console.error("Error fetching booking data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      const response = await axios.delete(
        `/recommendations/cancel-booking/${bookingId}`
      );
      if (response.data.success) {
        alert("Booking cancelled successfully");
        fetchBookingData(); // Refresh data
      } else {
        alert(response.data.error || "Failed to cancel booking");
      }
    } catch (err) {
      alert(err.response?.data?.error || "Error cancelling booking");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "text-green-600 bg-green-100";
      case "in_progress":
        return "text-blue-600 bg-blue-100";
      case "completed":
        return "text-gray-600 bg-gray-100";
      case "cancelled":
        return "text-red-600 bg-red-100";
      case "pending_payment":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getPaymentStatusColor = (paymentStatus) => {
    switch (paymentStatus) {
      case "paid":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "deferred":
        return "text-blue-600 bg-blue-100";
      case "failed":
        return "text-red-600 bg-red-100";
      case "none":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-blue-600 bg-blue-100";
    }
  };

  const getPaymentStatusText = (paymentStatus) => {
    switch (paymentStatus) {
      case "paid":
        return "Paid";
      case "pending":
        return "Payment Pending";
      case "deferred":
        return "Pay at Station";
      case "failed":
        return "Payment Failed";
      case "none":
        return "Completed";
      default:
        return "Completed";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-gray-950 text-white overflow-hidden pt-20 relative">
      {/* Animated Parallax Background */}
      <div className="fixed inset-0 opacity-40 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/15 via-purple-600/15 to-green-600/15 animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-indigo-600/10 to-purple-600/10"></div>
        <div className="absolute w-96 h-96 bg-gradient-radial from-cyan-500/25 to-transparent rounded-full blur-3xl left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-out"></div>
        <div
          className="absolute top-20 left-20 w-32 h-32 border border-cyan-500/20 rounded-full animate-spin"
          style={{ animationDuration: "20s" }}
        ></div>
        <div
          className="absolute top-40 right-32 w-24 h-24 border border-purple-500/20 rotate-45"
          style={{ animationDuration: "18s" }}
        ></div>
        <div
          className="absolute bottom-40 left-40 w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg"
          style={{ animationDuration: "22s" }}
        ></div>
      </div>
      <div className="container mx-auto px-6 py-8 relative z-10">
        {/* Payment Success Notification */}
        {location.state?.paymentCompleted && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 mb-6 text-white shadow-lg">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold">🎉 Payment Successful!</h3>
                <p className="text-green-100">
                  Your payment has been confirmed and processed successfully.
                  <br />
                  <span className="text-sm">
                    Booking ID: {location.state?.bookingId} • Transaction ID:{" "}
                    {location.state?.transactionId}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Success Notification from localStorage */}
        {(() => {
          const paymentDetails = localStorage.getItem(
            "payment_completion_details"
          );
          if (paymentDetails) {
            try {
              const details = JSON.parse(paymentDetails);
              const completedAt = new Date(details.completedAt);
              const now = new Date();
              const timeDiff = now - completedAt;

              // Show notification if payment was completed within the last 2 minutes
              if (timeDiff < 2 * 60 * 1000) {
                return (
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 mb-6 text-white shadow-lg">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">
                          🎉 Payment Successful!
                        </h3>
                        <p className="text-green-100">
                          Your payment of ₹{details.amount} for{" "}
                          {details.stationName} has been confirmed.
                          <br />
                          <span className="text-sm">
                            Booking ID: {details.bookingId} • Transaction ID:{" "}
                            {details.transactionId}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
            } catch (e) {
              console.error("Error parsing payment details:", e);
            }
          }
          return null;
        })()}

        {/* Pending Payments Notification */}
        {pendingPayments.length > 0 && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 mb-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold">💰 Payment Required!</h3>
                  <p className="text-orange-100">
                    You have {pendingPayments.length} completed charging session
                    {pendingPayments.length > 1 ? "s" : ""} ready for payment.
                    <br />
                    <span className="text-sm">
                      Amounts set by admin based on actual usage.
                    </span>
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
                <div
                  key={payment.booking_id}
                  className="bg-white/10 rounded-lg p-3 flex justify-between items-center"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {payment.station_details?.name ||
                        `Station ${payment.station_id}`}
                    </p>
                    <p className="text-sm text-orange-100">
                      {payment.booking_id} • Completed:{" "}
                      {new Date(
                        payment.admin_set_amount_at
                      ).toLocaleDateString()}
                    </p>
                    {payment.actual_charging_duration && (
                      <p className="text-xs text-orange-200">
                        Charging time: {payment.actual_charging_duration}{" "}
                        minutes
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">₹{payment.amount_npr}</p>
                    <p className="text-xs text-orange-200 mb-2">
                      Amount set by admin
                    </p>
                    <button
                      onClick={() =>
                        (window.location.href = `/payment?booking_id=${payment.booking_id}`)
                      }
                      className="text-sm bg-white text-orange-600 px-3 py-2 rounded font-semibold hover:bg-orange-50 transition-colors"
                    >
                      Pay with Khalti
                    </button>
                  </div>
                </div>
              ))}
              {pendingPayments.length > 3 && (
                <p className="text-center text-orange-100 text-sm">
                  +{pendingPayments.length - 3} more pending payment
                  {pendingPayments.length - 3 > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Welcome Header */}
        <div className="bg-gradient-to-br from-gray-900/70 to-gray-800/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-8 mb-8 hover:border-cyan-500/50 transition-all duration-500">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Welcome back, {user?.username || "User"}!
              </h1>
              <p className="text-xl text-white">
                Ready to charge your next adventure?
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleManualRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>

              <Link
                to="/recommendations"
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transform hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Find Stations
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="group bg-gradient-to-br from-gray-900/60 to-gray-800/60 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-gray-700/50 hover:border-blue-500/50 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-white">
                  {loading ? "..." : stats.activeBookings}
                </p>
                <p className="text-sm text-white">Active Bookings</p>
              </div>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-gray-900/60 to-gray-800/60 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-gray-700/50 hover:border-green-500/50 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-green-500/10">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-white">
                  {loading ? "..." : stats.completedBookings}
                </p>
                <p className="text-sm text-white">Completed</p>
              </div>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-gray-900/60 to-gray-800/60 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/10">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-white">
                  {loading ? "..." : stats.totalBookings}
                </p>
                <p className="text-sm text-white">Total Bookings</p>
              </div>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-gray-900/60 to-gray-800/60 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-gray-700/50 hover:border-red-500/50 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-500/10">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                {/* Cash/Money Icon */}
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect
                    x="3"
                    y="7"
                    width="18"
                    height="10"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="#fee2e2"
                  />
                  <circle cx="12" cy="12" r="2.5" fill="#ef4444" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-red-600">
                  NRs {loading ? "..." : stats.totalCost.toFixed(0)}
                </p>
                <p className="text-sm text-white">Total Cost</p>
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
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-2xl font-bold">
                    {loading ? "..." : stats.pendingPayments} Payment
                    {stats.pendingPayments > 1 ? "s" : ""} Pending
                  </p>
                  <p className="text-orange-100">
                    Rs.{" "}
                    {pendingPayments.reduce(
                      (sum, p) => sum + (p.amount_npr || 0),
                      0
                    )}{" "}
                    total due
                  </p>
                </div>
                <button
                  onClick={() =>
                    (window.location.href =
                      "/payment?booking_id=" + pendingPayments[0]?.booking_id)
                  }
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
            <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/60 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-700/50 hover:border-cyan-500/50 transition-all duration-500">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white-800">
                  Recent Bookings
                </h2>
                <Link
                  to="/recommendations"
                  className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center"
                >
                  View All
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
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
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    No bookings yet
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Start by finding charging stations near you
                  </p>
                  <Link
                    to="/map"
                    className="inline-flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Find Stations
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.slice(0, 5).map((booking) => (
                    <div
                      key={booking.booking_id}
                      className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-900/40 to-gray-800/40 rounded-lg border border-gray-700/30 group hover:border-cyan-500/50 hover:shadow-cyan-500/10 hover:shadow-2xl transition-all duration-300"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-white">
                            {booking.station_details?.name ||
                              `Station ${booking.station_id}`}
                          </h4>
                          {/* Show appropriate status based on booking state - FIXED LOGIC */}
                          {(() => {
                            // Check if this booking was recently paid (using localStorage)
                            const paidBookingIdsStr =
                              localStorage.getItem("paid_booking_ids");
                            const paidBookingIds = paidBookingIdsStr
                              ? JSON.parse(paidBookingIdsStr)
                              : [];
                            const isRecentlyPaid = paidBookingIds.includes(
                              booking.booking_id
                            );

                            // Priority 1: If payment_status is 'paid' OR booking is in recently paid list
                            if (
                              booking.payment_status === "paid" ||
                              isRecentlyPaid
                            ) {
                              return (
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                                    "paid"
                                  )}`}
                                >
                                  Paid
                                </span>
                              );
                            }

                            // Priority 2: If requires_payment is false and admin_amount_set, it's been paid
                            if (
                              booking.admin_amount_set &&
                              booking.requires_payment === false &&
                              booking.status === "completed"
                            ) {
                              return (
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                                    "paid"
                                  )}`}
                                >
                                  Paid
                                </span>
                              );
                            }

                            // Priority 3: If admin has set amount and still requires payment
                            if (
                              booking.status === "completed" &&
                              booking.admin_amount_set &&
                              booking.requires_payment
                            ) {
                              return (
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                                    "pending"
                                  )}`}
                                >
                                  Payment Pending
                                </span>
                              );
                            }

                            // Priority 4: If completed but admin hasn't set amount yet
                            if (
                              booking.status === "completed" &&
                              !booking.admin_amount_set
                            ) {
                              return (
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                    "completed"
                                  )}`}
                                >
                                  Charging Completed
                                </span>
                              );
                            }

                            // Priority 5: Other payment statuses
                            if (
                              booking.payment_status &&
                              booking.payment_status !== "none" &&
                              booking.payment_status !== "paid"
                            ) {
                              return (
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                                    booking.payment_status
                                  )}`}
                                >
                                  {getPaymentStatusText(booking.payment_status)}
                                </span>
                              );
                            }

                            // Priority 6: Default booking status
                            return (
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  booking.status
                                )}`}
                              >
                                {booking.status === "confirmed"
                                  ? "Active"
                                  : booking.status === "completed"
                                  ? "Completed"
                                  : booking.status.replace("_", " ")}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="text-sm text-white">
                          <p className="text-white">
                            🔌 {booking.charger_type} • 📅{" "}
                            {formatDate(booking.created_at)}
                          </p>
                          {booking.amount_npr && (
                            <p className="text-green-400">
                              {" "}
                              ₹{booking.amount_npr}
                            </p>
                          )}
                          {booking.auto_booked && (
                            <p className="text-green-400">Auto-booked</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {booking.status === "confirmed" &&
                          booking.payment_status !== "deferred" && (
                            <button
                              onClick={() =>
                                handleCancelBooking(booking.booking_id)
                              }
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        {booking.status === "pending_payment" && (
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
            <div className="bg-gradient-to-br from-gray-900/70 to-gray-800/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-6 hover:border-cyan-500/50 transition-all duration-500">
              <h3 className="text-xl font-bold text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  to="/map"
                  className="flex items-center w-full p-3 text-left bg-gradient-to-br from-blue-900/60 to-blue-800/60 hover:from-blue-800/80 hover:to-blue-700/80 border border-blue-700/40 rounded-lg transition-all group shadow-lg"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-700 transition-colors">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Find Stations</h4>
                    <p className="text-sm text-blue-200">
                      Explore nearby charging stations
                    </p>
                  </div>
                </Link>

                <Link
                  to="/recommendations"
                  className="flex items-center w-full p-3 text-left bg-gradient-to-br from-green-900/60 to-green-800/60 hover:from-green-800/80 hover:to-green-700/80 border border-green-700/40 rounded-lg transition-all group shadow-lg"
                >
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-700 transition-colors">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">
                      Smart Recommendations
                    </h4>
                    <p className="text-sm text-green-200">
                      Get personalized suggestions
                    </p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Active Bookings Summary */}
            {activeBookings.length > 0 && (
              <div className="bg-gradient-to-br from-gray-900/70 to-gray-800/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-6 hover:border-cyan-500/50 transition-all duration-500">
                <h3 className="text-xl font-bold text-white mb-4">
                  Active Bookings
                </h3>
                <div className="space-y-3">
                  {activeBookings.slice(0, 3).map((booking) => (
                    <div
                      key={booking.booking_id}
                      className="p-3 bg-gradient-to-br from-blue-900/60 to-blue-800/60 border border-blue-700/40 rounded-lg shadow-lg"
                    >
                      <div className="font-medium text-white">
                        {booking.station_details?.name ||
                          `Station ${booking.station_id}`}
                      </div>
                      <div className="text-sm text-blue-200">
                        {booking.charger_type} •{" "}
                        {formatDate(booking.created_at)}
                      </div>
                    </div>
                  ))}
                  {activeBookings.length > 3 && (
                    <div className="text-center">
                      <Link
                        to="/recommendations"
                        className="text-blue-600 text-sm hover:underline"
                      >
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
