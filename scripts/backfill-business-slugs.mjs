/**
 * Backfill SEO slugs for all Business rows missing slug.
 *
 * Usage:
 *   npm run backfill:slugs
 *   npm run backfill:slugs -- --dry-run
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (recommended) or NEXT_PUBLIC_SUPABASE_URL +
 * NEXT_PUBLIC_SUPABASE_ANON_KEY with update permissions on Business.
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

function withSlugSuffix(base, suffix) {
  return `${base}-${suffix}`.slice(0, 96).replace(/-+$/g, '');
}

async function main() {
  loadEnvFiles();

  const dryRun = process.argv.includes('--dry-run');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = serviceKey || anonKey;

  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL and Supabase key in .env / .env.local');
    process.exit(1);
  }

  if (!serviceKey) {
    console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY not set — updates may fail due to RLS.');
  }

  const supabase = createClient(url, key);
  const usedSlugs = new Set();
  const pageSize = 500;
  let from = 0;
  let updated = 0;
  let skipped = 0;

  // Preload existing slugs
  while (true) {
    const { data, error } = await supabase
      .from('Business')
      .select('slug')
      .not('slug', 'is', null)
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data?.length) break;
    for (const row of data) {
      if (row.slug) usedSlugs.add(row.slug);
    }
    if (data.length < pageSize) break;
    from += pageSize;
  }

  from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('Business')
      .select('id, businessName, displayName, city, slug')
      .or('slug.is.null,slug.eq.')
      .order('createdAt', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data?.length) break;

    for (const row of data) {
      if (row.slug?.trim()) {
        skipped += 1;
        continue;
      }

      const name = row.businessName || row.displayName || 'business';
      let base = buildBusinessSlugCandidate(name, row.city);
      let candidate = base;
      let suffix = 2;

      while (usedSlugs.has(candidate)) {
        candidate = withSlugSuffix(base, String(suffix));
        suffix += 1;
        if (suffix > 55) {
          candidate = withSlugSuffix(base, row.id.slice(0, 8));
          break;
        }
      }

      usedSlugs.add(candidate);

      if (dryRun) {
        console.log(`[dry-run] ${row.id} -> ${candidate}`);
        updated += 1;
        continue;
      }

      const { error: updateError } = await supabase
        .from('Business')
        .update({ slug: candidate, updatedAt: new Date().toISOString() })
        .eq('id', row.id);

      if (updateError) {
        console.error(`Failed ${row.id}:`, updateError.message);
        usedSlugs.delete(candidate);
        continue;
      }

      console.log(`Updated ${row.id} -> ${candidate}`);
      updated += 1;
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  console.log(`Done. Updated: ${updated}, skipped (already had slug): ${skipped}${dryRun ? ' (dry-run)' : ''}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
