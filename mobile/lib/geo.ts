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
  if (km < 1) {
    return `${Math.max(100, Math.round(km * 1000))} m`;
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

/** Prefer same city, then nearer distance. */
export function sortByUserLocation<T extends Locatable>(
  items: T[],
  opts: { coords?: Coords | null; city?: string | null },
): T[] {
  const { coords, city } = opts;
  if (!coords && !city?.trim()) return items;

  return [...items].sort((a, b) => {
    const cityDiff = cityMatchScore(a, city) - cityMatchScore(b, city);
    if (cityDiff !== 0) return cityDiff;

    if (!coords) return 0;

    const aOk =
      a.latitude != null &&
      a.longitude != null &&
      !(a.latitude === 0 && a.longitude === 0);
    const bOk =
      b.latitude != null &&
      b.longitude != null &&
      !(b.latitude === 0 && b.longitude === 0);

    if (!aOk && !bOk) return 0;
    if (!aOk) return 1;
    if (!bOk) return -1;

    return (
      getDistanceKm(coords.lat, coords.lng, a.latitude!, a.longitude!) -
      getDistanceKm(coords.lat, coords.lng, b.latitude!, b.longitude!)
    );
  });
}

