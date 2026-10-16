import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import { ownershipDetailsLock } from '@/lib/ownershipRequest.server';
import {
  categoryHead,
  categoryLeaf,
  composeStoredCategory,
  extraCategoryLeaves,
  primaryCategoryLabel,
} from '@/lib/alsoServes';

type CategoryRow = { id: string; name: string; parent_id: string | null };

export type AlsoServesState = {
  primary: string;
  selected: string[];
  options: string[];
};

function parentName(row: CategoryRow, byId: Map<string, CategoryRow>): string {
  if (!row.parent_id) return '';
  return byId.get(row.parent_id)?.name?.trim() || '';
}

export async function readAlsoServes(businessId: string): Promise<
  { success: true; state: AlsoServesState } | { success: false; error: string }
> {
  const supabase = createServiceClient();
  if (!supabase) return { success: false, error: 'Database is not available.' };

  const { data: business, error } = await supabase
    .from('Business')
    .select('category')
    .eq('id', businessId)
    .maybeSingle();
  if (error || !business) return { success: false, error: 'Business not found.' };

  const primary = primaryCategoryLabel(String(business.category || ''));
  if (!primary) {
    return { success: true, state: { primary: '', selected: [], options: [] } };
  }

  const { data: rows, error: categoryError } = await supabase
    .from('categories')
    .select('id, name, parent_id');
  if (categoryError) return { success: false, error: 'Could not load categories.' };

  const catalog = (rows || []) as CategoryRow[];
  const byId = new Map(catalog.map((row) => [String(row.id), { ...row, id: String(row.id), parent_id: row.parent_id ? String(row.parent_id) : null }]));
  const leaf = categoryLeaf(primary).toLowerCase();
  const head = categoryHead(primary).toLowerCase();
  const matches = [...byId.values()].filter((row) => row.name.trim().toLowerCase() === leaf);
  const current =
    matches.find((row) => parentName(row, byId).toLowerCase() === head) ||
    matches[0];
  const siblings = current?.parent_id
    ? [...byId.values()].filter(
        (row) => row.parent_id === current.parent_id && row.id !== current.id && row.name.trim(),
      )
    : [];

  return {
    success: true,
    state: {
      primary,
      selected: extraCategoryLeaves(String(business.category || '')),
      options: siblings.map((row) => row.name.trim()).sort((a, b) => a.localeCompare(b)),
    },
  };
}

export async function writeAlsoServes(
  businessId: string,
  leaves: string[],
): Promise<{ success: true; category: string } | { success: false; error: string }> {
  const locked = await ownershipDetailsLock(businessId);
  if (locked.locked) return { success: false, error: locked.error };
  const current = await readAlsoServes(businessId);
  if (!current.success) return current;
  if (!current.state.primary) return { success: false, error: 'Set a category before adding more.' };

  const allowed = new Map(current.state.options.map((name) => [name.toLowerCase(), name]));
  const picked: string[] = [];
  const seen = new Set<string>();
  for (const raw of leaves) {
    const name = allowed.get(String(raw || '').trim().toLowerCase());
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(name);
  }

  const category = composeStoredCategory(current.state.primary, picked);
  const supabase = createServiceClient();
  if (!supabase) return { success: false, error: 'Database is not available.' };
  const { error } = await supabase
    .from('Business')
    .update({ category, updatedAt: new Date().toISOString() })
    .eq('id', businessId);
  if (error) return { success: false, error: 'Could not save the extra categories.' };
  return { success: true, category };
}
