'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { submitBusinessReview } from '@/app/actions/reviews';
import { getSession } from '@/app/actions/user';
import { buildLoginHref } from '@/lib/authRedirect';
import { REVIEW_STAR_EMOJI, reviewTemplatesForCategory } from '@/lib/reviewInvite';
import { maskReviewAuthorName } from '@/lib/businessReviews';

function reviewSlugFromPath(reviewPath: string) {
  return decodeURIComponent(reviewPath.replace(/^\/review\//, '').split(/[?#]/)[0] || '');
}

function tryOpenReviewInApp(slug: string) {
  if (typeof window === 'undefined' || !slug) return;
  const ua = window.navigator.userAgent || '';
  if (!/Android/i.test(ua)) return;
  const started = Date.now();
  const fallback = () => undefined;
  const timer = window.setTimeout(fallback, 1200);
  const onHide = () => {
    if (Date.now() - started < 1600) window.clearTimeout(timer);
  };
  document.addEventListener('visibilitychange', onHide, { once: true });
  window.location.href = `finderb://review/${encodeURIComponent(slug)}`;
}

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [sessionReady, setSessionReady] = useState(false);
  const templates = useMemo(
    () => reviewTemplatesForCategory(category, rating, userId || userName || ''),
    [category, rating, userId, userName],
  );
  const mood = REVIEW_STAR_EMOJI[rating];
  const slug = reviewSlugFromPath(reviewPath);
  const loginHref = buildLoginHref(reviewPath);

  useEffect(() => {
    void getSession().then((session) => {
      if (session?.success && session.user) {
        setUserName(session.user.fullName);
        setUserId(session.user.id);
      } else {
        setUserName(null);
        setUserId('');
      }
      setSessionReady(true);
    });
  }, []);

  useEffect(() => {
    tryOpenReviewInApp(slug);
  }, [slug]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userName) return;
    setSubmitting(true);
    setError(null);
    const result = await submitBusinessReview({
      businessId,
      rating,
      content,
      anonymous,
    });
    setSubmitting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSuccess(anonymous ? 'Your anonymous review is live.' : 'Thank you — your review is live.');
    setContent('');
  };

  const openInApp = () => {
    if (!slug) return;
    window.location.href = `finderb://review/${encodeURIComponent(slug)}`;
  };

  return (
    <div className="min-h-screen bg-[#f6f3ee] px-4 pb-10 pt-28 sm:pt-32 lg:pt-36">
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-[#e6dcc8] bg-white shadow-[0_16px_40px_rgba(21,53,81,0.08)]">
        <div className="bg-gradient-to-br from-[#12324c] to-[#215481] px-4 py-4 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#f9d48a]">Review on FinderB</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">{businessName}</h1>
          <p className="mt-0.5 text-xs text-white/70">{[category, city].filter(Boolean).join(' · ')}</p>
        </div>

        {!sessionReady ? (
          <p className="px-4 py-8 text-center text-sm text-stone-500">Checking your account…</p>
        ) : !userName ? (
          <div className="space-y-3 px-4 py-5">
            <p className="text-sm leading-5 text-stone-600">
              Sign in with your FinderB account to leave a review. Guests cannot post.
            </p>
            <Link
              href={loginHref}
              className="block w-full rounded-lg bg-[#215481] py-2.5 text-center text-sm font-semibold text-white"
            >
              Log in to review
            </Link>
            <button
              type="button"
              onClick={openInApp}
              className="block w-full rounded-lg border border-stone-200 py-2.5 text-center text-sm font-semibold text-stone-800"
            >
              Open in FinderB app
            </button>
            <Link href={profilePath} className="block text-center text-xs font-medium text-[#215481] hover:underline">
              View full listing
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3.5 px-4 py-4">
            <div className="text-center">
              <div className="text-4xl leading-none">{mood?.emoji || '⭐'}</div>
              <p className="mt-1.5 text-xs font-medium text-stone-600">
                {mood ? mood.label : 'How was your experience?'}
              </p>
              <div className="mt-2 flex justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-base ${
                      star <= rating ? 'bg-amber-100' : 'bg-stone-100'
                    }`}
                    aria-label={`${star} star`}
                  >
                    {star <= rating ? '★' : '☆'}
                  </button>
                ))}
              </div>
            </div>

            {rating >= 1 && rating <= 3 ? (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] leading-4 text-stone-700">
                Please describe what happened without abusive or offensive words. A review that uses them can be removed under FinderB’s moderation policy.
              </p>
            ) : null}

            {templates.length > 0 ? (
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                  Suggested for {category || 'this business'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {templates.map((template) => (
                    <button
                      key={template}
                      type="button"
                      onClick={() => setContent(template)}
                      className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-left text-[10px] leading-snug text-stone-600 hover:border-[#215481] hover:bg-[#215481]/5"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={3}
              minLength={10}
              required
              placeholder="Write your review…"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[#215481]"
            />

            <p className="text-xs text-stone-600">
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
            {error ? <p className="text-xs text-rose-600">{error}</p> : null}
            {success ? <p className="text-xs text-emerald-700">{success}</p> : null}
            <button
              type="submit"
              disabled={submitting || rating < 1}
              className="w-full rounded-lg bg-[#215481] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting ? 'Posting…' : 'Post review'}
            </button>
            <button
              type="button"
              onClick={openInApp}
              className="block w-full text-center text-xs font-medium text-stone-500 hover:text-stone-800"
            >
              Open in FinderB app
            </button>
            <Link href={profilePath} className="block text-center text-xs font-medium text-[#215481] hover:underline">
              View full listing
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
