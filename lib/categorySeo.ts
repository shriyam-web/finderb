import type { Metadata } from 'next';
import { categoryHref } from '@/lib/categoryDisplay';
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
