/**
 * Regenerate / validate the FinderB sitemap (slug-based business URLs).
 *
 * Usage:
 *   npm run regenerate:sitemap
 *   npm run regenerate:sitemap -- --url https://finderb.com
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function loadEnvFiles() {
  for (const file of ['.env', '.env.local']) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function slugifyBusinessName(name) {
  return String(name || 'business')
    .toLowerCase()
    .trim()
    .replace(/[''`]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function buildBusinessSlugCandidate(businessName, city) {
  const base = slugifyBusinessName(businessName);
  if (!base) return 'business';
  const cityPart = city ? slugifyBusinessName(city) : '';
  if (!cityPart || base.endsWith(cityPart) || base.includes(`-${cityPart}`)) {
    return base.slice(0, 96);
  }
  return `${base}-${cityPart}`.slice(0, 96);
}

function resolveBusinessSlug(business) {
  const persisted = business.slug?.trim();
  if (persisted) return persisted;
  return buildBusinessSlugCandidate(business.businessName || 'business', business.city);
}

function isUuidLike(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function categorySlug(name, slug) {
  return slug || String(name).toLowerCase().replace(/\s+/g, '-');
}

function slugifyCity(city) {
  return String(city || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const STATIC_PATHS = [
  '/',
  '/categories',
  '/categories/job',
  '/movies',
  '/tourist-places',
  '/blog',
  '/news',
  '/pricing',
  '/about',
  '/contact',
  '/terms',
  '/privacy',
  '/cancellation-refund',
  '/shipping-delivery',
  '/advertisements',
  '/hirings',
  '/policy',
  '/business/register',
  '/business/list',
];

function resolveTouristPlaceSlug(place) {
  const persisted = place.slug?.trim();
  if (persisted) return persisted;
  return buildTouristPlaceSlugCandidate(place.name, place.location);
}

function buildTouristPlaceSlugCandidate(name, location) {
  const base = slugifyBusinessName(name);
  if (!base) return 'place';
  const locationLabel = String(location || '').split(',')[0]?.trim() || '';
  const locationPart = locationLabel ? slugifyBusinessName(locationLabel) : '';
  if (!locationPart || base.endsWith(locationPart) || base.includes(`-${locationPart}`)) {
    return base.slice(0, 96);
  }
  return `${base}-${locationPart}`.slice(0, 96);
}

async function buildSitemapPaths(supabase) {
  const paths = [...STATIC_PATHS];

  const [categoriesResult, blogsResult, touristResult, businessesResult] = await Promise.all([
    supabase
      .from('categories')
      .select('name, slug')
      .eq('status', 'Active')
      .order('position', { ascending: true }),
    supabase
      .from('blogs')
      .select('id, slug')
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
    supabase.from('tourist_places').select('id, slug, name, location').order('updated_at', { ascending: false }),
    supabase
      .from('Business')
      .select('id, slug, businessName, city, category')
      .eq('status', 'Active')
      .order('updatedAt', { ascending: false }),
  ]);

  if (categoriesResult.error) throw categoriesResult.error;
  if (blogsResult.error) throw blogsResult.error;
  if (touristResult.error) throw touristResult.error;
  if (businessesResult.error) throw businessesResult.error;

  for (const category of categoriesResult.data ?? []) {
    paths.push(`/categories/${categorySlug(category.name, category.slug)}`);
  }

  const cityPairs = new Set();
  for (const business of businessesResult.data ?? []) {
    const category = business.category?.trim();
    const city = business.city?.trim();
    if (category && city) {
      cityPairs.add(`/categories/${categorySlug(category)}/${slugifyCity(city)}`);
    }
  }
  paths.push(...cityPairs);

  for (const business of businessesResult.data ?? []) {
    paths.push(`/business/${resolveBusinessSlug(business)}`);
  }

  for (const blog of blogsResult.data ?? []) {
    paths.push(`/blog/${blog.slug || blog.id}`);
  }

  for (const place of touristResult.data ?? []) {
    paths.push(`/tourist-places/${resolveTouristPlaceSlug(place)}`);
  }

  return {
    paths: [...new Set(paths)],
    businessCount: businessesResult.data?.length ?? 0,
    businesses: businessesResult.data ?? [],
  };
}

async function warmSitemapCache(baseUrl) {
  const xmlUrl = `${baseUrl.replace(/\/$/, '')}/sitemap.xml`;
  const htmlUrl = `${baseUrl.replace(/\/$/, '')}/sitemap`;

  const results = [];
  for (const url of [xmlUrl, htmlUrl]) {
    try {
      const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
      results.push({ url, status: res.status, ok: res.ok });
    } catch (error) {
      results.push({ url, status: 0, ok: false, error: error.message });
    }
  }
  return results;
}

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

async function main() {
  loadEnvFiles();

  const siteUrl =
    getArgValue('--url') ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars in .env / .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { paths, businessCount, businesses } = await buildSitemapPaths(supabase);

  const businessPaths = paths.filter((p) => p.startsWith('/business/'));
  const uuidBusinessPaths = businessPaths.filter((p) => {
    const segment = p.replace('/business/', '');
    return isUuidLike(segment);
  });

  const touristPaths = paths.filter((p) => p.startsWith('/tourist-places/') && p !== '/tourist-places');
  const uuidTouristPaths = touristPaths.filter((p) => {
    const segment = p.replace('/tourist-places/', '');
    return isUuidLike(segment);
  });

  const missingSlug = businesses.filter((b) => !b.slug?.trim());

  console.log(`Sitemap preview for ${siteUrl}`);
  console.log(`Total URLs: ${paths.length}`);
  console.log(`Business URLs: ${businessPaths.length}`);
  console.log(`Tourist place URLs: ${touristPaths.length}`);
  console.log(`Category + city URLs: ${paths.filter((p) => p.match(/^\/categories\/[^/]+\/[^/]+$/)).length}`);

  if (uuidTouristPaths.length) {
    console.error('\nERROR: Sitemap still contains UUID tourist place URLs:');
    for (const path of uuidTouristPaths) console.error(`  - ${path}`);
    process.exit(1);
  }

  if (uuidBusinessPaths.length) {
    console.error('\nERROR: Sitemap still contains UUID business URLs:');
    for (const path of uuidBusinessPaths) console.error(`  - ${path}`);
    process.exit(1);
  }

  if (missingSlug.length) {
    console.warn(`\nWarning: ${missingSlug.length} active businesses missing slug in DB (paths use generated slugs):`);
    for (const row of missingSlug.slice(0, 5)) {
      console.warn(`  - ${row.businessName} (${row.id})`);
    }
    if (missingSlug.length > 5) console.warn(`  ... and ${missingSlug.length - 5} more`);
  }

  console.log('\nSample business URLs:');
  for (const path of businessPaths.slice(0, 5)) {
    console.log(`  ${siteUrl}${path}`);
  }

  console.log('\nSample tourist place URLs:');
  for (const path of touristPaths.slice(0, 5)) {
    console.log(`  ${siteUrl}${path}`);
  }

  console.log('\nWarming sitemap cache...');
  const warmResults = await warmSitemapCache(siteUrl);
  for (const result of warmResults) {
    if (result.ok) {
      console.log(`  OK ${result.status} ${result.url}`);
    } else {
      console.warn(`  SKIP ${result.url}${result.error ? ` (${result.error})` : ` (HTTP ${result.status})`}`);
    }
  }

  console.log('\nDone. Sitemap uses slug-only business and tourist place URLs.');
  console.log(`XML: ${siteUrl.replace(/\/$/, '')}/sitemap.xml`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
