'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildCanonicalProfileQrLink,
  shouldReplaceProfileQrLink,
} from '@/lib/businessProfileLink';
import { revalidateBusinessProfilePaths } from '@/lib/businessRevalidation';
import { buildBusinessSlugCandidate, withSlugSuffix } from '@/lib/businessSlug';
import { createServiceClient } from '@/lib/supabase/service';

function getSlugDb(): SupabaseClient {
  const service = createServiceClient();
  if (!service) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required to assign business slugs. Add it to your environment variables.'
    );
  }
  return service;
}

async function slugExists(
  supabase: SupabaseClient,
  slug: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase.from('Business').select('id').eq('slug', slug).limit(1);
  if (excludeId) {
    query = query.neq('id', excludeId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return Boolean(data?.length);
}

export async function generateUniqueBusinessSlug(
  businessName: string,
  city?: string | null,
  excludeId?: string
): Promise<string> {
  const supabase = getSlugDb();
  const base = buildBusinessSlugCandidate(businessName, city);
  if (!(await slugExists(supabase, base, excludeId))) {
    return base;
  }

  for (let i = 2; i <= 50; i += 1) {
    const candidate = withSlugSuffix(base, String(i));
    if (!(await slugExists(supabase, candidate, excludeId))) {
      return candidate;
    }
  }

  const fallback = withSlugSuffix(base, excludeId?.slice(0, 8) || Date.now().toString(36));
  return fallback;
}

export async function ensureBusinessSlug(business: {
  id: string;
  businessName?: string | null;
  displayName?: string | null;
  city?: string | null;
  slug?: string | null;
  profileQrLink?: string | null;
}): Promise<string> {
  const supabase = getSlugDb();
  const existing = business.slug?.trim();
  const name = business.businessName || business.displayName || 'business';
  const slug = existing || (await generateUniqueBusinessSlug(name, business.city, business.id));
  const profileQrLink = buildCanonicalProfileQrLink({ ...business, slug });
  const needsSlug = !existing;
  const needsQrLink = shouldReplaceProfileQrLink(business, business.profileQrLink);

  if (needsSlug || needsQrLink) {
    const { error } = await supabase
      .from('Business')
      .update({
        ...(needsSlug ? { slug } : {}),
        ...(needsQrLink ? { profileQrLink } : {}),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', business.id);

    if (error) {
      console.error('[ensureBusinessSlug] update failed:', error.message);
      throw error;
    }
  }

  revalidateBusinessProfilePaths({ id: business.id, slug, businessName: name, city: business.city });
  return slug;
}
