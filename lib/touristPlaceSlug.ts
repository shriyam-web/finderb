/** Client-safe tourist place URL slug helpers. */

import { isUuidLike } from '@/lib/businessSlug';

export function slugifyTouristPlaceName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[''`]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function buildTouristPlaceSlugCandidate(
  name: string,
  location?: string | null
): string {
  const base = slugifyTouristPlaceName(name);
  if (!base) return 'place';

  const locationLabel = location?.split(',')[0]?.trim() || '';
  const locationPart = locationLabel ? slugifyTouristPlaceName(locationLabel) : '';
  if (!locationPart || base.endsWith(locationPart) || base.includes(`-${locationPart}`)) {
    return base.slice(0, 96);
  }

  return `${base}-${locationPart}`.slice(0, 96);
}

export function isLegacyTouristPlaceId(value: string): boolean {
  return isUuidLike(value);
}

export function resolveTouristPlaceSlug(place: {
  slug?: string | null;
  name: string;
  location?: string | null;
}): string {
  const persisted = place.slug?.trim();
  if (persisted) return persisted;

  return buildTouristPlaceSlugCandidate(place.name, place.location);
}

export function shouldRedirectToCanonicalTouristPlaceSlug(
  slugOrId: string,
  place: {
    slug?: string | null;
    name: string;
    location?: string | null;
  }
): boolean {
  return slugOrId.trim() !== resolveTouristPlaceSlug(place);
}

export function getTouristPlacePath(place: {
  id: string;
  slug?: string | null;
  name: string;
  location?: string | null;
}): string {
  return `/tourist-places/${resolveTouristPlaceSlug(place)}`;
}

export function withTouristPlaceSlugSuffix(base: string, suffix: string): string {
  return `${base}-${suffix}`.slice(0, 96).replace(/-+$/g, '');
}
