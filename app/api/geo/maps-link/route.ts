import type { NextRequest } from 'next/server';
import { resolveGoogleMapsLocation } from '@/app/actions/location';
import { mobileApiJson, mobileApiOptions } from '@/lib/mobileApiCors';

export const dynamic = 'force-dynamic';

export function OPTIONS() {
  return mobileApiOptions();
}

/** Reads coordinates from a pasted Google Maps link (short links are expanded server-side). */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')?.trim() ?? '';
  if (!url) return mobileApiJson({ error: 'Please paste your Google Maps link.' }, 400);

  const resolved = await resolveGoogleMapsLocation(url);
  if (!resolved.success) return mobileApiJson({ error: resolved.error }, 422);

  return mobileApiJson({
    lat: resolved.latitude,
    lng: resolved.longitude,
    placeName: resolved.placeName ?? null,
  });
}
