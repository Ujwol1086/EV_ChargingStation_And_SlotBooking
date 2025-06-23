import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-blue-600 mb-6">
            Welcome to EVConnectNepal
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Find and book EV charging stations across Nepal with ease. Our
            platform helps you locate nearby charging points and reserve slots
            in advance.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Link
              to="/map"
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:bg-green-700 transition"
            >
              View Charging Stations Map
            </Link>

            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:bg-blue-700 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Create Account
                </Link>
              </>
            ) : (
              <Link
                to="/dashboard"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:bg-blue-700 transition"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              Find Stations
            </h2>
            <p className="text-gray-600">
              Locate EV charging stations across Nepal with our interactive map
              and search features.
            </p>
            <Link
              to="/map"
              className="mt-4 inline-block text-blue-600 hover:underline"
            >
              View Map →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              Book Slots
            </h2>
            <p className="text-gray-600">
              Reserve charging slots in advance to ensure availability when you
              arrive at your destination.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              Track Usage
            </h2>
            <p className="text-gray-600">
              Monitor your charging history and manage your bookings from your
              personal dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
