'use server';

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

  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '1',
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        'User-Agent': 'FinderB/1.0 (location-resolver)',
      },
    });
    const data = await response.json();
    if (Array.isArray(data) && data[0]?.lat && data[0]?.lon) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        placeName: data[0].display_name || query,
      };
    }
  } catch (error) {
    console.error('Nominatim geocoding failed:', error);
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

  try {
    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      format: 'json',
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
      headers: {
        'User-Agent': 'FinderB/1.0 (location-resolver)',
      },
    });
    const data = await response.json();
    if (data?.name) return data.name;
    if (data?.display_name) {
      return String(data.display_name).split(',')[0]?.trim() || data.display_name;
    }
  } catch (error) {
    console.error('Nominatim reverse geocoding failed:', error);
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

function extractAreaAndCityFromNominatimAddress(
  address: Record<string, string | undefined>
): { area: string | null; city: string | null; state: string | null } {
  const area =
    normalizeLocationPart(address.suburb) ||
    normalizeLocationPart(address.neighbourhood) ||
    normalizeLocationPart(address.quarter) ||
    normalizeLocationPart(address.residential) ||
    normalizeLocationPart(address.city_district);

  const city =
    normalizeLocationPart(address.city) ||
    normalizeLocationPart(address.state_district) ||
    normalizeLocationPart(address.town) ||
    normalizeLocationPart(address.county) ||
    normalizeLocationPart(address.municipality);

  const state = normalizeLocationPart(address.state);

  return { area, city, state };
}

type ResolvedUserLocation = {
  label: string;
  city: string | null;
  state: string | null;
};

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
        const label = formatLocationLabel(area, city);
        if (label) return { label, city, state };
      }
    } catch (error) {
      console.error('Google city reverse geocoding failed:', error);
    }
  }

  try {
    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      format: 'json',
      addressdetails: '1',
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
      headers: {
        'User-Agent': 'FinderB/1.0 (location-resolver)',
      },
    });
    const data = await response.json();
    const address = data?.address;
    if (address) {
      const { area, city, state } = extractAreaAndCityFromNominatimAddress(address);
      const label = formatLocationLabel(area, city);
      if (label) return { label, city, state };
    }
  } catch (error) {
    console.error('Nominatim city reverse geocoding failed:', error);
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
    cityName: resolved?.city ?? null,
  };
}
