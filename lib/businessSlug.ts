/** Client-safe business URL slug helpers. */

export function slugifyBusinessName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[''`]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function buildBusinessSlugCandidate(
  businessName: string,
  city?: string | null
): string {
  const base = slugifyBusinessName(businessName);
  if (!base) return 'business';

  const cityPart = city ? slugifyBusinessName(city) : '';
  if (!cityPart || base.endsWith(cityPart) || base.includes(`-${cityPart}`)) {
    return base.slice(0, 96);
  }

  return `${base}-${cityPart}`.slice(0, 96);
}

export function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function isCuidLike(value: string): boolean {
  return /^c[a-z0-9]{24,}$/i.test(value);
}

export function isLegacyBusinessId(value: string): boolean {
  return isUuidLike(value) || isCuidLike(value);
}

/** Canonical slug segment for a business — never returns a UUID. */
export function resolveBusinessSlug(business: {
  slug?: string | null;
  name?: string | null;
  businessName?: string | null;
  city?: string | null;
}): string {
  const persisted = business.slug?.trim();
  if (persisted) return persisted;

  return buildBusinessSlugCandidate(
    business.name || business.businessName || 'business',
    business.city
  );
}

export function shouldRedirectToCanonicalBusinessSlug(
  slugOrId: string,
  business: {
    slug?: string | null;
    name?: string | null;
    businessName?: string | null;
    city?: string | null;
  }
): boolean {
  const canonical = resolveBusinessSlug(business);
  return slugOrId.trim() !== canonical;
}

export function getBusinessProfilePath(business: {
  id: string;
  slug?: string | null;
  name?: string | null;
  businessName?: string | null;
  city?: string | null;
}): string {
  return `/business/${resolveBusinessSlug(business)}`;
}

/** True when a public profile href still points at a legacy UUID/CUID segment. */
export function isLegacyBusinessProfilePath(path: string): boolean {
  const match = path.match(/^\/business\/([^/?#]+)/);
  return Boolean(match && isLegacyBusinessId(match[1]));
}

export function withSlugSuffix(base: string, suffix: string): string {
  const trimmed = `${base}-${suffix}`.slice(0, 96);
  return trimmed.replace(/-+$/g, '');
}
