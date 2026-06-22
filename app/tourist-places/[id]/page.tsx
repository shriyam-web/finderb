import { cache } from 'react';
import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { getNearbyTouristPlaces, getTouristPlaceBySlugOrId } from '@/app/actions/touristPlace';
import JsonLd from '@/components/JsonLd';
import TouristPlaceDetailClient from '@/components/tourist/TouristPlaceDetailClient';
import {
  buildTouristPlaceJsonLd,
  buildTouristPlaceMetadata,
} from '@/lib/touristPlaceSeo';
import {
  getTouristPlacePath,
  resolveTouristPlaceSlug,
  shouldRedirectToCanonicalTouristPlaceSlug,
} from '@/lib/touristPlaceSlug';

type PageProps = {
  params: Promise<{ id: string }>;
};

const getPlaceCached = cache((slugOrId: string) => getTouristPlaceBySlugOrId(slugOrId));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getPlaceCached(id);
  const place = result.success && result.touristPlace ? result.touristPlace : null;

  return buildTouristPlaceMetadata(
    place
      ? {
          id: place.id,
          slug: place.slug,
          name: place.name,
          location: place.location,
          description: place.description,
          image: place.image,
          rating: place.rating,
        }
      : null
  );
}

export default async function TouristPlaceDetailPage({ params }: PageProps) {
  const { id: slugOrId } = await params;
  const placeResult = await getPlaceCached(slugOrId);
  const place = placeResult.success && placeResult.touristPlace ? placeResult.touristPlace : null;

  if (place && shouldRedirectToCanonicalTouristPlaceSlug(slugOrId, place)) {
    permanentRedirect(getTouristPlacePath(place));
  }

  const canonicalSlug = place ? resolveTouristPlaceSlug(place) : slugOrId;
  const nearbyResult = place
    ? await getNearbyTouristPlaces(place.id, undefined, undefined, 3)
    : { success: false as const, touristPlaces: [] };
  const nearby =
    nearbyResult.success && nearbyResult.touristPlaces ? nearbyResult.touristPlaces : [];

  const jsonLd = place
    ? buildTouristPlaceJsonLd({
        id: place.id,
        slug: place.slug,
        name: place.name,
        location: place.location,
        description: place.description,
        image: place.image,
        rating: place.rating,
      })
    : null;

  return (
    <>
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      <TouristPlaceDetailClient
        slugOrId={canonicalSlug}
        initialPlace={place}
        initialNearby={nearby}
      />
    </>
  );
}
