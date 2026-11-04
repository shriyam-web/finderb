/** Below this many reviews the average is shown without a count. */
export const REVIEW_COUNT_VISIBLE_FROM = 5;

export const UNRATED_LABEL = 'Not rated yet';

export type RatingDisplay =
  | { rated: false }
  | {
      rated: true;
      rating: number;
      /** One decimal, e.g. "4.3". */
      label: string;
      reviewCount: number;
      /** True from 5 reviews; with fewer, show the average only. */
      showCount: boolean;
    };

/**
 * Public rating rules: no reviews → "New / Not rated yet"; 1–4 reviews → average only;
 * 5+ reviews → average with the review count. Never invent a rating for unreviewed businesses.
 */
/** Same bands as the public business profile: red, amber, green. */
export function ratingBoxColor(rating: number): string {
  if (rating <= 2) return '#DC2626';
  if (rating <= 3.5) return '#E6A800';
  return '#16A34A';
}

export function getRatingDisplay(rating: unknown, reviewCount: unknown): RatingDisplay {
  const count = Math.max(0, Math.floor(Number(reviewCount) || 0));
  const value = Number(rating);
  if (count === 0 || !Number.isFinite(value) || value <= 0) return { rated: false };
  const clamped = Math.min(5, value);
  return {
    rated: true,
    rating: clamped,
    label: clamped.toFixed(1),
    reviewCount: count,
    showCount: count >= REVIEW_COUNT_VISIBLE_FROM,
  };
}
