import { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { MapPin, Smartphone, BarChart3, Zap, Menu, X } from 'lucide-react'
import { Link } from "react-router-dom"

export default function EVConnectNepal() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-gray-950 text-white overflow-hidden">
      {/* Enhanced Animated Background with Multiple Parallax Layers */}
      <div className="fixed inset-0 opacity-40">
        {/* Layer 1 - Slowest */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-cyan-600/15 via-purple-600/15 to-green-600/15 animate-pulse"
          style={{
            transform: `translateY(${scrollY * 0.1}px)`,
          }}
        ></div>
        
        {/* Layer 2 - Medium */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-indigo-600/10 to-purple-600/10"
          style={{
            transform: `translateY(${scrollY * 0.3}px) translateX(${scrollY * 0.1}px)`,
          }}
        ></div>
        
        {/* Layer 3 - Fastest */}
        <div
          className="absolute w-96 h-96 bg-gradient-radial from-cyan-500/25 to-transparent rounded-full blur-3xl transition-all duration-1000 ease-out"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192 + (scrollY * 0.5),
          }}
        ></div>

        {/* Floating Geometric Shapes */}
        <div
          className="absolute top-20 left-20 w-32 h-32 border border-cyan-500/20 rounded-full animate-spin"
          style={{
            transform: `translateY(${scrollY * 0.2}px)`,
            animationDuration: '20s'
          }}
        ></div>
        
        <div
          className="absolute top-40 right-32 w-24 h-24 border border-purple-500/20 rotate-45"
          style={{
            transform: `translateY(${scrollY * 0.4}px) rotate(${scrollY * 0.1}deg)`,
          }}
        ></div>
        
        <div
          className="absolute bottom-40 left-40 w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg"
          style={{
            transform: `translateY(${scrollY * -0.3}px)`,
          }}
        ></div>
      </div>

      {/* Transparent Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-black/20 border-b border-gray-800/30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-all duration-300">
                  <Zap className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                EVConnectNepal
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {['Home', 'Stations', 'Map', 'About'].map((item) => (
                <Link
                  key={item}
                  to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                  className="relative text-gray-300 hover:text-white transition-colors duration-300 group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 group-hover:w-full transition-all duration-300"></span>
                </Link>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800/50" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-6 py-2 rounded-xl font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25" asChild>
                <Link to="/register">Register</Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </nav>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 p-4 bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-800/50">
              <div className="flex flex-col space-y-4">
                {['Home', 'Stations', 'Map', 'About'].map((item) => (
                  <Link key={item} to={item === 'Home' ? '/' : `/${item.toLowerCase()}`} className="text-gray-300 hover:text-white transition-colors">
                    {item}
                  </Link>
                ))}
                <div className="flex flex-col space-y-2 pt-4 border-t border-gray-800">
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 justify-start" asChild>
                    <Link to="/register">Register</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-6xl lg:text-7xl font-black leading-tight">
                  <span className="bg-gradient-to-r from-gray-100 via-cyan-200 to-purple-200 bg-clip-text text-transparent">
                    Power Your
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-green-400 bg-clip-text text-transparent animate-pulse">
                    Journey
                  </span>
                </h1>
                <p className="text-xl text-gray-300 leading-relaxed max-w-lg">
                  Nepal's most advanced EV charging network - intelligent, instant, everywhere.
                  Experience the future of sustainable transportation.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-cyan-500/25"
                  asChild
                >
                  <Link to="/stations">
                    <MapPin className="w-5 h-5 mr-2" />
                    Browse Stations
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-green-500 text-green-400 hover:bg-green-500 hover:text-white px-8 py-4 rounded-2xl font-bold text-lg transform hover:scale-105 transition-all duration-300 bg-transparent backdrop-blur-sm"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Smart Recommendations
                </Button>
              </div>
            </div>

            {/* Right Content - 3D Visual */}
            <div className="relative">
              <div className="relative w-full h-96 flex items-center justify-center">
                {/* Central Charging Station */}
                <div className="relative">
                  <div className="w-32 h-48 bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center">
                      <Zap className="w-8 h-8 text-white animate-pulse" />
                    </div>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-20 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-bold text-white">AVAILABLE</span>
                    </div>
                  </div>

                  {/* Electric Arcs */}
                  <div className="absolute -top-8 -left-8 w-16 h-16 border-2 border-cyan-400 rounded-full animate-ping opacity-75"></div>
                  <div className="absolute -bottom-8 -right-8 w-12 h-12 border-2 border-purple-400 rounded-full animate-ping opacity-50 animation-delay-1000"></div>
                  <div className="absolute top-1/2 -right-12 w-8 h-8 border-2 border-green-400 rounded-full animate-ping opacity-60 animation-delay-2000"></div>
                </div>

                {/* Floating Elements */}
                <div className="absolute top-8 right-8 w-24 h-16 bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700 p-3 transform hover:scale-110 transition-transform duration-300">
                  <div className="text-xs text-gray-400">Fast Charging</div>
                  <div className="text-lg font-bold text-cyan-400">150kW</div>
                </div>

                <div className="absolute bottom-8 left-8 w-28 h-16 bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700 p-3 transform hover:scale-110 transition-transform duration-300">
                  <div className="text-xs text-gray-400">Available Now</div>
                  <div className="text-lg font-bold text-green-400">24/7</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black mb-6">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Why Choose EVConnectNepal?
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Experience the future of EV charging with our comprehensive platform designed for the modern driver
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="group relative bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-gray-700/50 p-8 rounded-3xl hover:border-cyan-500/50 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-cyan-400 transition-colors duration-300">
                  Find Stations
                </h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Discover EV charging stations across Nepal with our interactive map and advanced search features. Real-time availability updates.
                </p>
                <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 p-0 h-auto font-semibold">
                  Explore Map →
                </Button>
              </div>
            </Card>

            {/* Feature 2 */}
            <Card className="group relative bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-gray-700/50 p-8 rounded-3xl hover:border-purple-500/50 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-purple-400 transition-colors duration-300">
                  Smart Booking
                </h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Reserve charging slots in advance with intelligent recommendations. Never worry about availability again.
                </p>
                <Button variant="ghost" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 p-0 h-auto font-semibold">
                  Get Recommendations →
                </Button>
              </div>
            </Card>

            {/* Feature 3 */}
            <Card className="group relative bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-gray-700/50 p-8 rounded-3xl hover:border-green-500/50 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-green-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-green-400 transition-colors duration-300">
                  Track & Manage
                </h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Monitor your charging history and expenses with our personalized dashboard. Complete control at your fingertips.
                </p>
                <Button variant="ghost" className="text-green-400 hover:text-green-300 hover:bg-green-500/10 p-0 h-auto font-semibold">
                  Get Started →
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-green-500/10"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: "500+", label: "Charging Stations", color: "cyan" },
              { number: "50+", label: "Cities Covered", color: "purple" },
              { number: "1000+", label: "Happy Users", color: "green" },
              { number: "24/7", label: "Support", color: "blue" }
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className={`relative inline-block p-8 rounded-3xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-gray-700/50 hover:border-${stat.color}-500/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-${stat.color}-500/20`}>
                  <div className={`absolute inset-0 bg-gradient-to-br from-${stat.color}-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  <div className="relative z-10">
                    <div className={`text-4xl lg:text-5xl font-black mb-2 bg-gradient-to-r from-${stat.color}-400 to-${stat.color}-600 bg-clip-text text-transparent`}>
                      {stat.number}
                    </div>
                    <div className="text-gray-400 font-semibold">
                      {stat.label}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              EVConnectNepal
            </span>
          </div>
          <p className="text-gray-400 mb-6">
            Powering Nepal's sustainable future, one charge at a time.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <Link to="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-cyan-400 transition-colors">Terms of Service</Link>
            <Link to="/contact" className="hover:text-cyan-400 transition-colors">Contact</Link>
            <Link to="/support" className="hover:text-cyan-400 transition-colors">Support</Link>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800/50 text-gray-500 text-sm">
            © 2024 EVConnectNepal. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
