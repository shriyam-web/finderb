import {
  parseBusinessReviews,
  publicReviewAuthor,
  type BusinessReview,
} from './businessReviews';

export type AdminReviewListRow = {
  business_id: string;
  business_name: string;
  city: string | null;
  slug: string | null;
  review_id: string;
  author_name: string;
  public_name: string;
  content: string;
  rating: number;
  date: string;
  anonymous: boolean;
  anonymous_reason: string | null;
  anonymity_status: string;
  hidden: boolean;
  deleted: boolean;
  reply: string | null;
};

export function anonymityStatusOf(review: BusinessReview): string {
  if (review.anonymityStatus) return review.anonymityStatus;
  return review.anonymous ? 'pending' : 'allowed';
}

export function flattenBusinessReviews(row: {
  id: string;
  businessName?: string | null;
  displayName?: string | null;
  city?: string | null;
  slug?: string | null;
  review: unknown;
}): AdminReviewListRow[] {
  return parseBusinessReviews(row.review).map((review) => ({
    business_id: row.id,
    business_name: String(row.displayName || row.businessName || 'Business').trim() || 'Business',
    city: row.city ? String(row.city) : null,
    slug: row.slug ? String(row.slug) : null,
    review_id: review.id,
    author_name: review.author.trim() || 'Customer',
    public_name: publicReviewAuthor(review),
    content: review.content,
    rating: review.rating,
    date: review.date || '',
    anonymous: Boolean(review.anonymous),
    anonymous_reason: review.anonymousReason?.trim() || null,
    anonymity_status: anonymityStatusOf(review),
    hidden: Boolean(review.hidden),
    deleted: Boolean(review.deleted),
    reply: review.merchantReply?.content?.trim() || null,
  }));
}

export function matchesReviewQuery(row: AdminReviewListRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return true;
  return [
    row.business_name,
    row.city,
    row.author_name,
    row.public_name,
    row.content,
    row.review_id,
    row.business_id,
    row.slug,
    row.anonymous_reason,
  ].some((value) => (value || '').toLowerCase().includes(q));
}

export function visibilityLabel(row: Pick<AdminReviewListRow, 'hidden' | 'deleted'>): string {
  if (row.deleted) return 'Removed';
  if (row.hidden) return 'Hidden from public';
  return 'Visible on listing';
}

export function anonymousLabel(status: string): string {
  if (status === 'pending') return 'Waiting: keep anonymous or show name';
  if (status === 'allowed') return 'Kept anonymous';
  if (status === 'revealed') return 'Real name shown';
  return status;
}

export function sortReviewsNewest(rows: AdminReviewListRow[]): AdminReviewListRow[] {
  return [...rows].sort((a, b) => {
    const aTime = Date.parse(a.date) || 0;
    const bTime = Date.parse(b.date) || 0;
    return bTime - aTime;
  });
}
