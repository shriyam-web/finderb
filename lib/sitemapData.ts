import { createClient } from '@supabase/supabase-js';
import type { MetadataRoute } from 'next';
import { revalidatePath } from 'next/cache';

export const SITEMAP_BASE_URL = 'https://finderb.com';

type SitemapEntry = MetadataRoute.Sitemap[number];

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function categorySlug(name: string, slug?: string | null): string {
  return slug || name.toLowerCase().replace(/\s+/g, '-');
}

function toEntry(
  path: string,
  opts: Partial<Pick<SitemapEntry, 'lastModified' | 'changeFrequency' | 'priority'>> = {}
): SitemapEntry {
  return {
    url: `${SITEMAP_BASE_URL}${path}`,
    lastModified: opts.lastModified ?? new Date(),
    changeFrequency: opts.changeFrequency ?? 'weekly',
    priority: opts.priority ?? 0.5,
  };
}

function parseDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

const STATIC_PAGES: Array<{
  path: string;
  changeFrequency: NonNullable<SitemapEntry['changeFrequency']>;
  priority: number;
}> = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/categories', changeFrequency: 'daily', priority: 0.9 },
  { path: '/categories/job', changeFrequency: 'daily', priority: 0.7 },
  { path: '/movies', changeFrequency: 'daily', priority: 0.7 },
  { path: '/tourist-places', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/blog', changeFrequency: 'daily', priority: 0.8 },
  { path: '/news', changeFrequency: 'daily', priority: 0.8 },
  { path: '/pricing', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/cancellation-refund', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/shipping-delivery', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/advertisements', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/hirings', changeFrequency: 'weekly', priority: 0.4 },
  { path: '/login', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/signup', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/business/login', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/business/list', changeFrequency: 'weekly', priority: 0.5 },
];

function getStaticEntries(): SitemapEntry[] {
  return STATIC_PAGES.map(({ path, changeFrequency, priority }) =>
    toEntry(path, { changeFrequency, priority })
  );
}

async function fetchActiveBusinesses() {
  const supabase = getSupabase();
  const pageSize = 1000;
  const businesses: { id: string; updatedAt: string | null }[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('Business')
      .select('id, updatedAt')
      .eq('status', 'Active')
      .order('updatedAt', { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data?.length) break;

    businesses.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return businesses;
}

async function fetchDynamicEntries(): Promise<SitemapEntry[]> {
  const supabase = getSupabase();

  const [categoriesResult, blogsResult, touristResult, businesses] = await Promise.all([
    supabase
      .from('categories')
      .select('name, slug, updated_at')
      .eq('status', 'Active')
      .order('position', { ascending: true }),
    supabase
      .from('blogs')
      .select('id, slug, updated_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
    supabase
      .from('tourist_places')
      .select('id, updated_at')
      .order('updated_at', { ascending: false }),
    fetchActiveBusinesses(),
  ]);

  if (categoriesResult.error) throw categoriesResult.error;
  if (blogsResult.error) throw blogsResult.error;
  if (touristResult.error) throw touristResult.error;

  const categoryEntries = (categoriesResult.data ?? []).map((category) =>
    toEntry(`/categories/${categorySlug(category.name, category.slug)}`, {
      lastModified: parseDate(category.updated_at),
      changeFrequency: 'daily',
      priority: 0.8,
    })
  );

  const blogEntries = (blogsResult.data ?? []).map((blog) =>
    toEntry(`/blog/${blog.slug || blog.id}`, {
      lastModified: parseDate(blog.updated_at ?? blog.published_at),
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  );

  const touristEntries = (touristResult.data ?? []).map((place) =>
    toEntry(`/tourist-places/${place.id}`, {
      lastModified: parseDate(place.updated_at),
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  );

  const businessEntries = businesses.map((business) =>
    toEntry(`/business/${business.id}`, {
      lastModified: parseDate(business.updatedAt),
      changeFrequency: 'daily',
      priority: 0.7,
    })
  );

  return [...categoryEntries, ...businessEntries, ...blogEntries, ...touristEntries];
}

export async function buildSitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const dynamicEntries = await fetchDynamicEntries();
    return [...getStaticEntries(), ...dynamicEntries];
  } catch (error) {
    console.error('[sitemap] Dynamic fetch failed, serving static URLs only:', error);
    return getStaticEntries();
  }
}

export type SitemapSection = {
  title: string;
  links: { label: string; href: string }[];
};

export async function getSitemapSections(): Promise<SitemapSection[]> {
  const staticSection: SitemapSection = {
    title: 'Main pages',
    links: STATIC_PAGES.map(({ path }) => ({
      label: path === '/' ? 'Home' : path.replace(/^\//, '').replace(/\//g, ' › '),
      href: path,
    })),
  };

  try {
    const supabase = getSupabase();
    const [categoriesResult, blogsResult, touristResult, businesses] = await Promise.all([
      supabase
        .from('categories')
        .select('name, slug')
        .eq('status', 'Active')
        .is('parent_id', null)
        .order('position', { ascending: true }),
      supabase
        .from('blogs')
        .select('title, slug, id')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(100),
      supabase
        .from('tourist_places')
        .select('name, id')
        .order('name', { ascending: true }),
      supabase
        .from('Business')
        .select('id, businessName')
        .eq('status', 'Active')
        .order('updatedAt', { ascending: false })
        .limit(200),
    ]);

    const sections: SitemapSection[] = [staticSection];

    if (categoriesResult.data?.length) {
      sections.push({
        title: 'Categories',
        links: categoriesResult.data.map((category) => ({
          label: category.name,
          href: `/categories/${categorySlug(category.name, category.slug)}`,
        })),
      });
    }

    if (businesses.data?.length) {
      sections.push({
        title: 'Business listings',
        links: businesses.data.map((business) => ({
          label: business.businessName,
          href: `/business/${business.id}`,
        })),
      });
    }

    if (blogsResult.data?.length) {
      sections.push({
        title: 'Blog',
        links: blogsResult.data.map((blog) => ({
          label: blog.title,
          href: `/blog/${blog.slug || blog.id}`,
        })),
      });
    }

    if (touristResult.data?.length) {
      sections.push({
        title: 'Tourist places',
        links: touristResult.data.map((place) => ({
          label: place.name,
          href: `/tourist-places/${place.id}`,
        })),
      });
    }

    return sections;
  } catch (error) {
    console.error('[sitemap] HTML sections fetch failed:', error);
    return [staticSection];
  }
}

export function revalidateSitemap() {
  revalidatePath('/sitemap.xml');
  revalidatePath('/sitemap');
}
