'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getBusinessSession } from '@/app/actions/business';
import { getSession } from '@/app/actions/user';
import BusinessProfileReviewItem from '@/components/business/BusinessProfileReviewItem';
import { PUBLIC_REVIEW_PAGE, reviewsNewestFirst, type BusinessReview } from '@/lib/businessReviews';

export default function BusinessReviewsList({
  reviews,
  businessId,
  businessName,
  profilePath,
  defaultReply,
}: {
  reviews: BusinessReview[];
  businessId: string;
  businessName: string;
  profilePath: string;
  defaultReply?: string | null;
}) {
  const sorted = useMemo(() => reviewsNewestFirst(reviews), [reviews]);
  const [shown, setShown] = useState(PUBLIC_REVIEW_PAGE);
  const [contactRevealed, setContactRevealed] = useState(false);
  const visible = sorted.slice(0, shown);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getSession(), getBusinessSession()]).then(([userSession, businessSession]) => {
      if (cancelled) return;
      setContactRevealed(Boolean(userSession?.user || businessSession?.business));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <Link href={profilePath} className="text-sm font-semibold text-stone-600 hover:text-stone-900">
        Back to {businessName}
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-stone-900">Reviews</h1>
      <p className="mt-1 text-sm text-stone-500">
        {sorted.length} {sorted.length === 1 ? 'review' : 'reviews'} for {businessName}
      </p>
      <div className="mt-5 space-y-2.5">
        {visible.map((review) => (
          <BusinessProfileReviewItem
            key={review.id}
            review={review}
            businessId={businessId}
            businessName={businessName}
            contactRevealed={contactRevealed}
            profileRedirectPath={profilePath}
            defaultReply={defaultReply}
          />
        ))}
      </div>
      {shown < sorted.length ? (
        <button
          type="button"
          onClick={() => setShown((count) => count + PUBLIC_REVIEW_PAGE)}
          className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50"
        >
          Load more
        </button>
      ) : null}
    </div>
  );
}
