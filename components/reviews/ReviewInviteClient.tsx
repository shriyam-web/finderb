'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { submitBusinessReview } from '@/app/actions/reviews';
import { getSession } from '@/app/actions/user';
import { buildLoginHref } from '@/lib/authRedirect';
import { REVIEW_STAR_EMOJI, reviewTemplatesForCategory } from '@/lib/reviewInvite';
import { maskReviewAuthorName, validateAnonymousReason } from '@/lib/businessReviews';

export default function ReviewInviteClient({
  businessId,
  businessName,
  category,
  city,
  profilePath,
  reviewPath,
}: {
  businessId: string;
  businessName: string;
  category: string;
  city: string;
  profilePath: string;
  reviewPath: string;
}) {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [anonymousReason, setAnonymousReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const templates = useMemo(() => reviewTemplatesForCategory(category), [category]);
  const mood = REVIEW_STAR_EMOJI[rating];

  useEffect(() => {
    void getSession().then((session) => {
      if (session?.success && session.user) setUserName(session.user.fullName);
      else setUserName(null);
    });
  }, []);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userName) return;
    if (anonymous) {
      const reasonError = validateAnonymousReason(anonymousReason);
      if (reasonError) {
        setError(reasonError);
        return;
      }
    }
    setSubmitting(true);
    setError(null);
    const result = await submitBusinessReview({
      businessId,
      rating,
      content,
      anonymous,
      anonymousReason,
    });
    setSubmitting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSuccess(anonymous ? 'Your anonymous review is live.' : 'Thank you — your review is live.');
    setContent('');
  };

  return (
    <div className="min-h-screen bg-[#f6f3ee] px-4 py-10">
      <div className="mx-auto w-full max-w-lg overflow-hidden rounded-3xl border border-[#e6dcc8] bg-white shadow-[0_20px_60px_rgba(21,53,81,0.08)]">
        <div className="bg-gradient-to-br from-[#12324c] to-[#215481] px-5 py-6 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f9d48a]">Review on FinderB</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{businessName}</h1>
          <p className="mt-1 text-sm text-white/70">{[category, city].filter(Boolean).join(' · ')}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 px-5 py-6">
          <div className="text-center">
            <div className="text-5xl leading-none">{mood?.emoji || '⭐'}</div>
            <p className="mt-2 text-sm font-medium text-stone-600">
              {mood ? mood.label : 'How was your experience?'}
            </p>
            <div className="mt-3 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-lg ${
                    star <= rating ? 'bg-amber-100' : 'bg-stone-100'
                  }`}
                  aria-label={`${star} star`}
                >
                  {star <= rating ? '★' : '☆'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
              Suggested for {category || 'this business'}
            </p>
            <div className="flex flex-wrap gap-2">
              {templates.slice(0, 5).map((template) => (
                <button
                  key={template}
                  type="button"
                  onClick={() => setContent(template)}
                  className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-left text-xs text-stone-700 hover:border-[#215481] hover:bg-[#215481]/5"
                >
                  {template}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={4}
            minLength={10}
            required
            placeholder="Write your review…"
            className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-[#215481]"
          />

          {userName ? (
            <>
              <p className="text-sm text-stone-600">
                Posting as{' '}
                <span className="font-medium text-stone-900">
                  {anonymous ? maskReviewAuthorName(userName) : userName}
                </span>
              </p>
              <label className="flex items-start gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={anonymous}
                  onChange={(event) => setAnonymous(event.target.checked)}
                />
                Post anonymously
              </label>
              {anonymous ? (
                <textarea
                  value={anonymousReason}
                  onChange={(event) => setAnonymousReason(event.target.value)}
                  rows={2}
                  minLength={10}
                  required
                  placeholder="Why do you need to post anonymously?"
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[#215481]"
                />
              ) : null}
              {error ? <p className="text-xs text-rose-600">{error}</p> : null}
              {success ? <p className="text-xs text-emerald-700">{success}</p> : null}
              <button
                type="submit"
                disabled={submitting || rating < 1}
                className="w-full rounded-xl bg-[#215481] py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {submitting ? 'Posting…' : 'Post review'}
              </button>
            </>
          ) : (
            <Link
              href={buildLoginHref(reviewPath)}
              className="block w-full rounded-xl bg-[#215481] py-3 text-center text-sm font-semibold text-white"
            >
              Log in to post your review
            </Link>
          )}

          <Link href={profilePath} className="block text-center text-xs font-medium text-[#215481] hover:underline">
            View full listing
          </Link>
        </form>
      </div>
    </div>
  );
}
