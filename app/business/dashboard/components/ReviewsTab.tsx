'use client';

import { useMemo, useState } from 'react';
import { HiOutlineStar } from 'react-icons/hi2';
import { upsertMerchantReviewReply } from '@/app/actions/reviews';
import {
  parseBusinessReviews,
  REVIEW_REPLY_MAX_LENGTH,
  REVIEW_REPLY_MIN_LENGTH,
  type BusinessReview,
} from '@/lib/businessReviews';
import { DashboardPanel, DashboardSectionHeader } from './DashboardShell';

type ReviewsTabProps = {
  businessId: string;
  reviewData: unknown;
  onReviewsChange: (reviews: BusinessReview[]) => void;
};

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <HiOutlineStar
          key={index}
          size={14}
          className={index < rating ? 'text-amber-500' : 'text-zinc-200'}
        />
      ))}
    </div>
  );
}

function ReviewReplyEditor({
  review,
  businessId,
  onSaved,
}: {
  review: BusinessReview;
  businessId: string;
  onSaved: (reviews: BusinessReview[]) => void;
}) {
  const existingReply = review.merchantReply?.content ?? '';
  const [draft, setDraft] = useState(existingReply);
  const [editing, setEditing] = useState(!existingReply);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const result = await upsertMerchantReviewReply({
      businessId,
      reviewId: review.id,
      content: draft,
    });
    setSaving(false);

    if (!result.success) {
      setError(result.error || 'Failed to save reply');
      return;
    }

    onSaved(result.reviews);
    setEditing(false);
  };

  if (!editing && existingReply) {
    return (
      <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-zinc-500">Your reply</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-700">{existingReply}</p>
            {review.merchantReply?.date && (
              <p className="mt-1 text-[11px] text-zinc-400">
                {new Date(review.merchantReply.date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setDraft(existingReply);
              setEditing(true);
            }}
            className="shrink-0 text-xs font-medium text-zinc-700 hover:text-zinc-900"
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-md border border-zinc-200 bg-white p-3">
      <label className="text-xs font-medium text-zinc-600">
        {existingReply ? 'Edit your reply' : 'Reply to this review'}
      </label>
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        rows={3}
        maxLength={REVIEW_REPLY_MAX_LENGTH}
        placeholder={`Write a thoughtful reply (${REVIEW_REPLY_MIN_LENGTH}–${REVIEW_REPLY_MAX_LENGTH} characters)…`}
        className="mt-2 w-full resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-zinc-300"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-zinc-400">
          {draft.trim().length}/{REVIEW_REPLY_MAX_LENGTH}
        </p>
        <div className="flex items-center gap-2">
          {existingReply && (
            <button
              type="button"
              onClick={() => {
                setDraft(existingReply);
                setEditing(false);
                setError(null);
              }}
              className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            disabled={saving || draft.trim().length < REVIEW_REPLY_MIN_LENGTH}
            onClick={() => void handleSave()}
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving…' : existingReply ? 'Update reply' : 'Post reply'}
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function ReviewsTab({ businessId, reviewData, onReviewsChange }: ReviewsTabProps) {
  const reviews = useMemo(() => parseBusinessReviews(reviewData), [reviewData]);
  const repliedCount = reviews.filter((review) => review.merchantReply?.content).length;
  const pendingReplyCount = reviews.length - repliedCount;

  return (
    <div className="space-y-5">
      <DashboardPanel>
        <DashboardSectionHeader
          title="Customer reviews"
          description="Reply to customer feedback from your dashboard."
        />
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md border border-[#d6dbe3] bg-gradient-to-br from-white to-[#f7f9fc] px-3 py-2.5">
            <p className="text-xs font-medium text-[#5b6678]">Total</p>
            <p className="mt-1 text-lg font-semibold text-[#1d2a3b]">{reviews.length}</p>
          </div>
          <div className="rounded-md border border-[#c8e2d2] bg-gradient-to-br from-[#f5fcf8] to-[#eef8f2] px-3 py-2.5">
            <p className="text-xs font-medium text-[#3f6a52]">Replied</p>
            <p className="mt-1 text-lg font-semibold text-[#1e5135]">{repliedCount}</p>
          </div>
          <div className="rounded-md border border-[#efd9a8] bg-gradient-to-br from-[#fffaf0] to-[#fff5dc] px-3 py-2.5">
            <p className="text-xs font-medium text-[#7a6131]">Awaiting reply</p>
            <p className="mt-1 text-lg font-semibold text-[#6a4a0d]">{pendingReplyCount}</p>
          </div>
        </div>
      </DashboardPanel>

      {reviews.length === 0 ? (
        <DashboardPanel>
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <HiOutlineStar size={28} className="text-zinc-300" />
            <p className="mt-3 text-sm font-medium text-zinc-700">No reviews yet</p>
            <p className="mt-1 max-w-sm text-xs text-zinc-500">
              When customers review your listing, they will appear here and you can reply from this tab.
            </p>
          </div>
        </DashboardPanel>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white divide-y divide-zinc-100">
          {reviews.map((review) => (
            <article key={review.id} className="p-4 md:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900">{review.author}</p>
                  {review.date && <p className="mt-0.5 text-xs text-zinc-400">{review.date}</p>}
                </div>
                <StarRow rating={review.rating} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{review.content}</p>
              <ReviewReplyEditor
                review={review}
                businessId={businessId}
                onSaved={onReviewsChange}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
