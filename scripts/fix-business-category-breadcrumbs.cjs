/**
 * Fix Business.category values that store only a subcategory leaf name
 * (e.g. "Car Service Centers") into the canonical "Parent › Child" form.
 *
 * Usage: node scripts/fix-business-category-breadcrumbs.cjs [--dry-run]
 */
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { createClient } = require('@supabase/supabase-js');

const dryRun = process.argv.includes('--dry-run');

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const sb = createClient(url, key);

  const { data: categories, error: catErr } = await sb
    .from('categories')
    .select('id, name, parent_id, status');
  if (catErr) throw catErr;

  const active = (categories || []).filter((c) => {
    const status = String(c.status || 'Active').toLowerCase();
    return status === 'active' || !c.status;
  });

  const byId = new Map(active.map((c) => [c.id, c]));
  const children = active.filter((c) => c.parent_id && byId.has(c.parent_id));

  // leaf name (lower) -> preferred "Parent › Child"
  // If multiple parents share the same child name, skip (ambiguous).
  const leafToBreadcrumb = new Map();
  const ambiguous = new Set();

  for (const child of children) {
    const parent = byId.get(child.parent_id);
    if (!parent?.name?.trim() || !child.name?.trim()) continue;
    const key = child.name.trim().toLowerCase();
    const breadcrumb = `${parent.name.trim()} › ${child.name.trim()}`;
    if (ambiguous.has(key)) continue;
    if (leafToBreadcrumb.has(key) && leafToBreadcrumb.get(key) !== breadcrumb) {
      leafToBreadcrumb.delete(key);
      ambiguous.add(key);
      continue;
    }
    leafToBreadcrumb.set(key, breadcrumb);
  }

  console.log(
    `Mapped ${leafToBreadcrumb.size} unique subcategory names` +
      (ambiguous.size ? ` (skipped ${ambiguous.size} ambiguous)` : '')
  );

  // Fetch businesses in pages
  const pageSize = 1000;
  let from = 0;
  /** @type {{ id: string, businessName: string | null, category: string | null }[]} */
  const toFix = [];

  for (;;) {
    const { data, error } = await sb
      .from('Business')
      .select('id, businessName, category')
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data?.length) break;

    for (const biz of data) {
      const cat = (biz.category || '').trim();
      if (!cat) continue;
      if (cat.includes('›')) continue; // already breadcrumb

      const breadcrumb = leafToBreadcrumb.get(cat.toLowerCase());
      if (!breadcrumb) continue;
      if (breadcrumb === cat) continue;
      toFix.push({
        id: biz.id,
        businessName: biz.businessName,
        category: cat,
        next: breadcrumb,
      });
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  console.log(`Found ${toFix.length} businesses to update${dryRun ? ' (dry-run)' : ''}`);
  for (const row of toFix.slice(0, 50)) {
    console.log(` - ${row.businessName || row.id}: "${row.category}" → "${row.next}"`);
  }
  if (toFix.length > 50) console.log(` ... and ${toFix.length - 50} more`);

  if (dryRun || toFix.length === 0) return;

  let updated = 0;
  let failed = 0;
  for (const row of toFix) {
    const { error } = await sb
      .from('Business')
      .update({ category: row.next })
      .eq('id', row.id);
    if (error) {
      failed += 1;
      console.error(`Failed ${row.id}:`, error.message);
    } else {
      updated += 1;
    }
  }

  console.log(`Updated ${updated}, failed ${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
