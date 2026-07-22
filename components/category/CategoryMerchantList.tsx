'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Loader2, MapPin, Phone } from 'lucide-react';
import { getBusinessesByCategory } from '@/app/actions/business';
import { getSession } from '@/app/actions/user';
import { formatLocalityCityLabel } from '@/lib/businessAddress';
import { CATEGORY_LISTINGS_PAGE_SIZE } from '@/lib/categoryListings';
import { setLastSearchQuery } from '@/lib/lastSearchQuery';
import { getBusinessProfilePath } from '@/lib/businessSlug';
import { getBusinessListingImage } from '@/lib/businessMapping';
import { getBusinessOpenStatus } from '@/lib/businessHours';
import { formatDistanceFromUser, getDistanceKm } from '@/lib/geo';
import { useUserCoords } from '@/hooks/useUserCoords';
import MerchantListingRating from '@/components/business/MerchantListingRating';
import MerchantOfferBadge from '@/components/business/MerchantOfferBadge';
import CategoryListingsLoading from '@/components/category/CategoryListingsLoading';
import { VerifiedBusinessName } from '@/components/business/VerifiedMark';

type MerchantListing = {
  id: string;
  slug?: string | null;
  name: string;
  businessName?: string;
  city?: string | null;
  state?: string | null;
  category?: string;
  location?: string;
  businessAddress?: string | null;
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
  description?: string;
  latitude?: number | null;
  longitude?: number | null;
};

type CategoryMerchantListProps = {
  categorySlug: string;
  searchQuery?: string;
  pageSize?: number;
  /** When false, only the first page is shown (no infinite scroll / load more). */
  showLoadMore?: boolean;
  emptyMessage?: string;
  activeFilters?: string[];
  sortOrder?: 'relevance' | 'asc' | 'desc';
  onStatsChange?: (stats: { shown: number; total: number; loading: boolean }) => void;
};

function subcategoryLabel(category?: string) {
  if (!category?.trim()) return null;
  const parts = category.split('›').map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  return parts[parts.length - 1] || null;
}

function merchantRatingValue(biz: MerchantListing) {
  return biz.rating != null && Number(biz.rating) > 0 ? Number(biz.rating) : 5;
}

function sortMerchantsForBrowse(
  merchants: MerchantListing[],
  userCoords: { lat: number; lng: number } | null,
  options?: { preferNearest?: boolean; sortOrder?: 'relevance' | 'asc' | 'desc' }
) {
  const preferNearest = Boolean(options?.preferNearest);
  const nameOrder = options?.sortOrder;

  return [...merchants].sort((a, b) => {
    if (nameOrder === 'asc' || nameOrder === 'desc') {
      const cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      if (cmp !== 0) return nameOrder === 'asc' ? cmp : -cmp;
      return 0;
    }

    const aOpen = getBusinessOpenStatus(a.timings).status === 'Open' ? 1 : 0;
    const bOpen = getBusinessOpenStatus(b.timings).status === 'Open' ? 1 : 0;
    const distA =
      userCoords && a.latitude != null && a.longitude != null
        ? getDistanceKm(userCoords.lat, userCoords.lng, a.latitude, a.longitude)
        : Number.POSITIVE_INFINITY;
    const distB =
      userCoords && b.latitude != null && b.longitude != null
        ? getDistanceKm(userCoords.lat, userCoords.lng, b.latitude, b.longitude)
        : Number.POSITIVE_INFINITY;

    if (preferNearest) {
      if (distA !== distB) return distA - distB;
      if (bOpen !== aOpen) return bOpen - aOpen;
    } else {
      if (bOpen !== aOpen) return bOpen - aOpen;
      if (distA !== distB) return distA - distB;
    }

    const ratingDiff = merchantRatingValue(b) - merchantRatingValue(a);
    if (ratingDiff !== 0) return ratingDiff;

    return (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0);
  });
}

function MerchantRow({
  biz,
  onNavigate,
  onLogin,
  showPhone,
  distanceLabel,
}: {
  biz: MerchantListing;
  onNavigate: () => void;
  onLogin: () => void;
  showPhone: boolean;
  distanceLabel: string | null;
}) {
  const openStatus = getBusinessOpenStatus(biz.timings);
  const hasPhone = Boolean((biz.publicPhone || biz.contact || '').trim());
  const phone = (biz.publicPhone || biz.contact || '').trim();
  const verified = Boolean(biz.isFinderBVerified || biz.hasVerifiedBadge);
  const hoursLabel = (() => {
    if (!openStatus.label || openStatus.label === 'Hours not listed') return null;
    if (openStatus.status === 'Open') {
      const till = openStatus.label.match(/Open till\s+(.+)$/i);
      return till ? `Open · ${till[1]}` : 'Open';
    }
    const opens = openStatus.label.match(/opens\s+(.+)$/i);
    return opens ? `Closed · ${opens[1]}` : 'Closed';
  })();
  const placeLabel = formatLocalityCityLabel(biz);
  const subLabel = subcategoryLabel(biz.category);
  const hasOffer = Boolean(biz.discountRange?.trim());
  const about = biz.description?.trim();
  const isNewListing = (biz.reviewsCount ?? 0) === 0;

  return (
    <div
      tabIndex={0}
      onClick={onNavigate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onNavigate();
        }
      }}
      className="group flex w-full cursor-pointer items-start gap-2.5 rounded-xl bg-white p-2 text-left ring-1 ring-slate-200/80 transition-colors active:bg-slate-50 sm:gap-3 sm:p-2.5"
    >
      <div className="relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-[104px] sm:w-[104px]">
        <Image
          src={getBusinessListingImage(biz) || '/fallback.jpg'}
          alt={biz.name}
          fill
          className="object-cover object-center"
          sizes="104px"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
        <div className="flex min-w-0 items-start gap-1.5">
          <h3 className="min-w-0 font-heading text-[13.5px] font-semibold leading-snug tracking-tight text-slate-900 sm:text-[14.5px]">
            <VerifiedBusinessName
              name={biz.name}
              verified={verified}
              tickSize={12}
              className="break-words"
            />
          </h3>
          {isNewListing ? (
            <span
              className="mt-0.5 shrink-0 font-heading text-[11px] font-semibold italic tracking-wide text-secondary-600"
              title="New on FinderB — no reviews yet"
            >
              New
            </span>
          ) : null}
        </div>
        {subLabel ? (
          <p className="mt-0.5 truncate font-sans text-[11px] font-normal tracking-normal text-slate-500">
            {subLabel}
          </p>
        ) : null}

        <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
          {hoursLabel ? (
            <span
              className={`text-[9px] font-medium leading-none ${
                openStatus.status === 'Open' ? 'text-emerald-600' : 'text-rose-500'
              }`}
            >
              {hoursLabel}
            </span>
          ) : null}
          <MerchantListingRating
            rating={biz.rating}
            reviewCount={biz.reviewsCount}
            defaultRating={5}
            starSize={10}
            textClassName="text-[11px] font-semibold text-slate-700"
            emptyClassName="text-[11px] text-slate-400"
          />
        </div>

        {placeLabel || distanceLabel ? (
          <p className="flex min-w-0 items-start gap-1 text-[11px] leading-snug text-slate-500">
            <MapPin size={11} className="mt-0.5 shrink-0 text-slate-400" />
            <span className="line-clamp-1">
              {distanceLabel ? (
                <>
                  <span className="font-semibold text-slate-700">{distanceLabel}</span>
                  {placeLabel ? <span className="text-slate-300"> · </span> : null}
                </>
              ) : null}
              {placeLabel}
            </span>
          </p>
        ) : null}

        {hasPhone ? (
          <p className="flex min-w-0 items-center gap-1 text-[11px] text-slate-500">
            <Phone size={11} className="shrink-0 text-slate-400" />
            {showPhone ? (
              <span className="truncate font-medium text-slate-600">{phone}</span>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onLogin();
                }}
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                Login to view
              </button>
            )}
          </p>
        ) : null}

        {about ? (
          <p className="line-clamp-2 text-[11px] leading-snug text-slate-400">{about}</p>
        ) : null}

        {hasOffer || biz.hasActiveJobs ? (
          <div className="flex items-center gap-1.5 pt-0.5">
            {hasOffer ? (
              <MerchantOfferBadge discountRange={biz.discountRange} compact />
            ) : null}
            {biz.hasActiveJobs ? (
              <span
                className="ml-auto inline-flex shrink-0 flex-col items-center justify-center rounded border border-dashed border-sky-400 bg-sky-50 px-1 py-0.5 text-center font-extrabold uppercase leading-none text-sky-600"
                title="This business is hiring"
                aria-label="Open jobs available"
              >
                <span className="text-[7px] tracking-[0.14em]">Open</span>
                <span className="text-[9px] tracking-[0.1em]">Jobs</span>
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function CategoryMerchantList({
  categorySlug,
  searchQuery = '',
  pageSize = CATEGORY_LISTINGS_PAGE_SIZE,
  showLoadMore = true,
  emptyMessage = 'No businesses found in this category yet.',
  activeFilters = [],
  sortOrder = 'relevance',
  onStatsChange,
}: CategoryMerchantListProps) {
  const router = useRouter();
  const userCoords = useUserCoords();
  const [businesses, setBusinesses] = useState<MerchantListing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [visibleSlug, setVisibleSlug] = useState(categorySlug);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  if (categorySlug !== visibleSlug) {
    setVisibleSlug(categorySlug);
    setLoading(true);
    setBusinesses([]);
    setTotal(0);
    setPage(0);
  }

  const hasMore = showLoadMore && businesses.length < total;

  const visibleBusinesses = useMemo(() => {
    let rows = searchQuery.trim()
      ? businesses.filter((biz) =>
          biz.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
        )
      : [...businesses];

    if (activeFilters.includes('Open Now')) {
      rows = rows.filter((biz) => getBusinessOpenStatus(biz.timings).status === 'Open');
    }
    if (activeFilters.includes('Top Rated')) {
      rows = rows.filter((biz) => merchantRatingValue(biz) >= 4.5);
    }
    if (activeFilters.includes('FinderB verified')) {
      rows = rows.filter((biz) => Boolean(biz.isFinderBVerified || biz.hasVerifiedBadge));
    }

    return sortMerchantsForBrowse(rows, userCoords, {
      preferNearest: activeFilters.includes('Nearest First'),
      sortOrder,
    });
  }, [activeFilters, businesses, searchQuery, sortOrder, userCoords]);

  const onStatsChangeRef = useRef(onStatsChange);
  onStatsChangeRef.current = onStatsChange;

  useEffect(() => {
    onStatsChangeRef.current?.({
      shown: visibleBusinesses.length,
      total,
      loading,
    });
  }, [visibleBusinesses.length, total, loading]);

  useEffect(() => {
    let cancelled = false;
    void getSession().then((result) => {
      if (!cancelled) setIsLoggedIn(!!result?.success);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchPage = useCallback(
    async (nextPage: number, append: boolean) => {
      const result = await getBusinessesByCategory(categorySlug, {
        page: nextPage,
        pageSize,
      });

      if (!result.success || !result.businesses) {
        if (!append) {
          setBusinesses([]);
          setTotal(0);
          setPage(0);
        }
        return;
      }

      const rows = result.businesses as MerchantListing[];
      const nextTotal = result.total ?? rows.length;

      setBusinesses((prev) => {
        if (!append) return rows;
        const seen = new Set(prev.map((biz) => biz.id));
        const next = rows.filter((biz) => !seen.has(biz.id));
        return [...prev, ...next];
      });
      setTotal(nextTotal);
      setPage(nextPage);
    },
    [categorySlug, pageSize]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      setLoading(true);
      setBusinesses([]);
      setTotal(0);
      setPage(0);

      const result = await getBusinessesByCategory(categorySlug, { page: 1, pageSize });
      if (cancelled) return;

      if (result.success && result.businesses) {
        const rows = result.businesses as MerchantListing[];
        setBusinesses(rows);
        setTotal(result.total ?? rows.length);
        setPage(1);
      } else {
        setBusinesses([]);
        setTotal(0);
        setPage(0);
      }

      setLoading(false);
    }

    void loadInitial();
    return () => {
      cancelled = true;
    };
  }, [categorySlug, pageSize]);

  const loadMore = useCallback(async () => {
    if (loadingMore || loading || !hasMore) return;

    setLoadingMore(true);
    try {
      await fetchPage(page + 1, true);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, loading, loadingMore, page]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: '240px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore, loading]);

  const openBusiness = (biz: MerchantListing) => {
    if (searchQuery.trim()) setLastSearchQuery(searchQuery);
    router.push(getBusinessProfilePath(biz));
  };

  if (loading) {
    return <CategoryListingsLoading columns={2} />;
  }

  if (visibleBusinesses.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl bg-white py-12 text-slate-400 ring-1 ring-slate-200/70">
        <p className="text-sm font-medium text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
      {visibleBusinesses.map((biz) => (
        <MerchantRow
          key={biz.id}
          biz={biz}
          showPhone={isLoggedIn}
          distanceLabel={formatDistanceFromUser(userCoords, biz.latitude, biz.longitude)}
          onNavigate={() => openBusiness(biz)}
          onLogin={() => router.push('/login')}
        />
      ))}

      {hasMore && !searchQuery.trim() ? (
        <div ref={sentinelRef} className="col-span-full flex flex-col items-center gap-2 py-2">
          {loadingMore ? (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              Loading more…
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void loadMore()}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-primary/30 hover:text-primary"
            >
              Load more
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
