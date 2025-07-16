// Function to calculate distance between two coordinates in kilometers
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

// Convert degrees to radians
export const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

// Helper function to get station coordinates
export const getStationCoordinates = (station) => {
  if (!station.location) return null;
  
  if (Array.isArray(station.location)) {
    return station.location;
  } else if (station.location.coordinates && Array.isArray(station.location.coordinates)) {
    return station.location.coordinates;
  }
  return null;
};

// Helper function to format location display
export const formatLocationDisplay = (station) => {
  if (station.location?.address) {
    return station.location.address;
  }
  
  const coords = getStationCoordinates(station);
  if (coords) {
    return `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`;
  }
  
  return 'Location data unavailable';
}; 