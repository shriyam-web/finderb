import * as Location from 'expo-location';
import type { UserCoords } from '../hooks/useUserLocation';
import { lookupCityCoords } from './cityCoords';

const memory = new Map<string, UserCoords | null>();

function cacheKey(query: string): string {
  return query.trim().toLowerCase();
}

/** Resolve lat/lng for a place or city string (static map first, then platform geocode). */
export async function geocodePlaceQuery(
  query: string,
): Promise<UserCoords | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const key = cacheKey(trimmed);
  if (memory.has(key)) return memory.get(key) ?? null;

  const fromMap = lookupCityCoords(trimmed);
  if (fromMap) {
    memory.set(key, fromMap);
    return fromMap;
  }

  try {
    const q = /india/i.test(trimmed) ? trimmed : `${trimmed}, India`;
    const results = await Location.geocodeAsync(q);
    const first = results[0];
    if (
      first &&
      Number.isFinite(first.latitude) &&
      Number.isFinite(first.longitude)
    ) {
      const coords = { lat: first.latitude, lng: first.longitude };
      memory.set(key, coords);
      return coords;
    }
  } catch {
    // fall through
  }

  memory.set(key, null);
  return null;
}
