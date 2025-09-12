import { useState, useEffect } from 'react';
import axios from '../../api/axios';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    system: {
      siteName: 'EVConnect Nepal',
      siteDescription: 'Electric Vehicle Charging Station Network',
      maintenanceMode: false,
      maxBookingDuration: 120,
      minBookingDuration: 30,
      defaultPricing: 12.0,
      currency: 'NPR',
      timezone: 'Asia/Kathmandu'
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      bookingConfirmations: true,
      paymentReminders: true,
      systemAlerts: true
    },
    payment: {
      khaltiEnabled: true,
      khaltiPublicKey: '',
      khaltiSecretKey: '',
      paymentTimeout: 300,
      refundPolicy: '24 hours'
    },
    charging: {
      defaultChargerTypes: ['CCS2', 'GBT'],
      maxPowerOutput: 60,
      minPowerOutput: 22,
      safetyChecks: true,
      autoDisconnect: true
    },
    security: {
      sessionTimeout: 3600,
      maxLoginAttempts: 5,
      requireStrongPasswords: true,
      twoFactorAuth: false,
      ipWhitelist: []
    }
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/settings');
      if (response.data.success) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await axios.put('/admin/settings', settings);
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully' });
      } else {
        setMessage({ type: 'error', text: response.data.error || 'Failed to save settings' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleArrayChange = (section, field, value) => {
    const arrayValue = value.split(',').map(item => item.trim()).filter(item => item);
    handleInputChange(section, field, arrayValue);
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
          <h1 className="text-3xl font-bold text-gray-800">System Settings</h1>
          <p className="text-gray-600">Configure your EV charging network settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg flex items-center space-x-2"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">System Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
              <input
                type="text"
                value={settings.system.siteName}
                onChange={(e) => handleInputChange('system', 'siteName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Description</label>
              <textarea
                value={settings.system.siteDescription}
                onChange={(e) => handleInputChange('system', 'siteDescription', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="maintenanceMode"
                checked={settings.system.maintenanceMode}
                onChange={(e) => handleInputChange('system', 'maintenanceMode', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-700">
                Maintenance Mode
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Booking Duration (min)</label>
                <input
                  type="number"
                  value={settings.system.maxBookingDuration}
                  onChange={(e) => handleInputChange('system', 'maxBookingDuration', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Booking Duration (min)</label>
                <input
                  type="number"
                  value={settings.system.minBookingDuration}
                  onChange={(e) => handleInputChange('system', 'minBookingDuration', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Pricing (NPR/kWh)</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.system.defaultPricing}
                  onChange={(e) => handleInputChange('system', 'defaultPricing', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  value={settings.system.currency}
                  onChange={(e) => handleInputChange('system', 'currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="NPR">NPR (Nepalese Rupee)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="INR">INR (Indian Rupee)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Notification Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailNotifications"
                checked={settings.notifications.emailNotifications}
                onChange={(e) => handleInputChange('notifications', 'emailNotifications', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-700">
                Email Notifications
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="smsNotifications"
                checked={settings.notifications.smsNotifications}
                onChange={(e) => handleInputChange('notifications', 'smsNotifications', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="smsNotifications" className="ml-2 block text-sm text-gray-700">
                SMS Notifications
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="bookingConfirmations"
                checked={settings.notifications.bookingConfirmations}
                onChange={(e) => handleInputChange('notifications', 'bookingConfirmations', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="bookingConfirmations" className="ml-2 block text-sm text-gray-700">
                Booking Confirmations
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="paymentReminders"
                checked={settings.notifications.paymentReminders}
                onChange={(e) => handleInputChange('notifications', 'paymentReminders', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="paymentReminders" className="ml-2 block text-sm text-gray-700">
                Payment Reminders
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="systemAlerts"
                checked={settings.notifications.systemAlerts}
                onChange={(e) => handleInputChange('notifications', 'systemAlerts', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="systemAlerts" className="ml-2 block text-sm text-gray-700">
                System Alerts
              </label>
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Configuration</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="khaltiEnabled"
                checked={settings.payment.khaltiEnabled}
                onChange={(e) => handleInputChange('payment', 'khaltiEnabled', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="khaltiEnabled" className="ml-2 block text-sm text-gray-700">
                Enable Khalti Payment
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Khalti Public Key</label>
              <input
                type="text"
                value={settings.payment.khaltiPublicKey}
                onChange={(e) => handleInputChange('payment', 'khaltiPublicKey', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter Khalti public key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Khalti Secret Key</label>
              <input
                type="password"
                value={settings.payment.khaltiSecretKey}
                onChange={(e) => handleInputChange('payment', 'khaltiSecretKey', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter Khalti secret key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Timeout (seconds)</label>
              <input
                type="number"
                value={settings.payment.paymentTimeout}
                onChange={(e) => handleInputChange('payment', 'paymentTimeout', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Refund Policy</label>
              <select
                value={settings.payment.refundPolicy}
                onChange={(e) => handleInputChange('payment', 'refundPolicy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="24 hours">24 hours</option>
                <option value="48 hours">48 hours</option>
                <option value="7 days">7 days</option>
                <option value="No refunds">No refunds</option>
              </select>
            </div>
          </div>
        </div>

        {/* Charging Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Charging Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Charger Types</label>
              <input
                type="text"
                value={settings.charging.defaultChargerTypes.join(', ')}
                onChange={(e) => handleArrayChange('charging', 'defaultChargerTypes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="CCS2, GBT"
              />
              <p className="text-xs text-gray-500 mt-1">Separate multiple types with commas</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Power Output (kW)</label>
                <input
                  type="number"
                  value={settings.charging.maxPowerOutput}
                  onChange={(e) => handleInputChange('charging', 'maxPowerOutput', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Power Output (kW)</label>
                <input
                  type="number"
                  value={settings.charging.minPowerOutput}
                  onChange={(e) => handleInputChange('charging', 'minPowerOutput', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="safetyChecks"
                checked={settings.charging.safetyChecks}
                onChange={(e) => handleInputChange('charging', 'safetyChecks', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="safetyChecks" className="ml-2 block text-sm text-gray-700">
                Enable Safety Checks
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoDisconnect"
                checked={settings.charging.autoDisconnect}
                onChange={(e) => handleInputChange('charging', 'autoDisconnect', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autoDisconnect" className="ml-2 block text-sm text-gray-700">
                Auto Disconnect After Charging
              </label>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Security Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (seconds)</label>
              <input
                type="number"
                value={settings.security.sessionTimeout}
                onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Login Attempts</label>
              <input
                type="number"
                value={settings.security.maxLoginAttempts}
                onChange={(e) => handleInputChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="requireStrongPasswords"
                checked={settings.security.requireStrongPasswords}
                onChange={(e) => handleInputChange('security', 'requireStrongPasswords', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="requireStrongPasswords" className="ml-2 block text-sm text-gray-700">
                Require Strong Passwords
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="twoFactorAuth"
                checked={settings.security.twoFactorAuth}
                onChange={(e) => handleInputChange('security', 'twoFactorAuth', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="twoFactorAuth" className="ml-2 block text-sm text-gray-700">
                Enable Two-Factor Authentication
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IP Whitelist</label>
              <textarea
                value={settings.security.ipWhitelist.join('\n')}
                onChange={(e) => handleInputChange('security', 'ipWhitelist', e.target.value.split('\n').filter(ip => ip.trim()))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter IP addresses, one per line"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to allow all IPs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
