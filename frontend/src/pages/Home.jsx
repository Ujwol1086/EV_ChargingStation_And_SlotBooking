import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { MapPin, Smartphone, BarChart3, Zap, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

export default function EVConnectNepal() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
            transform: `translateY(${scrollY * 0.3}px) translateX(${
              scrollY * 0.1
            }px)`,
          }}
        ></div>

        {/* Layer 3 - Fastest */}
        <div
          className="absolute w-96 h-96 bg-gradient-radial from-cyan-500/25 to-transparent rounded-full blur-3xl transition-all duration-1000 ease-out"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192 + scrollY * 0.5,
          }}
        ></div>

        {/* Floating Geometric Shapes */}
        <div
          className="absolute top-20 left-20 w-32 h-32 border border-cyan-500/20 rounded-full animate-spin"
          style={{
            transform: `translateY(${scrollY * 0.2}px)`,
            animationDuration: "20s",
          }}
        ></div>

        <div
          className="absolute top-40 right-32 w-24 h-24 border border-purple-500/20 rotate-45"
          style={{
            transform: `translateY(${scrollY * 0.4}px) rotate(${
              scrollY * 0.1
            }deg)`,
          }}
        ></div>

        <div
          className="absolute bottom-40 left-40 w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg"
          style={{
            transform: `translateY(${scrollY * -0.3}px)`,
          }}
        ></div>
      </div>

      {/* Navbar is globally rendered in App.jsx; removed page-specific header to avoid duplication */}

      {/* Hero Section */}
      <section className="relative pt-28 lg:pt-24 pb-24 px-8">
        <div className="max-w-[95%] mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-12">
              <div className="space-y-10">
                <h1 className="text-8xl lg:text-9xl font-black leading-[1.05]">
                  <span className="bg-gradient-to-r from-gray-100 via-cyan-200 to-purple-200 bg-clip-text text-transparent">
                    Power Your
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-green-400 bg-clip-text text-transparent animate-pulse">
                    Journey
                  </span>
                </h1>
                <p className="text-3xl text-gray-300 leading-relaxed max-w-3xl">
                  Nepal's most advanced EV charging network - intelligent,
                  instant, everywhere. Experience the future of sustainable
                  transportation.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-8">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-16 py-8 rounded-2xl font-bold text-3xl transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-cyan-500/25"
                  asChild
                >
                  <Link to="/stations">
                    <MapPin className="w-8 h-8 mr-4" />
                    Browse Stations
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-green-500 text-green-400 hover:bg-green-500 hover:text-white px-16 py-8 rounded-2xl font-bold text-3xl transform hover:scale-105 transition-all duration-300 bg-transparent backdrop-blur-sm"
                >
                  <Zap className="w-8 h-8 mr-4" />
                  Smart Recommendations
                </Button>
              </div>
            </div>

            {/* Right Content - Interactive SVG Visual */}
            <div className="relative flex items-center justify-center">
              <div className="relative w-full max-w-5xl xl:max-w-6xl h-[760px] xl:h-[880px] flex items-center justify-center group overflow-hidden lg:translate-x-8 xl:translate-x-12">
                <svg
                  width="600"
                  height="500"
                  viewBox="0 0 600 500"
                  className="w-full h-full pointer-events-none select-none"
                >
                  <defs>
                    <linearGradient
                      id="deviceGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#1f2937" />
                      <stop offset="100%" stopColor="#111827" />
                    </linearGradient>
                    <linearGradient
                      id="screenGlow"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="50%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                    <linearGradient
                      id="energyFlow"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter id="shadow">
                      <feDropShadow
                        dx="0"
                        dy="8"
                        stdDeviation="12"
                        floodColor="#000000"
                        floodOpacity="0.4"
                      />
                    </filter>
                  </defs>
                  <g className="main-interface" transform="translate(150, 50)">
                    <rect
                      x="0"
                      y="0"
                      width="300"
                      height="400"
                      rx="24"
                      fill="url(#deviceGradient)"
                      stroke="url(#screenGlow)"
                      strokeWidth="3"
                      filter="url(#shadow)"
                    >
                      <animate
                        attributeName="opacity"
                        values="0.9;1;0.9"
                        dur="4s"
                        repeatCount="indefinite"
                      />
                    </rect>
                    <rect
                      x="15"
                      y="20"
                      width="270"
                      height="360"
                      rx="20"
                      fill="#000000"
                      opacity="0.95"
                    />
                    <rect
                      x="25"
                      y="30"
                      width="250"
                      height="50"
                      rx="12"
                      fill="url(#screenGlow)"
                      opacity="0.9"
                    >
                      <animate
                        attributeName="opacity"
                        values="0.7;1;0.7"
                        dur="3s"
                        repeatCount="indefinite"
                      />
                    </rect>
                    <circle cx="50" cy="55" r="12" fill="#06b6d4" opacity="0.9">
                      <animate
                        attributeName="opacity"
                        values="0.7;1;0.7"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <path
                      d="M 44 48 L 52 56 L 48 56 L 56 64 L 48 56 L 52 56 Z"
                      fill="white"
                      opacity="0.9"
                    />
                    <text
                      x="75"
                      y="50"
                      fill="white"
                      fontSize="14"
                      fontWeight="bold"
                    >
                      EVConnectNepal
                    </text>
                    <text x="75" y="65" fill="#9ca3af" fontSize="10">
                      Smart EV Charging Network
                    </text>
                    <rect
                      x="25"
                      y="90"
                      width="250"
                      height="180"
                      rx="12"
                      fill="#1f2937"
                      stroke="#374151"
                      strokeWidth="2"
                    />
                    {/* Map Grid Lines */}
                    {[0, 1, 2, 3, 4].map((i) => (
                      <g key={i}>
                        <line
                          x1="25"
                          y1={90 + i * 36}
                          x2="275"
                          y2={90 + i * 36}
                          stroke="#374151"
                          strokeWidth="1"
                          opacity="0.3"
                        />
                        <line
                          x1={25 + i * 50}
                          y1="90"
                          x2={25 + i * 50}
                          y2="270"
                          stroke="#374151"
                          strokeWidth="1"
                          opacity="0.3"
                        />
                      </g>
                    ))}
                    {/* Charging Stations */}
                    {[
                      { x: 60, y: 130, name: "Kathmandu Central", delay: "0s" },
                      { x: 120, y: 150, name: "Pokhara Hub", delay: "0.5s" },
                      { x: 180, y: 120, name: "Chitwan Station", delay: "1s" },
                      {
                        x: 220,
                        y: 180,
                        name: "Bhaktapur Point",
                        delay: "1.5s",
                      },
                      { x: 100, y: 200, name: "Lalitpur Center", delay: "2s" },
                      { x: 240, y: 140, name: "Biratnagar Hub", delay: "2.5s" },
                    ].map((station, index) => (
                      <g key={index}>
                        <circle
                          cx={station.x}
                          cy={station.y}
                          r="6"
                          fill="#10b981"
                          opacity="0"
                          filter="url(#glow)"
                        >
                          <animate
                            attributeName="opacity"
                            values="0;1;0.8;1"
                            dur="4s"
                            repeatCount="indefinite"
                            begin={station.delay}
                          />
                          <animate
                            attributeName="r"
                            values="4;8;6;8"
                            dur="4s"
                            repeatCount="indefinite"
                            begin={station.delay}
                          />
                        </circle>
                        <circle
                          cx={station.x}
                          cy={station.y}
                          r="12"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2"
                          opacity="0"
                        >
                          <animate
                            attributeName="opacity"
                            values="0;0.6;0"
                            dur="4s"
                            repeatCount="indefinite"
                            begin={station.delay}
                          />
                          <animate
                            attributeName="r"
                            values="8;20;8"
                            dur="4s"
                            repeatCount="indefinite"
                            begin={station.delay}
                          />
                        </circle>
                        <path
                          d={`M ${station.x - 3} ${station.y - 2} L ${
                            station.x + 1
                          } ${station.y + 2} L ${station.x - 1} ${
                            station.y + 2
                          } L ${station.x + 3} ${station.y + 6} L ${
                            station.x - 1
                          } ${station.y + 2} L ${station.x + 1} ${
                            station.y + 2
                          } Z`}
                          fill="white"
                          opacity="0"
                        >
                          <animate
                            attributeName="opacity"
                            values="0;1;0.9;1"
                            dur="4s"
                            repeatCount="indefinite"
                            begin={station.delay}
                          />
                        </path>
                      </g>
                    ))}
                    <path
                      d="M 60 130 Q 90 140 120 150 Q 150 135 180 120 Q 200 130 220 180 Q 160 190 100 200"
                      fill="none"
                      stroke="url(#energyFlow)"
                      strokeWidth="3"
                      strokeDasharray="8,4"
                      opacity="0.6"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        values="0;-24;0"
                        dur="6s"
                        repeatCount="indefinite"
                      />
                    </path>
                    <rect
                      x="25"
                      y="280"
                      width="250"
                      height="90"
                      rx="12"
                      fill="#1f2937"
                      stroke="#374151"
                      strokeWidth="1"
                    />
                    <g className="stats-grid">
                      {[
                        {
                          x: 35,
                          label: "Active Stations",
                          value: "80+",
                          color: "#10b981",
                        },
                        {
                          x: 95,
                          label: "Available Now",
                          value: "24",
                          color: "#06b6d4",
                        },
                        {
                          x: 155,
                          label: "Total Users",
                          value: "1.2K",
                          color: "#8b5cf6",
                        },
                        {
                          x: 215,
                          label: "Cities",
                          value: "15",
                          color: "#f59e0b",
                        },
                      ].map((stat, index) => (
                        <g key={index}>
                          <rect
                            x={stat.x}
                            y="290"
                            width="50"
                            height="35"
                            rx="6"
                            fill="#374151"
                            opacity="0.8"
                          />
                          <text
                            x={stat.x + 25}
                            y="305"
                            textAnchor="middle"
                            fill={stat.color}
                            fontSize="16"
                            fontWeight="bold"
                            opacity="0"
                          >
                            {stat.value}
                            <animate
                              attributeName="opacity"
                              values="0;1;0.9;1"
                              dur="3s"
                              repeatCount="indefinite"
                              begin={`${index * 0.5}s`}
                            />
                          </text>
                          <text
                            x={stat.x + 25}
                            y="318"
                            textAnchor="middle"
                            fill="#9ca3af"
                            fontSize="7"
                            opacity="0.8"
                          >
                            {stat.label}
                          </text>
                        </g>
                      ))}
                    </g>
                    <g className="activity-feed">
                      {[
                        {
                          y: 335,
                          text: "New station: Kathmandu Mall",
                          time: "2m ago",
                        },
                        {
                          y: 350,
                          text: "Charging complete: User #1234",
                          time: "5m ago",
                        },
                        {
                          y: 365,
                          text: "Station online: Pokhara Hub",
                          time: "8m ago",
                        },
                      ].map((activity, index) => (
                        <g key={index} opacity="0">
                          <circle
                            cx="35"
                            cy={activity.y}
                            r="3"
                            fill="#10b981"
                          />
                          <text
                            x="45"
                            y={activity.y + 2}
                            fill="white"
                            fontSize="8"
                          >
                            {activity.text}
                          </text>
                          <text
                            x="245"
                            y={activity.y + 2}
                            fill="#6b7280"
                            fontSize="7"
                            textAnchor="end"
                          >
                            {activity.time}
                          </text>
                          <animate
                            attributeName="opacity"
                            values="0;1;0.9;1"
                            dur="2s"
                            repeatCount="indefinite"
                            begin={`${index * 0.8}s`}
                          />
                        </g>
                      ))}
                    </g>
                  </g>
                  <g className="side-panels">
                    <g transform="translate(50, 150)" className="pointer-events-none">
                      <rect
                        x="0"
                        y="0"
                        width="80"
                        height="120"
                        rx="12"
                        fill="url(#deviceGradient)"
                        opacity="0.95"
                        filter="url(#shadow)"
                      >
                        <animateTransform
                          attributeName="transform"
                          type="translate"
                          values="0,0; 3,-3; 0,0"
                          dur="8s"
                          repeatCount="indefinite"
                        />
                      </rect>
                      <text
                        x="40"
                        y="20"
                        textAnchor="middle"
                        fill="#06b6d4"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        Quick Actions
                      </text>
                      {["Find Station", "Book Slot", "View History"].map(
                        (action, index) => (
                          <g key={index}>
                            <rect
                              x="10"
                              y={30 + index * 25}
                              width="60"
                              height="20"
                              rx="6"
                              fill="#374151"
                              opacity="0"
                            >
                              <animate
                                attributeName="opacity"
                                values="0;0.8;0.6;0.8"
                                dur="3s"
                                repeatCount="indefinite"
                                begin={`${index * 0.5}s`}
                              />
                            </rect>
                            <text
                              x="40"
                              y={42 + index * 25}
                              textAnchor="middle"
                              fill="white"
                              fontSize="7"
                              opacity="0"
                            >
                              {action}
                              <animate
                                attributeName="opacity"
                                values="0;1;0.9;1"
                                dur="3s"
                                repeatCount="indefinite"
                                begin={`${index * 0.5}s`}
                              />
                            </text>
                          </g>
                        )
                      )}
                    </g>
                    <g transform="translate(470, 180)" className="pointer-events-none">
                      <rect
                        x="0"
                        y="0"
                        width="100"
                        height="140"
                        rx="12"
                        fill="url(#deviceGradient)"
                        opacity="0.95"
                        filter="url(#shadow)"
                      >
                        <animateTransform
                          attributeName="transform"
                          type="translate"
                          values="0,0; -2,2; 0,0"
                          dur="7s"
                          repeatCount="indefinite"
                        />
                      </rect>
                      <text
                        x="50"
                        y="20"
                        textAnchor="middle"
                        fill="#8b5cf6"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        Live Metrics
                      </text>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <rect
                          key={i}
                          x={20 + i * 10}
                          y={80 - i * 8}
                          width="6"
                          height={20 + i * 8}
                          fill="url(#energyFlow)"
                          opacity="0"
                        >
                          <animate
                            attributeName="opacity"
                            values="0;0.8;0.6;0.8"
                            dur="4s"
                            repeatCount="indefinite"
                            begin={`${i * 0.3}s`}
                          />
                          <animate
                            attributeName="height"
                            values={`${15 + i * 6};${25 + i * 10};${
                              15 + i * 6
                            }`}
                            dur="4s"
                            repeatCount="indefinite"
                            begin={`${i * 0.3}s`}
                          />
                        </rect>
                      ))}
                      <text
                        x="50"
                        y="115"
                        textAnchor="middle"
                        fill="#9ca3af"
                        fontSize="8"
                      >
                        Network Uptime
                      </text>
                      <text
                        x="50"
                        y="130"
                        textAnchor="middle"
                        fill="#10b981"
                        fontSize="12"
                        fontWeight="bold"
                      >
                        94%
                        <animate
                          attributeName="opacity"
                          values="0;1;0.9;1"
                          dur="3s"
                          repeatCount="indefinite"
                          begin="0s"
                        />
                      </text>
                    </g>
                  </g>
                  <g className="connections" opacity="0.4">
                    <path
                      d="M 130 220 Q 150 200 170 220"
                      fill="none"
                      stroke="url(#energyFlow)"
                      strokeWidth="2"
                      strokeDasharray="4,4"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        values="0;-16;0"
                        dur="4s"
                        repeatCount="indefinite"
                      />
                    </path>
                    <path
                      d="M 450 250 Q 430 230 410 250"
                      fill="none"
                      stroke="url(#energyFlow)"
                      strokeWidth="2"
                      strokeDasharray="4,4"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        values="0;-16;0"
                        dur="4s"
                        repeatCount="indefinite"
                        begin="1s"
                      />
                    </path>
                  </g>
                </svg>
                {/* Enhanced CSS Animations */}
                <style>
                  {`
                    .main-interface:hover {
                      transform: none;
                      transition: none;
                    }
                    .side-panels > g:hover {
                      transform: none;
                      transition: none;
                    }
                    @keyframes pulse {
                      0%, 100% { opacity: 0.8; }
                      50% { opacity: 1; }
                    }
                    .stats-grid {
                      animation: pulse 3s ease-in-out infinite;
                    }
                  `}
                </style>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-8 relative">
        <div className="max-w-[95%] mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-6xl font-black mb-8">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Why Choose EVConnectNepal?
              </span>
            </h2>
            <p className="text-2xl text-gray-400 max-w-4xl mx-auto">
              Experience the future of EV charging with our comprehensive
              platform designed for the modern driver
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <Card className="group relative bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-gray-700/50 p-10 rounded-3xl hover:border-cyan-500/50 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-6 text-white group-hover:text-cyan-400 transition-colors duration-300">
                  Find Stations
                </h3>
                <p className="text-gray-400 mb-8 leading-relaxed text-lg">
                  Discover EV charging stations across Nepal with our
                  interactive map and advanced search features. Real-time
                  availability updates.
                </p>
                <Button
                  variant="ghost"
                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 p-0 h-auto font-semibold text-lg"
                >
                  Explore Map →
                </Button>
              </div>
            </Card>

            {/* Feature 2 */}
            <Card className="group relative bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-gray-700/50 p-10 rounded-3xl hover:border-purple-500/50 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                  <Smartphone className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-6 text-white group-hover:text-purple-400 transition-colors duration-300">
                  Smart Booking
                </h3>
                <p className="text-gray-400 mb-8 leading-relaxed text-lg">
                  Reserve charging slots in advance with intelligent
                  recommendations. Never worry about availability again.
                </p>
                <Button
                  variant="ghost"
                  className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 p-0 h-auto font-semibold text-lg"
                >
                  Get Recommendations →
                </Button>
              </div>
            </Card>

            {/* Feature 3 */}
            <Card className="group relative bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-gray-700/50 p-10 rounded-3xl hover:border-green-500/50 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-green-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-6 text-white group-hover:text-green-400 transition-colors duration-300">
                  Track & Manage
                </h3>
                <p className="text-gray-400 mb-8 leading-relaxed text-lg">
                  Monitor your charging history and expenses with our
                  personalized dashboard. Complete control at your fingertips.
                </p>
                <Button
                  variant="ghost"
                  className="text-green-400 hover:text-green-300 hover:bg-green-500/10 p-0 h-auto font-semibold text-lg"
                >
                  Get Started →
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-green-500/10"></div>
        <div className="max-w-[95%] mx-auto relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { number: "500+", label: "Charging Stations", color: "cyan" },
              { number: "50+", label: "Cities Covered", color: "purple" },
              { number: "1000+", label: "Happy Users", color: "green" },
              { number: "24/7", label: "Support", color: "blue" },
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div
                  className={`relative inline-block p-10 rounded-3xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-gray-700/50 hover:border-${stat.color}-500/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-${stat.color}-500/20`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br from-${stat.color}-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  ></div>
                  <div className="relative z-10">
                    <div
                      className={`text-5xl lg:text-6xl font-black mb-3 bg-gradient-to-r from-${stat.color}-400 to-${stat.color}-600 bg-clip-text text-transparent`}
                    >
                      {stat.number}
                    </div>
                    <div className="text-gray-400 font-semibold text-lg">
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
      <footer className="py-16 px-8 border-t border-gray-800/50">
        <div className="max-w-[95%] mx-auto text-center">
          <div className="flex items-center justify-center space-x-4 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              EVConnectNepal
            </span>
          </div>
          <p className="text-gray-400 mb-8 text-lg">
            Powering Nepal's sustainable future, one charge at a time.
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-base text-gray-500">
            <Link
              to="/privacy"
              className="hover:text-cyan-400 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-cyan-400 transition-colors">
              Terms of Service
            </Link>
            <Link
              to="/contact"
              className="hover:text-cyan-400 transition-colors"
            >
              Contact
            </Link>
            <Link
              to="/support"
              className="hover:text-cyan-400 transition-colors"
            >
              Support
            </Link>
          </div>
          <div className="mt-10 pt-10 border-t border-gray-800/50 text-gray-500 text-base">
            © 2024 EVConnectNepal. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
