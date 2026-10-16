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
