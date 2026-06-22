import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import {
  isLegacyBusinessProfileSegment,
  RESERVED_BUSINESS_ROUTE_SEGMENTS,
} from '@/lib/businessProfileLink';
import { getBusinessProfilePath } from '@/lib/businessSlug';

function getSupabaseForRedirect() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Edge redirect: legacy /business/{uuid} → /business/{slug} before the page renders. */
export async function redirectLegacyBusinessProfile(
  request: NextRequest
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  const match = pathname.match(/^\/business\/([^/]+)\/?$/);
  if (!match) return null;

  const segment = match[1];
  if (RESERVED_BUSINESS_ROUTE_SEGMENTS.has(segment)) return null;
  if (!isLegacyBusinessProfileSegment(segment)) return null;

  const supabase = getSupabaseForRedirect();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('Business')
    .select('id, slug, businessName, displayName, city')
    .eq('id', segment)
    .maybeSingle();

  if (error || !data) return null;

  const slugPath = getBusinessProfilePath(data);
  const target = new URL(slugPath, request.url);
  target.search = request.nextUrl.search;
  target.hash = request.nextUrl.hash;

  return NextResponse.redirect(target, 308);
}
