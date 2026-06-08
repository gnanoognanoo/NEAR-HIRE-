/**
 * Location service — GPS, distance calculations, and geohash utilities
 */

// Default fallback: New Delhi, India
export const DEFAULT_LOCATION = { lat: 28.6139, lng: 77.2090 };

/**
 * Get current GPS position as a Promise
 */
export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Get location with fallback to default
 */
export const getLocationWithFallback = async () => {
  try {
    return await getCurrentPosition();
  } catch {
    return DEFAULT_LOCATION;
  }
};

/**
 * Haversine distance between two coordinates in kilometers
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg) => deg * (Math.PI / 180);

/**
 * Format distance for display
 */
export const formatDistance = (distanceKm) => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)} km`;
};

/**
 * Simple geohash encoding for Firestore geo queries.
 * Uses ngeohash if available, otherwise a simple bounding box approach.
 */
export const getGeoBoundingBox = (lat, lng, radiusKm) => {
  // Approximate: 1 degree latitude ≈ 111 km
  const latDelta = radiusKm / 111.0;
  // 1 degree longitude ≈ 111 * cos(lat) km
  const lngDelta = radiusKm / (111.0 * Math.cos(lat * Math.PI / 180));

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
};

/**
 * Filter jobs by distance from a center point
 */
export const filterByRadius = (items, centerLat, centerLng, radiusKm) => {
  return items
    .map((item) => {
      const distance = calculateDistance(
        centerLat,
        centerLng,
        item.location?.lat || 0,
        item.location?.lng || 0
      );
      return { ...item, distance };
    })
    .filter((item) => item.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
};
