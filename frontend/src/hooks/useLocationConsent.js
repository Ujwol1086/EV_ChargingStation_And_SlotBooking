import { useState, useEffect, useCallback } from 'react';

const useLocationConsent = () => {
  // Initialize from localStorage synchronously to avoid a frame where it's null
  const initialConsent = (() => {
    const saved = localStorage.getItem('locationConsent');
    if (saved === 'granted') return true;
    if (saved === 'denied') return false;
    return null;
  })();
  const initialLocation = (() => {
    try {
      const saved = localStorage.getItem('userLocation');
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  })();

  const [locationConsent, setLocationConsent] = useState(initialConsent); // null = not asked, true = granted, false = denied
  const [userLocation, setUserLocation] = useState(initialLocation);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Keep state in sync if other parts of app update localStorage directly
  useEffect(() => {
    const handler = () => {
      const savedConsent = localStorage.getItem('locationConsent');
      setLocationConsent(savedConsent === 'granted' ? true : savedConsent === 'denied' ? false : null);
      try {
        const savedLoc = localStorage.getItem('userLocation');
        setUserLocation(savedLoc ? JSON.parse(savedLoc) : null);
      } catch (_) {}
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Request location access
  const requestLocationAccess = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      setLocationConsent(false);
      return false;
    }

    setIsRequestingLocation(true);
    setLocationError(null);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      const location = [latitude, longitude];
      
      setUserLocation(location);
      setLocationConsent(true);
      localStorage.setItem('locationConsent', 'granted');
      try { localStorage.setItem('userLocation', JSON.stringify(location)); } catch (_) {}
      return true;
    } catch (error) {
      console.error('Location access error:', error);
      setLocationError(error.message);
      setLocationConsent(false);
      localStorage.setItem('locationConsent', 'denied');
      return false;
    } finally {
      setIsRequestingLocation(false);
    }
  }, []);

  // Manually set location (for when user declines but wants to use coordinates)
  const setManualLocation = useCallback((coordinates) => {
    setUserLocation(coordinates);
    setLocationConsent(false); // User declined but provided manual location
    setLocationError(null);
    try { localStorage.setItem('userLocation', JSON.stringify(coordinates)); } catch (_) {}
  }, []);

  // Clear location data
  const clearLocation = useCallback(() => {
    setUserLocation(null);
    setLocationConsent(null);
    setLocationError(null);
    localStorage.removeItem('locationConsent');
    localStorage.removeItem('userLocation');
  }, []);

  // Check if location is available (either granted or manually set)
  const hasLocation = userLocation !== null;

  // Check if we need to show consent modal
  const needsConsent = locationConsent === null;

  return {
    locationConsent,
    userLocation,
    isRequestingLocation,
    locationError,
    hasLocation,
    needsConsent,
    requestLocationAccess,
    setManualLocation,
    clearLocation
  };
};

export default useLocationConsent;
