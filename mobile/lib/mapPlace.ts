import { SITE_URL } from './supabase';

export type MapPin = { lat: number; lng: number };

export type PinCityCheck = {
  ok: boolean;
  message: string;
};

export type MapSearchPlace = MapPin & { name: string; address: string };

const LOOKUP_TIMEOUT_MS = 15000;

/** Google Maps lookups go through finderb.com so the app checks pins exactly like the server does. */
async function geoApi<T>(path: string, params: Record<string, string>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);
  try {
    const response = await fetch(`${SITE_URL}/api/geo/${path}?${new URLSearchParams(params).toString()}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    }).catch(() => {
      throw new Error('Could not reach Google Maps. Check your internet and try again.');
    });
    const body = (await response.json().catch(() => ({}))) as T & { error?: string };
    if (!response.ok) throw new Error(body.error || `Google Maps lookup failed (${response.status})`);
    return body;
  } finally {
    clearTimeout(timer);
  }
}

export async function searchMapPlaces(
  query: string,
  city: string,
  state: string,
): Promise<MapSearchPlace[]> {
  const body = await geoApi<{ places?: MapSearchPlace[] }>('places-search', { q: query, city, state });
  return (body.places ?? []).filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lng));
}

export async function resolveMapsLink(url: string): Promise<MapPin> {
  const body = await geoApi<{ lat?: number; lng?: number }>('maps-link', { url });
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('Could not read a location from this link.');
  }
  return { lat, lng };
}

export async function geocodeCityCenter(city: string, state: string): Promise<MapPin | null> {
  const places = await searchMapPlaces(`${city}, ${state}, India`, '', '').catch(() => []);
  const first = places[0];
  return first ? { lat: first.lat, lng: first.lng } : null;
}

export async function checkPinInsideCity(
  pin: MapPin,
  city: string,
  state: string,
): Promise<PinCityCheck> {
  try {
    const body = await geoApi<{ ok?: boolean; message?: string | null }>('pin-check', {
      lat: String(pin.lat),
      lng: String(pin.lng),
      city,
      state,
      country: 'India',
    });
    return body.ok
      ? { ok: true, message: `Pin is inside ${city}.` }
      : { ok: false, message: body.message || `Move the pin inside ${city}, or clear it.` };
  } catch {
    return {
      ok: false,
      message: 'Could not check this pin. Try again, or clear it to register without a map location.',
    };
  }
}
