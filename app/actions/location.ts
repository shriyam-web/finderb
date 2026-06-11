'use server';

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

async function geocodePlaceQuery(
  query: string
): Promise<{ latitude: number; longitude: number; placeName?: string } | null> {
  const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

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
  const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

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
  if (latitude == null || longitude == null || (latitude === 0 && longitude === 0)) {
    return { success: false as const, placeName: null };
  }

  const fromUrl = googleMapsUrl ? extractPlaceNameFromGoogleMapsUrl(googleMapsUrl) : null;
  const placeName =
    fromUrl || (await reverseGeocodeCoordinates(latitude, longitude));

  return { success: true as const, placeName };
}
