import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <nav className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 shadow-lg backdrop-blur-sm border-b border-blue-500/20">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-white text-2xl font-bold hover:text-blue-100 transition-colors duration-300"
          >
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
              </svg>
            </div>
            <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              EVConnectNepal
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link 
              to="/" 
              className="px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 font-medium"
            >
              Home
            </Link>
            <Link 
              to="/map" 
              className="px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 font-medium"
            >
              Stations
            </Link>
            <Link 
              to="/recommendations" 
              className="px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 font-medium"
            >
              Smart Recommendations
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center space-x-1 ml-4 pl-4 border-l border-white/20">
                <Link 
                  to="/dashboard" 
                  className="px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 font-medium"
                >
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-white/90 hover:text-white hover:bg-red-500/20 rounded-lg transition-all duration-300 font-medium"
                >
                  Logout
                </button>
                <div className="flex items-center space-x-2 ml-3 px-3 py-1.5 bg-white/10 rounded-full backdrop-blur-sm">
                  <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-green-900">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-white text-sm font-medium">
                    {user?.username}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-white/20">
                <Link 
                  to="/login" 
                  className="px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 font-medium"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-4 py-2 bg-white/20 text-white hover:bg-white/30 rounded-lg transition-all duration-300 font-medium backdrop-blur-sm border border-white/20"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors duration-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
