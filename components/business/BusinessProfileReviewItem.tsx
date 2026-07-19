'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Flag, Star, X } from 'lucide-react';
import { reportBusinessReview } from '@/app/actions/reviews';
import { VerifiedUserTick } from '@/components/business/VerifiedMark';
import { buildLoginHref } from '@/lib/authRedirect';
import { isReviewAuthorVerified, type BusinessReview } from '@/lib/businessReviews';

const REPORT_SUGGESTIONS = [
  'Spam or fake review',
  'Offensive or inappropriate content',
  'Not about this business',
  'Conflict of interest',
  'Other',
] as const;

type BusinessProfileReviewItemProps = {
  review: BusinessReview;
  businessId: string;
  businessName: string;
  contactRevealed: boolean;
  profileRedirectPath: string;
  /** Fallback thank-you when this review has no custom merchant reply. */
  defaultReply?: string | null;
};

export default function BusinessProfileReviewItem({
  review,
  businessId,
  businessName,
  contactRevealed,
  profileRedirectPath,
  defaultReply = null,
}: BusinessProfileReviewItemProps) {
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [portalMounted, setPortalMounted] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>(REPORT_SUGGESTIONS[0]);
  const [otherDetails, setOtherDetails] = useState('');
  const showVerifiedBadge = isReviewAuthorVerified(review);
  const loginHref = buildLoginHref(`${profileRedirectPath}#reviews`);
  const replyContent =
    review.merchantReply?.content?.trim() || defaultReply?.trim() || '';

  useEffect(() => {
    setPortalMounted(true);
  }, []);

  useEffect(() => {
    if (!reportModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !reporting) {
        setReportModalOpen(false);
        setReportError(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [reportModalOpen, reporting]);

  const closeReportModal = () => {
    if (reporting) return;
    setReportModalOpen(false);
    setReportError(null);
    setSelectedReason(REPORT_SUGGESTIONS[0]);
    setOtherDetails('');
  };

  const buildReportReason = () => {
    if (selectedReason === 'Other') {
      return otherDetails.trim();
    }
    if (otherDetails.trim()) {
      return `${selectedReason}: ${otherDetails.trim()}`;
    }
    return selectedReason;
  };

  const handleSubmitReport = async () => {
    if (!contactRevealed || reported || reporting) return;

    const reason = buildReportReason();
    if (!reason || reason.length < 8) {
      setReportError('Please add a short reason before submitting.');
      return;
    }

    setReporting(true);
    setReportError(null);

    const result = await reportBusinessReview({
      businessId,
      reviewId: review.id,
      reason,
    });

    if (result.success) {
      setReported(true);
      setReportModalOpen(false);
      setReportError(null);
      setSelectedReason(REPORT_SUGGESTIONS[0]);
      setOtherDetails('');
    } else {
      setReportError(result.error);
    }

    setReporting(false);
  };

  const reportModal =
    reportModalOpen && portalMounted ? (
      <div
        className="fixed inset-0 z-[10100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4 pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] sm:pb-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`report-review-title-${review.id}`}
        onClick={closeReportModal}
      >
        <div
          className="flex max-h-[min(88vh,680px)] w-full flex-col overflow-hidden rounded-t-xl border border-stone-200 bg-white sm:max-w-md sm:rounded-lg"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-stone-200 px-4 py-3">
            <div className="min-w-0">
              <h3
                id={`report-review-title-${review.id}`}
                className="text-sm font-semibold text-[#153551] sm:text-base"
              >
                Flag this review
              </h3>
              <p className="mt-0.5 text-xs text-stone-500 sm:text-sm">
                Tell us why this review should be reviewed.
              </p>
            </div>
            <button
              type="button"
              onClick={closeReportModal}
              disabled={reporting}
              className="shrink-0 rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 disabled:opacity-50"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-stone-600">Reason</legend>
              {REPORT_SUGGESTIONS.map((option) => (
                <label
                  key={option}
                  className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                    selectedReason === option
                      ? 'border-[#215481] bg-stone-50 text-[#153551]'
                      : 'border-stone-200 text-stone-700 hover:border-stone-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`report-reason-${review.id}`}
                    value={option}
                    checked={selectedReason === option}
                    onChange={() => setSelectedReason(option)}
                    className="mt-0.5 shrink-0"
                  />
                  <span className="leading-snug">{option}</span>
                </label>
              ))}
            </fieldset>

            <div>
              <label
                htmlFor={`report-details-${review.id}`}
                className="mb-1 block text-xs font-medium text-stone-600"
              >
                {selectedReason === 'Other' ? 'Describe the issue' : 'Additional details (optional)'}
              </label>
              <textarea
                id={`report-details-${review.id}`}
                value={otherDetails}
                onChange={(event) => setOtherDetails(event.target.value)}
                rows={3}
                placeholder={
                  selectedReason === 'Other'
                    ? 'What is wrong with this review?'
                    : 'Add any extra context for our team'
                }
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 outline-none focus:border-[#215481]"
              />
            </div>

            {reportError && <p className="text-xs text-rose-600">{reportError}</p>}
          </div>

          <div className="flex shrink-0 gap-2 border-t border-stone-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
            <button
              type="button"
              onClick={closeReportModal}
              disabled={reporting}
              className="flex-1 rounded-lg border border-stone-200 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSubmitReport()}
              disabled={reporting}
              className="flex-[1.4] rounded-lg bg-[#215481] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[#1a4367] disabled:opacity-50"
            >
              {reporting ? 'Submitting…' : 'Submit report'}
            </button>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <article className="border-b border-stone-100 pb-5 last:border-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-sm font-medium text-stone-900">{review.author}</p>
              {showVerifiedBadge ? <VerifiedUserTick size={14} /> : null}
            </div>
            {review.date && <p className="text-xs text-stone-400">{review.date}</p>}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={11}
                  className={
                    i < review.rating ? 'fill-amber-500 text-amber-500' : 'text-stone-200'
                  }
                />
              ))}
            </div>

            {contactRevealed ? (
              <button
                type="button"
                onClick={() => {
                  setReportError(null);
                  setReportModalOpen(true);
                }}
                disabled={reported}
                className="inline-flex items-center gap-1 rounded-md border border-stone-200 px-2 py-1 text-[11px] font-medium text-stone-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-default disabled:opacity-60"
                aria-label={reported ? 'Review reported' : 'Report review'}
                title={reported ? 'Review reported' : 'Report review'}
              >
                <Flag size={12} />
                {reported ? 'Reported' : 'Flag'}
              </button>
            ) : (
              <Link
                href={loginHref}
                className="inline-flex items-center gap-1 rounded-md border border-stone-200 px-2 py-1 text-[11px] font-medium text-stone-500 hover:border-stone-300 hover:bg-stone-50"
                title="Sign in to report this review"
              >
                <Flag size={12} />
                Flag
              </Link>
            )}
          </div>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-stone-600">{review.content}</p>

        {replyContent ? (
          <div className="mt-3 border-l-2 border-stone-300 pl-4">
            <p className="text-xs font-medium text-stone-500">{businessName}</p>
            <p className="mt-1 text-sm text-stone-700">{replyContent}</p>
          </div>
        ) : null}
      </article>

      {portalMounted && reportModal ? createPortal(reportModal, document.body) : null}
    </>
  );
}
