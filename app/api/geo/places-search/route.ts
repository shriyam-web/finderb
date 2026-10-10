import type { NextRequest } from 'next/server';
import { searchGooglePlaces } from '@/app/actions/location';
import { mobileApiJson, mobileApiOptions } from '@/lib/mobileApiCors';

export const dynamic = 'force-dynamic';

export function OPTIONS() {
  return mobileApiOptions();
}

/** Google Maps place search for the app's location pickers. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const found = await searchGooglePlaces(params.get('q') ?? '', {
    city: params.get('city'),
    state: params.get('state'),
  });
  if (!found.success) return mobileApiJson({ error: found.error }, 422);

  return mobileApiJson({
    places: found.places.map((place) => ({
      name: place.name,
      address: place.address,
      lat: place.latitude,
      lng: place.longitude,
    })),
  });
}
