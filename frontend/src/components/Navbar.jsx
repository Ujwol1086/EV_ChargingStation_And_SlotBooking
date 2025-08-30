import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { Zap, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isStationsOpen, setIsStationsOpen] = useState(false);
  const [isMobileStationsOpen, setIsMobileStationsOpen] = useState(false);
  const [closeTimeout, setCloseTimeout] = useState(null);

  const stationItems = [
    { name: "NEA Charging Stations", path: "/map/nea" },
    { name: "BYD Charging Stations", path: "/map/byd" },
    { name: "KIA Charging Stations", path: "/map/kia" },
    { name: "HYUNDAI Charging Stations", path: "/map/hyundai" },
    { name: "TATA Charging Stations", path: "/map/tata" },
    { name: "MG Charging Stations", path: "/map/mg" },
  ];

  return (
    <header className="fixed top-0 w-full z-50 bg-black border-b border-gray-800/30">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <nav className="flex items-center justify-between py-3 sm:py-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 sm:space-x-3 group"
          >
            <div className="relative">
              <div className="w-7 h-7 sm:w-11 sm:h-11 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-all duration-300">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
            </div>
            <span className="text-lg sm:text-xl lg:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              EVConnectNepal
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-10">
            <Link
              to="/"
              className="relative text-gray-300 hover:text-white transition-colors duration-300 group text-lg font-medium"
            >
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 group-hover:w-full transition-all duration-300"></span>
            </Link>

            {/* Desktop Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => {
                if (closeTimeout) clearTimeout(closeTimeout);
                setIsStationsOpen(true);
              }}
              onMouseLeave={() => {
                const timeout = setTimeout(() => setIsStationsOpen(false), 200); // 1 second delay
                setCloseTimeout(timeout);
              }}
            >
              <button className="flex items-center space-x-1 relative text-gray-300 hover:text-white transition-colors duration-300 group text-lg font-medium cursor-pointer">
                <span>Charging Stations</span>
                <ChevronDown
                  className={`w-4 h-4 transform transition-transform duration-300 ${
                    isStationsOpen ? "rotate-180" : ""
                  }`}
                />
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 group-hover:w-full transition-all duration-300"></span>
              </button>

              {isStationsOpen && (
                <div className="absolute left-0 mt-2 w-[250px] bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50">
                  {stationItems.map((item, idx) => (
                    <Link
                      key={idx}
                      to={item.path}
                      className={`block px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                        idx < stationItems.length - 1
                          ? "border-b border-gray-700"
                          : ""
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/locations"
              className="relative text-gray-300 hover:text-white transition-colors duration-300 group text-lg font-medium"
            >
              Locations
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 group-hover:w-full transition-all duration-300"></span>
            </Link>

            <Link
              to="/trip-planner"
              className="relative text-gray-300 hover:text-white transition-colors duration-300 group text-lg font-medium"
            >
              Trip Planner
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 group-hover:w-full transition-all duration-300"></span>
            </Link>

            {/* Auth Section */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2 lg:space-x-3">
                <Link
                  to="/dashboard"
                  className="text-gray-300 hover:text-white transition-colors text-sm lg:text-base"
                >
                  Dashboard
                </Link>
                <Button
                  variant="ghost"
                  className="text-gray-300 hover:text-white hover:bg-gray-800/50 text-sm lg:text-base px-3 lg:px-4 py-1.5 lg:py-2 cursor-pointer"
                  onClick={logout}
                >
                  Logout
                </Button>
                <div className="flex items-center space-x-2 px-2 py-1 bg-white/10 rounded-full backdrop-blur-sm border border-white/10">
                  <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
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
              <>
                <Button
                  variant="ghost"
                  className="text-gray-300 hover:text-white hover:bg-gray-800/50 text-sm lg:text-base px-3 lg:px-4 py-1.5 lg:py-2"
                  asChild
                >
                  <Link to="/login">Login</Link>
                </Button>
                <Button
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-3 lg:px-4 py-0.5 lg:py-1 rounded-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 text-sm lg:text-base"
                  asChild
                >
                  <Link to="/register">Register</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-1.5 text-gray-300 hover:text-white transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-gray-800/30">
            <div className="flex flex-col space-y-3">
              {/* Navigation Links */}
              <div className="flex flex-col space-y-2">
                <Link
                  to="/"
                  className="text-gray-300 hover:text-white transition-colors duration-300 text-base font-medium py-1.5"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>

                {/* Mobile Dropdown */}
                <div className="flex flex-col">
                  <button
                    onClick={() =>
                      setIsMobileStationsOpen(!isMobileStationsOpen)
                    }
                    className="flex justify-between items-center px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded transition-colors font-medium"
                  >
                    Charging Stations
                    <ChevronDown
                      className={`w-4 h-4 transform transition-transform duration-300 ${
                        isMobileStationsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isMobileStationsOpen && (
                    <div className="flex flex-col bg-gray-900 rounded-lg mt-1">
                      {stationItems.map((item, idx) => (
                        <Link
                          key={idx}
                          to={item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`block px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                            idx < stationItems.length - 1
                              ? "border-b border-gray-700"
                              : ""
                          }`}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <Link
                  to="/locations"
                  className="text-gray-300 hover:text-white transition-colors duration-300 text-base font-medium py-1.5"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Locations
                </Link>
                <Link
                  to="/trip-planner"
                  className="text-gray-300 hover:text-white transition-colors duration-300 text-base font-medium py-1.5"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Trip Planner
                </Link>
              </div>

              {/* Auth Section */}
              <div className="pt-3 border-t border-gray-800/30">
                {isAuthenticated ? (
                  <div className="flex flex-col space-y-2">
                    <Link
                      to="/dashboard"
                      className="text-gray-300 hover:text-white transition-colors text-base py-1.5"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Button
                      variant="ghost"
                      className="text-gray-300 hover:text-white hover:bg-gray-800/50 text-base py-2 justify-start"
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="ghost"
                      className="text-gray-300 hover:text-white hover:bg-gray-800/50 text-base py-2 justify-start"
                      asChild
                    >
                      <Link
                        to="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Login
                      </Link>
                    </Button>
                    <Button
                      className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white py-1 rounded-lg font-semibold text-sm"
                      asChild
                    >
                      <Link
                        to="/register"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Register
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
