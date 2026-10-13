import type { Metadata } from 'next';
import { categoryHref } from '@/lib/categoryDisplay';
import { buildCategoryCityLabel, categoryCityHref } from '@/lib/categoryCity';
import {
  buildBreadcrumbJsonLd,
  buildJsonLdGraph,
  buildPageMetadata,
  resolveAbsoluteUrl,
  truncate,
} from '@/lib/seoUtils';

export function buildCategoryIndexMetadata(): Metadata {
  return buildPageMetadata({
    title: 'All Categories — Local Business Services in India',
    description:
      'Browse 500+ local business categories on FinderB — restaurants, doctors, plumbers, salons, hotels, tutors, lawyers, contractors and more across India.',
    canonicalPath: '/categories',
    keywords: [
      'business categories India',
      'local services directory',
      'find businesses near me',
      'FinderB categories',
    ],
  });
}

export function buildCategorySearchMetadata(query: string): Metadata {
  const trimmed = query.trim();
  const title = `${trimmed} — Local Businesses & Services`;
  const description = truncate(
    `Find verified ${trimmed} listings on FinderB. Compare ratings, contact details, addresses, and reviews from local businesses across India.`,
    160
  );

  return buildPageMetadata({
    title,
    description,
    canonicalPath: `/categories?search=${encodeURIComponent(trimmed)}`,
    keywords: [trimmed, 'near me', 'local business', 'FinderB'],
    robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
  });
}

export function buildCategorySlugMetadata(
  slug: string,
  name: string,
  businessCount?: number
): Metadata {
  const title = `${name} — Local Businesses & Services in India`;
  const countPhrase =
    businessCount != null && businessCount > 0
      ? ` Browse ${businessCount} verified ${name.toLowerCase()} listing${businessCount === 1 ? '' : 's'}.`
      : '';
  const description = truncate(
    `Discover top-rated ${name.toLowerCase()} businesses on FinderB.${countPhrase} Compare ratings, phone numbers, addresses, and customer reviews across India.`,
    160
  );

  return buildPageMetadata({
    title,
    description,
    canonicalPath: categoryHref(slug, name),
    keywords: [name, `${name} near me`, 'local business', 'India', 'FinderB'],
  });
}

export function buildCategoryCityMetadata(
  categorySlug: string,
  categoryName: string,
  citySlug: string,
  cityName: string,
  businessCount?: number
): Metadata {
  const label = buildCategoryCityLabel(categoryName, cityName);
  const countPhrase =
    businessCount != null && businessCount > 0
      ? ` Browse ${businessCount} verified listing${businessCount === 1 ? '' : 's'}.`
      : '';

  return buildPageMetadata({
    title: `${label} — Local Businesses & Services`,
    description: truncate(
      `Find top-rated ${categoryName.toLowerCase()} in ${cityName} on FinderB.${countPhrase} Compare reviews, phone numbers, addresses, and contact details.`,
      160
    ),
    canonicalPath: categoryCityHref(categorySlug, citySlug),
    keywords: [
      `${categoryName} in ${cityName}`,
      `${categoryName} ${cityName}`,
      categoryName,
      cityName,
      'near me',
      'FinderB',
    ],
  });
}

export function buildCategoryCityCollectionJsonLd(
  categorySlug: string,
  categoryName: string,
  citySlug: string,
  cityName: string,
  businessCount?: number
) {
  const categoryPath = categoryHref(categorySlug, categoryName);
  const path = categoryCityHref(categorySlug, citySlug);
  const url = resolveAbsoluteUrl(path);
  const label = buildCategoryCityLabel(categoryName, cityName);

  return buildJsonLdGraph(
    {
      '@type': 'CollectionPage',
      '@id': url,
      name: `${label} — FinderB`,
      description: `Browse ${categoryName.toLowerCase()} businesses in ${cityName} on FinderB.`,
      url,
      isPartOf: { '@id': `${resolveAbsoluteUrl('/')}#website` },
      ...(businessCount != null && businessCount > 0 ? { numberOfItems: businessCount } : {}),
    },
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Categories', path: '/categories' },
      { name: categoryName, path: categoryPath },
      { name: cityName, path },
    ])
  );
}

export function buildCategoryCollectionJsonLd(
  slug: string,
  name: string,
  businessCount?: number
) {
  const path = categoryHref(slug, name);
  const url = resolveAbsoluteUrl(path);

  return buildJsonLdGraph(
    {
      '@type': 'CollectionPage',
      '@id': url,
      name: `${name} — FinderB`,
      description: `Browse ${name.toLowerCase()} businesses and services on FinderB across India.`,
      url,
      isPartOf: { '@id': `${resolveAbsoluteUrl('/')}#website` },
      ...(businessCount != null && businessCount > 0
        ? { numberOfItems: businessCount }
        : {}),
    },
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Categories', path: '/categories' },
      { name, path },
    ])
  );
}
