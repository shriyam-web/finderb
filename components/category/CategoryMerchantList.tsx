'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Loader2, MapPin, Phone } from 'lucide-react';
import { getBusinessesByCategory } from '@/app/actions/business';
import { getSession } from '@/app/actions/user';
import { CATEGORY_LISTINGS_PAGE_SIZE } from '@/lib/categoryListings';
import { setLastSearchQuery } from '@/lib/lastSearchQuery';
import { getBusinessProfilePath } from '@/lib/businessSlug';
import { getBusinessListingImage } from '@/lib/businessMapping';
import { getBusinessOpenStatus } from '@/lib/businessHours';
import { formatDistanceFromUser } from '@/lib/geo';
import { useUserCoords } from '@/hooks/useUserCoords';
import MerchantListingRating from '@/components/business/MerchantListingRating';
import MerchantOfferBadge from '@/components/business/MerchantOfferBadge';
import MerchantJobBadge from '@/components/business/MerchantJobBadge';
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
  onStatsChange?: (stats: { shown: number; total: number; loading: boolean }) => void;
};

function categoryLabel(category?: string) {
  if (!category?.trim()) return 'Business';
  const parts = category.split('›').map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1] || category;
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
  const about = biz.description?.trim();
  const hoursLabel =
    openStatus.label && openStatus.label !== 'Hours not listed' ? openStatus.label : null;

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
      className="group flex h-full w-full cursor-pointer items-stretch gap-3 rounded-xl border border-slate-200/80 bg-white p-2.5 text-left transition-colors hover:border-[#215481]/25 hover:bg-slate-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215481]/30 sm:gap-3 sm:p-3"
    >
      <div className="relative h-[100px] w-[100px] shrink-0 self-center overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200/70 sm:h-[112px] sm:w-[112px]">
        <Image
          src={getBusinessListingImage(biz) || '/fallback.jpg'}
          alt={biz.name}
          fill
          className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="112px"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-0.5">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-medium text-[#215481]">
              {categoryLabel(biz.category)}
            </p>
            <h3 className="mt-0.5 text-[13px] font-semibold leading-snug text-slate-900 sm:text-sm">
              <VerifiedBusinessName
                name={biz.name}
                verified={verified}
                tickSize={13}
                className="break-words"
              />
            </h3>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 empty:hidden">
            <MerchantOfferBadge discountRange={biz.discountRange} compact />
            {biz.hasActiveJobs ? <MerchantJobBadge compact /> : null}
          </div>
        </div>

        <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
          {hoursLabel ? (
            <span
              className={`text-[11px] font-semibold ${
                openStatus.status === 'Open' ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {hoursLabel}
            </span>
          ) : null}
          <MerchantListingRating
            rating={biz.rating}
            reviewCount={biz.reviewsCount}
            starSize={10}
            textClassName="text-[11px] font-medium text-[#475569]"
            emptyClassName="text-[11px] text-[#94a3b8]"
          />
        </div>

        {biz.location || distanceLabel ? (
          <p className="flex min-w-0 items-start gap-1 text-[11px] leading-snug text-slate-500">
            <MapPin size={11} className="mt-0.5 shrink-0 text-slate-400" />
            <span className="line-clamp-1">
              {distanceLabel ? (
                <>
                  <span className="font-semibold text-[#2563eb]">{distanceLabel}</span>
                  {biz.location ? <span className="text-slate-300"> · </span> : null}
                </>
              ) : null}
              {biz.location}
            </span>
          </p>
        ) : null}

        {hasPhone ? (
          <p className="flex min-w-0 items-center gap-1 text-[11px] text-slate-500">
            <Phone size={11} className="shrink-0 text-slate-400" />
            {showPhone ? (
              <span className="truncate">{phone}</span>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onLogin();
                }}
                className="font-medium text-[#2563eb] underline-offset-2 hover:underline"
              >
                Login to view
              </button>
            )}
          </p>
        ) : null}

        {about ? (
          <p className="line-clamp-1 text-[11px] leading-snug text-slate-400">{about}</p>
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
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const hasMore = showLoadMore && businesses.length < total;

  const visibleBusinesses = searchQuery.trim()
    ? businesses.filter((biz) =>
        biz.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : businesses;

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
    return (
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[136px] animate-pulse rounded-xl bg-white" />
        ))}
      </div>
    );
  }

  if (visibleBusinesses.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-slate-400 sm:py-16">
        <p className="text-sm font-medium text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 xl:gap-2.5">
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
        <div ref={sentinelRef} className="col-span-full flex flex-col items-center gap-2 py-3">
          {loadingMore ? (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              Loading more…
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void loadMore()}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-[#215481]/30 hover:text-[#215481]"
            >
              Load more
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
