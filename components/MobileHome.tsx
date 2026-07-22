'use client';

import Link from 'next/link';
import { setLastSearchQuery } from '@/lib/lastSearchQuery';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  ChevronRight,
  TrendingUp,
  Grid3X3,
} from 'lucide-react';
import CategoryIcon from '@/components/CategoryIcon';
import MerchantListingRating from '@/components/business/MerchantListingRating';
import MerchantOfferBadge from '@/components/business/MerchantOfferBadge';
import MerchantJobBadge from '@/components/business/MerchantJobBadge';
import { VerifiedNameTick } from '@/components/business/VerifiedMark';
import HomeHero from '@/components/HomeHero';
import HomeTrustHighlights from '@/components/HomeTrustHighlights';
import { Business, Category } from '@/lib/mockData';
import { categoryBrowseHref } from '@/lib/categoryDisplay';
import { getBusinessProfilePath } from '@/lib/businessSlug';
import { formatDistanceFromUser } from '@/lib/geo';
import { getBusinessOpenStatus } from '@/lib/businessHours';
import type { TrendingWeekItem } from '@/lib/trendingThisWeek';
import type { UserCoords } from '@/hooks/useUserCoords';

const HOME_BANNERS = [
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
] as const;

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
  trendingThisWeek?: TrendingWeekItem[];
  showFeaturedVerified?: boolean;
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
  trendingThisWeek = [],
  showFeaturedVerified = true,
}: MobileHomeProps) {
  const gridCategories = categories.slice(0, 7);
  const featured = businesses.slice(0, 6);

  const [currentBanner, setCurrentBanner] = useState(0);
  const bannerScrollerRef = useRef<HTMLDivElement>(null);
  const bannerPauseUntilRef = useRef(0);
  const bannerScrollRafRef = useRef(0);

  const scrollBannerTo = (index: number, behavior: ScrollBehavior = 'smooth') => {
    const el = bannerScrollerRef.current;
    if (!el) return;
    const width = el.clientWidth || 1;
    el.scrollTo({ left: index * width, behavior });
    setCurrentBanner(index);
  };

  const pauseBannerAutoplay = (ms = 6000) => {
    bannerPauseUntilRef.current = Date.now() + ms;
  };

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (Date.now() < bannerPauseUntilRef.current) return;
      setCurrentBanner((prev) => {
        const next = (prev + 1) % HOME_BANNERS.length;
        const el = bannerScrollerRef.current;
        if (el) {
          const width = el.clientWidth || 1;
          el.scrollTo({ left: next * width, behavior: 'smooth' });
        }
        return next;
      });
    }, 3500);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (bannerScrollRafRef.current) {
        cancelAnimationFrame(bannerScrollRafRef.current);
      }
    };
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
              href={categoryBrowseHref(cat.id)}
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

      {/* Banner carousel — auto + manual swipe / dots */}
      <section className="mt-1 w-full px-4 pb-1">
        <div className="relative w-full overflow-hidden rounded-xl">
          <div
            ref={bannerScrollerRef}
            className="scrollbar-hide flex w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]"
            onPointerDown={() => pauseBannerAutoplay()}
            onTouchStart={() => pauseBannerAutoplay()}
            onScroll={() => {
              if (bannerScrollRafRef.current) cancelAnimationFrame(bannerScrollRafRef.current);
              bannerScrollRafRef.current = requestAnimationFrame(() => {
                const el = bannerScrollerRef.current;
                if (!el) return;
                const width = el.clientWidth || 1;
                const next = Math.round(el.scrollLeft / width);
                const clamped = Math.max(0, Math.min(HOME_BANNERS.length - 1, next));
                setCurrentBanner((prev) => (prev === clamped ? prev : clamped));
              });
            }}
          >
            {HOME_BANNERS.map((banner) => (
              <Link
                key={banner.src}
                href={banner.href}
                className="relative block w-full min-w-full max-w-full shrink-0 grow-0 basis-full snap-center snap-always"
              >
                <Image
                  src={banner.src}
                  alt={banner.alt}
                  width={1200}
                  height={320}
                  className="block h-auto w-full max-w-full object-cover object-center"
                  sizes="(max-width: 1024px) calc(100vw - 2rem), 400px"
                  priority={banner.src === HOME_BANNERS[0].src}
                />
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-1.5 flex items-center justify-center gap-1.5">
          {HOME_BANNERS.map((banner, index) => (
            <button
              key={`${banner.src}-dot`}
              type="button"
              aria-label={`Show banner ${index + 1}`}
              aria-current={currentBanner === index ? 'true' : undefined}
              onClick={() => {
                pauseBannerAutoplay();
                scrollBannerTo(index);
              }}
              className={`h-1.5 rounded-full transition-all ${
                currentBanner === index ? 'w-4 bg-primary' : 'w-1.5 bg-slate-300'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Trending */}
      {trendingThisWeek.length > 0 ? (
        <section className="mt-1.5 px-4 py-1">
          <div className="rounded-xl border border-gray-100 bg-white px-3.5 py-2.5">
            <div className="mb-1 flex items-center gap-2">
              <h2 className="flex items-center gap-1 text-[14px] font-bold text-[#0f2a4a]">
                Trending This Week
                <span className="inline-block animate-fire-flicker" aria-hidden>
                  🔥
                </span>
              </h2>
            </div>
            <ul className="divide-y divide-gray-100">
              {trendingThisWeek.map((item, idx) => (
                <li key={`${item.label}-${idx}`}>
                  <button
                    type="button"
                    onClick={() => onSearch(item.query)}
                    className="flex w-full items-center gap-2 py-1.5 text-left"
                  >
                    <span className="w-4 shrink-0 text-xs font-medium text-[#94a3b8]">
                      {idx + 1}
                    </span>
                    <span className="min-w-0 flex-1 text-[13px] font-medium text-[#334155]">
                      {item.label}
                    </span>
                    <span className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-[#22c55e]">
                      <TrendingUp size={12} strokeWidth={2.5} />
                      +{item.trend}%
                    </span>
                    <ChevronRight size={14} className="shrink-0 text-[#cbd5e1]" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Featured Verified */}
      {showFeaturedVerified ? (
      <section data-top-picks className="mt-3 scroll-mt-24 bg-white px-4 py-5">
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
                    <div className="flex min-w-0 items-center gap-1.5 pt-1 empty:hidden">
                      <MerchantOfferBadge discountRange={biz.discountRange} compact />
                      {biz.hasActiveJobs ? (
                        <MerchantJobBadge compact className="ml-auto shrink-0" />
                      ) : null}
                    </div>
                  </div>
                </Link>
                );
              })}
        </div>
      </section>
      ) : null}

      {/* Trust icons */}
      <HomeTrustHighlights variant="mobile" />
    </div>
  );
}
