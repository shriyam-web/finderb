'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Star } from 'lucide-react';
import { touristPlaces } from '@/lib/mockData';
import { getTouristPlaces } from '@/app/actions/touristPlace';
import TouristPlaceImage from '@/components/TouristPlaceImage';
import { useSortedTouristPlaces } from '@/hooks/useSortedTouristPlaces';

import { getTouristPlacePath } from '@/lib/touristPlaceSlug';

type Place = {
  id: string;
  slug?: string | null;
  name: string;
  location: string;
  image: string;
  distance?: string;
  rating?: number;
};

export default function TouristPlacesListingClient({
  initialPlaces = [],
}: {
  initialPlaces?: Place[];
}) {
  const [places, setPlaces] = useState<Place[]>(initialPlaces.length > 0 ? initialPlaces : touristPlaces);
  const sortedPlaces = useSortedTouristPlaces(places);
  const [loading, setLoading] = useState(initialPlaces.length === 0);

  useEffect(() => {
    if (initialPlaces.length > 0) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      const result = await getTouristPlaces();
      if (result.success && result.touristPlaces && result.touristPlaces.length > 0) {
        setPlaces(result.touristPlaces);
      }
      setLoading(false);
    }
    fetchData();
  }, [initialPlaces.length]);

  return (
    <div className="min-h-[calc(100dvh-6.75rem)] bg-[#f8fafc] pb-24 lg:min-h-screen lg:pb-12">
      <div className="border-b border-gray-100 bg-white pt-[4.25rem] sm:pt-24">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#64748b] transition-colors hover:text-[#2563eb]"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[#1e293b] sm:text-3xl">
            Explore <span className="text-[#2563eb]">Destinations</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b] sm:text-base">
            Discover popular tourist spots, landmarks, and must-visit places across India.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="flex animate-pulse overflow-hidden rounded-xl border border-gray-100 bg-white"
              >
                <div className="h-24 w-24 shrink-0 bg-slate-200" />
                <div className="flex flex-1 flex-col justify-center gap-2 p-4">
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                  <div className="h-3 w-1/2 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : places.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white px-6 py-16 text-center">
            <p className="text-base font-semibold text-[#1e293b]">No destinations yet</p>
            <p className="mt-2 text-sm text-[#64748b]">Check back soon for new places to explore.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedPlaces.map((place) => (
              <Link
                key={place.id}
                href={getTouristPlacePath(place)}
                className="group flex overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.06)] transition-all hover:border-[#2563eb]/20 hover:shadow-md"
              >
                <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28">
                  <TouristPlaceImage
                    src={place.image}
                    alt={place.name}
                    fill
                    className="transition-transform duration-500 group-hover:scale-105"
                    sizes="112px"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3">
                  <h2 className="line-clamp-1 text-[15px] font-bold text-[#1e293b] transition-colors group-hover:text-[#2563eb]">
                    {place.name}
                  </h2>
                  <div className="mt-1 flex items-center gap-1 text-[12px] text-[#64748b]">
                    <MapPin size={12} className="shrink-0 text-[#94a3b8]" />
                    <span className="line-clamp-1">{place.location}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {place.rating != null && (
                      <div className="flex items-center gap-0.5 text-[#f59e0b]">
                        <Star size={12} className="fill-[#f59e0b]" />
                        <span className="text-[12px] font-semibold text-[#1e293b]">{place.rating}</span>
                      </div>
                    )}
                    {place.distance && (
                      <span className="text-[11px] text-[#94a3b8]">· {place.distance}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
