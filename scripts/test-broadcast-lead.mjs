/**
 * Verifies broadcast enquiry inserts into Supabase `leads` table.
 * Run: node scripts/test-broadcast-lead.mjs
 *      node scripts/test-broadcast-lead.mjs --anon-only
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
      process.env[key] = value;
    }
  }
}

loadEnvFiles();

const anonOnly = process.argv.includes('--anon-only');
const keepRows = process.argv.includes('--keep');

const PROFILE_LEAD_BADGE = 'Generated on your profile';
const CATEGORY_LEAD_BADGE = 'In your category';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = anonOnly
  ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  : process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (anonOnly) console.log('Using anon key only (same as browser form)\n');

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or Supabase key in environment.');
  process.exit(1);
}

const supabase = createClient(url, key);
const testMarker = `test-${Date.now()}@finderb-test.local`;

async function main() {
  console.log('--- Broadcast lead DB test ---\n');

  const { data: sampleBusiness, error: bizError } = await supabase
    .from('Business')
    .select('id, businessName, category, city, location, status')
    .eq('status', 'Active')
    .not('category', 'is', null)
    .limit(1)
    .maybeSingle();

  if (bizError) {
    console.error('Failed to fetch sample business:', bizError.message);
    process.exit(1);
  }

  if (!sampleBusiness) {
    console.error('No active Business row found — cannot run insert test.');
    process.exit(1);
  }

  const area = (sampleBusiness.city || sampleBusiness.location || '').trim();
  if (!area || /not specified|unknown/i.test(area)) {
    console.error('Sample business has no usable city/location:', sampleBusiness);
    process.exit(1);
  }

  console.log('Sample merchant:', {
    id: sampleBusiness.id,
    name: sampleBusiness.businessName,
    category: sampleBusiness.category,
    area,
  });

  const areaPattern = `%${area}%`;
  const categoryPattern = `%${sampleBusiness.category.trim()}%`;

  const { data: peers, error: peersError } = await supabase
    .from('Business')
    .select('id')
    .eq('status', 'Active')
    .ilike('category', categoryPattern)
    .or(`city.ilike.${areaPattern},location.ilike.${areaPattern}`);

  if (peersError) {
    console.error('Peer query failed:', peersError.message);
    process.exit(1);
  }

  const merchantIds = new Set([sampleBusiness.id]);
  for (const b of peers ?? []) merchantIds.add(b.id);

  const now = new Date().toISOString();
  const lookingFor = `DB test enquiry ${testMarker}`;

  const rows = [...merchantIds].map((businessId) => ({
    name: 'FinderB Test User',
    email: testMarker,
    phone: '9999999999',
    category: sampleBusiness.category.trim(),
    business_id: businessId,
    message: lookingFor,
    status: businessId === sampleBusiness.id ? PROFILE_LEAD_BADGE : CATEGORY_LEAD_BADGE,
    created_at: now,
    updated_at: now,
  }));

  console.log(`\nInserting ${rows.length} lead row(s)...`);

  const { data: inserted, error: insertError } = await supabase
    .from('leads')
    .insert(rows)
    .select('id, business_id, status, email, message');

  if (insertError) {
    console.error('\nINSERT FAILED:', insertError.message);
    console.error('Details:', insertError);
    process.exit(1);
  }

  console.log('\nINSERT OK. Rows returned:', inserted?.length ?? 0);
  for (const row of inserted ?? []) {
    console.log(`  - id=${row.id} business_id=${row.business_id} status="${row.status}"`);
  }

  const { data: verified, error: verifyError } = await supabase
    .from('leads')
    .select('id, business_id, status, email, message, created_at')
    .eq('email', testMarker)
    .order('created_at', { ascending: false });

  if (verifyError) {
    console.error('\nVERIFY READ FAILED:', verifyError.message);
    process.exit(1);
  }

  console.log(`\nVERIFY READ OK: ${verified?.length ?? 0} row(s) with test email.`);

  const profileCount = verified?.filter((r) => r.status === PROFILE_LEAD_BADGE).length ?? 0;
  const categoryCount = verified?.filter((r) => r.status === CATEGORY_LEAD_BADGE).length ?? 0;
  console.log(`  Profile badge: ${profileCount}, Category badge: ${categoryCount}`);

  if (keepRows) {
    console.log('\n--keep: rows left in DB. Filter leads by email:', testMarker);
  } else {
    const { error: deleteError } = await supabase.from('leads').delete().eq('email', testMarker);

    if (deleteError) {
      console.warn('\nCleanup delete failed (remove manually):', deleteError.message);
      console.warn('Test email marker:', testMarker);
    } else {
      console.log('\nCleanup: test rows deleted.');
    }
  }

  console.log('\n--- Test passed: leads table write + read confirmed ---');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
