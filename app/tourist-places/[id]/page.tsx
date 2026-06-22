import type { Metadata } from 'next';
import { getNearbyTouristPlaces, getTouristPlace } from '@/app/actions/touristPlace';
import JsonLd from '@/components/JsonLd';
import TouristPlaceDetailClient from '@/components/tourist/TouristPlaceDetailClient';
import {
  buildTouristPlaceJsonLd,
  buildTouristPlaceMetadata,
} from '@/lib/touristPlaceSeo';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getTouristPlace(id);
  const place = result.success && result.touristPlace ? result.touristPlace : null;

  return buildTouristPlaceMetadata(
    place
      ? {
          id: place.id,
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
  const { id } = await params;
  const [placeResult, nearbyResult] = await Promise.all([
    getTouristPlace(id),
    getNearbyTouristPlaces(id, undefined, undefined, 3),
  ]);

  const place = placeResult.success && placeResult.touristPlace ? placeResult.touristPlace : null;
  const nearby =
    nearbyResult.success && nearbyResult.touristPlaces ? nearbyResult.touristPlaces : [];

  const jsonLd = place
    ? buildTouristPlaceJsonLd({
        id: place.id,
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
      <TouristPlaceDetailClient placeId={id} initialPlace={place} initialNearby={nearby} />
    </>
  );
}
