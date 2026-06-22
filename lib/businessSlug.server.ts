'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildBusinessSlugCandidate,
  isLegacyBusinessId,
  withSlugSuffix,
} from '@/lib/businessSlug';

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
  supabase: SupabaseClient,
  businessName: string,
  city?: string | null,
  excludeId?: string
): Promise<string> {
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

export async function ensureBusinessSlug(
  supabase: SupabaseClient,
  business: {
    id: string;
    businessName?: string | null;
    displayName?: string | null;
    city?: string | null;
    slug?: string | null;
  }
): Promise<string> {
  const existing = business.slug?.trim();
  if (existing) return existing;

  const name = business.businessName || business.displayName || 'business';
  const slug = await generateUniqueBusinessSlug(supabase, name, business.city, business.id);

  const { error } = await supabase
    .from('Business')
    .update({ slug, updatedAt: new Date().toISOString() })
    .eq('id', business.id);

  if (error) throw error;
  return slug;
}
