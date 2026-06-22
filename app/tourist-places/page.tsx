import type { Metadata } from 'next';
import { getTouristPlaces } from '@/app/actions/touristPlace';
import JsonLd from '@/components/JsonLd';
import TouristPlacesListingClient from '@/components/tourist/TouristPlacesListingClient';
import { buildTouristPlacesIndexMetadata } from '@/lib/touristPlaceSeo';
import { buildBreadcrumbJsonLd, buildJsonLdGraph, resolveAbsoluteUrl } from '@/lib/seoUtils';

export const metadata: Metadata = buildTouristPlacesIndexMetadata();

export default async function TouristPlacesListingPage() {
  const result = await getTouristPlaces();
  const places = result.success && result.touristPlaces ? result.touristPlaces : [];

  const jsonLd = buildJsonLdGraph(
    {
      '@type': 'CollectionPage',
      '@id': resolveAbsoluteUrl('/tourist-places'),
      name: 'Tourist Places in India',
      description: 'Explore tourist destinations and attractions across India on FinderB.',
      url: resolveAbsoluteUrl('/tourist-places'),
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: places.map((place, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: resolveAbsoluteUrl(`/tourist-places/${place.id}`),
          name: place.name,
        })),
      },
    },
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Tourist Places', path: '/tourist-places' },
    ])
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <TouristPlacesListingClient initialPlaces={places} />
    </>
  );
}
