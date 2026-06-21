'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getBusinessesByCategory } from '@/app/actions/business';
import BusinessCard from '@/components/BusinessCard';
import { CATEGORY_LISTINGS_PAGE_SIZE } from '@/lib/categoryListings';
import type { Business } from '@/lib/mockData';

type CategoryBusinessListProps = {
  categorySlug: string;
  initialBusinesses: Business[];
  initialTotal: number;
  pageSize?: number;
};

export default function CategoryBusinessList({
  categorySlug,
  initialBusinesses,
  initialTotal,
  pageSize = CATEGORY_LISTINGS_PAGE_SIZE,
}: CategoryBusinessListProps) {
  const [businesses, setBusinesses] = useState(initialBusinesses);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const hasMore = businesses.length < total;

  useEffect(() => {
    setBusinesses(initialBusinesses);
    setTotal(initialTotal);
    setPage(1);
  }, [categorySlug, initialBusinesses, initialTotal]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    const nextPage = page + 1;

    try {
      const result = await getBusinessesByCategory(categorySlug, {
        page: nextPage,
        pageSize,
      });

      if (result.success && result.businesses) {
        setBusinesses((prev) => {
          const seen = new Set(prev.map((biz) => biz.id));
          const next = result.businesses!.filter((biz) => !seen.has(biz.id));
          return [...prev, ...next];
        });
        setTotal(result.total ?? total);
        setPage(nextPage);
      }
    } finally {
      setLoading(false);
    }
  }, [categorySlug, hasMore, loading, page, pageSize, total]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

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
  }, [hasMore, loadMore]);

  if (businesses.length === 0) {
    return (
      <div className="col-span-full py-20 text-center bg-white border border-dashed border-gray-200">
        <p className="text-gray-500 font-bold">No businesses found in this category yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {businesses.map((biz) => (
          <BusinessCard key={biz.id} business={biz} />
        ))}
      </div>

      {hasMore ? (
        <div ref={sentinelRef} className="mt-10 flex flex-col items-center gap-3 py-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <Loader2 size={18} className="animate-spin" />
              Loading more listings…
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void loadMore()}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-600"
            >
              Load more
            </button>
          )}
          <p className="text-xs text-gray-400">
            Showing {businesses.length} of {total}
          </p>
        </div>
      ) : total > pageSize ? (
        <p className="mt-8 text-center text-xs text-gray-400">
          All {total} listings loaded
        </p>
      ) : null}
    </>
  );
}
