import { useState, useEffect } from 'react';
import axios from '../../api/axios';

const AdminStations = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/stations');
      if (response.data.success) {
        setStations(response.data.stations);
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
      // Mock data for development
      setStations([
        {
          id: 'cs001',
          name: 'Kathmandu Central Station',
          location: [27.7172, 85.3240],
          address: 'Thamel, Kathmandu',
          available_slots: 3,
          total_slots: 5,
          pricing_per_kwh: 25,
          rating: 4.5,
          status: 'active',
          connector_types: ['Type 2', 'CCS'],
          features: ['Cafe', 'Restroom', 'WiFi'],
          operating_hours: '24/7'
        },
        {
          id: 'cs002',
          name: 'Pokhara Lakeside Station',
          location: [28.2096, 83.9856],
          address: 'Lakeside, Pokhara',
          available_slots: 2,
          total_slots: 4,
          pricing_per_kwh: 20,
          rating: 4.2,
          status: 'active',
          connector_types: ['Type 2', 'CHAdeMO'],
          features: ['Parking', 'Restroom'],
          operating_hours: '6:00 AM - 10:00 PM'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStation = async (stationData) => {
    try {
      const response = await axios.post('/admin/stations', stationData);
      if (response.data.success) {
        setShowAddModal(false);
        fetchStations();
      }
    } catch (error) {
      console.error('Error adding station:', error);
    }
  };

  const handleEditStation = async (stationId, stationData) => {
    try {
      const response = await axios.put(`/admin/stations/${stationId}`, stationData);
      if (response.data.success) {
        setShowEditModal(false);
        setSelectedStation(null);
        fetchStations();
      }
    } catch (error) {
      console.error('Error updating station:', error);
    }
  };

  const handleDeleteStation = async (stationId) => {
    if (window.confirm('Are you sure you want to delete this station?')) {
      try {
        const response = await axios.delete(`/admin/stations/${stationId}`);
        if (response.data.success) {
          fetchStations();
        }
      } catch (error) {
        console.error('Error deleting station:', error);
      }
    }
  };

  const filteredStations = stations.filter(station => {
    const matchesSearch = station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         station.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || station.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Stations Management</h1>
          <p className="text-gray-600">Manage charging stations across the network</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Station
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search stations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchStations}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStations.map((station) => (
          <div key={station.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Station Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{station.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{station.address}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(station.status)}`}>
                    {station.status}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedStation(station);
                      setShowEditModal(true);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteStation(station.id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Station Details */}
            <div className="p-6 space-y-4">
              {/* Availability */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Availability</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    {station.available_slots}/{station.total_slots}
                  </span>
                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-green-500 rounded-full"
                      style={{ width: `${(station.available_slots / station.total_slots) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pricing</span>
                <span className="text-sm font-medium text-gray-900">
                  Rs. {station.pricing_per_kwh}/kWh
                </span>
              </div>

              {/* Rating */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Rating</span>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900 ml-1">{station.rating}</span>
                </div>
              </div>

              {/* Connector Types */}
              <div>
                <span className="text-sm text-gray-600">Connector Types</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {station.connector_types.map((type) => (
                    <span key={type} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {/* Features */}
              {station.features && station.features.length > 0 && (
                <div>
                  <span className="text-sm text-gray-600">Features</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {station.features.slice(0, 3).map((feature) => (
                      <span key={feature} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {feature}
                      </span>
                    ))}
                    {station.features.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        +{station.features.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Operating Hours */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Operating Hours</span>
                <span className="text-sm font-medium text-gray-900">{station.operating_hours}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredStations.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No stations found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Add Station Modal */}
      {showAddModal && (
        <AddStationModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddStation}
        />
      )}

      {/* Edit Station Modal */}
      {showEditModal && selectedStation && (
        <EditStationModal
          station={selectedStation}
          onClose={() => {
            setShowEditModal(false);
            setSelectedStation(null);
          }}
          onEdit={handleEditStation}
        />
      )}
    </div>
  );
};

// Add Station Modal Component
const AddStationModal = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    total_slots: '',
    pricing_per_kwh: '',
    connector_types: [],
    features: [],
    operating_hours: '24/7',
    status: 'active'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      ...formData,
      location: [parseFloat(formData.latitude), parseFloat(formData.longitude)],
      total_slots: parseInt(formData.total_slots),
      pricing_per_kwh: parseFloat(formData.pricing_per_kwh)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Station</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Station Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.latitude}
                  onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.longitude}
                  onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Slots</label>
                <input
                  type="number"
                  required
                  value={formData.total_slots}
                  onChange={(e) => setFormData({...formData, total_slots: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price per kWh</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.pricing_per_kwh}
                  onChange={(e) => setFormData({...formData, pricing_per_kwh: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Station
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Edit Station Modal Component
const EditStationModal = ({ station, onClose, onEdit }) => {
  const [formData, setFormData] = useState({
    name: station.name,
    address: station.address,
    total_slots: station.total_slots,
    pricing_per_kwh: station.pricing_per_kwh,
    status: station.status,
    operating_hours: station.operating_hours
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onEdit(station.id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Station</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Station Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Slots</label>
                <input
                  type="number"
                  required
                  value={formData.total_slots}
                  onChange={(e) => setFormData({...formData, total_slots: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price per kWh</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.pricing_per_kwh}
                  onChange={(e) => setFormData({...formData, pricing_per_kwh: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operating Hours</label>
                <input
                  type="text"
                  value={formData.operating_hours}
                  onChange={(e) => setFormData({...formData, operating_hours: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Update Station
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminStations; 