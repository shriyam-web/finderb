import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { isLegacyTouristPlaceId, getTouristPlacePath } from '@/lib/touristPlaceSlug';

function getSupabaseForRedirect() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Edge redirect: legacy /tourist-places/{uuid} → /tourist-places/{slug} before the page renders. */
export async function redirectLegacyTouristPlaceProfile(
  request: NextRequest
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  const match = pathname.match(/^\/tourist-places\/([^/]+)\/?$/);
  if (!match) return null;

  const segment = match[1];
  if (!isLegacyTouristPlaceId(segment)) return null;

  const supabase = getSupabaseForRedirect();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('tourist_places')
    .select('id, slug, name, location')
    .eq('id', segment)
    .maybeSingle();

  if (error || !data) return null;

  const slugPath = getTouristPlacePath(data);
  const target = new URL(slugPath, request.url);
  target.search = request.nextUrl.search;
  target.hash = request.nextUrl.hash;

  return NextResponse.redirect(target, 308);
}
