export const OUT_OF_RANGE_KM = 3;

// Bounding box for the Jerusalem metro area — coords outside this are rejected as noise/demo artifacts
export const JER_CENTER = { lat: 31.7716, lon: 35.2137 };
const JER_BOUNDS = { latMin: 31.70, latMax: 31.85, lonMin: 35.14, lonMax: 35.30 };

export function isJerusalemArea(lat, lon) {
  return lat >= JER_BOUNDS.latMin && lat <= JER_BOUNDS.latMax &&
         lon >= JER_BOUNDS.lonMin && lon <= JER_BOUNDS.lonMax;
}

export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = deg => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
