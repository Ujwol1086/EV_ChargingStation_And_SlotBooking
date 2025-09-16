import { useState } from 'react';

const LocationConsentModal = ({ isOpen, onAccept, onDecline, onClose }) => {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleAccept = async () => {
    setIsRequesting(true);
    try {
      // Request location permission
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      onAccept(position);
    } catch (error) {
      console.error('Location access denied or error:', error);
      onDecline(error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDecline = () => {
    onDecline(new Error('User declined location access'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Location Access Required</h2>
              <p className="text-blue-100 text-sm">We need your location to provide better recommendations</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Find Nearby Charging Stations</h3>
                <p className="text-sm text-gray-600">Get personalized recommendations based on your current location</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Calculate Accurate Routes</h3>
                <p className="text-sm text-gray-600">Get precise driving directions to your chosen charging station</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Real-time Availability</h3>
                <p className="text-sm text-gray-600">See which stations are available right now near you</p>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Privacy & Security</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Your location is only used to provide charging station recommendations and is not stored permanently. 
                  You can change this permission anytime in your browser settings.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6">
          <div className="flex gap-3">
            <button
              onClick={handleDecline}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Use Without Location
            </button>
            <button
              onClick={handleAccept}
              disabled={isRequesting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRequesting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Requesting...</span>
                </div>
              ) : (
                'Allow Location Access'
              )}
            </button>
          </div>
          
          <div className="mt-3 text-center">
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationConsentModal;
