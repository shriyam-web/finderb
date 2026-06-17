import { formatDistanceFromUser, getDistanceKm } from '@/lib/geo';

export type TouristPlaceLike = {
  id: string;
  name: string;
  location: string;
  image: string;
  distance?: string;
  rating?: number;
};

export type UserLocationContext = {
  cityName: string | null;
  state: string | null;
  searchLocation: string | null;
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function locationParts(location: string): string[] {
  return location
    .split(/[,|]/)
    .map((part) => normalize(part))
    .filter(Boolean);
}

/** Lower score = closer / more relevant to the user. */
export function scorePlaceProximity(placeLocation: string, ctx: UserLocationContext): number {
  const parts = locationParts(placeLocation);
  const haystack = normalize(placeLocation);
  const city = ctx.cityName ? normalize(ctx.cityName) : null;
  const state = ctx.state ? normalize(ctx.state) : null;
  const searchParts = ctx.searchLocation ? locationParts(ctx.searchLocation) : [];

  if (city && parts.some((p) => p === city || p.includes(city) || city.includes(p))) {
    return 0;
  }

  if (searchParts.some((needle) => parts.some((p) => p === needle || p.includes(needle)))) {
    return 1;
  }

  if (city && haystack.includes(city)) {
    return 2;
  }

  if (state && parts.some((p) => p === state || p.includes(state))) {
    return 3;
  }

  if (state && haystack.includes(state)) {
    return 4;
  }

  return 50;
}

export function sortTouristPlacesByText<T extends TouristPlaceLike>(
  places: T[],
  ctx: UserLocationContext
): T[] {
  if (!ctx.cityName && !ctx.state && !ctx.searchLocation) {
    return places;
  }

  return [...places].sort(
    (a, b) => scorePlaceProximity(a.location, ctx) - scorePlaceProximity(b.location, ctx)
  );
}

export function applyDistanceLabel<T extends TouristPlaceLike>(
  place: T,
  user: { lat: number; lng: number } | null,
  placeCoords: { lat: number; lng: number } | null
): T {
  if (!user || !placeCoords) {
    return place;
  }

  const label = formatDistanceFromUser(user, placeCoords.lat, placeCoords.lng);
  return label ? { ...place, distance: label } : place;
}

export function sortByDistanceKm<T extends TouristPlaceLike & { distanceKm: number }>(
  places: T[]
): T[] {
  return [...places].sort((a, b) => a.distanceKm - b.distanceKm);
}

export function distanceKmFromUser(
  user: { lat: number; lng: number },
  placeCoords: { lat: number; lng: number }
): number {
  return getDistanceKm(user.lat, user.lng, placeCoords.lat, placeCoords.lng);
}
