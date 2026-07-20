import { unstable_cache } from 'next/cache';
import { revalidatePath, updateTag } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { sortBusinessesByProfileCompleteness } from '@/lib/businessProfileCompleteness';
import { mapBusinessRecord, filterBusinessesWithPublicPhotos } from '@/lib/businessMapping';
import { categoryBrowseHref, dbBanner, dbSymbol } from '@/lib/categoryDisplay';
import { stripHtml } from '@/lib/stripHtml';
import { mapTouristPlaceRow } from '@/lib/touristPlaceImage';
import { getPublicSupabase } from '@/lib/supabase/public';
import { SHOW_HOME_LATEST_MOVIES_SECTION } from '@/lib/featureFlags';
import {
  fetchFinderBTutorialPlaylists,
  type FinderBTutorialPlaylist,
} from '@/lib/finderbYoutube';
import {
  attachSubcategoryBusinessCounts,
  attachTopLevelBusinessCounts,
  fetchActiveBusinessCategoryLabels,
} from '@/lib/categoryBusinessCounts';
import { getTrendingThisWeek } from '@/app/actions/analytics';
import type { TrendingWeekItem } from '@/lib/trendingThisWeek';

export const HOME_PAGE_REVALIDATE_SECONDS = 300;
export const HOME_PAGE_CACHE_TAG = 'homepage';

const MIN_SUBCATEGORIES_PER_GROUP = 2;

export type HomePageData = {
  businesses: ReturnType<typeof mapBusinessRecord>[];
  categories: Array<{
    id: string;
    name: string;
    icon: string;
    image: string;
    slug: string;
    businessCount: number;
    color: string;
  }>;
  movies: Array<{
    id: string;
    title: string;
    genre: string;
    image: string;
    rating: number;
  }>;
  touristPlaces: ReturnType<typeof mapTouristPlaceRow>[];
  blogs: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    image: string;
    date: string;
    author: string;
  }>;
  featuredGroups: Array<{
    id: string;
    title: string;
    slug: string;
    icon: string;
    subcategories: Array<{
      id: string;
      name: string;
      slug: string | null;
      icon: string;
      image: string;
      businessCount: number;
      href: string;
    }>;
  }>;
  tutorialPlaylists: FinderBTutorialPlaylist[];
  trendingThisWeek: TrendingWeekItem[];
};

function plainBlogExcerpt(
  excerpt: string | null | undefined,
  content: string | null | undefined,
  maxLen = 150
): string {
  const raw = excerpt || (content ? content.substring(0, maxLen) + '...' : '');
  return stripHtml(raw);
}

async function attachActiveJobFlags<T extends { id: string }>(
  supabase: SupabaseClient,
  businesses: T[]
): Promise<(T & { hasActiveJobs: boolean })[]> {
  if (businesses.length === 0) return [];

  const ids = businesses.map((business) => business.id);
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('business_id')
    .eq('status', 'active')
    .in('business_id', ids);

  if (error) {
    console.error('[homepage] active jobs lookup failed:', error);
    return businesses.map((business) => ({ ...business, hasActiveJobs: false }));
  }

  const hiringIds = new Set(
    (jobs ?? [])
      .map((row) => row.business_id)
      .filter((id): id is string => Boolean(id))
      .map(String)
  );

  return businesses.map((business) => ({
    ...business,
    hasActiveJobs: hiringIds.has(String(business.id)),
  }));
}

async function fetchFeaturedBusinesses(supabase: SupabaseClient) {
  const { data: businesses, error } = await supabase
    .from('Business')
    .select('*')
    .eq('status', 'Active')
    .or('isFinderBVerified.eq.true,hasVerifiedBadge.eq.true')
    .limit(60);

  if (error) {
    console.error('[homepage] featured businesses fetch failed:', error);
    return [];
  }

  const mappedBusinesses = filterBusinessesWithPublicPhotos(
    (businesses ?? []).map((b: Record<string, unknown>) => mapBusinessRecord(b))
  );
  const ranked = sortBusinessesByProfileCompleteness(mappedBusinesses).slice(0, 12);
  return attachActiveJobFlags(supabase, ranked);
}

async function fetchCategories(supabase: SupabaseClient) {
  const [{ data: categories, error }, businessLabels] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('status', 'Active')
      .is('parent_id', null)
      .order('position', { ascending: true })
      .order('items_count', { ascending: false }),
    fetchActiveBusinessCategoryLabels(supabase),
  ]);

  if (error) {
    console.error('[homepage] categories fetch failed:', error);
    return [];
  }

  return attachTopLevelBusinessCounts(
    (categories ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      icon: dbSymbol(c.symbol) ?? '',
      image: dbBanner(c.banner) ?? '',
      slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
      businessCount: 0,
      color: '#3B82F6',
    })),
    businessLabels
  );
}

async function fetchMovies(supabase: SupabaseClient) {
  const { data: movies, error } = await supabase
    .from('movies')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('[homepage] movies fetch failed:', error);
    return [];
  }

  return (movies ?? []).map((m) => ({
    id: m.id,
    title: m.name,
    genre: m.description || 'Entertainment',
    image:
      m.poster_url ||
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800',
    rating: m.finderb_rating ? Number(m.finderb_rating) : 0,
  }));
}

async function fetchTouristPlaces(supabase: SupabaseClient) {
  const { data: places, error } = await supabase
    .from('tourist_places')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[homepage] tourist places fetch failed:', error);
    return [];
  }

  return (places ?? []).map(mapTouristPlaceRow);
}

async function fetchBlogs(supabase: SupabaseClient) {
  const { data: blogs, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(6);

  if (error) {
    console.error('[homepage] blogs fetch failed:', error);
    return [];
  }

  return (blogs ?? []).map((b) => ({
    id: b.id,
    title: b.title,
    slug: b.slug,
    excerpt: plainBlogExcerpt(b.excerpt, b.content),
    image:
      b.image_url ||
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=800',
    date: b.published_at
      ? new Date(b.published_at).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : 'Recently',
    author: b.author || 'FinderB Admin',
  }));
}

async function fetchFeaturedGroups(supabase: SupabaseClient) {
  const { data: parents, error: parentError } = await supabase
    .from('categories')
    .select('id, name, slug, banner, symbol, position, items_count')
    .is('parent_id', null)
    .eq('status', 'Active')
    .order('position', { ascending: true })
    .order('items_count', { ascending: false });

  if (parentError) {
    console.error('[homepage] featured groups fetch failed:', parentError);
    return [];
  }

  if (!parents?.length) {
    return [];
  }

  const parentIds = parents.map((p) => p.id);
  const [{ data: children, error: childError }, businessLabels] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, slug, banner, symbol, items_count, parent_id, position')
      .in('parent_id', parentIds)
      .eq('status', 'Active')
      .order('position', { ascending: true })
      .order('items_count', { ascending: false }),
    fetchActiveBusinessCategoryLabels(supabase),
  ]);

  if (childError) {
    console.error('[homepage] featured group children fetch failed:', childError);
    return [];
  }

  const childrenByParent = new Map<string, NonNullable<typeof children>>();
  for (const child of children ?? []) {
    const list = childrenByParent.get(child.parent_id) ?? [];
    list.push(child);
    childrenByParent.set(child.parent_id, list);
  }

  return parents
    .map((parent) => {
      const subs = childrenByParent.get(parent.id) ?? [];
      if (subs.length < MIN_SUBCATEGORIES_PER_GROUP) return null;

      return {
        id: parent.id,
        title: parent.name,
        slug: parent.slug,
        icon: dbSymbol(parent.symbol) ?? '',
        subcategories: attachSubcategoryBusinessCounts(
          subs.map((child) => ({
            id: child.id,
            name: child.name,
            slug: child.slug,
            icon: dbSymbol(child.symbol) ?? '',
            image: dbBanner(child.banner) ?? '',
            businessCount: 0,
            href: categoryBrowseHref(parent.id, child.id),
          })),
          parent.name,
          businessLabels
        ),
      };
    })
    .filter((g): g is NonNullable<typeof g> => g !== null);
}

async function fetchHomePageData(): Promise<HomePageData> {
  const supabase = getPublicSupabase();

  const [
    businesses,
    categories,
    movies,
    touristPlaces,
    blogs,
    featuredGroups,
    tutorialPlaylists,
    trendingThisWeek,
  ] = await Promise.all([
    fetchFeaturedBusinesses(supabase),
    fetchCategories(supabase),
    SHOW_HOME_LATEST_MOVIES_SECTION ? fetchMovies(supabase) : Promise.resolve([]),
    fetchTouristPlaces(supabase),
    fetchBlogs(supabase),
    fetchFeaturedGroups(supabase),
    fetchFinderBTutorialPlaylists(),
    getTrendingThisWeek(4),
  ]);

  return {
    businesses,
    categories,
    movies,
    touristPlaces,
    blogs,
    featuredGroups,
    tutorialPlaylists,
    trendingThisWeek,
  };
}

const getHomePageDataCached = unstable_cache(fetchHomePageData, ['homepage-data'], {
  revalidate: HOME_PAGE_REVALIDATE_SECONDS,
  tags: [HOME_PAGE_CACHE_TAG],
});

export async function getCachedHomePageData(): Promise<HomePageData> {
  return getHomePageDataCached();
}

export function revalidateHomePage() {
  updateTag(HOME_PAGE_CACHE_TAG);
  revalidatePath('/');
}
