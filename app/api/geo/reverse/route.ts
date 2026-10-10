import type { NextRequest } from 'next/server';
import { resolveCityFromCoordinates } from '@/app/actions/location';
import { mobileApiJson, mobileApiOptions } from '@/lib/mobileApiCors';

export const dynamic = 'force-dynamic';

export function OPTIONS() {
  return mobileApiOptions();
}

/** Area / city / state for a coordinate, from Google Geocoding. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lat = Number(params.get('lat'));
  const lng = Number(params.get('lng'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return mobileApiJson({ error: 'lat and lng are required' }, 400);
  }

  const resolved = await resolveCityFromCoordinates(lat, lng);
  if (!resolved.success || !resolved.cityName) {
    return mobileApiJson({ error: 'Place not found' }, 404);
  }

  return mobileApiJson({
    area: resolved.area ?? null,
    city: resolved.cityName,
    region: resolved.state ?? null,
  });
}
