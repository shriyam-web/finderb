/**
 * Merge unique Admissions categories into Education, remap Business.category
 * labels, then delete duplicate Admissions rows and the Admissions parent.
 *
 * Usage: node scripts/merge-admissions-into-education.cjs [--dry-run]
 */
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { createClient } = require('@supabase/supabase-js');

const dryRun = process.argv.includes('--dry-run');

function norm(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function remapCategoryLabel(raw, uniqueNames, duplicateNames) {
  const value = String(raw || '').trim();
  if (!value) return value;

  const parts = value.split('›').map((part) => part.trim()).filter(Boolean);
  const leaf = parts[parts.length - 1] || value;
  const leafKey = norm(leaf);
  const rootKey = norm(parts[0] || '');

  const isAdmissionsRoot = rootKey === 'admissions' || leafKey === 'admissions';
  const isUnique = uniqueNames.has(leafKey);
  const isDuplicate = duplicateNames.has(leafKey);

  if (!isAdmissionsRoot && !isUnique && !isDuplicate) return value;
  if (leafKey === 'admissions' && parts.length === 1) return 'Education';
  if (isUnique || isDuplicate || isAdmissionsRoot) {
    return `Education › ${leaf === 'Admissions' ? 'Education' : leaf}`;
  }
  return value;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const sb = createClient(url, key);
  const { data: rows, error } = await sb
    .from('categories')
    .select(
      'id, name, slug, parent_id, level, status, position, items_count, symbol, banner',
    );
  if (error) throw error;

  const all = rows || [];
  const education = all.find((c) => !c.parent_id && norm(c.slug) === 'education');
  const admissions = all.find((c) => !c.parent_id && norm(c.slug) === 'admissions');
  if (!education) throw new Error('Education parent category not found');
  if (!admissions) {
    console.log('Admissions parent already gone — nothing to merge.');
    return;
  }

  const educationKids = all.filter((c) => c.parent_id === education.id);
  const admissionsKids = all.filter((c) => c.parent_id === admissions.id);
  const educationNames = new Set(educationKids.map((c) => norm(c.name)));

  const uniqueKids = admissionsKids.filter((c) => !educationNames.has(norm(c.name)));
  const duplicateKids = admissionsKids.filter((c) => educationNames.has(norm(c.name)));
  const uniqueNames = new Set(uniqueKids.map((c) => norm(c.name)));
  const duplicateNames = new Set(duplicateKids.map((c) => norm(c.name)));

  console.log('Education:', education.name, education.id);
  console.log(
    '  existing:',
    educationKids.map((c) => c.name).join(', ') || '(none)',
  );
  console.log(
    'Admissions unique to move:',
    uniqueKids.map((c) => c.name).join(', ') || '(none)',
  );
  console.log(
    'Admissions duplicates to delete:',
    duplicateKids.map((c) => c.name).join(', ') || '(none)',
  );

  const maxPos = educationKids.reduce(
    (max, c) => Math.max(max, Number(c.position) || 0),
    0,
  );

  if (!dryRun) {
    for (const [index, child] of uniqueKids.entries()) {
      const { error: moveErr } = await sb
        .from('categories')
        .update({
          parent_id: education.id,
          level: 2,
          position: maxPos + index + 1,
          status: 'Active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', child.id);
      if (moveErr) throw moveErr;
      console.log('moved', child.name, '→ Education');
    }
  } else {
    for (const child of uniqueKids) {
      console.log('[dry-run] would move', child.name, '→ Education');
    }
  }

  const pageSize = 1000;
  let from = 0;
  let updatedBiz = 0;
  for (;;) {
    const { data, error: bizErr } = await sb
      .from('Business')
      .select('id, businessName, category')
      .range(from, from + pageSize - 1);
    if (bizErr) throw bizErr;
    if (!data?.length) break;

    for (const biz of data) {
      const next = remapCategoryLabel(biz.category, uniqueNames, duplicateNames);
      if (!next || next === (biz.category || '').trim()) continue;
      updatedBiz += 1;
      console.log(
        `${dryRun ? '[dry-run] ' : ''}biz ${biz.businessName}: "${biz.category}" → "${next}"`,
      );
      if (!dryRun) {
        const { error: updErr } = await sb
          .from('Business')
          .update({ category: next })
          .eq('id', biz.id);
        if (updErr) throw updErr;
      }
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }
  console.log('businesses remapped:', updatedBiz);

  const deleteIds = [
    ...duplicateKids.map((c) => c.id),
    admissions.id,
  ];
  for (const id of deleteIds) {
    const row = all.find((c) => c.id === id);
    const leftoverKids = all.filter(
      (c) => c.parent_id === id && !deleteIds.includes(c.id) && !uniqueKids.some((u) => u.id === c.id),
    );
    if (leftoverKids.length && id === admissions.id && uniqueKids.length && !dryRun) {
      // Unique kids already reparented; re-check live children.
    }
    if (!dryRun) {
      const { count } = await sb
        .from('categories')
        .select('id', { count: 'exact', head: true })
        .eq('parent_id', id);
      if (count && id === admissions.id) {
        throw new Error(`Admissions still has ${count} children; aborting delete`);
      }
      if (count && id !== admissions.id) {
        throw new Error(`${row?.name || id} still has ${count} children; aborting delete`);
      }
      const { error: delErr } = await sb.from('categories').delete().eq('id', id);
      if (delErr) throw delErr;
      console.log('deleted', row?.name || id);
    } else {
      console.log('[dry-run] would delete', row?.name || id);
    }
  }

  console.log(dryRun ? 'Dry run complete.' : 'Merge complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
