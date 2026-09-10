import Image from 'next/image';
import Link from 'next/link';
import type { Business } from '@/lib/mockData';
import { getBusinessListingImage, BUSINESS_IMAGE_FALLBACK } from '@/lib/businessMapping';
import { getBusinessProfilePath } from '@/lib/businessSlug';
import { formatDistanceFromUser } from '@/lib/geo';

type Coords = { lat: number; lng: number } | null;

export default function BusinessProfileRelatedRail({
  businesses,
  userCoords,
}: {
  businesses: Business[];
  userCoords: Coords;
}) {
  if (businesses.length === 0) return null;

  return (
    <section className="px-4 pt-6">
      <h2 className="text-[20px] font-extrabold tracking-tight text-[#153551]">Similar nearby</h2>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {businesses.map((item) => {
          const cover = getBusinessListingImage(item) || BUSINESS_IMAGE_FALLBACK;
          const dist = formatDistanceFromUser(userCoords, item.latitude, item.longitude);
          return (
            <Link
              key={item.id}
              href={getBusinessProfilePath(item)}
              className="w-[min(220px,58vw)] shrink-0"
            >
              <div className="relative h-[150px] overflow-hidden rounded-2xl bg-stone-200">
                <Image
                  src={cover}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="220px"
                />
                <div className="absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute inset-x-3 bottom-3">
                  <p className="line-clamp-2 text-sm font-bold text-white">{item.name}</p>
                  <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-white/75">
                    {item.category}
                    {dist ? ` · ${dist}` : ''}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
