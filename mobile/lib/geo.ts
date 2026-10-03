export type Coords = { lat: number; lng: number };

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
  lon2: number,
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
  user: Coords | null | undefined,
  businessLat?: number | null,
  businessLng?: number | null,
): string | null {
  if (
    !user ||
    businessLat == null ||
    businessLng == null ||
    (businessLat === 0 && businessLng === 0)
  ) {
    return null;
  }

  const km = getDistanceKm(user.lat, user.lng, businessLat, businessLng);
  return formatRoadDistanceKm(km);
}

/** Label a road distance. Short trips stay in metres, longer ones in kilometres. */
export function formatRoadDistanceKm(km: number): string | null {
  if (!Number.isFinite(km) || km < 0) return null;
  if (km < 1) {
    const meters = Math.max(10, Math.round((km * 1000) / 10) * 10);
    return `${meters} m`;
  }
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

type Locatable = {
  city?: string | null;
  state?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

function cityMatchScore(item: Locatable, city?: string | null): number {
  if (!city?.trim()) return 1;
  const needle = city.trim().toLowerCase();
  const hay = [item.city, item.state, item.location]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (!hay) return 1;
  if (hay.includes(needle)) return 0;
  return 1;
}

/** Where an unpinned business in the user's own city slots into the distance order. */
const SAME_CITY_UNPINNED_KM = 15;

/**
 * Nearest first when the user's position is known; businesses without a pin
 * rank by city. With only a city, same-city businesses lead. Ties keep order.
 */
export function sortByUserLocation<T extends Locatable>(
  items: T[],
  opts: { coords?: Coords | null; city?: string | null },
): T[] {
  const { coords, city } = opts;
  if (!coords && !city?.trim()) return items;

  const keys = items.map((item, index) => {
    const pinned =
      item.latitude != null &&
      item.longitude != null &&
      Number.isFinite(item.latitude) &&
      Number.isFinite(item.longitude) &&
      !(item.latitude === 0 && item.longitude === 0);
    let rank: number;
    if (coords && pinned) {
      rank = getDistanceKm(coords.lat, coords.lng, item.latitude!, item.longitude!);
    } else if (coords) {
      rank = cityMatchScore(item, city) === 0 ? SAME_CITY_UNPINNED_KM : Infinity;
    } else {
      rank = cityMatchScore(item, city);
    }
    return { item, index, rank };
  });

  keys.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank < b.rank ? -1 : 1;
    return a.index - b.index;
  });
  return keys.map((k) => k.item);
}

