/**
 * QA: business + tourist place slug URLs load correctly.
 * Usage: node scripts/test-profile-urls.mjs [--url http://localhost:3000]
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

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function checkPage(baseUrl, path, expectations) {
  const url = `${baseUrl.replace(/\/$/, '')}${path}`;
  const res = await fetch(url, { redirect: 'follow' });
  const html = await res.text();
  const title = html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() || '';
  const finalUrl = res.url;
  const finalPath = new URL(finalUrl).pathname;

  const issues = [];

  if (!res.ok) issues.push(`HTTP ${res.status}`);
  if (/not found/i.test(title)) issues.push(`title="${title}"`);
  if (expectations.name) {
    const normalizedNeedle = expectations.name.trim().toLowerCase();
    const normalizedTitle = title.toLowerCase();
    const normalizedHtml = html.toLowerCase();
    const namePresent =
      normalizedHtml.includes(normalizedNeedle) ||
      normalizedTitle.includes(normalizedNeedle.split(' ')[0]);
    if (!namePresent) issues.push(`content missing business/place name`);
  }
  if (expectations.finalPathPrefix && !finalPath.startsWith(expectations.finalPathPrefix)) {
    issues.push(`final path ${finalPath}`);
  }
  if (expectations.noUuidInPath && UUID_RE.test(finalPath.split('/').pop() || '')) {
    issues.push(`final URL still UUID: ${finalPath}`);
  }
  if (expectations.expectedSlug && !finalPath.endsWith(`/${expectations.expectedSlug}`)) {
    issues.push(`expected slug ${expectations.expectedSlug}, got ${finalPath}`);
  }

  return {
    ok: issues.length === 0,
    url,
    finalUrl,
    status: res.status,
    title,
    issues,
  };
}

async function checkRedirect(baseUrl, path, expectedSlug) {
  const url = `${baseUrl.replace(/\/$/, '')}${path}`;
  const res = await fetch(url, { redirect: 'manual' });
  const location = res.headers.get('location');
  const issues = [];

  if (res.status !== 301 && res.status !== 308 && res.status !== 307 && res.status !== 302) {
    issues.push(`expected redirect, got HTTP ${res.status}`);
  }
  if (location && expectedSlug && !location.includes(expectedSlug)) {
    issues.push(`redirect location ${location} missing slug ${expectedSlug}`);
  }
  if (location && UUID_RE.test(new URL(location, url).pathname.split('/').pop() || '')) {
    issues.push(`redirect still points to UUID: ${location}`);
  }

  return { ok: issues.length === 0, url, status: res.status, location, issues };
}

loadEnvFiles();

const baseUrl =
  getArgValue('--url') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const { data: businesses, error: bizErr } = await supabase
  .from('Business')
  .select('id, slug, businessName, status')
  .eq('status', 'Active')
  .not('slug', 'is', null)
  .limit(20);

const { data: places, error: placeErr } = await supabase
  .from('tourist_places')
  .select('id, slug, name')
  .not('slug', 'is', null)
  .limit(20);

if (bizErr) throw bizErr;
if (placeErr) throw placeErr;

console.log(`\nTesting against ${baseUrl}\n`);

const results = [];

for (const biz of businesses ?? []) {
  const path = `/business/${biz.slug}`;
  const r = await checkPage(baseUrl, path, {
    name: biz.businessName,
    finalPathPrefix: '/business/',
    noUuidInPath: true,
    expectedSlug: biz.slug,
  });
  results.push({ type: 'business', slug: biz.slug, ...r });

  const redirect = await checkRedirect(baseUrl, `/business/${biz.id}`, biz.slug);
  results.push({ type: 'business-redirect', slug: biz.slug, ...redirect });
}

for (const place of places ?? []) {
  const path = `/tourist-places/${place.slug}`;
  const r = await checkPage(baseUrl, path, {
    name: place.name,
    finalPathPrefix: '/tourist-places/',
    noUuidInPath: true,
    expectedSlug: place.slug,
  });
  results.push({ type: 'tourist', slug: place.slug, ...r });

  const redirect = await checkRedirect(baseUrl, `/tourist-places/${place.id}`, place.slug);
  results.push({ type: 'tourist-redirect', slug: place.slug, ...redirect });
}

// Listing pages
const listingChecks = [
  ['/tourist-places', 'Tourist Places'],
  ['/categories', 'Categories'],
];

for (const [path, needle] of listingChecks) {
  const r = await checkPage(baseUrl, path, { name: needle });
  results.push({ type: 'listing', slug: path, ...r });
}

// Homepage business + tourist links (sample)
const homeRes = await fetch(`${baseUrl.replace(/\/$/, '')}/`);
const homeHtml = await homeRes.text();
const hrefs = [...homeHtml.matchAll(/href="(\/business\/[^"?#]+)"/g)].map((m) => m[1]);
const touristHrefs = [...homeHtml.matchAll(/href="(\/tourist-places\/[^"?#]+)"/g)].map((m) => m[1]);

const uuidBusinessHrefs = hrefs.filter((h) => UUID_RE.test(h.split('/').pop() || ''));
const uuidTouristHrefs = touristHrefs.filter((h) => UUID_RE.test(h.split('/').pop() || ''));

if (uuidBusinessHrefs.length) {
  results.push({
    type: 'homepage-links',
    slug: 'business',
    ok: false,
    issues: [`homepage has ${uuidBusinessHrefs.length} UUID business links`],
  });
}
if (uuidTouristHrefs.length) {
  results.push({
    type: 'homepage-links',
    slug: 'tourist',
    ok: false,
    issues: [`homepage has ${uuidTouristHrefs.length} UUID tourist links`],
  });
}

const failed = results.filter((r) => !r.ok);
const passed = results.filter((r) => r.ok);

console.log(`PASSED: ${passed.length}`);
console.log(`FAILED: ${failed.length}\n`);

for (const r of passed.slice(0, 8)) {
  console.log(`  OK  [${r.type}] ${r.slug || r.url}`);
}
if (passed.length > 8) console.log(`  ... and ${passed.length - 8} more`);

if (failed.length) {
  console.log('\nFailures:');
  for (const r of failed) {
    console.log(`  FAIL [${r.type}] ${r.slug || r.url}`);
    for (const issue of r.issues || []) console.log(`       - ${issue}`);
    if (r.title) console.log(`       title: ${r.title}`);
    if (r.finalUrl) console.log(`       final: ${r.finalUrl}`);
    if (r.location) console.log(`       location: ${r.location}`);
  }
  process.exit(1);
}

console.log('\nAll profile URL tests passed.');
console.log(`Business profiles tested: ${businesses?.length ?? 0}`);
console.log(`Tourist places tested: ${places?.length ?? 0}`);
