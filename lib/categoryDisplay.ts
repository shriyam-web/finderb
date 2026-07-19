/** Raw `symbol` / `banner` from Supabase — no client-side placeholders. */
export function dbSymbol(value: string | null | undefined): string | null {
  if (!value || value === 'Not Set') return null;
  return value;
}

export function dbBanner(value: string | null | undefined): string | null {
  if (!value || value === 'Not Set') return null;
  return value;
}

export function isCategoryIconUrl(icon: string | null | undefined): boolean {
  return Boolean(icon?.startsWith('http') || icon?.startsWith('/'));
}

export function categoryHref(slug: string | null | undefined, name: string): string {
  const s = slug || name.toLowerCase().replace(/\s+/g, '-');
  return `/categories/${s}`;
}

/**
 * Opens the categories browse UI with a top-level category pre-selected,
 * and optionally a subcategory already chosen (merchants view).
 */
export function categoryBrowseHref(categoryId: string, subcategoryId?: string): string {
  const params = new URLSearchParams({ id: categoryId });
  if (subcategoryId) params.set('sub', subcategoryId);
  return `/categories?${params.toString()}`;
}
