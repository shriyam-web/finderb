import type { UserCoords } from '../hooks/useUserLocation';
import { INDIA_CITY_COORDS } from './cityCoords';
import { getDistanceKm } from './geo';
import { stateForCity } from './indianPlaces';
import { SITE_URL } from './supabase';

export type PlaceName = { area: string | null; city: string | null; region: string | null };

/** Beyond this, the closest listed city is too far away to name the user's place. */
const NEAREST_CITY_MAX_KM = 45;

function titleCase(value: string) {
  return value.replace(/\b\w/g, (ch) => ch.toUpperCase());
}

/** Offline guess from the bundled city list, so the header has a name the moment a fix lands. */
export function nearestKnownCity(coords: UserCoords): PlaceName | null {
  let best: { key: string; km: number } | null = null;
  for (const [key, point] of Object.entries(INDIA_CITY_COORDS)) {
    const km = getDistanceKm(coords.lat, coords.lng, point.lat, point.lng);
    if (!best || km < best.km) best = { key, km };
  }
  if (!best || best.km > NEAREST_CITY_MAX_KM) return null;
  const city = titleCase(best.key);
  return { area: null, city, region: stateForCity(city) };
}

const NETWORK_TIMEOUT_MS = 5000;

function clean(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function placeFrom(area: string | null, city: string | null, region: string | null): PlaceName | null {
  const sameAsCity = area && city && area.toLowerCase() === city.toLowerCase();
  const name = { area: sameAsCity ? null : area, city: city ?? area, region };
  return name.city || name.area ? name : null;
}

/**
 * Google reverse geocode (via finderb.com) for when the phone's geocoder is not ready yet,
 * which is common right after install.
 */
export async function networkPlaceName(coords: UserCoords): Promise<PlaceName | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
  try {
    const res = await fetch(`${SITE_URL}/api/geo/reverse?lat=${coords.lat}&lng=${coords.lng}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const body = (await res.json()) as Record<string, unknown>;
    return placeFrom(clean(body.area), clean(body.city), clean(body.region));
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
