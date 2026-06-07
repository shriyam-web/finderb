'use client';

import { use, useState, useEffect } from 'react';
import { touristPlaces } from '@/lib/mockData';
import { getTouristPlace, getNearbyTouristPlaces } from '@/app/actions/touristPlace';
import Link from 'next/link';
import { ArrowLeft, MapPin, Star, ExternalLink } from 'lucide-react';
import TouristPlaceImage from '@/components/TouristPlaceImage';

type Place = {
  id: string;
  name: string;
  location: string;
  image: string;
  description?: string | null;
  rating?: number;
  distance?: string;
};

export default function TouristPlaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [place, setPlace] = useState<Place | null>(null);
  const [nearby, setNearby] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);

      const [placeResult, nearbyResult] = await Promise.all([
        getTouristPlace(id),
        getNearbyTouristPlaces(id, 3),
      ]);

      if (placeResult.success && placeResult.touristPlace) {
        setPlace(placeResult.touristPlace);
      } else {
        const mock = touristPlaces.find((p) => p.id === id) || touristPlaces[0];
        setPlace(mock);
      }

      if (nearbyResult.success && nearbyResult.touristPlaces?.length) {
        setNearby(nearbyResult.touristPlaces);
      } else {
        setNearby(touristPlaces.filter((p) => p.id !== id).slice(0, 3));
      }

      setIsLoading(false);
    }

    fetchData();
  }, [id]);

  if (isLoading || !place) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white pt-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2563eb] border-t-transparent" />
          <p className="text-sm text-[#64748b]">Loading place...</p>
        </div>
      </div>
    );
  }

  const description =
    place.description ||
    `${place.name} is a popular destination in ${place.location}. Explore local sights, plan your visit, and discover what makes this place worth seeing.`;

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-12">
      <div className="border-b border-gray-100 bg-white pt-[4.25rem] sm:pt-24">
        <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#64748b] hover:text-[#2563eb]"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#64748b]">
          <span className="inline-flex items-center gap-1">
            <MapPin size={13} className="text-[#94a3b8]" />
            {place.location}
          </span>
          {place.distance && (
            <>
              <span className="text-[#cbd5e1]">·</span>
              <span>{place.distance}</span>
            </>
          )}
          <span className="text-[#cbd5e1]">·</span>
          <span className="inline-flex items-center gap-1 text-[#f59e0b]">
            <Star size={13} className="fill-[#f59e0b]" />
            <span className="font-semibold text-[#1e293b]">{place.rating ?? 4.8}</span>
          </span>
        </div>

        <h1 className="mb-5 text-[1.5rem] font-bold leading-snug tracking-tight text-[#1e293b] sm:text-2xl">
          {place.name}
        </h1>

        <div className="relative mb-6 aspect-[16/10] overflow-hidden rounded-xl border border-gray-100 sm:mb-8">
          <TouristPlaceImage
            src={place.image}
            alt={place.name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>

        <section className="mb-8 space-y-4">
          <h2 className="text-base font-semibold text-[#1e293b]">About this place</h2>
          <p className="text-[15px] leading-relaxed text-[#475569]">{description}</p>
        </section>

        <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Best time', value: 'Oct – Mar' },
            { label: 'Visit duration', value: '2–3 hrs' },
            { label: 'Entry', value: 'Varies' },
            { label: 'Type', value: 'Sightseeing' },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-gray-100 bg-[#f8fafc] px-3 py-3 text-center"
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-[#94a3b8]">
                {item.label}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#1e293b]">{item.value}</p>
            </div>
          ))}
        </section>

        <div className="mb-10 rounded-xl border border-gray-100 bg-[#f8fafc] p-4">
          <p className="mb-3 text-sm text-[#64748b]">
            Open directions in Google Maps to plan your visit.
          </p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${place.location}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
          >
            Get directions
            <ExternalLink size={15} />
          </a>
        </div>

        {nearby.length > 0 && (
          <section>
            <h2 className="mb-4 text-base font-semibold text-[#1e293b]">More places nearby</h2>
            <div className="space-y-3">
              {nearby.map((p) => (
                <Link
                  key={p.id}
                  href={`/tourist-places/${p.id}`}
                  className="flex gap-3 overflow-hidden rounded-xl border border-gray-100 bg-white p-3 transition-colors hover:border-[#2563eb]/20"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    <TouristPlaceImage src={p.image} alt={p.name} fill sizes="64px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-[#1e293b]">{p.name}</p>
                    <p className="mt-0.5 text-xs text-[#64748b]">{p.location}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
