import type { UserCoords } from '../hooks/useUserLocation';
import { INDIA_CITY_COORDS } from './cityCoords';
import { getDistanceKm } from './geo';
import { stateForCity } from './indianPlaces';

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

async function getJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'en',
        'User-Agent': 'FinderB/1.0 (location)',
      },
      signal: controller.signal,
    });
    return res.ok ? await res.json() : null;
  } finally {
    clearTimeout(timer);
  }
}

/** OpenStreetMap at neighbourhood zoom: sector / suburb names like the phone's geocoder. */
async function nominatimPlace(coords: UserCoords): Promise<PlaceName | null> {
  const body = (await getJson(
    'https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&addressdetails=1' +
      `&lat=${coords.lat}&lon=${coords.lng}`,
  )) as { address?: Record<string, unknown> } | null;
  const a = body?.address;
  if (!a) return null;
  const area =
    clean(a.suburb) ||
    clean(a.neighbourhood) ||
    clean(a.quarter) ||
    clean(a.residential) ||
    clean(a.city_district) ||
    clean(a.village) ||
    clean(a.hamlet);
  const city =
    clean(a.city) || clean(a.town) || clean(a.municipality) || clean(a.county) || clean(a.state_district);
  return placeFrom(area, city, clean(a.state));
}

async function photonPlace(coords: UserCoords): Promise<PlaceName | null> {
  const body = (await getJson(
    `https://photon.komoot.io/reverse?lat=${coords.lat}&lon=${coords.lng}&lang=en`,
  )) as { features?: Array<{ properties?: Record<string, unknown> }> } | null;
  const p = body?.features?.[0]?.properties;
  if (!p) return null;
  return placeFrom(clean(p.district) || clean(p.locality), clean(p.city) || clean(p.county), clean(p.state));
}

async function bigDataCloudPlace(coords: UserCoords): Promise<PlaceName | null> {
  const body = (await getJson(
    'https://api.bigdatacloud.net/data/reverse-geocode-client' +
      `?latitude=${coords.lat}&longitude=${coords.lng}&localityLanguage=en`,
  )) as { city?: string; locality?: string; principalSubdivision?: string } | null;
  if (!body) return null;
  return placeFrom(clean(body.locality), clean(body.city), clean(body.principalSubdivision));
}

/**
 * Web reverse geocoders for when the phone's geocoder is not ready yet (common right after
 * install). Returns the first answer that names the locality, else the best city-only one.
 */
export async function networkPlaceName(coords: UserCoords): Promise<PlaceName | null> {
  let cityOnly: PlaceName | null = null;
  for (const lookup of [nominatimPlace, photonPlace, bigDataCloudPlace]) {
    const name = await lookup(coords).catch(() => null);
    if (name?.area) return name;
    cityOnly ??= name;
  }
  return cityOnly;
}
