import type { Metadata } from 'next';
import {
  buildBreadcrumbJsonLd,
  buildJsonLdGraph,
  buildPageMetadata,
  NO_INDEX_ROBOTS,
  resolveAbsoluteUrl,
  truncate,
} from '@/lib/seoUtils';

export type TouristPlaceSeoInput = {
  id: string;
  name: string;
  location: string;
  description?: string | null;
  image?: string | null;
  rating?: number | null;
};

export function getTouristPlaceCanonicalPath(id: string): string {
  return `/tourist-places/${id}`;
}

export function buildTouristPlacesIndexMetadata(): Metadata {
  return buildPageMetadata({
    title: 'Tourist Places — Destinations & Attractions in India',
    description:
      'Explore popular tourist places, landmarks, and must-visit destinations across India on FinderB. Plan trips with maps, ratings, and local insights.',
    canonicalPath: '/tourist-places',
    keywords: ['tourist places India', 'travel destinations', 'attractions', 'FinderB'],
  });
}

export function buildTouristPlaceMetadata(place: TouristPlaceSeoInput | null): Metadata {
  if (!place) {
    return buildPageMetadata({
      title: 'Place not found',
      description: 'This tourist place could not be found on FinderB.',
      canonicalPath: '/tourist-places',
      robots: NO_INDEX_ROBOTS,
    });
  }

  const canonicalPath = getTouristPlaceCanonicalPath(place.id);
  const description = truncate(
    place.description ||
      `Visit ${place.name} in ${place.location}. Explore travel tips, directions, and nearby attractions on FinderB.`,
    160
  );

  return buildPageMetadata({
    title: `${place.name} — Tourist Place in ${place.location}`,
    description,
    canonicalPath,
    ogImage: place.image || '/logo1.png',
    keywords: [place.name, place.location, 'tourist place', 'India', 'FinderB'],
  });
}

export function buildTouristPlaceJsonLd(place: TouristPlaceSeoInput) {
  const path = getTouristPlaceCanonicalPath(place.id);
  const url = resolveAbsoluteUrl(path);
  const image = place.image ? resolveAbsoluteUrl(place.image) : resolveAbsoluteUrl('/logo1.png');

  return buildJsonLdGraph(
    {
      '@type': 'TouristAttraction',
      '@id': url,
      name: place.name,
      description: truncate(
        place.description ||
          `${place.name} is a popular destination in ${place.location}, India.`,
        300
      ),
      url,
      image: [image],
      address: {
        '@type': 'PostalAddress',
        addressLocality: place.location,
        addressCountry: 'IN',
      },
      ...(place.rating != null
        ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: place.rating,
              bestRating: 5,
              worstRating: 1,
            },
          }
        : {}),
    },
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Tourist Places', path: '/tourist-places' },
      { name: place.name, path },
    ])
  );
}
