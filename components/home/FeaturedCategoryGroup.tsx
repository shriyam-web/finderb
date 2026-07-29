'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Navigation,
  Phone,
  Star,
  Tag,
  X,
} from 'lucide-react';
import { getBusinessesByCategory } from '@/app/actions/business';
import CategoryIcon from '@/components/CategoryIcon';
import MerchantOfferBadge from '@/components/business/MerchantOfferBadge';
import MerchantJobBadge from '@/components/business/MerchantJobBadge';
import { VerifiedBusinessName } from '@/components/business/VerifiedMark';
import { directionsHref, phoneHref } from '@/lib/businessContact';
import { formatLocalityCityLabel } from '@/lib/businessAddress';
import { categoryBrowseHref } from '@/lib/categoryDisplay';
import { getBusinessListingImage } from '@/lib/businessMapping';
import { getBusinessProfilePath } from '@/lib/businessSlug';
import { getBusinessOpenStatus } from '@/lib/businessHours';
import { getDiscountOfferCardLabel } from '@/lib/discountOffer';
import { formatDistanceFromUser, getDistanceKm } from '@/lib/geo';
import { useUserCoords } from '@/hooks/useUserCoords';

export type FeaturedSubcategory = {
  id: string;
  name: string;
  slug: string | null;
  icon?: string;
  businessCount?: number;
  href?: string;
  /** Category label for Business.category queries (e.g. parent name for "All"). */
  queryName?: string;
};

type FeaturedCategoryGroupProps = {
  id: string;
  title: string;
  slug?: string | null;
  subcategories: FeaturedSubcategory[];
  /** Alternating section tone: even = white, odd = soft gray */
  tone?: 'light' | 'muted';
};

type MerchantCard = {
  id: string;
  slug?: string | null;
  name: string;
  category?: string;
  location?: string;
  city?: string | null;
  state?: string | null;
  businessAddress?: string | null;
  description?: string;
  about?: string | null;
  contact?: string;
  publicPhone?: string;
  image?: string;
  profilePictureUrl?: string;
  images?: string[];
  rating?: number | null;
  reviewsCount?: number;
  timings?: unknown;
  discountRange?: string | null;
  isFinderBVerified?: boolean;
  hasVerifiedBadge?: boolean;
  hasActiveJobs?: boolean;
  latitude?: number | null;
  longitude?: number | null;
};

const HOME_MERCHANT_PAGE_SIZE = 24;
const TRENDING_COUNT = 3;
const SUBCAT_STORAGE_PREFIX = 'finderb-home-subcat:';

type MerchantFilterId =
  | 'open-now'
  | 'top-rated'
  | 'verified'
  | 'offers'
  | 'hiring'
  | 'nearest';

const MERCHANT_FILTERS: Array<{
  id: MerchantFilterId;
  label: string;
  icon: typeof Clock3;
}> = [
  { id: 'nearest', label: 'Nearest', icon: Navigation },
  { id: 'open-now', label: 'Open now', icon: Clock3 },
  { id: 'top-rated', label: 'Top rated', icon: Star },
  { id: 'verified', label: 'Verified', icon: BadgeCheck },
  { id: 'offers', label: 'Offers', icon: Tag },
  { id: 'hiring', label: 'Hiring', icon: Briefcase },
];

function isAllSubcategory(sub: FeaturedSubcategory) {
  return String(sub.id).startsWith('all:');
}

function pickDefaultSubcategory(subs: FeaturedSubcategory[]) {
  const allTab = subs.find((sub) => isAllSubcategory(sub));
  if (allTab) return allTab;
  const withBusinesses = subs.find((sub) => (sub.businessCount ?? 0) > 0);
  return withBusinesses ?? subs[0] ?? null;
}

function writeStoredSubcategoryId(categoryId: string, subId: string) {
  try {
    sessionStorage.setItem(`${SUBCAT_STORAGE_PREFIX}${categoryId}`, subId);
  } catch {
    /* ignore */
  }
}

function merchantHasOffer(biz: MerchantCard) {
  return Boolean(getDiscountOfferCardLabel(biz.discountRange));
}

function merchantRating(biz: MerchantCard) {
  return biz.rating != null && Number(biz.rating) > 0 ? Number(biz.rating) : 5;
}

function trendingScore(biz: MerchantCard) {
  return merchantRating(biz) * 1000 + (biz.reviewsCount ?? 0);
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Stable shuffle so the homepage strip doesn't jump on every re-render. */
function seededShuffle<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  let s = hashSeed(seed) || 1;
  const next = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function applyMerchantFilters(
  merchants: MerchantCard[],
  activeFilters: MerchantFilterId[],
  userCoords: { lat: number; lng: number } | null,
  shuffleSeed: string
) {
  let rows = [...merchants];

  if (activeFilters.includes('open-now')) {
    rows = rows.filter(
      (biz) => getBusinessOpenStatus(biz.timings).status === 'Open'
    );
  }
  if (activeFilters.includes('top-rated')) {
    rows = rows.filter((biz) => merchantRating(biz) >= 4.5);
  }
  if (activeFilters.includes('verified')) {
    rows = rows.filter((biz) =>
      Boolean(biz.isFinderBVerified || biz.hasVerifiedBadge)
    );
  }
  if (activeFilters.includes('offers')) {
    rows = rows.filter(merchantHasOffer);
  }
  if (activeFilters.includes('hiring')) {
    rows = rows.filter((biz) => Boolean(biz.hasActiveJobs));
  }

  // Default: randomised order so filter chips visibly change the strip.
  if (activeFilters.length === 0) {
    return seededShuffle(rows, shuffleSeed);
  }

  const preferNearest = activeFilters.includes('nearest') && userCoords;
  const preferRated = activeFilters.includes('top-rated');
  const preferOpen = activeFilters.includes('open-now');

  if (preferNearest || preferRated || preferOpen) {
    rows.sort((a, b) => {
      if (preferOpen) {
        const aOpen = getBusinessOpenStatus(a.timings).status === 'Open' ? 1 : 0;
        const bOpen = getBusinessOpenStatus(b.timings).status === 'Open' ? 1 : 0;
        if (bOpen !== aOpen) return bOpen - aOpen;
      }

      if (preferNearest && userCoords) {
        const distA =
          a.latitude != null && a.longitude != null
            ? getDistanceKm(userCoords.lat, userCoords.lng, a.latitude, a.longitude)
            : Number.POSITIVE_INFINITY;
        const distB =
          b.latitude != null && b.longitude != null
            ? getDistanceKm(userCoords.lat, userCoords.lng, b.latitude, b.longitude)
            : Number.POSITIVE_INFINITY;
        if (distA !== distB) return distA - distB;
      }

      if (preferRated) {
        const ratingDiff = merchantRating(b) - merchantRating(a);
        if (ratingDiff !== 0) return ratingDiff;
        return (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0);
      }

      return 0;
    });
    return rows;
  }

  // Offers / verified / hiring only — keep a shuffled filtered set.
  return seededShuffle(rows, `${shuffleSeed}:${activeFilters.slice().sort().join(',')}`);
}

function emptyFilterTip(activeFilters: MerchantFilterId[]) {
  if (activeFilters.length === 0) return null;
  const labels = activeFilters.map(
    (id) => MERCHANT_FILTERS.find((f) => f.id === id)?.label ?? id
  );
  if (labels.length === 1) {
    return `No listings match — try removing “${labels[0]}”.`;
  }
  return `No listings match — try removing “${labels[0]}” or clear all filters.`;
}

function merchantSubcategoryLabel(category?: string) {
  if (!category?.trim()) return null;
  const parts = category.split('›').map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  return parts[parts.length - 1] || null;
}

function MerchantPortraitCard({
  biz,
  distanceLabel,
  showTrending,
}: {
  biz: MerchantCard;
  distanceLabel: string | null;
  showTrending: boolean;
}) {
  const openStatus = getBusinessOpenStatus(biz.timings);
  const verified = Boolean(biz.isFinderBVerified || biz.hasVerifiedBadge);
  const isOpen = openStatus.status === 'Open';
  const hoursLabel = (() => {
    if (isOpen) {
      const openTillMatch = openStatus.label.match(/Open till\s+.+/i);
      return openTillMatch ? openTillMatch[0] : null;
    }
    if (openStatus.label === 'Hours not listed' || openStatus.label === 'Closed now') {
      return null;
    }
    const opensMatch = openStatus.label.match(/opens\s+(.+)$/i);
    return opensMatch ? `Opens ${opensMatch[1]}` : null;
  })();
  const ratingValue = merchantRating(biz);
  const hasOffer = Boolean(biz.discountRange?.trim());
  const isNewListing = (biz.reviewsCount ?? 0) === 0;
  const aboutText = (biz.description || biz.about || '').trim();
  const subcategoryLabel = merchantSubcategoryLabel(biz.category);
  const placeLabel = formatLocalityCityLabel(biz);
  const phone = (biz.publicPhone || biz.contact || '').trim();
  const callHref = phone ? phoneHref(phone) : undefined;
  const mapsHref = directionsHref({
    latitude: biz.latitude,
    longitude: biz.longitude,
    location: biz.location,
    address: biz.businessAddress,
  });
  const profileHref = getBusinessProfilePath(biz);

  return (
    <div className="group relative flex w-[184px] shrink-0 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_-12px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/70 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_36px_-18px_rgba(33,84,129,0.35)] hover:ring-primary/25 sm:w-[208px]">
      <Link href={profileHref} className="absolute inset-0 z-0" aria-label={biz.name} />

      <div className="pointer-events-none relative h-[160px] w-full overflow-hidden bg-slate-100 sm:h-[180px]">
        <Image
          src={getBusinessListingImage(biz) || '/fallback.jpg'}
          alt={biz.name}
          fill
          className="object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-[1.05]"
          sizes="208px"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-70" />

        {showTrending ? (
          <div className="pointer-events-none absolute bottom-2 right-2 z-[1] inline-flex items-center gap-0.5 text-[10px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]">
            <span className="animate-fire-flicker text-[11px] leading-none" aria-hidden>
              🔥
            </span>
            Trending
          </div>
        ) : null}

        {(callHref || mapsHref) && (
          <div className="pointer-events-auto absolute inset-x-0 top-1/2 z-[2] hidden -translate-y-1/2 items-center justify-center gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:flex">
            {callHref ? (
              <a
                href={callHref}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80 backdrop-blur hover:text-primary"
              >
                <Phone size={11} />
                Call
              </a>
            ) : null}
            {mapsHref ? (
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80 backdrop-blur hover:text-primary"
              >
                <Navigation size={11} />
                Directions
              </a>
            ) : null}
          </div>
        )}
      </div>

      <div className="relative z-[1] pointer-events-none flex flex-1 flex-col px-2.5 pb-2 pt-2">
        <div className="flex items-start gap-1.5">
          <p className="min-h-[30px] min-w-0 flex-1 font-sans text-[13px] font-semibold leading-snug tracking-[-0.01em] text-slate-900">
            <VerifiedBusinessName
              name={biz.name}
              verified={verified}
              tickSize={12}
              className="line-clamp-2 transition-colors group-hover:text-primary"
              tickClassName="ml-0.5 inline-flex align-middle -translate-y-px"
            />
          </p>
          {isNewListing ? (
            <span
              className="mt-0.5 shrink-0 font-heading text-[11px] font-semibold italic tracking-wide text-secondary-600"
              title="New on FinderB — no reviews yet"
            >
              New
            </span>
          ) : null}
        </div>

        {subcategoryLabel ? (
          <p className="mt-0.5 truncate text-[10px] font-medium text-slate-400">
            {subcategoryLabel}
          </p>
        ) : null}

        <div className="mt-1.5 flex min-h-[16px] items-center gap-2">
          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums text-slate-800">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            {ratingValue.toFixed(1)}
            {(biz.reviewsCount ?? 0) > 0 ? (
              <span className="font-medium text-slate-400">({biz.reviewsCount})</span>
            ) : null}
          </span>

          {hoursLabel ? (
            <>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span
                className={`truncate text-[10px] font-semibold ${
                  isOpen ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {hoursLabel}
              </span>
            </>
          ) : null}
        </div>

        <p className="mt-1.5 min-h-[28px] line-clamp-2 text-[10px] leading-snug text-slate-500">
          {aboutText || null}
        </p>

        <p className="mt-1.5 flex min-h-[28px] items-start gap-1 border-t border-slate-100 pt-1.5 text-[10px] leading-snug text-slate-500">
          <MapPin size={11} className="mt-px shrink-0 text-slate-400" />
          <span className="line-clamp-2">
            {distanceLabel ? (
              <>
                <span className="font-semibold text-primary">{distanceLabel}</span>
                {placeLabel ? <span className="text-slate-300"> · </span> : null}
              </>
            ) : null}
            {placeLabel || 'Nearby'}
          </span>
        </p>

        {biz.hasActiveJobs ? (
          <div className="pointer-events-none mt-1.5 flex min-w-0 items-center justify-end">
            <MerchantJobBadge compact className="shrink-0" />
          </div>
        ) : null}

        {hasOffer ? (
          <div className="mt-auto flex justify-start pt-2">
            <MerchantOfferBadge discountRange={biz.discountRange} compact />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MerchantCardSkeleton() {
  return (
    <div className="flex h-[336px] w-[184px] shrink-0 flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/70 sm:h-[356px] sm:w-[208px]">
      <div className="h-[160px] shrink-0 animate-pulse bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 sm:h-[180px]" />
      <div className="flex flex-1 flex-col gap-2 px-2.5 py-2">
        <div className="h-3.5 w-[90%] animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-[55%] animate-pulse rounded bg-slate-100" />
        <div className="mt-0.5 h-2.5 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-2.5 w-[80%] animate-pulse rounded bg-slate-100" />
        <div className="mt-auto h-2.5 w-full animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}

export default function FeaturedCategoryGroup({
  id,
  title,
  slug = null,
  subcategories,
  tone = 'light',
}: FeaturedCategoryGroupProps) {
  const userCoords = useUserCoords();
  const sectionRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollTabsLeft, setCanScrollTabsLeft] = useState(false);
  const [canScrollTabsRight, setCanScrollTabsRight] = useState(false);
  const [selectedId, setSelectedId] = useState(
    () => pickDefaultSubcategory(subcategories)?.id ?? ''
  );
  const [subReady, setSubReady] = useState(false);
  const [merchants, setMerchants] = useState<MerchantCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<MerchantFilterId[]>([]);

  const subIdsKey = subcategories.map((sub) => sub.id).join(',');

  const selected =
    subcategories.find((sub) => sub.id === selectedId) ??
    pickDefaultSubcategory(subcategories);

  const viewAllHref = selected
    ? selected.href ||
      (selected.id?.startsWith('all:')
        ? categoryBrowseHref({ slug, name: title })
        : categoryBrowseHref({ slug, name: title }, selected))
    : categoryBrowseHref({ slug, name: title });

  const visibleMerchants = useMemo(
    () =>
      applyMerchantFilters(
        merchants,
        activeFilters,
        userCoords,
        `${id}:${selected?.id || selectedId || 'all'}`
      ),
    [merchants, activeFilters, userCoords, id, selected?.id, selectedId]
  );

  const trendingIds = useMemo(() => {
    const ranked = [...visibleMerchants].sort(
      (a, b) => trendingScore(b) - trendingScore(a)
    );
    return new Set(
      ranked.slice(0, Math.min(TRENDING_COUNT, ranked.length)).map((biz) => biz.id)
    );
  }, [visibleMerchants]);

  const filterTip = emptyFilterTip(activeFilters);

  const selectSubcategory = (subId: string) => {
    setSelectedId(subId);
    writeStoredSubcategoryId(id, subId);
    requestAnimationFrame(() => {
      const tab = tabsRef.current?.querySelector<HTMLElement>(
        `[data-sub-id="${subId}"]`
      );
      tab?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
  };

  const toggleFilter = (filterId: MerchantFilterId) => {
    setActiveFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((fid) => fid !== filterId)
        : [...prev, filterId]
    );
  };

  const removeFilter = (filterId: MerchantFilterId) => {
    setActiveFilters((prev) => prev.filter((fid) => fid !== filterId));
  };

  // Always open on "All" for each category section.
  useEffect(() => {
    const fallback = pickDefaultSubcategory(subcategories)?.id ?? '';
    setSelectedId(fallback);
    setSubReady(true);
    if (fallback) writeStoredSubcategoryId(id, fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- subIdsKey tracks list identity
  }, [id, subIdsKey]);

  // If selected id disappeared from the list, fall back and persist.
  useEffect(() => {
    if (!subReady || !selectedId) return;
    if (!subcategories.some((sub) => sub.id === selectedId)) {
      const fallback = pickDefaultSubcategory(subcategories)?.id ?? '';
      setSelectedId(fallback);
      if (fallback) writeStoredSubcategoryId(id, fallback);
    }
  }, [subReady, selectedId, subIdsKey, id, subcategories]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '280px 0px', threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || !subReady || !selected) return;

    let cancelled = false;
    const query = selected.queryName || selected.slug || selected.name;

    async function load() {
      setLoading(true);
      setMerchants([]);
      setActiveFilters([]);
      const result = await getBusinessesByCategory(query, {
        page: 1,
        pageSize: HOME_MERCHANT_PAGE_SIZE,
      });
      if (cancelled) return;

      if (result.success && result.businesses) {
        setMerchants(result.businesses as MerchantCard[]);
      } else {
        setMerchants([]);
      }
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [inView, subReady, selected?.id, selected?.slug, selected?.name, selected?.queryName]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      setCanScrollLeft(el.scrollLeft > 2);
      setCanScrollRight(el.scrollLeft < maxScroll - 2);
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);

    return () => {
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [visibleMerchants, loading, selectedId, activeFilters]);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;

    const update = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      setCanScrollTabsLeft(el.scrollLeft > 2);
      setCanScrollTabsRight(maxScroll > 2 && el.scrollLeft < maxScroll - 2);
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    const raf = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [subcategories]);

  const scrollByCards = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === 'left' ? -360 : 360,
      behavior: 'smooth',
    });
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    const el = tabsRef.current;
    if (!el) return;
    const step = Math.max(el.clientWidth * 0.6, 140);
    el.scrollBy({
      left: direction === 'left' ? -step : step,
      behavior: 'smooth',
    });
  };

  if (!selected) return null;

  const isMuted = tone === 'muted';
  const showMerchantSkeleton = !inView || !subReady || loading;

  return (
    <article
      ref={sectionRef}
      className={`w-full px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 ${
        isMuted ? 'bg-slate-100/70' : 'bg-white'
      }`}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h3 className="min-w-0 truncate font-heading text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {title}
          </h3>
          <Link
            href={viewAllHref}
            className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-600"
          >
            View all
            <ArrowRight
              size={14}
              className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        <div className="relative">
          <div className="flex items-center gap-1 sm:gap-1.5">
            {canScrollTabsLeft ? (
              <button
                type="button"
                onClick={() => scrollTabs('left')}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-primary/30 hover:text-primary"
                aria-label="Scroll subcategories left"
              >
                <ChevronLeft size={16} strokeWidth={2} />
              </button>
            ) : null}

            <div
              ref={tabsRef}
              className="scrollbar-hide min-w-0 flex-1 overflow-x-auto"
              role="tablist"
              aria-label={`${title} subcategories`}
            >
              <div className="flex gap-1.5 pb-0.5 pt-0.5 sm:gap-2">
                {subcategories.map((sub) => {
                  const isActive = sub.id === selected.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      role="tab"
                      data-sub-id={sub.id}
                      aria-selected={isActive}
                      onClick={() => selectSubcategory(sub.id)}
                      className="group/tab relative flex w-[4rem] shrink-0 flex-col items-center gap-1 px-0.5 py-1 text-center transition-colors duration-200 sm:w-[4.35rem]"
                    >
                      <CategoryIcon
                        icon={sub.icon}
                        name={sub.name}
                        size={24}
                        className={`h-6 w-6 transition-colors duration-200 sm:h-[26px] sm:w-[26px] ${
                          isActive
                            ? 'text-primary'
                            : 'text-slate-500 group-hover/tab:text-primary'
                        }`}
                        imageClassName="object-contain"
                      />
                      <span
                        className={`line-clamp-2 w-full text-[9px] font-semibold leading-tight transition-colors duration-200 sm:text-[10px] ${
                          isActive
                            ? 'text-primary'
                            : 'text-slate-500 group-hover/tab:text-slate-700'
                        }`}
                      >
                        {sub.name}
                      </span>
                      <span
                        className={`mt-0.5 h-0.5 w-4 rounded-full transition-colors duration-200 ${
                          isActive ? 'bg-primary' : 'bg-transparent'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {canScrollTabsRight ? (
              <button
                type="button"
                onClick={() => scrollTabs('right')}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-primary/30 hover:text-primary"
                aria-label="Scroll subcategories right"
              >
                <ChevronRight size={16} strokeWidth={2} />
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-1 flex items-center gap-2 border-t border-slate-200/70 pt-1.5">
          <span className="shrink-0 text-[10px] font-semibold text-slate-500">
            Filters
          </span>
          <div
            className="scrollbar-hide flex min-w-0 flex-1 gap-1 overflow-x-auto"
            role="group"
            aria-label="Listing filters"
          >
            {MERCHANT_FILTERS.map((filter) => {
              const isActive = activeFilters.includes(filter.id);
              const Icon = filter.icon;
              const nearestDisabled = filter.id === 'nearest' && !userCoords;
              return (
                <button
                  key={filter.id}
                  type="button"
                  disabled={nearestDisabled}
                  aria-pressed={isActive}
                  title={
                    nearestDisabled
                      ? 'Allow location to sort by nearest'
                      : filter.label
                  }
                  onClick={() => toggleFilter(filter.id)}
                  className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
                    isActive
                      ? 'border-primary bg-primary text-white'
                      : 'border-slate-200 bg-transparent text-slate-600 hover:border-primary/40 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <Icon
                    size={11}
                    strokeWidth={2}
                    className={isActive ? 'text-white' : 'text-slate-400'}
                  />
                  {filter.label}
                </button>
              );
            })}
          </div>

          {activeFilters.length > 0 ? (
            <button
              type="button"
              onClick={() => setActiveFilters([])}
              className="shrink-0 whitespace-nowrap text-[10px] font-semibold text-primary hover:underline"
              title="Clear all filters"
            >
              {activeFilters.length} selected
            </button>
          ) : null}
        </div>

        <div role="tabpanel" aria-label={selected.name} className="relative mt-3">
          {canScrollLeft ? (
            <div
              className={`pointer-events-none absolute inset-y-0 left-0 z-[1] w-4 sm:w-5 ${
                isMuted
                  ? 'bg-gradient-to-r from-slate-100/35 via-slate-100/10 to-transparent'
                  : 'bg-gradient-to-r from-white/40 via-white/10 to-transparent'
              }`}
              aria-hidden
            />
          ) : null}
          {canScrollRight ? (
            <div
              className={`pointer-events-none absolute inset-y-0 right-0 z-[1] w-4 sm:w-5 ${
                isMuted
                  ? 'bg-gradient-to-l from-slate-100/35 via-slate-100/10 to-transparent'
                  : 'bg-gradient-to-l from-white/40 via-white/10 to-transparent'
              }`}
              aria-hidden
            />
          ) : null}

          {canScrollLeft ? (
            <button
              type="button"
              onClick={() => scrollByCards('left')}
              className="absolute left-0 top-[42%] z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/80 bg-white/95 text-slate-600 shadow-[0_4px_16px_rgba(15,23,42,0.12)] backdrop-blur transition hover:border-primary/25 hover:text-primary sm:flex"
              aria-label="Scroll merchants left"
            >
              <ChevronLeft size={16} />
            </button>
          ) : null}
          {canScrollRight ? (
            <button
              type="button"
              onClick={() => scrollByCards('right')}
              className="absolute right-0 top-[42%] z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/80 bg-white/95 text-slate-600 shadow-[0_4px_16px_rgba(15,23,42,0.12)] backdrop-blur transition hover:border-primary/25 hover:text-primary sm:flex"
              aria-label="Scroll merchants right"
            >
              <ChevronRight size={16} />
            </button>
          ) : null}

          {showMerchantSkeleton ? (
            <div className="scrollbar-hide flex gap-3.5 overflow-hidden sm:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <MerchantCardSkeleton key={i} />
              ))}
            </div>
          ) : visibleMerchants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm ring-1 ring-slate-100">
                <MapPin size={18} />
              </div>
              <p className="text-sm font-semibold text-slate-600">
                {merchants.length === 0
                  ? `No listings in ${selected.name} yet`
                  : 'No listings match these filters'}
              </p>
              <p className="mt-1 max-w-sm text-xs text-slate-400">
                {merchants.length === 0
                  ? 'Check back soon or browse more listings.'
                  : filterTip}
              </p>
              {merchants.length > 0 && activeFilters.length > 0 ? (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  {activeFilters.map((fid) => {
                    const label =
                      MERCHANT_FILTERS.find((f) => f.id === fid)?.label ?? fid;
                    return (
                      <button
                        key={fid}
                        type="button"
                        onClick={() => removeFilter(fid)}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-primary/30 hover:text-primary"
                      >
                        Remove {label}
                        <X size={11} />
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setActiveFilters([])}
                    className="inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-primary-600"
                  >
                    Clear all
                  </button>
                </div>
              ) : (
                <Link
                  href={viewAllHref}
                  className="mt-4 inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-primary-600"
                >
                  Browse all
                  <ArrowRight size={12} />
                </Link>
              )}
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="scrollbar-hide flex gap-3.5 overflow-x-auto scroll-smooth pb-1 pt-1 sm:gap-4"
            >
              {visibleMerchants.map((biz, index) => (
                <div
                  key={biz.id}
                  className="animate-app-reveal-up opacity-0"
                  style={{ animationDelay: `${Math.min(index, 7) * 40}ms` }}
                >
                  <MerchantPortraitCard
                    biz={biz}
                    showTrending={trendingIds.has(biz.id)}
                    distanceLabel={formatDistanceFromUser(
                      userCoords,
                      biz.latitude,
                      biz.longitude
                    )}
                  />
                </div>
              ))}

              <Link
                href={viewAllHref}
                className="group flex h-[336px] w-[148px] shrink-0 flex-col items-center justify-center gap-2.5 rounded-2xl border border-dashed border-slate-200/90 bg-white/60 text-center transition-all duration-300 hover:border-primary/35 hover:bg-white sm:h-[356px] sm:w-[160px]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary shadow-[0_4px_12px_rgba(33,84,129,0.12)] ring-1 ring-slate-200/80 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:ring-primary/30">
                  <ArrowRight size={16} />
                </span>
                <span className="px-2.5 text-[11px] font-semibold leading-snug text-slate-500 transition-colors group-hover:text-primary">
                  See all
                  <span className="mt-0.5 block font-medium text-slate-400 group-hover:text-primary/70">
                    {selected.name}
                  </span>
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
