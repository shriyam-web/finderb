'use server';

import {
  formatResolvedAddressLabel,
  hasResolvedMapAddress,
  locationTokensMatch,
  mapPinMatchesManualAddress,
  type ManualAddress,
  type ResolvedMapAddress,
} from '@/lib/locationMatch';
import { getGoogleMapsServerKeyOrFallback } from '@/lib/googleMapsKeys';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import {
  buildGoogleMapsUrl,
  extractGoogleMapsSearchQuery,
  extractPlaceNameFromGoogleMapsUrl,
  isGoogleMapsUrl,
  normalizeGoogleMapsInput,
  parseCoordinatesFromGoogleMapsUrl,
} from '@/lib/googleMapsLocation';

async function expandShortGoogleMapsUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'FinderB/1.0 (location-resolver)',
      },
    });
    return response.url || url;
  } catch {
    return url;
  }
}

export async function geocodePlaceQuery(
  query: string
): Promise<{ latitude: number; longitude: number; placeName?: string } | null> {
  const geocodeLimit = await enforceRateLimit('geocode');
  if (!geocodeLimit.ok) return null;

  const googleKey = getGoogleMapsServerKeyOrFallback();

  if (googleKey) {
    try {
      const params = new URLSearchParams({
        address: query,
        key: googleKey,
      });
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
      const data = await response.json();
      const result = data?.results?.[0];
      const location = result?.geometry?.location;
      if (location?.lat != null && location?.lng != null) {
        return {
          latitude: location.lat,
          longitude: location.lng,
          placeName: result?.formatted_address || query,
        };
      }
    } catch (error) {
      console.error('Google geocoding failed:', error);
    }
  }

  return null;
}

async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number
): Promise<string | null> {
  const googleKey = getGoogleMapsServerKeyOrFallback();

  if (googleKey) {
    try {
      const params = new URLSearchParams({
        latlng: `${latitude},${longitude}`,
        key: googleKey,
      });
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
      const data = await response.json();
      const results = data?.results;
      if (Array.isArray(results) && results.length > 0) {
        const poi = results.find((entry: { types?: string[] }) =>
          entry.types?.some((type) =>
            ['establishment', 'point_of_interest', 'premise', 'store'].includes(type)
          )
        );
        return poi?.formatted_address || results[0]?.formatted_address || null;
      }
    } catch (error) {
      console.error('Google reverse geocoding failed:', error);
    }
  }

  return null;
}

function normalizeLocationPart(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function formatLocationLabel(area: string | null, city: string | null): string | null {
  const areaPart = normalizeLocationPart(area);
  const cityPart = normalizeLocationPart(city);

  if (areaPart && cityPart && areaPart.toLowerCase() === cityPart.toLowerCase()) {
    return cityPart;
  }

  if (areaPart && cityPart) {
    return `${areaPart}, ${cityPart}`;
  }

  return cityPart || areaPart;
}

function extractAreaAndCityFromGoogleResults(
  results: Array<{ address_components?: Array<{ long_name: string; types: string[] }> }>
): { area: string | null; city: string | null; state: string | null } {
  let area: string | null = null;
  let city: string | null = null;
  let state: string | null = null;

  const areaTypes = [
    'sublocality_level_1',
    'sublocality',
    'neighborhood',
    'premise',
    'route',
  ];
  const cityTypes = ['locality', 'administrative_area_level_2', 'administrative_area_level_3'];
  const stateTypes = ['administrative_area_level_1'];

  for (const result of results) {
    if (!area) {
      for (const type of areaTypes) {
        const match = result.address_components?.find((component) => component.types.includes(type));
        if (match?.long_name) {
          area = match.long_name;
          break;
        }
      }
    }

    if (!city) {
      for (const type of cityTypes) {
        const match = result.address_components?.find((component) => component.types.includes(type));
        if (match?.long_name) {
          city = match.long_name;
          break;
        }
      }
    }

    if (!state) {
      for (const type of stateTypes) {
        const match = result.address_components?.find((component) => component.types.includes(type));
        if (match?.long_name) {
          state = match.long_name;
          break;
        }
      }
    }

    if (area && city && state) break;
  }

  return { area, city, state };
}

type ResolvedUserLocation = {
  label: string;
  area: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
};

function extractCountryFromGoogleResults(
  results: Array<{ address_components?: Array<{ long_name: string; short_name: string; types: string[] }> }>,
): string | null {
  for (const result of results) {
    const match = result.address_components?.find((component) => component.types.includes('country'));
    if (match?.long_name) return match.long_name;
  }
  return null;
}

const GOOGLE_PLACE_NAME_TYPES = [
  'locality',
  'postal_town',
  'sublocality',
  'sublocality_level_1',
  'sublocality_level_2',
  'neighborhood',
  'administrative_area_level_2',
  'administrative_area_level_3',
  'administrative_area_level_4',
];

/**
 * Every locality/district name Google gives for a pin. A pin sits "in" a city when any of these
 * match it, so villages and suburbs picked from a city list still count.
 */
async function reverseGeocodePlaceNames(latitude: number, longitude: number): Promise<string[]> {
  const names = new Set<string>();
  const googleKey = getGoogleMapsServerKeyOrFallback();

  if (googleKey) {
    try {
      const params = new URLSearchParams({ latlng: `${latitude},${longitude}`, key: googleKey });
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
      const data = await response.json();
      const results: Array<{ address_components?: Array<{ long_name: string; types: string[] }> }> =
        Array.isArray(data?.results) ? data.results : [];
      for (const result of results) {
        for (const component of result.address_components ?? []) {
          if (component.types.some((type) => GOOGLE_PLACE_NAME_TYPES.includes(type))) {
            const name = normalizeLocationPart(component.long_name);
            if (name) names.add(name);
          }
        }
      }
    } catch (error) {
      console.error('Google place-name reverse geocoding failed:', error);
    }
  }

  return [...names];
}

async function reverseGeocodeCity(latitude: number, longitude: number): Promise<ResolvedUserLocation | null> {
  const googleKey = getGoogleMapsServerKeyOrFallback();

  if (googleKey) {
    try {
      const params = new URLSearchParams({
        latlng: `${latitude},${longitude}`,
        key: googleKey,
      });
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
      const data = await response.json();
      const results = data?.results;
      if (Array.isArray(results) && results.length > 0) {
        const { area, city, state } = extractAreaAndCityFromGoogleResults(results);
        const country = extractCountryFromGoogleResults(results);
        const label = formatLocationLabel(area, city);
        if (label) return { label, area, city, state, country };
      }
    } catch (error) {
      console.error('Google city reverse geocoding failed:', error);
    }
  }

  return null;
}

async function resolvePlaceName(
  resolvedUrl: string,
  latitude: number,
  longitude: number,
  geocodedName?: string
): Promise<string | null> {
  const fromUrl = extractPlaceNameFromGoogleMapsUrl(resolvedUrl);
  if (fromUrl) return fromUrl;
  if (geocodedName) return geocodedName;
  return reverseGeocodeCoordinates(latitude, longitude);
}

export async function resolveGoogleMapsLocation(input: string) {
  const geocodeLimit = await enforceRateLimit('geocode', 'resolve-maps');
  if (!geocodeLimit.ok) {
    return { success: false as const, error: geocodeLimit.error };
  }

  const normalizedInput = normalizeGoogleMapsInput(input);

  if (!normalizedInput) {
    return { success: false as const, error: 'Please paste your Google Maps link.' };
  }

  if (!isGoogleMapsUrl(normalizedInput)) {
    return {
      success: false as const,
      error: 'That does not look like a Google Maps link. Copy the URL from Google Maps (Share → Copy link).',
    };
  }

  let resolvedUrl = normalizedInput;

  try {
    const host = new URL(normalizedInput).hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'goo.gl' || host === 'maps.app.goo.gl') {
      resolvedUrl = await expandShortGoogleMapsUrl(normalizedInput);
    }
  } catch {
    return { success: false as const, error: 'Invalid Google Maps link.' };
  }

  let coords = parseCoordinatesFromGoogleMapsUrl(resolvedUrl);
  let geocodedName: string | undefined;

  if (!coords) {
    const searchQuery = extractGoogleMapsSearchQuery(resolvedUrl);
    if (searchQuery) {
      const geocoded = await geocodePlaceQuery(searchQuery);
      if (geocoded) {
        coords = { latitude: geocoded.latitude, longitude: geocoded.longitude };
        geocodedName = geocoded.placeName;
      }
    }
  }

  if (!coords) {
    return {
      success: false as const,
      error:
        'Could not read coordinates from this link. Open your pin in Google Maps, tap Share, and copy the full link again.',
    };
  }

  const placeName = await resolvePlaceName(
    resolvedUrl,
    coords.latitude,
    coords.longitude,
    geocodedName
  );

  return {
    success: true as const,
    latitude: coords.latitude,
    longitude: coords.longitude,
    placeName,
    normalizedUrl: buildGoogleMapsUrl(coords.latitude, coords.longitude),
    resolvedUrl,
  };
}

export async function lookupPlaceNameFromCoordinates(
  latitude: number,
  longitude: number,
  googleMapsUrl?: string
) {
  const geocodeLimit = await enforceRateLimit('geocode', 'lookup-place');
  if (!geocodeLimit.ok) {
    return { success: false as const, placeName: null };
  }

  if (latitude == null || longitude == null || (latitude === 0 && longitude === 0)) {
    return { success: false as const, placeName: null };
  }

  const fromUrl = googleMapsUrl ? extractPlaceNameFromGoogleMapsUrl(googleMapsUrl) : null;
  const placeName =
    fromUrl || (await reverseGeocodeCoordinates(latitude, longitude));

  return { success: true as const, placeName };
}

export async function resolveCityFromCoordinates(latitude: number, longitude: number) {
  const geocodeLimit = await enforceRateLimit('geocode', 'resolve-city');
  if (!geocodeLimit.ok) {
    return { success: false as const, city: null, state: null, cityName: null };
  }

  if (latitude == null || longitude == null || (latitude === 0 && longitude === 0)) {
    return { success: false as const, city: null, state: null, cityName: null };
  }

  const resolved = await reverseGeocodeCity(latitude, longitude);
  return {
    success: true as const,
    city: resolved?.label ?? null,
    state: resolved?.state ?? null,
    country: resolved?.country ?? null,
    cityName: resolved?.city ?? null,
    area: resolved?.area ?? null,
  };
}

export type GooglePlaceResult = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

/** Google Maps place search, biased to the merchant's city so their own listing comes first. */
export async function searchGooglePlaces(
  query: string,
  near?: { city?: string | null; state?: string | null },
): Promise<{ success: true; places: GooglePlaceResult[] } | { success: false; error: string }> {
  const trimmed = query.trim().slice(0, 160);
  if (trimmed.length < 2) {
    return { success: false, error: 'Type your business name or address to search.' };
  }

  const geocodeLimit = await enforceRateLimit('geocode', 'place-search');
  if (!geocodeLimit.ok) return { success: false, error: geocodeLimit.error };

  const googleKey = getGoogleMapsServerKeyOrFallback();
  if (!googleKey) return { success: false, error: 'Google Maps search is not available right now.' };

  const area = [near?.city, near?.state].map((part) => part?.trim()).filter(Boolean).join(', ');
  const textQuery = area && !trimmed.toLowerCase().includes(String(near?.city).toLowerCase())
    ? `${trimmed}, ${area}`
    : trimmed;

  try {
    const params = new URLSearchParams({ query: textQuery, region: 'in', key: googleKey });
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`,
    );
    const data = await response.json();
    if (data?.status !== 'OK' && data?.status !== 'ZERO_RESULTS') {
      console.error('Google place search failed:', data?.status, data?.error_message);
      return { success: false, error: 'Could not search Google Maps. Try again in a moment.' };
    }
    const results: Array<{
      name?: string;
      formatted_address?: string;
      geometry?: { location?: { lat?: number; lng?: number } };
    }> = Array.isArray(data?.results) ? data.results : [];
    const places = results
      .filter((item) => item.geometry?.location?.lat != null && item.geometry?.location?.lng != null)
      .slice(0, 6)
      .map((item) => ({
        name: item.name || item.formatted_address || trimmed,
        address: item.formatted_address || '',
        latitude: Number(item.geometry!.location!.lat),
        longitude: Number(item.geometry!.location!.lng),
      }));
    return { success: true, places };
  } catch (error) {
    console.error('Google place search failed:', error);
    return { success: false, error: 'Could not search Google Maps. Try again in a moment.' };
  }
}

export type MapPinAddressValidation =
  | {
      ok: true;
      resolved: ResolvedMapAddress;
      resolvedLabel: string;
    }
  | {
      ok: false;
      error: string;
      resolved: ResolvedMapAddress;
      resolvedLabel: string;
    };

export async function validateMapPinAgainstAddress(
  latitude: number,
  longitude: number,
  manual: ManualAddress,
): Promise<MapPinAddressValidation> {
  const geocodeLimit = await enforceRateLimit('geocode', 'validate-map-address');
  if (!geocodeLimit.ok) {
    return {
      ok: false,
      error: geocodeLimit.error,
      resolved: { city: null, state: null, country: null, label: null },
      resolvedLabel: '',
    };
  }

  if (latitude == null || longitude == null || (latitude === 0 && longitude === 0)) {
    return {
      ok: false,
      error: 'Map location is not set.',
      resolved: { city: null, state: null, country: null, label: null },
      resolvedLabel: '',
    };
  }

  const resolved = await reverseGeocodeCity(latitude, longitude);
  const resolvedAddress: ResolvedMapAddress = {
    city: resolved?.city ?? null,
    state: resolved?.state ?? null,
    country: resolved?.country ?? null,
    label: resolved?.label ?? null,
  };
  const resolvedLabel = formatResolvedAddressLabel(resolvedAddress);

  if (!hasResolvedMapAddress(resolvedAddress)) {
    return {
      ok: false,
      error:
        'We could not read city/state from this map pin. Check the link or confirm your Google Maps API key is configured.',
      resolved: resolvedAddress,
      resolvedLabel,
    };
  }

  let match = mapPinMatchesManualAddress(resolvedAddress, manual);
  const manualCity = manual.city?.trim();
  if (!match.ok && manualCity) {
    const names = await reverseGeocodePlaceNames(latitude, longitude);
    const cityName = names.find((name) => locationTokensMatch(name, manualCity));
    if (cityName) {
      match = mapPinMatchesManualAddress({ ...resolvedAddress, city: cityName }, manual);
    }
  }
  if (!match.ok) {
    return {
      ok: false,
      error: match.error,
      resolved: resolvedAddress,
      resolvedLabel,
    };
  }

  return { ok: true, resolved: resolvedAddress, resolvedLabel };
}
