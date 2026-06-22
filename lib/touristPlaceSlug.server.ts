'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildTouristPlaceSlugCandidate,
  withTouristPlaceSlugSuffix,
} from '@/lib/touristPlaceSlug';
import { createServiceClient } from '@/lib/supabase/service';

function getSlugDb(): SupabaseClient {
  const service = createServiceClient();
  if (!service) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required to assign tourist place slugs. Add it to your environment variables.'
    );
  }
  return service;
}

async function slugExists(
  supabase: SupabaseClient,
  slug: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase.from('tourist_places').select('id').eq('slug', slug).limit(1);
  if (excludeId) {
    query = query.neq('id', excludeId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return Boolean(data?.length);
}

export async function generateUniqueTouristPlaceSlug(
  name: string,
  location?: string | null,
  excludeId?: string
): Promise<string> {
  const supabase = getSlugDb();
  const base = buildTouristPlaceSlugCandidate(name, location);
  if (!(await slugExists(supabase, base, excludeId))) {
    return base;
  }

  for (let i = 2; i <= 50; i += 1) {
    const candidate = withTouristPlaceSlugSuffix(base, String(i));
    if (!(await slugExists(supabase, candidate, excludeId))) {
      return candidate;
    }
  }

  return withTouristPlaceSlugSuffix(base, excludeId?.slice(0, 8) || Date.now().toString(36));
}

export async function ensureTouristPlaceSlug(place: {
  id: string;
  name: string;
  location?: string | null;
  slug?: string | null;
}): Promise<string> {
  const existing = place.slug?.trim();
  if (existing) return existing;

  const supabase = getSlugDb();
  const slug = await generateUniqueTouristPlaceSlug(place.name, place.location, place.id);

  const { error } = await supabase
    .from('tourist_places')
    .update({ slug, updated_at: new Date().toISOString() })
    .eq('id', place.id);

  if (error) {
    console.error('[ensureTouristPlaceSlug] update failed:', error.message);
    throw error;
  }

  return slug;
}
