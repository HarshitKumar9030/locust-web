const EARTH_RADIUS_KM = 6371;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return EARTH_RADIUS_KM * c;
}

export const GEOFENCE = {
  name: 'Cosmos Greens, Bhiwadi',
  center: { lat: 28.2036569, lng: 76.8400441 },
  radiusKm: 10,
};

export function isInsideGeofence(lat: number, lng: number) {
  const distanceKm = haversineKm({ lat, lng }, GEOFENCE.center);
  return { inside: distanceKm <= GEOFENCE.radiusKm, distanceKm };
}
