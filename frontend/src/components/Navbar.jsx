import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <nav className="bg-blue-600 p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-xl font-bold">
          EVConnectNepal
        </Link>

        <div className="flex space-x-4">
          <Link to="/" className="text-white hover:text-blue-200">
            Home
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="text-white hover:text-blue-200">
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="text-white hover:text-blue-200"
              >
                Logout
              </button>
              <span className="text-white">Welcome, {user?.username}</span>
            </>
          ) : (
            <>
              <Link to="/login" className="text-white hover:text-blue-200">
                Login
              </Link>
              <Link to="/register" className="text-white hover:text-blue-200">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
