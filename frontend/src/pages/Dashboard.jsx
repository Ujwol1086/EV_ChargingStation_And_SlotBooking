import { useAuth } from "../context/useAuth";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome, {user?.username}!
          </h1>
          <p className="text-gray-600">
            This is your personal dashboard for managing EV charging stations
            and bookings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              Your Bookings
            </h2>
            <p className="text-gray-600 mb-4">
              You have no active bookings at this time.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
              Find Stations
            </button>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              Favorite Stations
            </h2>
            <p className="text-gray-600 mb-4">
              You haven't saved any favorite stations yet.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
              Explore Map
            </button>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              Your Profile
            </h2>
            <div className="mb-4">
              <p className="text-gray-600">
                <span className="font-medium">Username:</span> {user?.username}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Email:</span> {user?.email}
              </p>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
