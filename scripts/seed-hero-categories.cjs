/**
 * Upsert hero-critical top-level categories + subcategories.
 * Usage: node scripts/seed-hero-categories.mjs
 */
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(url, key);

/** @type {Array<{ name: string, slug: string, kids: Array<{ name: string, slug: string }> }>} */
const TREES = [
  {
    name: 'B2B',
    slug: 'b2b',
    kids: [
      { name: 'Wholesalers', slug: 'wholesalers' },
      { name: 'Distributors', slug: 'distributors' },
      { name: 'Manufacturers', slug: 'manufacturers' },
      { name: 'Industrial Suppliers', slug: 'industrial-suppliers' },
      { name: 'Office Supplies', slug: 'office-supplies' },
      { name: 'Raw Material Suppliers', slug: 'raw-material-suppliers' },
    ],
  },
  {
    name: 'CA & Tax',
    slug: 'ca',
    kids: [
      { name: 'Chartered Accountants', slug: 'chartered-accountants' },
      { name: 'Tax Consultants', slug: 'tax-consultants' },
      { name: 'GST Consultants', slug: 'gst-consultants' },
      { name: 'Company Secretaries', slug: 'company-secretaries' },
      { name: 'Audit Firms', slug: 'audit-firms' },
      { name: 'Bookkeeping Services', slug: 'bookkeeping-services' },
    ],
  },
  {
    name: 'Doctors',
    slug: 'doctors',
    kids: [
      { name: 'General Physicians', slug: 'general-physicians' },
      { name: 'Pediatricians', slug: 'pediatricians' },
      { name: 'Gynecologists', slug: 'gynecologists' },
      { name: 'Orthopedic Doctors', slug: 'orthopedic-doctors' },
      { name: 'Cardiologists', slug: 'cardiologists' },
      { name: 'ENT Specialists', slug: 'ent-specialists' },
      { name: 'Dermatologists Clinics', slug: 'dermatologists-clinics' },
      { name: 'Ayurvedic Doctors', slug: 'ayurvedic-doctors' },
    ],
  },
  {
    name: 'Real Estate',
    slug: 'real-estate',
    kids: [
      { name: 'Property Dealers', slug: 'property-dealers' },
      { name: 'Real Estate Agents', slug: 'real-estate-agents' },
      { name: 'Builders & Developers', slug: 'builders-developers' },
      { name: 'Paying Guest Consultants', slug: 'pg-consultants' },
      { name: 'Commercial Property', slug: 'commercial-property' },
      { name: 'Plot Dealers', slug: 'plot-dealers' },
    ],
  },
  {
    name: 'Lawyers',
    slug: 'lawyers',
    kids: [
      { name: 'Criminal Lawyers', slug: 'criminal-lawyers' },
      { name: 'Civil Lawyers', slug: 'civil-lawyers' },
      { name: 'Family Lawyers', slug: 'family-lawyers' },
      { name: 'Corporate Lawyers', slug: 'corporate-lawyers' },
      { name: 'Property Lawyers', slug: 'property-lawyers' },
      { name: 'Immigration Lawyers', slug: 'immigration-lawyers' },
    ],
  },
  {
    name: 'PG/Hostels',
    slug: 'pg-hostels',
    kids: [
      { name: 'Boys PG', slug: 'boys-pg' },
      { name: 'Girls PG', slug: 'girls-pg' },
      { name: 'Hostels', slug: 'hostels' },
      { name: 'Shared Rooms', slug: 'shared-rooms' },
      { name: 'Student Accommodation', slug: 'student-accommodation' },
    ],
  },
  {
    name: 'Car Repair & Services',
    slug: 'car-repair-services',
    kids: [
      { name: 'Car Service Centers', slug: 'car-service-centers' },
      { name: 'Car Wash', slug: 'car-wash' },
      { name: 'Tyre & Wheel Care', slug: 'tyre-wheel-care' },
      { name: 'Car AC Repair', slug: 'car-ac-repair' },
      { name: 'Denting & Painting', slug: 'denting-painting' },
      { name: 'Car Accessories', slug: 'car-accessories' },
    ],
  },
  {
    name: 'Beauty Spa',
    slug: 'beauty-spa',
    kids: [
      { name: 'Makeup Artists', slug: 'makeup-artists' },
      { name: 'Hair Stylists', slug: 'hair-stylists' },
    ],
  },
];

async function ensureParent(tree, position) {
  const { data: existing } = await sb
    .from('categories')
    .select('id,name,slug,position')
    .eq('slug', tree.slug)
    .is('parent_id', null)
    .maybeSingle();

  if (existing) {
    await sb
      .from('categories')
      .update({
        name: tree.name,
        status: 'Active',
        level: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    console.log('parent ok', tree.slug, existing.id);
    return existing.id;
  }

  const { data, error } = await sb
    .from('categories')
    .insert({
      name: tree.name,
      slug: tree.slug,
      type: 'Merchant',
      status: 'Active',
      items_count: 0,
      banner: 'Not Set',
      symbol: 'Not Set',
      parent_id: null,
      level: 0,
      position,
      keywords: [tree.name, tree.slug.replace(/-/g, ' ')],
    })
    .select('id')
    .single();

  if (error) throw new Error(`parent ${tree.slug}: ${error.message}`);
  console.log('parent created', tree.slug, data.id);
  return data.id;
}

async function ensureChild(parentId, child, position) {
  const { data: existing } = await sb
    .from('categories')
    .select('id,slug')
    .eq('slug', child.slug)
    .eq('parent_id', parentId)
    .maybeSingle();

  if (existing) {
    await sb
      .from('categories')
      .update({
        name: child.name,
        status: 'Active',
        level: 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    console.log('  child ok', child.slug);
    return;
  }

  // Slug may already exist under another parent — reuse if same slug globally.
  const { data: bySlug } = await sb
    .from('categories')
    .select('id,parent_id,slug')
    .eq('slug', child.slug)
    .maybeSingle();

  if (bySlug) {
    console.log('  child slug exists elsewhere, skip', child.slug, bySlug.parent_id);
    return;
  }

  const { error } = await sb.from('categories').insert({
    name: child.name,
    slug: child.slug,
    type: 'Merchant',
    status: 'Active',
    items_count: 0,
    banner: 'Not Set',
    symbol: 'Not Set',
    parent_id: parentId,
    level: 1,
    position,
    keywords: [child.name, child.slug.replace(/-/g, ' ')],
  });

  if (error) throw new Error(`child ${child.slug}: ${error.message}`);
  console.log('  child created', child.slug);
}

async function main() {
  const { data: maxRows } = await sb
    .from('categories')
    .select('position')
    .is('parent_id', null)
    .order('position', { ascending: false })
    .limit(1);

  let nextPos = (maxRows?.[0]?.position ?? 0) + 1;

  for (const tree of TREES) {
    const parentId = await ensureParent(tree, nextPos);
    if (!(await sb.from('categories').select('id').eq('id', parentId).single()).data) {
      nextPos += 1;
    }
    // Only bump position for newly needed slots; existing parents keep theirs.
    const { data: parentRow } = await sb
      .from('categories')
      .select('position')
      .eq('id', parentId)
      .single();
    if (parentRow?.position == null || parentRow.position >= nextPos) {
      nextPos = (parentRow?.position ?? nextPos) + 1;
    }

    let childPos = 1;
    for (const kid of tree.kids) {
      await ensureChild(parentId, kid, childPos);
      childPos += 1;
    }
  }

  await ensureEducationKids();

  console.log('done');
}

async function ensureEducationKids() {
  const { data: education } = await sb
    .from('categories')
    .select('id')
    .eq('slug', 'education')
    .is('parent_id', null)
    .maybeSingle();
  if (!education) {
    console.log('education parent missing; skip extra kids');
    return;
  }

  const extras = [
    { name: 'Admission Consultants', slug: 'admission-consultants' },
    { name: 'Study Abroad Consultants', slug: 'study-abroad-consultants' },
  ];

  const { data: existingKids } = await sb
    .from('categories')
    .select('id, slug, position')
    .eq('parent_id', education.id);
  const maxPos = (existingKids || []).reduce(
    (max, row) => Math.max(max, Number(row.position) || 0),
    0,
  );
  let nextPos = maxPos;

  for (const kid of extras) {
    const underEducation = (existingKids || []).find((row) => row.slug === kid.slug);
    if (underEducation) {
      await sb
        .from('categories')
        .update({
          name: kid.name,
          status: 'Active',
          level: 2,
          updated_at: new Date().toISOString(),
        })
        .eq('id', underEducation.id);
      console.log('  education child ok', kid.slug);
      continue;
    }

    const { data: bySlug } = await sb
      .from('categories')
      .select('id')
      .eq('slug', kid.slug)
      .maybeSingle();
    if (bySlug) {
      nextPos += 1;
      await sb
        .from('categories')
        .update({
          name: kid.name,
          parent_id: education.id,
          level: 2,
          status: 'Active',
          position: nextPos,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bySlug.id);
      console.log('  education child moved', kid.slug);
      continue;
    }

    nextPos += 1;
    const { error } = await sb.from('categories').insert({
      name: kid.name,
      slug: kid.slug,
      type: 'Merchant',
      status: 'Active',
      items_count: 0,
      banner: 'Not Set',
      symbol: 'Not Set',
      parent_id: education.id,
      level: 2,
      position: nextPos,
      keywords: [kid.name, kid.slug.replace(/-/g, ' ')],
    });
    if (error) throw new Error(`education child ${kid.slug}: ${error.message}`);
    console.log('  education child created', kid.slug);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
