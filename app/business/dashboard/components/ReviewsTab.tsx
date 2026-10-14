'use client';

import { useEffect, useMemo, useState } from 'react';
import { HiOutlineStar } from 'react-icons/hi2';
import { flagMerchantReview, getMerchantReviewFlagQuota, upsertMerchantReviewReply } from '@/app/actions/reviews';
import ReviewIdBadge from '@/components/reviews/ReviewIdBadge';
import {
  BUSINESS_REVIEW_FLAGS_PER_MONTH,
  isAnonymousPublic,
  parseBusinessReviews,
  publicReviewAuthor,
  REVIEW_REPLY_MAX_LENGTH,
  REVIEW_REPLY_MIN_LENGTH,
  visibleMerchantReviews,
  type BusinessReview,
} from '@/lib/businessReviews';
import { DashboardPanel, DashboardSectionHeader } from './DashboardShell';

const FLAG_REASONS = [
  'Offensive or abusive',
  'Untruthful or fake',
  'From a competitor',
  'Spam',
  'Other',
] as const;

type ReviewsTabProps = {
  businessId: string;
  reviewData: unknown;
  highlightReviewId?: string | null;
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

export default function ReviewsTab({ businessId, reviewData, highlightReviewId, onReviewsChange }: ReviewsTabProps) {
  const reviews = useMemo(
    () => visibleMerchantReviews(parseBusinessReviews(reviewData)),
    [reviewData]
  );
  const [flagTarget, setFlagTarget] = useState<BusinessReview | null>(null);
  const [flagReason, setFlagReason] = useState<string>(FLAG_REASONS[0]);
  const [flagDetails, setFlagDetails] = useState('');
  const [flagError, setFlagError] = useState<string | null>(null);
  const [flagging, setFlagging] = useState(false);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(() => new Set());
  const [flagsLeft, setFlagsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!highlightReviewId) return;
    document.getElementById(`review-${highlightReviewId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightReviewId, reviews.length]);

  useEffect(() => {
    let cancelled = false;
    void getMerchantReviewFlagQuota(businessId).then((result) => {
      if (!cancelled && result.success) setFlagsLeft(result.flagsRemaining);
    });
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const repliedCount = reviews.filter((review) => review.merchantReply?.content).length;
  const pendingReplyCount = reviews.length - repliedCount;

  const submitFlag = async () => {
    if (!flagTarget) return;
    const reason =
      flagReason === 'Other'
        ? flagDetails.trim()
        : flagDetails.trim()
          ? `${flagReason}: ${flagDetails.trim()}`
          : flagReason;
    if (reason.length < 8) {
      setFlagError('Please add a short reason before submitting.');
      return;
    }
    setFlagging(true);
    setFlagError(null);
    const result = await flagMerchantReview({
      businessId,
      reviewId: flagTarget.id,
      reason,
    });
    setFlagging(false);
    if (!result.success) {
      setFlagError(result.error);
      return;
    }
    setFlaggedIds((prev) => new Set(prev).add(flagTarget.id));
    if ('flagsRemaining' in result) setFlagsLeft(result.flagsRemaining);
    setFlagTarget(null);
    setFlagDetails('');
    setFlagReason(FLAG_REASONS[0]);
  };

  return (
    <div className="space-y-5">
      <DashboardPanel>
        <DashboardSectionHeader
          title="Customer reviews"
          description="Reply from here. Copy the review ID if FinderB support asks for it. Flag abusive reviews — 10 per month."
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
        {flagsLeft != null ? (
          <p className="mt-3 text-xs text-zinc-500">
            {flagsLeft} of {BUSINESS_REVIEW_FLAGS_PER_MONTH} review flags left this month.
          </p>
        ) : (
          <p className="mt-3 text-xs text-zinc-500">
            You can flag up to {BUSINESS_REVIEW_FLAGS_PER_MONTH} reviews per month.
          </p>
        )}
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
          {reviews.map((review) => {
            const author = publicReviewAuthor(review);
            const anonymous = isAnonymousPublic(review);
            const flagged = flaggedIds.has(review.id);
            return (
              <article
                key={review.id}
                id={`review-${review.id}`}
                className={`p-4 md:p-5 ${highlightReviewId === review.id ? 'bg-amber-50 ring-1 ring-amber-200' : ''}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-zinc-900">{author}</p>
                      {anonymous ? (
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                          Anonymous
                        </span>
                      ) : null}
                      {review.hidden ? (
                        <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700">
                          Hidden from public
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <StarRow rating={review.rating} />
                      {review.date ? <p className="text-xs text-zinc-400">{review.date}</p> : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <ReviewIdBadge reviewId={review.id} tone="zinc" />
                    <button
                      type="button"
                      disabled={flagged}
                      onClick={() => {
                        setFlagTarget(review);
                        setFlagError(null);
                      }}
                      className="rounded-md border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60"
                    >
                      {flagged ? 'Flagged' : 'Flag'}
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{review.content}</p>
                <ReviewReplyEditor
                  review={review}
                  businessId={businessId}
                  onSaved={onReviewsChange}
                />
              </article>
            );
          })}
        </div>
      )}

      {flagTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-4 shadow-lg">
            <h3 className="text-sm font-semibold text-zinc-900">Flag this review</h3>
            <p className="mt-1 text-xs text-zinc-500">
              FinderB admins will check if it is offensive, untruthful, or abusive. Hidden reviews leave your public profile.
            </p>
            <div className="mt-3 space-y-2">
              {FLAG_REASONS.map((option) => (
                <label key={option} className="flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="radio"
                    name="merchant-flag-reason"
                    checked={flagReason === option}
                    onChange={() => setFlagReason(option)}
                  />
                  {option}
                </label>
              ))}
            </div>
            <textarea
              value={flagDetails}
              onChange={(event) => setFlagDetails(event.target.value)}
              rows={3}
              placeholder={flagReason === 'Other' ? 'Describe the issue' : 'Extra context (optional)'}
              className="mt-3 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-300"
            />
            {flagError ? <p className="mt-2 text-xs text-red-600">{flagError}</p> : null}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setFlagTarget(null)}
                className="flex-1 rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={flagging}
                onClick={() => void submitFlag()}
                className="flex-[1.3] rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {flagging ? 'Sending…' : 'Submit flag'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
