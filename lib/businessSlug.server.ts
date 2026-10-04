'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import { revalidateBusinessProfilePaths } from '@/lib/businessRevalidation';
import { buildBusinessSlugCandidate, withSlugSuffix } from '@/lib/businessSlug';
import { createServiceClient } from '@/lib/supabase/service';

function getSlugDb(): SupabaseClient | null {
  return createServiceClient();
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
  if (!supabase) {
    return buildBusinessSlugCandidate(businessName, city);
  }

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

  return withSlugSuffix(base, excludeId?.slice(0, 8) || Date.now().toString(36));
}

/** Persist a slug when missing. Never revalidates on read — only after a write. */
export async function ensureBusinessSlug(business: {
  id: string;
  businessName?: string | null;
  displayName?: string | null;
  city?: string | null;
  slug?: string | null;
}): Promise<string> {
  const existing = business.slug?.trim();
  if (existing) return existing;

  const supabase = getSlugDb();
  if (!supabase) {
    return buildBusinessSlugCandidate(
      business.businessName || business.displayName || 'business',
      business.city
    );
  }

  const name = business.businessName || business.displayName || 'business';
  const slug = await generateUniqueBusinessSlug(name, business.city, business.id);

  const { error } = await supabase
    .from('Business')
    .update({ slug, updatedAt: new Date().toISOString() })
    .eq('id', business.id);

  if (error) {
    console.error('[ensureBusinessSlug] update failed:', error.message);
    throw error;
  }

  try {
    revalidateBusinessProfilePaths({ id: business.id, slug, businessName: name, city: business.city });
  } catch (revalidateError) {
    console.error('[ensureBusinessSlug] cache refresh failed', revalidateError);
  }
  return slug;
}
