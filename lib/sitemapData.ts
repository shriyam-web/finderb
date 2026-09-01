import { createClient } from '@supabase/supabase-js';
import type { MetadataRoute } from 'next';
import { revalidatePath } from 'next/cache';
import { revalidateHomePage } from '@/lib/homePageData';
import { SITE_ORIGIN } from '@/lib/siteSeo';
import { slugifyCity } from '@/lib/categoryCity';
import { getBusinessProfilePath } from '@/lib/businessSlug';
import { businessHasPublicPhoto } from '@/lib/businessMapping';
import { getTouristPlacePath } from '@/lib/touristPlaceSlug';

export const SITEMAP_BASE_URL = SITE_ORIGIN;

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

/**
 * Next.js writes MetadataRoute.Sitemap `url` values into <loc> without XML
 * escaping. Raw `&` in category slugs (car-wash-&-detailing) crashes Googlebot
 * with xmlParseEntityRef. Escape here; crawlers decode &amp; back to `&`.
 */
function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toSitemapLoc(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const absolute = `${SITEMAP_BASE_URL}${normalized}`;
  try {
    return escapeXmlText(encodeURI(decodeURI(absolute)));
  } catch {
    return escapeXmlText(encodeURI(absolute));
  }
}

function toEntry(
  path: string,
  opts: Partial<Pick<SitemapEntry, 'lastModified' | 'changeFrequency' | 'priority'>> = {}
): SitemapEntry {
  return {
    url: toSitemapLoc(path),
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
  { path: '/categories/admissions', changeFrequency: 'daily', priority: 0.75 },
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
  { path: '/policy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/business/register', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/business/list', changeFrequency: 'weekly', priority: 0.5 },
  { path: '/llms.txt', changeFrequency: 'monthly', priority: 0.3 },
];

/** Special /categories/* routes that are not DB category rows (or share a slug). */
const RESERVED_CATEGORY_SLUGS = new Set(['job', 'admissions']);

function dedupeSitemapEntries(entries: SitemapEntry[]): SitemapEntry[] {
  const byUrl = new Map<string, SitemapEntry>();
  for (const entry of entries) {
    const existing = byUrl.get(entry.url);
    if (!existing) {
      byUrl.set(entry.url, entry);
      continue;
    }
    const existingPri = existing.priority ?? 0;
    const nextPri = entry.priority ?? 0;
    if (nextPri > existingPri) {
      byUrl.set(entry.url, entry);
      continue;
    }
    const existingMod = existing.lastModified ? new Date(existing.lastModified).getTime() : 0;
    const nextMod = entry.lastModified ? new Date(entry.lastModified).getTime() : 0;
    if (nextMod > existingMod) byUrl.set(entry.url, { ...existing, lastModified: entry.lastModified });
  }
  return [...byUrl.values()];
}

function getStaticEntries(): SitemapEntry[] {
  return STATIC_PAGES.map(({ path, changeFrequency, priority }) =>
    toEntry(path, { changeFrequency, priority })
  );
}

async function fetchActiveBusinesses() {
  const supabase = getSupabase();
  const pageSize = 1000;
  const businesses: {
    id: string;
    slug: string | null;
    businessName: string | null;
    city: string | null;
    updatedAt: string | null;
  }[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('Business')
      .select('id, slug, businessName, city, updatedAt, profilePictureUrl, images')
      .eq('status', 'Active')
      .order('updatedAt', { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data?.length) break;

    for (const row of data) {
      if (!businessHasPublicPhoto(row)) continue;
      businesses.push({
        id: row.id,
        slug: row.slug,
        businessName: row.businessName,
        city: row.city,
        updatedAt: row.updatedAt,
      });
    }
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return businesses;
}

function categorySlugFromName(name: string, slug?: string | null): string {
  return categorySlug(name, slug);
}

async function fetchCategoryCityEntries(): Promise<SitemapEntry[]> {
  const supabase = getSupabase();
  const pageSize = 1000;
  const pairs = new Map<string, Date | undefined>();
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('Business')
      .select('category, city, updatedAt, profilePictureUrl, images')
      .eq('status', 'Active')
      .not('city', 'is', null)
      .order('updatedAt', { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data?.length) break;

    for (const row of data) {
      if (!businessHasPublicPhoto(row)) continue;
      const category = row.category?.trim();
      const city = row.city?.trim();
      if (!category || !city) continue;

      const path = `/categories/${categorySlugFromName(category)}/${slugifyCity(city)}`;
      const updated = parseDate(row.updatedAt);
      const existing = pairs.get(path);
      if (!existing || (updated && updated > existing)) {
        pairs.set(path, updated);
      }
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return [...pairs.entries()].map(([path, lastModified]) =>
    toEntry(path, {
      lastModified,
      changeFrequency: 'daily',
      priority: 0.75,
    })
  );
}

async function fetchDynamicEntries(): Promise<SitemapEntry[]> {
  const supabase = getSupabase();

  const [categoriesResult, blogsResult, touristResult, businesses, categoryCityEntries] =
    await Promise.all([
      supabase
        .from('categories')
        .select('id, name, slug, parent_id, updated_at')
        .eq('status', 'Active')
        .order('position', { ascending: true }),
      supabase
        .from('blogs')
        .select('id, slug, updated_at, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false }),
      supabase
        .from('tourist_places')
        .select('id, slug, name, location, updated_at')
        .order('updated_at', { ascending: false }),
      fetchActiveBusinesses(),
      fetchCategoryCityEntries(),
    ]);

  if (categoriesResult.error) throw categoriesResult.error;
  if (blogsResult.error) throw blogsResult.error;
  if (touristResult.error) throw touristResult.error;

  const allCategories = categoriesResult.data ?? [];
  const parents = allCategories.filter((category) => !category.parent_id);
  const parentById = new Map(parents.map((category) => [category.id, category]));

  const categoryEntries = parents
    .map((category) => {
      const slug = categorySlug(category.name, category.slug);
      if (RESERVED_CATEGORY_SLUGS.has(slug)) return null;
      return toEntry(`/categories/${slug}`, {
        lastModified: parseDate(category.updated_at),
        changeFrequency: 'daily',
        priority: 0.8,
      });
    })
    .filter((entry): entry is SitemapEntry => Boolean(entry));

  // Subcategory browse URLs used by the modern Categories UI.
  const subcategoryEntries = allCategories
    .filter((category) => Boolean(category.parent_id))
    .map((category) => {
      const parent = parentById.get(category.parent_id as string);
      if (!parent) return null;
      const parentSlug = categorySlug(parent.name, parent.slug);
      const subSlug = categorySlug(category.name, category.slug);
      if (!parentSlug || !subSlug || RESERVED_CATEGORY_SLUGS.has(parentSlug)) return null;
      return toEntry(`/categories/${parentSlug}?sub=${encodeURIComponent(subSlug)}`, {
        lastModified: parseDate(category.updated_at) ?? parseDate(parent.updated_at),
        changeFrequency: 'daily',
        priority: 0.7,
      });
    })
    .filter((entry): entry is SitemapEntry => Boolean(entry));

  const blogEntries = (blogsResult.data ?? []).map((blog) =>
    toEntry(`/blog/${blog.slug || blog.id}`, {
      lastModified: parseDate(blog.updated_at ?? blog.published_at),
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  );

  const touristEntries = (touristResult.data ?? []).map((place) =>
    toEntry(getTouristPlacePath(place), {
      lastModified: parseDate(place.updated_at),
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  );

  const businessEntries = businesses.map((business) =>
    toEntry(getBusinessProfilePath(business), {
      lastModified: parseDate(business.updatedAt),
      changeFrequency: 'daily',
      priority: 0.7,
    })
  );

  return [
    ...categoryEntries,
    ...subcategoryEntries,
    ...categoryCityEntries,
    ...businessEntries,
    ...blogEntries,
    ...touristEntries,
  ];
}

export async function buildSitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const dynamicEntries = await fetchDynamicEntries();
    return dedupeSitemapEntries([...getStaticEntries(), ...dynamicEntries]);
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
        .select('id, name, slug, parent_id')
        .eq('status', 'Active')
        .order('position', { ascending: true }),
      supabase
        .from('blogs')
        .select('title, slug, id')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(100),
      supabase
        .from('tourist_places')
        .select('name, id, slug, location')
        .order('name', { ascending: true }),
      supabase
        .from('Business')
        .select('id, slug, businessName, city, profilePictureUrl, images')
        .eq('status', 'Active')
        .order('updatedAt', { ascending: false })
        .limit(200),
    ]);

    const sections: SitemapSection[] = [staticSection];
    const allCategories = categoriesResult.data ?? [];
    const parents = allCategories.filter((category) => !category.parent_id);
    const parentById = new Map(parents.map((category) => [category.id, category]));

    if (parents.length) {
      sections.push({
        title: 'Categories',
        links: parents.map((category) => ({
          label: category.name,
          href: `/categories/${categorySlug(category.name, category.slug)}`,
        })),
      });
    }

    const subcategoryLinks = allCategories
      .filter((category) => Boolean(category.parent_id))
      .map((category) => {
        const parent = parentById.get(category.parent_id as string);
        if (!parent) return null;
        const parentSlug = categorySlug(parent.name, parent.slug);
        const subSlug = categorySlug(category.name, category.slug);
        return {
          label: `${parent.name} › ${category.name}`,
          href: `/categories/${parentSlug}?sub=${encodeURIComponent(subSlug)}`,
        };
      })
      .filter((link): link is { label: string; href: string } => Boolean(link))
      .slice(0, 200);

    if (subcategoryLinks.length) {
      sections.push({
        title: 'Subcategories',
        links: subcategoryLinks,
      });
    }

    const publicBusinesses = (businesses.data ?? []).filter((business) =>
      businessHasPublicPhoto(business)
    );

    if (publicBusinesses.length) {
      sections.push({
        title: 'Business listings',
        links: publicBusinesses.map((business) => ({
          label: business.businessName,
          href: getBusinessProfilePath(business),
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
          href: getTouristPlacePath(place),
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
  revalidateHomePage();
}
