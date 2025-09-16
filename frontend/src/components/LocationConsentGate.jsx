import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import useLocationConsent from '../hooks/useLocationConsent';
import LocationConsentModal from './LocationConsentModal';

const LocationConsentGate = () => {
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const {
    locationConsent,
    setManualLocation,
  } = useLocationConsent();

  const [isOpen, setIsOpen] = useState(false);

  // Show once right after login if undecided
  useEffect(() => {
    if (isAuthenticated && locationConsent === null) {
      setIsOpen(true);
    }
  }, [isAuthenticated, locationConsent]);

  // If user clicked "Maybe later", prompt only on Recommendations route
  useEffect(() => {
    if (pathname.startsWith('/recommendations')) {
      const saved = localStorage.getItem('locationConsent');
      if (saved === null) {
        setIsOpen(true);
      }
    }
  }, [pathname]);

  const handleAccept = (position) => {
    try {
      const { latitude, longitude } = position?.coords || {};
      localStorage.setItem('locationConsent', 'granted');
      if (latitude != null && longitude != null) {
        localStorage.setItem('userLocation', JSON.stringify([latitude, longitude]));
        setManualLocation([latitude, longitude]);
      }
    } catch (_) {}
    setIsOpen(false);
  };

  const handleDecline = () => {
    localStorage.setItem('locationConsent', 'denied');
    setIsOpen(false);
  };

  const handleClose = () => {
    // Maybe later: don't persist; allow re-prompt on recommendations
    setIsOpen(false);
  };

  return (
    <LocationConsentModal
      isOpen={isOpen}
      onAccept={handleAccept}
      onDecline={handleDecline}
      onClose={handleClose}
    />
  );
};

export default LocationConsentGate;


