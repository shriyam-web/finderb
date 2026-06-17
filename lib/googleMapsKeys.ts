/** Server-side key — Geocoding API (reverse geocode). Never expose in client bundles. */
export function getGoogleMapsServerKey(): string | undefined {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  return key || undefined;
}

/** Browser key — Geolocation API (IP/Wi‑Fi fix from the user’s device). Restrict by HTTP referrer. */
export function getGoogleMapsPublicKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  return key || undefined;
}

/** Prefer dedicated server key; never use the public browser key in production server routes. */
export function getGoogleMapsServerKeyOrFallback(): string | undefined {
  return getGoogleMapsServerKey();
}
