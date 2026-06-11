export function parseCoordinate(value: unknown): number | null {
  if (value == null || value === '') return null;

  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return null;

  return num;
}

export function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistanceFromUser(
  user: { lat: number; lng: number } | null | undefined,
  businessLat?: number | null | string,
  businessLng?: number | null | string
): string | null {
  const lat = parseCoordinate(businessLat);
  const lng = parseCoordinate(businessLng);

  if (!user || lat == null || lng == null || (lat === 0 && lng === 0)) {
    return null;
  }

  const km = getDistanceKm(user.lat, user.lng, lat, lng);
  if (km < 1) {
    return `${Math.max(100, Math.round(km * 1000))} m away`;
  }
  return `${km.toFixed(1)} km away`;
}
