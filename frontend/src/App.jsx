import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import DashboardRouter from "./components/DashboardRouter";
import Navbar from "./components/Navbar";
import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminStations from "./admin/pages/AdminStations";
import AdminUsers from "./admin/pages/AdminUsers";
import AdminBookings from "./admin/pages/AdminBookings";
import AdminAnalytics from "./admin/pages/AdminAnalytics";
import AdminChargingManagement from "./admin/pages/AdminChargingManagement";


// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Map from "./pages/Map";
import StationsList from "./pages/StationsList";
import Recommendations from "./pages/Recommendations";
import TripPlanner from "./pages/TripPlanner";
import RouteMap from "./pages/RouteMap";
import BookingPage from "./pages/BookingPage";
import PaymentPage from "./pages/PaymentPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import BookingDetailsPage from "./pages/BookingDetailsPage";
import GoogleOAuthCallback from "./components/GoogleOAuthCallback";

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="min-h-screen flex flex-col">
          {/* Conditionally render Navbar only for non-admin routes */}
          <Routes>
            {/* Admin routes - no navbar */}
            <Route
              path="/admin/*"
              element={
                <Routes>
                  <Route
                    path="/"
                    element={
                      <ProtectedAdminRoute>
                        <AdminLayout>
                          <AdminDashboard />
                        </AdminLayout>
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/stations"
                    element={
                      <ProtectedAdminRoute>
                        <AdminLayout>
                          <AdminStations />
                        </AdminLayout>
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/users"
                    element={
                      <ProtectedAdminRoute>
                        <AdminLayout>
                          <AdminUsers />
                        </AdminLayout>
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/bookings"
                    element={
                      <ProtectedAdminRoute>
                        <AdminLayout>
                          <AdminBookings />
                        </AdminLayout>
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <ProtectedAdminRoute>
                        <AdminLayout>
                          <AdminAnalytics />
                        </AdminLayout>
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/charging"
                    element={
                      <ProtectedAdminRoute>
                        <AdminLayout>
                          <AdminChargingManagement />
                        </AdminLayout>
                      </ProtectedAdminRoute>
                    }
                  />

                </Routes>
              }
            />
            
            {/* User routes - with navbar */}
            <Route
              path="/*"
              element={
                <>
                  <Navbar />
                  <main className="flex-grow">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/map" element={<Map />} />
                      <Route path="/map/all" element={<Map selectedStationType="all" />} />
                      <Route
                        path="/map/nea"
                        element={<Map selectedStationType="nea" />}
                      />
                      <Route
                        path="/map/byd"
                        element={<Map selectedStationType="byd" />}
                      />
                      <Route
                        path="/map/kia"
                        element={<Map selectedStationType="kia" />}
                      />
                      <Route
                        path="/map/hyundai"
                        element={<Map selectedStationType="hyundai" />}
                      />
                      <Route
                        path="/map/tata"
                        element={<Map selectedStationType="tata" />}
                      />
                      <Route
                        path="/map/mg"
                        element={<Map selectedStationType="mg" />}
                      />
                      <Route path="/stations" element={<StationsList />} />
                      <Route path="/recommendations" element={<Recommendations />} />
                      <Route
                        path="/trip-planner"
                        element={
                          <ProtectedRoute>
                            <TripPlanner />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/auth/google/callback"
                        element={<GoogleOAuthCallback />}
                      />
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute>
                            <DashboardRouter />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/user-dashboard"
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
                    </Routes>
                  </main>
                </>
              }
            />
          </Routes>
        </div>
      </Router>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
