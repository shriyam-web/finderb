import type { Metadata } from 'next';
import type { Business } from '@/lib/mockData';
import { buildFaqJsonLd, buildBusinessSeoContent } from '@/lib/businessContent';
import { getBusinessAreaLabel, getBusinessLocationLabel } from '@/lib/businessBreadcrumb';
import { getPublicReviewRating, parseBusinessReviews } from '@/lib/businessReviews';
import { reviewsToSchemaReviews, timingsToOpeningHoursSchema, aggregateRatingJsonLd } from '@/lib/businessHoursSchema';
import { getBusinessIndexDecision } from '@/lib/businessIndexation';
import { categoryHref } from '@/lib/categoryDisplay';
import { categoryCityHref, slugifyCity } from '@/lib/categoryCity';
import { getBusinessProfilePath } from '@/lib/businessSlug';
import { footerSearchHref } from '@/lib/footerData';
import {
  buildBreadcrumbJsonLd,
  buildJsonLdGraph,
  buildPageMetadata,
  NO_INDEX_ROBOTS,
  resolveAbsoluteUrl,
  truncate,
} from '@/lib/seoUtils';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://finderb.com';
const SITE_NAME = 'FinderB';
const DEFAULT_OG_IMAGE = '/logo1.png';

export { resolveAbsoluteUrl };

export function getBusinessCanonicalPath(business: { id: string; slug?: string | null }): string {
  return getBusinessProfilePath(business);
}

export function getBusinessShareUrl(
  business: { id: string; slug?: string | null },
  origin?: string
): string {
  const base = origin?.replace(/\/$/, '') || SITE_URL;
  return `${base}${getBusinessCanonicalPath(business)}`;
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

/** Fits Google's ~60-character title width (the " | FinderB" suffix is added by the layout template). */
const TITLE_BUDGET = 60 - ' | FinderB'.length;

export function buildBusinessMetaTitle(business: Business): string {
  const name = business.name.trim();
  const city = business.city?.trim() || '';
  const area = getBusinessAreaLabel(business);
  const named = (place: string) =>
    place && !name.toLowerCase().includes(place.toLowerCase()) ? `${name}, ${place}` : name;

  const candidates = [
    `${named(area && city ? `${area}, ${city}` : city)} - Reviews & Contact`,
    named(area && city ? `${area}, ${city}` : city),
    `${named(city)} - Reviews & Contact`,
    named(city),
  ];
  return candidates.find((title) => title.length <= TITLE_BUDGET) ?? truncate(named(city), TITLE_BUDGET);
}

export function buildBusinessMetaDescription(business: Business): string {
  const city = business.city?.trim() || '';
  const area = getBusinessAreaLabel(business);
  const place = area && city ? `${area}, ${city}` : city || getBusinessLocationLabel(business) || '';
  const placePart = place ? ` in ${place}` : '';
  const services = business.services?.slice(0, 3).join(', ');
  const servicePart = services ? ` Services: ${services}.` : '';

  return truncate(
    `${business.name}${placePart} - see customer reviews, photos, phone number and address on FinderB.${servicePart}`,
    160
  );
}

export function buildBusinessDescription(business: Business): string {
  return buildBusinessMetaDescription(business);
}

export function buildBusinessPageTitle(business: Business): string {
  return buildBusinessMetaTitle(business);
}

type BusinessMetaRecord = Business & {
  status?: string | null;
  paymentStatus?: string | null;
  slug?: string | null;
};

export function buildBusinessMetadata(business: BusinessMetaRecord | null): Metadata {
  if (!business) {
    return buildPageMetadata({
      title: 'Business not found',
      description: 'This business listing could not be found on FinderB.',
      canonicalPath: '/categories',
      robots: NO_INDEX_ROBOTS,
    });
  }

  const canonicalPath = getBusinessCanonicalPath(business);
  const indexDecision = getBusinessIndexDecision(business);
  const title = buildBusinessMetaTitle(business);
  const description = buildBusinessMetaDescription(business);
  const ogImage = getBusinessOgImage(business);
  const location = getBusinessLocationLabel(business);
  const socialTitle = truncate(
    `${business.name}${location ? ` — ${location}` : ''}`,
    70
  );
  const socialDescription = truncate(
    business.about?.trim() ||
      business.description?.trim() ||
      `View ${business.name} on FinderB — contact number, address, reviews, and services.`,
    200
  );

  const keywords = [
    business.name,
    `${business.name} ${location || ''}`.trim(),
    `${business.name} ${business.category}`.trim(),
    business.category,
    location ? `${business.category} in ${location}` : undefined,
    business.city,
    business.state,
    business.contact,
    'local business',
    'reviews',
    SITE_NAME,
    ...(business.keywords ?? []),
    ...(business.services ?? []).slice(0, 6),
  ].filter((value): value is string => Boolean(value && String(value).trim()));

  return buildPageMetadata({
    title,
    description,
    canonicalPath,
    ogImage,
    keywords,
    robots: indexDecision.index ? undefined : NO_INDEX_ROBOTS,
    openGraphTitle: socialTitle,
    openGraphDescription: socialDescription,
  });
}

export function buildCityCategorySearchPath(
  category: string,
  city?: string | null,
  categorySlug?: string | null
): string {
  const cityLabel = city?.trim();
  if (!cityLabel) return footerSearchHref(category);

  if (categorySlug) {
    return categoryCityHref(categorySlug, slugifyCity(cityLabel));
  }

  return footerSearchHref(`${category} in ${cityLabel}`);
}

export function buildBusinessJsonLd(
  business: BusinessMetaRecord,
  categorySlug?: string | null
) {
  const canonicalPath = getBusinessCanonicalPath(business);
  const url = resolveAbsoluteUrl(canonicalPath);
  const reviews = parseBusinessReviews(business.review);
  const rating = getPublicReviewRating(reviews);
  const image = getBusinessOgImage(business);
  const location = getBusinessLocationLabel(business);
  const seoContent = buildBusinessSeoContent(business);
  const categoryPath =
    business.category && categorySlug
      ? categoryHref(categorySlug, business.category)
      : buildCityCategorySearchPath(business.category, business.city, categorySlug);

  const localBusiness: Record<string, unknown> = {
    '@type': 'LocalBusiness',
    '@id': url,
    name: business.name,
    description: business.about || business.description || seoContent.about,
    url,
    image: [image],
    telephone: business.contact || undefined,
    email: business.email || undefined,
    address: business.businessAddress
      ? {
          '@type': 'PostalAddress',
          streetAddress: business.businessAddress,
          addressLocality: business.city || location || undefined,
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
    sameAs: [
      business.website,
      business.instagramUrl,
      business.facebookUrl,
      business.youtubeUrl,
    ].filter(Boolean),
  };

  if (business.category) {
    localBusiness.category = business.category;
  }

  const openingHours = timingsToOpeningHoursSchema(business.timings);
  if (openingHours.length) {
    localBusiness.openingHoursSpecification = openingHours;
  }

  const aggregateRating = aggregateRatingJsonLd(rating ?? 0, reviews.length);
  if (aggregateRating) {
    localBusiness.aggregateRating = aggregateRating;
    localBusiness.review = reviewsToSchemaReviews(reviews, {
      '@type': 'LocalBusiness',
      '@id': url,
    });
  }

  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Categories', path: '/categories' },
    ...(business.category ? [{ name: business.category, path: categoryPath }] : []),
    ...(location
      ? [
          {
            name: location,
            path: buildCityCategorySearchPath(
              business.category,
              business.city,
              categorySlug
            ),
          },
        ]
      : []),
    { name: business.name, path: canonicalPath },
  ]);

  const faqNode = buildFaqJsonLd(seoContent.faqs, url);
  const graph = [localBusiness, breadcrumbs];
  if (faqNode) graph.push(faqNode);

  return buildJsonLdGraph(...graph);
}
