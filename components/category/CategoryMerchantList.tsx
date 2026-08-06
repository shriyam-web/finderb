'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Loader2, MapPin, Phone } from 'lucide-react';
import { getBusinessesByCategory } from '@/app/actions/business';
import { getSession } from '@/app/actions/user';
import { formatLocalityCityLabel } from '@/lib/businessAddress';
import { CATEGORY_LISTINGS_PAGE_SIZE } from '@/lib/categoryListings';
import { setLastSearchQuery } from '@/lib/lastSearchQuery';
import { getBusinessProfilePath } from '@/lib/businessSlug';
import { getBusinessOpenStatus } from '@/lib/businessHours';
import { formatDistanceFromUser, getDistanceKm } from '@/lib/geo';
import { useUserCoords } from '@/hooks/useUserCoords';
import MerchantListingRating from '@/components/business/MerchantListingRating';
import MerchantOfferBadge from '@/components/business/MerchantOfferBadge';
import CategoryListingsLoading from '@/components/category/CategoryListingsLoading';
import { VerifiedBusinessName } from '@/components/business/VerifiedMark';
import BusinessListingImage from '@/components/business/BusinessListingImage';

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
  /** When false, only page 1 is shown (no pagination controls). */
  showPagination?: boolean;
  emptyMessage?: string;
  activeFilters?: string[];
  sortOrder?: 'relevance' | 'asc' | 'desc';
  onStatsChange?: (stats: { shown: number; total: number; loading: boolean }) => void;
  /** Nested scroll container (categories main pane). Used to jump to top on page change. */
  scrollRootRef?: RefObject<HTMLElement | null>;
};

function buildPageNumbers(current: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, totalPages, current]);
  for (let i = current - 1; i <= current + 1; i += 1) {
    if (i >= 1 && i <= totalPages) pages.add(i);
  }
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
    pages.add(totalPages - 3);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  let prev = 0;
  for (const n of sorted) {
    if (prev && n - prev > 1) out.push('…');
    out.push(n);
    prev = n;
  }
  return out;
}

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
        <BusinessListingImage
          business={biz}
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
  showPagination = true,
  emptyMessage = 'No businesses found in this category yet.',
  activeFilters = [],
  sortOrder = 'relevance',
  onStatsChange,
  scrollRootRef,
}: CategoryMerchantListProps) {
  const router = useRouter();
  const userCoords = useUserCoords();
  const [businesses, setBusinesses] = useState<MerchantListing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [visibleSlug, setVisibleSlug] = useState(categorySlug);
  const requestIdRef = useRef(0);

  if (categorySlug !== visibleSlug) {
    setVisibleSlug(categorySlug);
    setLoading(true);
    setBusinesses([]);
    setTotal(0);
    setPage(1);
  }

  const preferNearest = activeFilters.includes('Nearest First');
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

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
      preferNearest,
      sortOrder,
    });
  }, [activeFilters, businesses, preferNearest, searchQuery, sortOrder, userCoords]);

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

  const scrollListToTop = useCallback(() => {
    const root = scrollRootRef?.current;
    if (root) {
      root.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [scrollRootRef]);

  const loadPage = useCallback(
    async (nextPage: number, opts?: { scroll?: boolean }) => {
      const requestId = ++requestIdRef.current;
      setLoading(true);

      const result = await getBusinessesByCategory(categorySlug, {
        page: nextPage,
        pageSize,
      });

      if (requestId !== requestIdRef.current) return;

      if (result.success && Array.isArray(result.businesses)) {
        const rows = result.businesses as MerchantListing[];
        setBusinesses(rows);
        setTotal(result.total ?? rows.length);
        setPage(nextPage);
      } else {
        setBusinesses([]);
        setTotal(0);
        setPage(1);
      }

      setLoading(false);
      if (opts?.scroll) scrollListToTop();
    },
    [categorySlug, pageSize, scrollListToTop]
  );

  useEffect(() => {
    void loadPage(1);
  }, [categorySlug, pageSize]); // eslint-disable-line react-hooks/exhaustive-deps -- reset to page 1 on category change

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page || loading) return;
    void loadPage(nextPage, { scroll: true });
  };

  const openBusiness = (biz: MerchantListing) => {
    if (searchQuery.trim()) setLastSearchQuery(searchQuery);
    router.push(getBusinessProfilePath(biz));
  };

  if (loading && businesses.length === 0) {
    return <CategoryListingsLoading columns={2} />;
  }

  if (!loading && visibleBusinesses.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl bg-white py-12 text-slate-400 ring-1 ring-slate-200/70">
        <p className="text-sm font-medium text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const pageNumbers = buildPageNumbers(page, totalPages);
  const showPager = showPagination && total > pageSize && !searchQuery.trim();

  return (
    <div className="space-y-3">
      <div
        className={`grid grid-cols-1 gap-2 lg:grid-cols-2 ${loading ? 'opacity-60' : ''}`}
        aria-busy={loading}
      >
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
      </div>

      {showPager ? (
        <div className="flex flex-col items-center gap-2 border-t border-slate-200/70 pt-3 pb-1">
          <p className="text-[11px] text-slate-400">
            {rangeStart}–{rangeEnd} of {total}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1 || loading}
              className="inline-flex h-8 items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} strokeWidth={2.25} />
              Prev
            </button>

            {pageNumbers.map((item, index) =>
              item === '…' ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-1 text-xs font-medium text-slate-400"
                  aria-hidden
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => goToPage(item)}
                  disabled={loading}
                  aria-current={item === page ? 'page' : undefined}
                  className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
                    item === page
                      ? 'bg-primary text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-primary/30 hover:text-primary'
                  }`}
                >
                  {item}
                </button>
              )
            )}

            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages || loading}
              className="inline-flex h-8 items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              Next
              <ChevronRight size={14} strokeWidth={2.25} />
            </button>
          </div>
          {loading ? (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <Loader2 size={12} className="animate-spin" />
              Loading…
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
