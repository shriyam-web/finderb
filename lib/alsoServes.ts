import { joinBusinessCategories, splitBusinessCategories } from '@/lib/categoryTree';

export function categoryLeaf(label: string): string {
  const parts = label
    .split('›')
    .map((part) => part.trim())
    .filter(Boolean);
  return parts[parts.length - 1] || label.trim();
}

export function categoryHead(label: string): string {
  const parts = label
    .split('›')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return '';
  return parts.slice(0, -1).join(' › ');
}

export function primaryCategoryLabel(stored: string | null | undefined): string {
  return splitBusinessCategories(stored)[0] || '';
}

export function extraCategoryLabels(stored: string | null | undefined): string[] {
  return splitBusinessCategories(stored).slice(1);
}

export function extraCategoryLeaves(stored: string | null | undefined): string[] {
  return extraCategoryLabels(stored).map(categoryLeaf);
}

/** Short labels for chips. Drops the " ||| " storage separator. */
export function categoryDisplayTags(stored: string | null | undefined): string[] {
  const tags: string[] = [];
  const seen = new Set<string>();
  for (const part of splitBusinessCategories(stored)) {
    const leaf = categoryLeaf(part);
    const key = leaf.toLowerCase();
    if (!leaf || seen.has(key)) continue;
    seen.add(key);
    tags.push(leaf);
  }
  return tags;
}

/** True when this business is already listed under that category or subcategory name. */
export function categoryBelongsTo(stored: string | null | undefined, name: string): boolean {
  const target = name.trim().toLowerCase();
  if (!target) return false;
  for (const part of splitBusinessCategories(stored)) {
    if (part.trim().toLowerCase() === target) return true;
    for (const bit of part.split('›')) {
      if (bit.trim().toLowerCase() === target) return true;
    }
  }
  return false;
}

/** Primary subcategory plus extras in the same category. */
export const MAX_SUBCATEGORIES_PER_CATEGORY = 5;

export function composeStoredCategory(primary: string, extraLeaves: string[]): string {
  const head = categoryHead(primary);
  const extras = extraLeaves
    .map((leaf) => leaf.trim())
    .filter(Boolean)
    .map((leaf) => (head ? `${head} › ${leaf}` : leaf));
  return joinBusinessCategories([primary, ...extras]);
}

/** A listing matches a category counter when any mapped segment matches. */
export function categorySegments(stored: string): string[] {
  const parts = stored
    .split(/\s*\|\|\|\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length ? parts : [stored.trim()].filter(Boolean);
}
