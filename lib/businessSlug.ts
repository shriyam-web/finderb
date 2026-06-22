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

export function shouldRedirectLegacyBusinessUrl(
  slugOrId: string,
  businessSlug?: string | null
): boolean {
  return Boolean(
    businessSlug &&
      businessSlug !== slugOrId &&
      isLegacyBusinessId(slugOrId)
  );
}

export function getBusinessProfilePath(business: {
  id: string;
  slug?: string | null;
}): string {
  return `/business/${business.slug?.trim() || business.id}`;
}

export function withSlugSuffix(base: string, suffix: string): string {
  const trimmed = `${base}-${suffix}`.slice(0, 96);
  return trimmed.replace(/-+$/g, '');
}
