import type { UserCoords } from '../hooks/useUserLocation';
import { lookupCityCoords } from './cityCoords';
import { SITE_URL } from './supabase';

export type ApproxLocation = {
  coords: UserCoords | null;
  city: string | null;
};

const TIMEOUT_MS = 5000;

/** Network-based city for when device location is off or denied. */
export async function fetchApproxLocation(): Promise<ApproxLocation | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${SITE_URL}/api/geo/approx`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      lat?: number | null;
      lng?: number | null;
      city?: string | null;
    };
    const city = body.city?.trim() || null;
    const coords =
      typeof body.lat === 'number' && typeof body.lng === 'number'
        ? { lat: body.lat, lng: body.lng }
        : city
          ? lookupCityCoords(city)
          : null;
    if (!coords && !city) return null;
    return { coords, city };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
