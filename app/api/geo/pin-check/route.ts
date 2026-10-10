import type { NextRequest } from 'next/server';
import { validateMapPinAgainstAddress } from '@/app/actions/location';
import { mobileApiJson, mobileApiOptions } from '@/lib/mobileApiCors';

export const dynamic = 'force-dynamic';

export function OPTIONS() {
  return mobileApiOptions();
}

/** Checks that a map pin sits inside the city the merchant selected (Google Geocoding). */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lat = Number(params.get('lat'));
  const lng = Number(params.get('lng'));
  const city = params.get('city')?.trim() ?? '';
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !city) {
    return mobileApiJson({ error: 'lat, lng and city are required' }, 400);
  }

  const check = await validateMapPinAgainstAddress(lat, lng, {
    city,
    state: params.get('state')?.trim() || undefined,
    country: params.get('country')?.trim() || undefined,
  });

  return mobileApiJson({
    ok: check.ok,
    message: check.ok ? null : check.error,
    resolved: check.resolvedLabel || null,
  });
}
