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

export function slugifyCategoryName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

export function categoryHref(slug: string | null | undefined, name: string): string {
  const s = slug || slugifyCategoryName(name);
  return `/categories/${s}`;
}

export type CategoryBrowseRef = {
  slug?: string | null;
  name?: string | null;
};

export type CategorySubBrowseRef =
  | string
  | {
      id?: string;
      slug?: string | null;
      name?: string | null;
    };

function resolveCategorySlug(category: CategoryBrowseRef): string {
  const fromSlug = category.slug?.trim();
  if (fromSlug) return fromSlug;
  const name = category.name?.trim();
  if (name) return slugifyCategoryName(name);
  return '';
}

/** Prefer slug in `?sub=` (SEO-friendly); fall back to id for legacy links. */
export function resolveSubQueryParam(subcategory?: CategorySubBrowseRef | null): string | undefined {
  if (!subcategory) return undefined;
  if (typeof subcategory === 'string') {
    if (!subcategory || subcategory.startsWith('all:')) return undefined;
    return subcategory;
  }
  if (subcategory.id?.startsWith('all:')) return undefined;
  const fromSlug = subcategory.slug?.trim();
  if (fromSlug) return fromSlug;
  if (subcategory.name?.trim()) return slugifyCategoryName(subcategory.name);
  if (subcategory.id?.trim()) return subcategory.id.trim();
  return undefined;
}

export function subMatchesQueryParam(
  sub: { id?: string; slug?: string | null; name?: string | null },
  subFromUrl: string | null | undefined
): boolean {
  if (!subFromUrl || subFromUrl.startsWith('all:')) return false;
  if (sub.id && sub.id === subFromUrl) return true;
  if (sub.slug && sub.slug === subFromUrl) return true;
  if (sub.name && slugifyCategoryName(sub.name) === subFromUrl) return true;
  return false;
}

/**
 * Modern categories UI — SEO path `/categories/{slug}` with optional `?sub={subSlug}`.
 */
export function categoryBrowseHref(
  category: CategoryBrowseRef,
  subcategory?: CategorySubBrowseRef | null
): string {
  const slug = resolveCategorySlug(category);
  if (!slug) return '/categories';
  const base = `/categories/${slug}`;
  const subParam = resolveSubQueryParam(subcategory);
  if (subParam) {
    return `${base}?sub=${encodeURIComponent(subParam)}`;
  }
  return base;
}
