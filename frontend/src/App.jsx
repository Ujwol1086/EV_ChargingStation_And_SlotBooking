import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import Navbar from "./components/Navbar";
import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminStations from "./admin/pages/AdminStations";
import AdminUsers from "./admin/pages/AdminUsers";
import AdminBookings from "./admin/pages/AdminBookings";
import AdminAnalytics from "./admin/pages/AdminAnalytics";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Map from "./pages/Map";
import StationsList from "./pages/StationsList";
import Recommendations from "./pages/Recommendations";
import RouteMap from "./pages/RouteMap";
import BookingPage from "./pages/BookingPage";
import PaymentPage from "./pages/PaymentPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import BookingDetailsPage from "./pages/BookingDetailsPage";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/map" element={<Map />} />
              <Route path="/stations" element={<StationsList />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/route/:stationId"
                element={
                  <ProtectedRoute>
                    <RouteMap />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking/:stationId"
                element={
                  <ProtectedRoute>
                    <BookingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment"
                element={
                  <ProtectedRoute>
                    <PaymentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment-success"
                element={
                  <ProtectedRoute>
                    <PaymentSuccessPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking-details/:bookingId"
                element={
                  <ProtectedRoute>
                    <BookingDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/admin" element={
                <ProtectedAdminRoute>
                  <AdminLayout><AdminDashboard /></AdminLayout>
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/stations" element={
                <ProtectedAdminRoute>
                  <AdminLayout><AdminStations /></AdminLayout>
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedAdminRoute>
                  <AdminLayout><AdminUsers /></AdminLayout>
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/bookings" element={
                <ProtectedAdminRoute>
                  <AdminLayout><AdminBookings /></AdminLayout>
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/analytics" element={
                <ProtectedAdminRoute>
                  <AdminLayout><AdminAnalytics /></AdminLayout>
                </ProtectedAdminRoute>
              } />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
