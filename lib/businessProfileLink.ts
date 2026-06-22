import { SITE_URL } from '@/lib/businessSeo';
import {
  getBusinessProfilePath,
  isLegacyBusinessId,
  isLegacyBusinessProfilePath,
} from '@/lib/businessSlug';

type BusinessLinkFields = {
  id: string;
  slug?: string | null;
  name?: string | null;
  businessName?: string | null;
  displayName?: string | null;
  city?: string | null;
};

export function buildCanonicalProfileQrLink(business: BusinessLinkFields): string {
  return `${SITE_URL}${getBusinessProfilePath(business)}`;
}

export function shouldReplaceProfileQrLink(
  business: BusinessLinkFields,
  currentLink?: string | null
): boolean {
  const link = currentLink?.trim();
  if (!link) return true;

  if (link.includes(business.id)) return true;

  try {
    const pathname = link.startsWith('http')
      ? new URL(link).pathname
      : link.startsWith('/')
        ? link
        : `/${link}`;
    return isLegacyBusinessProfilePath(pathname);
  } catch {
    return true;
  }
}

export function isLegacyBusinessProfileSegment(segment: string): boolean {
  return isLegacyBusinessId(segment);
}

export const RESERVED_BUSINESS_ROUTE_SEGMENTS = new Set([
  'dashboard',
  'login',
  'register',
  'list',
  'kyc',
  'payment',
]);
