'use client';

import Link from 'next/link';
import { setLastSearchQuery } from '@/lib/lastSearchQuery';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  MapPin,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  MessageSquare,
  RefreshCw,
  Phone,
  Grid3X3,
} from 'lucide-react';
import CategoryIcon from '@/components/CategoryIcon';
import MerchantListingRating from '@/components/business/MerchantListingRating';
import MerchantOfferBadge from '@/components/business/MerchantOfferBadge';
import { VerifiedNameTick } from '@/components/business/VerifiedMark';
import HomeHero from '@/components/HomeHero';
import { Business, Category } from '@/lib/mockData';
import { categoryHref } from '@/lib/categoryDisplay';
import { getBusinessProfilePath } from '@/lib/businessSlug';
import { formatDistanceFromUser } from '@/lib/geo';
import { getBusinessOpenStatus } from '@/lib/businessHours';
import type { UserCoords } from '@/hooks/useUserCoords';

const MOBILE_TRENDING = [
  { label: 'Best Cafes in Delhi', trend: 12 },
  { label: 'CA Services Near You', trend: 7 },
  { label: 'Home Interior Designers', trend: 15 },
  { label: 'PG in Delhi', trend: 5 },
];

type MobileHomeProps = {
  manualQuery: string;
  onQueryChange: (value: string) => void;
  onSearch: (query?: string) => void;
  onVoiceSearch?: () => void;
  voiceActive?: boolean;
  searchHint?: boolean;
  categories: Category[];
  businesses: Business[];
  isBusinessesLoading: boolean;
  userCoords?: UserCoords | null;
};

export default function MobileHome({
  manualQuery,
  onQueryChange,
  onSearch,
  onVoiceSearch,
  voiceActive = false,
  searchHint = false,
  categories,
  businesses,
  isBusinessesLoading,
  userCoords = null,
}: MobileHomeProps) {
  const gridCategories = categories.slice(0, 7);
  const featured = businesses.slice(0, 6);

  const banners = [
  {
    src: '/business-register.png',
    href: '/business/register',
    alt: 'Register your business on FinderB',
  },
  {
    src: '/meet-ai.png',
    href: '/?tab=ai',
    alt: 'Meet FinderB AI',
  },
];

const [currentBanner, setCurrentBanner] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  }, 3500);

  return () => clearInterval(interval);
}, []);
  return (
    <div className="lg:hidden bg-white">
      <HomeHero
        variant="mobile"
        manualQuery={manualQuery}
        onQueryChange={onQueryChange}
        onSearch={onSearch}
        onVoiceSearch={onVoiceSearch}
        voiceActive={voiceActive}
        searchHint={searchHint}
      />

      {/* Popular Categories */}
      <section className="mt-2 bg-white px-4 py-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-[#0f2a4a]">Popular Categories</h2>
          <Link href="/categories" className="text-[13px] font-medium text-[#2563eb]">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {gridCategories.map((cat) => (
            <Link
              key={cat.id}
              href={categoryHref(cat.slug, cat.name)}
              className="flex flex-col items-center rounded-xl border border-gray-100 bg-white px-1 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
            >
              <div className="mb-2 flex h-10 w-10 items-center justify-center">
                <CategoryIcon
                  icon={cat.icon}
                  name={cat.name}
                  size={36}
                  className="h-9 w-9"
                  imageClassName="object-contain"
                />
              </div>
              <p className="line-clamp-2 text-center text-[11px] font-semibold leading-tight text-[#334155]">
                {cat.name}
              </p>
            </Link>
          ))}
          <Link
            href="/categories"
            className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white px-1 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f5f9]">
              <Grid3X3 size={22} className="text-[#64748b]" />
            </div>
            <p className="text-center text-[11px] font-semibold text-[#334155]">More</p>
          </Link>
        </div>
      </section>

      {/* Auto Scrolling Banner */}
      <section className="mt-1 px-4 pb-1">
        <div className="relative overflow-hidden rounded-xl">
          <div className="flex transition-transform duration-700 ease-in-out" style={{transform:`translateX(-${currentBanner*100}%)`}}>
            {banners.map((banner)=>(
              <Link key={banner.src} href={banner.href} className="min-w-full">
                <Image src={banner.src} alt={banner.alt} width={1200} height={320} className="h-auto w-full" sizes="(max-width: 1024px) 100vw, 400px"/>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trending */}
      <section className="mt-2 px-4 py-2">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-1 text-[15px] font-bold text-[#0f2a4a]">
              Trending This Week
              <span aria-hidden>🔥</span>
            </h2>
            <Link href="/categories" className="text-[13px] font-medium text-[#2563eb]">
              View All
            </Link>
          </div>
          <ul className="divide-y divide-gray-100">
            {MOBILE_TRENDING.map((item, idx) => (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() => onSearch(item.label)}
                  className="flex w-full items-center gap-2 py-3 text-left"
                >
                  <span className="w-4 shrink-0 text-xs font-medium text-[#94a3b8]">{idx + 1}</span>
                  <span className="min-w-0 flex-1 text-[13px] font-medium text-[#334155]">
                    {item.label}
                  </span>
                  <span className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-[#22c55e]">
                    <TrendingUp size={12} strokeWidth={2.5} />
                    {item.trend}%
                  </span>
                  <ChevronRight size={14} className="shrink-0 text-[#cbd5e1]" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Featured Verified */}
      <section className="mt-3 bg-white px-4 py-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-[#0f2a4a]">Featured Verified Businesses</h2>
          <Link href="/categories" className="text-[13px] font-medium text-[#2563eb]">
            View All
          </Link>
        </div>
        <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
          {isBusinessesLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[220px] w-[200px] shrink-0 animate-pulse rounded-xl bg-gray-100"
                />
              ))
            : featured.map((biz) => {
                const distanceLabel = formatDistanceFromUser(
                  userCoords,
                  biz.latitude,
                  biz.longitude
                );
                const openStatus = getBusinessOpenStatus(biz.timings);

                return (
                <Link
                  key={biz.id}
                  href={getBusinessProfilePath(biz)}
                  onClick={() => {
                    if (manualQuery.trim()) setLastSearchQuery(manualQuery);
                  }}
                  className="w-[200px] shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white"
                >
                  <div className="relative h-[110px]">
                    <Image
                      src={biz.profilePictureUrl || biz.image || '/fallback.jpg'}
                      alt={biz.name}
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="flex items-center gap-1 text-[13px] font-bold text-[#0f2a4a]">
                      <span className="min-w-0 truncate">{biz.name}</span>
                      {(biz.isFinderBVerified || biz.hasVerifiedBadge) && (
                        <VerifiedNameTick size={13} className="shrink-0" />
                      )}
                    </p>
                    <p className="line-clamp-1 text-[11px] text-[#94a3b8]">{biz.category}</p>
                    {openStatus && (
                      <p
                        className={`line-clamp-1 text-[10px] font-semibold ${
                          openStatus.status === 'Open' ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {openStatus.label}
                      </p>
                    )}
                    <MerchantListingRating
                      rating={biz.rating}
                      reviewCount={biz.reviewsCount}
                      starSize={10}
                      textClassName="text-[11px] font-medium text-[#475569]"
                      emptyClassName="text-[11px] text-[#94a3b8]"
                    />
                    <div className="flex items-start gap-1 text-[10px] text-[#94a3b8]">
                      <MapPin size={11} className="mt-0.5 shrink-0" />
                      <span className="line-clamp-2">
                        {distanceLabel && (
                          <span className="font-semibold text-[#2563eb]">{distanceLabel} · </span>
                        )}
                        {biz.location}
                      </span>
                    </div>
                    <div className="min-w-0 pt-1 empty:hidden">
                      <MerchantOfferBadge discountRange={biz.discountRange} compact />
                    </div>
                  </div>
                </Link>
                );
              })}
        </div>
      </section>

      {/* Trust icons */}
      <section className="bg-white px-4 pb-3 pt-3">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Verified\nBusinesses', icon: ShieldCheck, bg: 'bg-blue-50', color: 'text-blue-600' },
            { label: 'Real Customer\nReviews', icon: MessageSquare, bg: 'bg-emerald-50', color: 'text-emerald-600' },
            { label: 'Updated\nDaily', icon: RefreshCw, bg: 'bg-violet-50', color: 'text-violet-600' },
            { label: 'Instant\nContact', icon: Phone, bg: 'bg-orange-50', color: 'text-orange-500' },
          ].map(({ label, icon: Icon, bg, color }) => (
            <div key={label} className="flex flex-col items-center text-center">
              <div className={`mb-1.5 flex h-10 w-10 items-center justify-center rounded-full ${bg}`}>
                <Icon size={18} className={color} />
              </div>
              <p className="whitespace-pre-line text-[9px] font-semibold leading-tight text-[#475569]">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
