'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronRight, Loader2 } from 'lucide-react';
import { getBusinessesByCategory } from '@/app/actions/business';
import { CATEGORY_LISTINGS_PAGE_SIZE } from '@/lib/categoryListings';
import { setLastSearchQuery } from '@/lib/lastSearchQuery';

type MerchantListing = {
  id: string;
  name: string;
  category?: string;
  location?: string;
  image?: string;
  profilePictureUrl?: string;
};

type CategoryMerchantListProps = {
  categorySlug: string;
  searchQuery?: string;
  pageSize?: number;
};

function MerchantRow({ biz, onNavigate }: { biz: MerchantListing; onNavigate: () => void }) {
  return (
    <button
      type="button"
      onClick={onNavigate}
      className="group flex w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white text-left transition-colors hover:border-[#215481]/25 hover:bg-slate-50/50"
    >
      <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden sm:h-24 sm:w-24">
        <Image
          src={
            biz.image ||
            biz.profilePictureUrl ||
            'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=400'
          }
          alt={biz.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3.5 py-3 sm:px-4">
        <span className="text-[10px] font-medium text-[#215481]">{biz.category || 'Business'}</span>
        <h3 className="truncate text-sm font-semibold text-slate-900">{biz.name}</h3>
        {biz.location ? <p className="truncate text-xs text-slate-500">{biz.location}</p> : null}
      </div>
      <div className="hidden shrink-0 items-center pr-4 sm:flex">
        <ChevronRight size={16} className="text-slate-300 transition-colors group-hover:text-[#215481]" />
      </div>
    </button>
  );
}

export default function CategoryMerchantList({
  categorySlug,
  searchQuery = '',
  pageSize = CATEGORY_LISTINGS_PAGE_SIZE,
}: CategoryMerchantListProps) {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<MerchantListing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const hasMore = businesses.length < total;

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

  const visibleBusinesses = searchQuery.trim()
    ? businesses.filter((biz) =>
        biz.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : businesses;

  const openBusiness = (biz: MerchantListing) => {
    if (searchQuery.trim()) setLastSearchQuery(searchQuery);
    router.push(`/business/${biz.id}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-2.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-white" />
        ))}
      </div>
    );
  }

  if (visibleBusinesses.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-slate-400">
        <p className="text-sm font-medium text-slate-500">No businesses found in this category yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="px-1 text-xs text-slate-500">
        Showing {visibleBusinesses.length}
        {searchQuery.trim() ? ` matching "${searchQuery.trim()}"` : ''} of {total} listings
      </p>

      <div className="flex flex-col gap-2.5">
        {visibleBusinesses.map((biz) => (
          <MerchantRow key={biz.id} biz={biz} onNavigate={() => openBusiness(biz)} />
        ))}
      </div>

      {hasMore && !searchQuery.trim() ? (
        <div ref={sentinelRef} className="flex flex-col items-center gap-2 py-4">
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
