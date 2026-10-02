import type { NextRequest } from 'next/server';
import { mobileApiJson, mobileApiOptions } from '@/lib/mobileApiCors';

export const dynamic = 'force-dynamic';

function decodeHeader(value: string | null): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value).trim() || null;
  } catch {
    return value.trim() || null;
  }
}

export function OPTIONS() {
  return mobileApiOptions();
}

/**
 * Approximate city for the caller from Vercel's edge geolocation. The app uses
 * it only when device location is unavailable, so nearby businesses still rank first.
 */
export async function GET(request: NextRequest) {
  const lat = Number(request.headers.get('x-vercel-ip-latitude'));
  const lng = Number(request.headers.get('x-vercel-ip-longitude'));
  const hasCoords =
    request.headers.has('x-vercel-ip-latitude') &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0);

  const city = decodeHeader(request.headers.get('x-vercel-ip-city'));
  if (!hasCoords && !city) {
    return mobileApiJson({ error: 'Location unavailable' }, 404);
  }

  return mobileApiJson({
    lat: hasCoords ? lat : null,
    lng: hasCoords ? lng : null,
    city,
    country: request.headers.get('x-vercel-ip-country'),
  });
}
