/**
 * Public business profile reads — no cookies(), so pages can use ISR.
 * Cached for ~10 minutes; merchant updates call revalidateBusinessProfilePaths.
 */
import { unstable_cache } from 'next/cache';
import { getPublicSupabase } from '@/lib/supabase/public';
import {
  businessHasPublicPhoto,
  filterBusinessesWithPublicPhotos,
  mapBusinessRecord,
} from '@/lib/businessMapping';
import { isLegacyBusinessId, resolveBusinessSlug } from '@/lib/businessSlug';
import { redactPublicBusinessFields } from '@/lib/security/businessFields';
import { escapeIlikePattern } from '@/lib/searchMatch';
import { categoryHref } from '@/lib/categoryDisplay';

export const BUSINESS_PAGE_REVALIDATE_SECONDS = 600;

type PublicBusinessResult =
  | { success: true; business: ReturnType<typeof mapBusinessRecord>; reason: 'active' }
  | {
      success: false;
      error: string;
      reason: 'not_found' | 'inactive';
      listing?: {
        id: string;
        businessName: string;
        displayName: string;
        city: string | null;
        status: string;
        slug: string | null;
        registrationNumber: string | null;
      };
    };

async function fetchBusinessBySlugOrId(slugOrId: string): Promise<PublicBusinessResult> {
  const identifier = slugOrId.trim();
  if (!identifier) {
    return { success: false, error: 'Business identifier is required', reason: 'not_found' };
  }

  const supabase = getPublicSupabase();

  const { data: bySlug, error: slugError } = await supabase
    .from('Business')
    .select('*')
    .eq('slug', identifier)
    .maybeSingle();

  if (slugError) throw slugError;

  let business = bySlug;

  if (!business && isLegacyBusinessId(identifier)) {
    const { data: byId, error: idError } = await supabase
      .from('Business')
      .select('*')
      .eq('id', identifier)
      .maybeSingle();
    if (idError) throw idError;
    business = byId;
  }

  if (!business) {
    return { success: false, error: 'Business not found', reason: 'not_found' };
  }

  const listingStatus = String(business.status || 'Pending');
  if (listingStatus.toLowerCase() !== 'active') {
    const displayName =
      String(business.displayName || business.businessName || 'This business').trim() ||
      'This business';
    return {
      success: false,
      error: 'Business listing is not active',
      reason: 'inactive',
      listing: {
        id: String(business.id),
        businessName: String(business.businessName || displayName),
        displayName,
        city: business.city ? String(business.city) : null,
        status: listingStatus,
        slug: business.slug ? String(business.slug) : null,
        registrationNumber: business.registrationNumber
          ? String(business.registrationNumber)
          : null,
      },
    };
  }

  const slug =
    business.slug?.trim() ||
    resolveBusinessSlug({
      slug: business.slug,
      name: business.displayName,
      businessName: business.businessName,
      city: business.city,
    });

  const mapped = mapBusinessRecord({ ...business, slug });
  if (!businessHasPublicPhoto(mapped)) {
    return {
      success: false,
      error: 'Business listing is hidden until photos are added',
      reason: 'not_found',
    };
  }

  const publicBusiness = redactPublicBusinessFields(
    mapped as unknown as Record<string, unknown>
  ) as ReturnType<typeof mapBusinessRecord>;

  return {
    success: true,
    business: publicBusiness,
    reason: 'active',
  };
}

export function getCachedPublicBusiness(slugOrId: string) {
  const identifier = slugOrId.trim();
  const cacheKey = identifier.toLowerCase();
  return unstable_cache(
    async () => fetchBusinessBySlugOrId(identifier),
    ['public-business-v1', cacheKey],
    { revalidate: BUSINESS_PAGE_REVALIDATE_SECONDS }
  )();
}

async function fetchRelatedForProfile(business: {
  id: string;
  category: string;
  city?: string | null;
}) {
  const supabase = getPublicSupabase();
  const categoryLimit = 4;
  const cityLimit = 4;

  const categoryQuery = supabase
    .from('Business')
    .select(
      'id, businessName, displayName, slug, category, city, status, profilePictureUrl, images, isFinderBVerified, updatedAt'
    )
    .eq('status', 'Active')
    .neq('id', business.id)
    .ilike('category', `%${escapeIlikePattern(business.category)}%`)
    .order('updatedAt', { ascending: false })
    .limit(categoryLimit + 2);

  let cityBusinesses: Record<string, unknown>[] = [];
  if (business.city?.trim()) {
    const { data } = await supabase
      .from('Business')
      .select(
        'id, businessName, displayName, slug, category, city, status, profilePictureUrl, images, isFinderBVerified, updatedAt'
      )
      .eq('status', 'Active')
      .neq('id', business.id)
      .ilike('city', `%${escapeIlikePattern(business.city.trim())}%`)
      .order('updatedAt', { ascending: false })
      .limit(cityLimit + 2);
    cityBusinesses = (data as Record<string, unknown>[]) ?? [];
  }

  const { data: categoryRows, error } = await categoryQuery;
  if (error) throw error;

  const sameCategory = filterBusinessesWithPublicPhotos(
    (categoryRows ?? [])
      .map((row) => mapBusinessRecord(row as Record<string, unknown>))
      .filter((row) => row.id !== business.id)
  ).slice(0, categoryLimit);

  const sameCity = filterBusinessesWithPublicPhotos(
    cityBusinesses
      .map((row) => mapBusinessRecord(row))
      .filter(
        (row) => row.id !== business.id && !sameCategory.some((item) => item.id === row.id)
      )
  ).slice(0, cityLimit);

  return { success: true as const, sameCategory, sameCity };
}

export function getCachedRelatedBusinesses(business: {
  id: string;
  category: string;
  city?: string | null;
}) {
  return unstable_cache(
    async () => fetchRelatedForProfile(business),
    [
      'public-business-related-v1',
      business.id,
      business.category.toLowerCase(),
      (business.city || '').toLowerCase(),
    ],
    { revalidate: BUSINESS_PAGE_REVALIDATE_SECONDS }
  )();
}

async function fetchCategoryBreadcrumb(categoryName: string) {
  const name = categoryName.trim();
  if (!name) return { success: true as const, category: null };

  const supabase = getPublicSupabase();
  const pattern = escapeIlikePattern(name);
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id')
    .eq('status', 'Active')
    .ilike('name', pattern)
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return {
      success: true as const,
      category: {
        id: '',
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        parentId: null as string | null,
        href: `/categories?search=${encodeURIComponent(name)}`,
      },
    };
  }

  const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-');
  return {
    success: true as const,
    category: {
      id: data.id,
      name: data.name,
      slug,
      parentId: data.parent_id ? String(data.parent_id) : null,
      href: categoryHref(slug, data.name),
    },
  };
}

export function getCachedCategoryBreadcrumb(categoryName: string) {
  const name = categoryName.trim();
  const cacheKey = name.toLowerCase();
  return unstable_cache(
    async () => fetchCategoryBreadcrumb(name),
    ['public-category-breadcrumb-v1', cacheKey],
    { revalidate: BUSINESS_PAGE_REVALIDATE_SECONDS }
  )();
}

async function fetchTopCategoriesForLinks() {
  const supabase = getPublicSupabase();
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('status', 'Active')
    .is('parent_id', null)
    .order('position', { ascending: true })
    .limit(12);

  if (error) throw error;
  return data ?? [];
}

export function getCachedTopCategoriesForLinks() {
  return unstable_cache(
    async () => fetchTopCategoriesForLinks(),
    ['public-top-categories-links-v1'],
    { revalidate: BUSINESS_PAGE_REVALIDATE_SECONDS }
  )();
}
