import { useState, useEffect } from 'react';
import axios from '../api/axios';

const StationFilterDropdown = ({ onFiltersChange, onSearchChange }) => {
  const [filterOptions, setFilterOptions] = useState({
    companies: [],
    cities: [],
    provinces: [],
    connector_types: [],
    features: [],
    total_stations: 0
  });
  
  const [filters, setFilters] = useState({
    company: '',
    city: '',
    province: '',
    connector_type: '',
    feature: '',
    min_rating: '',
    max_price: '',
    available_only: false,
    search_term: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/stations/filter-options');
      if (response.data.success) {
        setFilterOptions(response.data.filter_options);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSearchChange = (value) => {
    const newFilters = { ...filters, search_term: value };
    setFilters(newFilters);
    onSearchChange(value);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      company: '',
      city: '',
      province: '',
      connector_type: '',
      feature: '',
      min_rating: '',
      max_price: '',
      available_only: false,
      search_term: ''
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== false
  );

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-700 rounded mb-4"></div>
          <div className="h-10 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 mb-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Filter Charging Stations</h3>
          <p className="text-gray-300 text-sm">
            {filterOptions.total_stations} stations available • Find your perfect charging spot
          </p>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl hover:from-red-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 text-sm"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search stations by name, location, or city..."
            value={filters.search_term}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-4 py-3 pl-12 bg-gray-800/50 border border-gray-600/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300"
          />
          <svg 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Basic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Company Filter */}
        <div>
          <label className="block text-sm font-medium text-cyan-400 mb-2">Company</label>
          <select
            value={filters.company}
            onChange={(e) => handleFilterChange('company', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300"
          >
            <option value="">All Companies</option>
            {filterOptions.companies.map(company => (
              <option key={company} value={company}>{company}</option>
            ))}
          </select>
        </div>

        {/* City Filter */}
        <div>
          <label className="block text-sm font-medium text-cyan-400 mb-2">City</label>
          <select
            value={filters.city}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300"
          >
            <option value="">All Cities</option>
            {filterOptions.cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Province Filter */}
        <div>
          <label className="block text-sm font-medium text-cyan-400 mb-2">Province</label>
          <select
            value={filters.province}
            onChange={(e) => handleFilterChange('province', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300"
          >
            <option value="">All Provinces</option>
            {filterOptions.provinces.map(province => (
              <option key={province} value={province}>{province}</option>
            ))}
          </select>
        </div>

        {/* Connector Type Filter */}
        <div>
          <label className="block text-sm font-medium text-cyan-400 mb-2">Connector Type</label>
          <select
            value={filters.connector_type}
            onChange={(e) => handleFilterChange('connector_type', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300"
          >
            <option value="">All Connectors</option>
            {filterOptions.connector_types.map(connector => (
              <option key={connector} value={connector}>{connector}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="mb-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors duration-300"
        >
          <svg 
            className={`w-4 h-4 transform transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          Advanced Filters
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 bg-gray-800/30 rounded-2xl border border-gray-700/50">
          {/* Feature Filter */}
          <div>
            <label className="block text-sm font-medium text-green-400 mb-2">Features</label>
            <select
              value={filters.feature}
              onChange={(e) => handleFilterChange('feature', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300"
            >
              <option value="">All Features</option>
              {filterOptions.features.map(feature => (
                <option key={feature} value={feature}>{feature}</option>
              ))}
            </select>
          </div>

          {/* Min Rating Filter */}
          <div>
            <label className="block text-sm font-medium text-yellow-400 mb-2">Min Rating</label>
            <select
              value={filters.min_rating}
              onChange={(e) => handleFilterChange('min_rating', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-300"
            >
              <option value="">Any Rating</option>
              <option value="3">3+ Stars</option>
              <option value="4">4+ Stars</option>
              <option value="4.5">4.5+ Stars</option>
            </select>
          </div>

          {/* Max Price Filter */}
          <div>
            <label className="block text-sm font-medium text-purple-400 mb-2">Max Price (NPR/kWh)</label>
            <select
              value={filters.max_price}
              onChange={(e) => handleFilterChange('max_price', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
            >
              <option value="">Any Price</option>
              <option value="12">Under ₹12/kWh</option>
              <option value="15">Under ₹15/kWh</option>
              <option value="18">Under ₹18/kWh</option>
            </select>
          </div>
        </div>
      )}

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => handleFilterChange('available_only', !filters.available_only)}
          className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-300 ${
            filters.available_only
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-2xl shadow-green-500/25'
              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border border-gray-600/50'
          }`}
        >
          <span className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${filters.available_only ? 'bg-green-400' : 'bg-gray-400'}`}></span>
            Available Only
          </span>
        </button>

        <button
          onClick={() => handleFilterChange('min_rating', filters.min_rating === '4' ? '' : '4')}
          className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-300 ${
            filters.min_rating === '4'
              ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-2xl shadow-yellow-500/25'
              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border border-gray-600/50'
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="text-yellow-400">★</span>
            4+ Stars
          </span>
        </button>

        <button
          onClick={() => handleFilterChange('max_price', filters.max_price === '15' ? '' : '15')}
          className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-300 ${
            filters.max_price === '15'
              ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-2xl shadow-purple-500/25'
              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border border-gray-600/50'
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="text-purple-400">₹</span>
            Under ₹15/kWh
          </span>
        </button>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 p-3 bg-gray-800/30 rounded-2xl border border-gray-700/50">
          <p className="text-sm text-gray-300 mb-2">Active Filters:</p>
          <div className="flex flex-wrap gap-2">
            {filters.company && (
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-xl border border-cyan-500/30">
                Company: {filters.company}
              </span>
            )}
            {filters.city && (
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-xl border border-cyan-500/30">
                City: {filters.city}
              </span>
            )}
            {filters.province && (
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-xl border border-cyan-500/30">
                Province: {filters.province}
              </span>
            )}
            {filters.connector_type && (
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-xl border border-cyan-500/30">
                Connector: {filters.connector_type}
              </span>
            )}
            {filters.feature && (
              <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs rounded-xl border border-green-500/30">
                Feature: {filters.feature}
              </span>
            )}
            {filters.min_rating && (
              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-xl border border-yellow-500/30">
                Rating: {filters.min_rating}+
              </span>
            )}
            {filters.max_price && (
              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-xl border border-purple-500/30">
                Price: Under ₹{filters.max_price}/kWh
              </span>
            )}
            {filters.available_only && (
              <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs rounded-xl border border-green-500/30">
                Available Only
              </span>
            )}
            {filters.search_term && (
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-xl border border-blue-500/30">
                Search: "{filters.search_term}"
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StationFilterDropdown;
