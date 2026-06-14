'use client';

import { getGoogleMapsPublicKey } from '@/lib/googleMapsKeys';

type Coords = { lat: number; lng: number };

type GoogleGeolocateResponse = {
  location?: { lat?: number; lng?: number };
  accuracy?: number;
};

/**
 * Calls Google Geolocation API from the browser so Google sees the user’s IP (not the server’s).
 * Use only as a last-resort fallback — accuracy is city/region level, not GPS-level.
 */
export async function geolocateViaGoogleIp(): Promise<Coords | null> {
  const key = getGoogleMapsPublicKey();
  if (!key) return null;

  try {
    const response = await fetch(
      `https://www.googleapis.com/geolocation/v1/geolocate?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ considerIp: true }),
      }
    );

    if (!response.ok) {
      console.error('Google Geolocation API error:', response.status, await response.text());
      return null;
    }

    const data = (await response.json()) as GoogleGeolocateResponse;
    const lat = data.location?.lat;
    const lng = data.location?.lng;

    if (lat == null || lng == null) return null;

    return { lat, lng };
  } catch (error) {
    console.error('Google Geolocation API request failed:', error);
    return null;
  }
}
