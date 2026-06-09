import type { Metadata } from 'next';
import type { Business } from '@/lib/mockData';
import { getBusinessLocationLabel } from '@/lib/businessBreadcrumb';
import { getPublicReviewRating, parseBusinessReviews } from '@/lib/businessReviews';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://finderb.com';
const SITE_NAME = 'FinderB';
const DEFAULT_OG_IMAGE = '/logo1.png';

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

export function resolveAbsoluteUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getBusinessCanonicalPath(id: string): string {
  return `/business/${id}`;
}

export function getBusinessShareUrl(id: string, origin?: string): string {
  const base = origin?.replace(/\/$/, '') || SITE_URL;
  return `${base}${getBusinessCanonicalPath(id)}`;
}

export function getBusinessOgImage(
  business: Pick<Business, 'profilePictureUrl' | 'image' | 'images'>
): string {
  const candidate =
    business.profilePictureUrl ||
    business.image ||
    (business.images && business.images.length > 0 ? business.images[0] : null);

  return candidate ? resolveAbsoluteUrl(candidate) : resolveAbsoluteUrl(DEFAULT_OG_IMAGE);
}

export function buildBusinessDescription(business: Business): string {
  const location = getBusinessLocationLabel(business);
  const reviews = parseBusinessReviews(business.review);
  const rating = getPublicReviewRating(reviews);
  const parts: string[] = [];

  parts.push(
    `${business.name}${business.category ? ` — ${business.category}` : ''}${
      location ? ` in ${location}` : ''
    }.`
  );

  if (rating != null && reviews.length > 0) {
    parts.push(`Rated ${rating}/5 from ${reviews.length} review${reviews.length === 1 ? '' : 's'}.`);
  }

  const blurb = business.description || business.about || '';
  if (blurb) parts.push(truncate(blurb, 140));

  parts.push('Contact details, hours, services and offers on FinderB.');

  return truncate(parts.join(' '), 300);
}

export function buildBusinessPageTitle(business: Business): string {
  const location = getBusinessLocationLabel(business);
  const locationSuffix = location ? `, ${location}` : '';
  const categorySuffix = business.category ? ` — ${business.category}` : '';
  return `${business.name}${categorySuffix}${locationSuffix}`;
}

export function buildBusinessMetadata(id: string, business: Business | null): Metadata {
  const canonicalPath = getBusinessCanonicalPath(id);
  const canonicalUrl = resolveAbsoluteUrl(canonicalPath);

  if (!business) {
    return {
      title: 'Business not found',
      description: 'This business listing could not be found on FinderB.',
      robots: { index: false, follow: false },
      alternates: { canonical: canonicalPath },
    };
  }

  const title = buildBusinessPageTitle(business);
  const description = buildBusinessDescription(business);
  const ogImage = getBusinessOgImage(business);
  const keywords = [
    business.name,
    business.category,
    business.city,
    business.state,
    'local business',
    'verified business',
    SITE_NAME,
    ...(business.keywords ?? []),
    ...(business.services ?? []).slice(0, 6),
  ].filter((value): value is string => Boolean(value && String(value).trim()));

  return {
    title,
    description,
    keywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      title,
      description,
      siteName: SITE_NAME,
      locale: 'en_IN',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${business.name} on FinderB`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@finderb',
      creator: '@finderb',
      title,
      description,
      images: {
        url: ogImage,
        alt: `${business.name} on FinderB`,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export function buildBusinessJsonLd(id: string, business: Business) {
  const url = resolveAbsoluteUrl(getBusinessCanonicalPath(id));
  const reviews = parseBusinessReviews(business.review);
  const rating = getPublicReviewRating(reviews);
  const image = getBusinessOgImage(business);

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': url,
    name: business.name,
    description: business.description || business.about || buildBusinessDescription(business),
    url,
    image: [image],
    telephone: business.contact || undefined,
    email: business.email || undefined,
    address: business.businessAddress
      ? {
          '@type': 'PostalAddress',
          streetAddress: business.businessAddress,
          addressLocality: business.city || undefined,
          addressRegion: business.state || undefined,
          addressCountry: 'IN',
        }
      : undefined,
    geo:
      business.latitude != null && business.longitude != null
        ? {
            '@type': 'GeoCoordinates',
            latitude: business.latitude,
            longitude: business.longitude,
          }
        : undefined,
    sameAs: [business.website, business.instagramUrl, business.facebookUrl, business.youtubeUrl].filter(
      Boolean
    ),
  };

  if (business.category) {
    schema.category = business.category;
  }

  if (rating != null && reviews.length > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating,
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}
