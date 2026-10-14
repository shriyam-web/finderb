export type ReviewAnonymityStatus = 'pending' | 'allowed' | 'revealed';

export type BusinessReview = {
  id: string;
  author: string;
  content: string;
  rating: number;
  date: string;
  userId?: string;
  authorVerified?: boolean;
  merchantReply?: BusinessReviewReply;
  anonymous?: boolean;
  anonymousReason?: string;
  anonymityStatus?: ReviewAnonymityStatus;
  hidden?: boolean;
  deleted?: boolean;
};

export type BusinessReviewReply = {
  content: string;
  date?: string;
};

export const REVIEW_REPLY_MIN_LENGTH = 10;
export const REVIEW_REPLY_MAX_LENGTH = 500;
export const ANONYMOUS_REASON_MIN_LENGTH = 10;
export const ANONYMOUS_REASON_MAX_LENGTH = 500;
export const BUSINESS_REVIEW_FLAGS_PER_MONTH = 10;

export function getReviewReplyDraft(reviewReply: unknown): string {
  return parseBusinessReviewReply(reviewReply)?.content ?? '';
}

export function validateReviewReplyContent(content: string): string | null {
  const trimmed = content.trim();
  if (!trimmed) return null;
  if (trimmed.length < REVIEW_REPLY_MIN_LENGTH) {
    return `Default reply must be at least ${REVIEW_REPLY_MIN_LENGTH} characters.`;
  }
  if (trimmed.length > REVIEW_REPLY_MAX_LENGTH) {
    return `Default reply must be ${REVIEW_REPLY_MAX_LENGTH} characters or fewer.`;
  }
  return null;
}

export function validateAnonymousReason(reason: string): string | null {
  const trimmed = reason.trim();
  if (!trimmed) return 'Please tell us why you want to post anonymously.';
  if (trimmed.length < ANONYMOUS_REASON_MIN_LENGTH) {
    return `Please write at least ${ANONYMOUS_REASON_MIN_LENGTH} characters.`;
  }
  if (trimmed.length > ANONYMOUS_REASON_MAX_LENGTH) {
    return `Reason must be ${ANONYMOUS_REASON_MAX_LENGTH} characters or fewer.`;
  }
  return null;
}

export function normalizeReviewReplyForStorage(content: string): BusinessReviewReply | null {
  const trimmed = content.trim();
  if (!trimmed) return null;
  return { content: trimmed, date: new Date().toISOString() };
}

function parseAnonymityStatus(value: unknown): ReviewAnonymityStatus | undefined {
  if (value === 'pending' || value === 'allowed' || value === 'revealed') return value;
  return undefined;
}

function normalizeReviewEntry(raw: unknown, index: number): BusinessReview | null {
  if (!raw) return null;

  if (typeof raw === 'string') {
    const content = raw.trim();
    if (!content) return null;
    return {
      id: `legacy-${index}`,
      author: 'Customer',
      content,
      rating: 5,
      date: '',
    };
  }

  if (typeof raw !== 'object') return null;

  const entry = raw as Record<string, unknown>;
  const content = String(entry.content || entry.text || '').trim();
  if (!content) return null;

  const rating = Number(entry.rating);
  const merchantReply = parseBusinessReviewReply(entry.merchantReply) ?? undefined;
  const anonymousReason = String(entry.anonymousReason || '').trim();
  return {
    id: String(entry.id || `review-${index}`),
    author: String(entry.author || entry.name || 'Customer').trim() || 'Customer',
    content,
    rating: Number.isFinite(rating) && rating >= 1 && rating <= 5 ? rating : 5,
    date: String(entry.date || entry.createdAt || '').trim(),
    userId: entry.userId ? String(entry.userId) : undefined,
    authorVerified:
      typeof entry.authorVerified === 'boolean'
        ? entry.authorVerified
        : Boolean(entry.userId),
    merchantReply,
    anonymous: Boolean(entry.anonymous),
    anonymousReason: anonymousReason || undefined,
    anonymityStatus: parseAnonymityStatus(entry.anonymityStatus),
    hidden: Boolean(entry.hidden),
    deleted: Boolean(entry.deleted),
  };
}

export function parseBusinessReviews(review: unknown): BusinessReview[] {
  if (!review) return [];

  if (Array.isArray(review)) {
    return review
      .map((entry, index) => normalizeReviewEntry(entry, index))
      .filter((entry): entry is BusinessReview => Boolean(entry));
  }

  if (typeof review === 'string') {
    const trimmed = review.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        return parseBusinessReviews(JSON.parse(trimmed));
      } catch {
        // Stored as a plain-text review, not JSON.
      }
    }
    const single = normalizeReviewEntry(trimmed, 0);
    return single ? [single] : [];
  }

  if (typeof review === 'object') {
    const objectReview = review as Record<string, unknown>;
    const values = Object.values(objectReview);
    const looksLikeCollection = values.some(
      (value) => typeof value === 'object' && value !== null && ('content' in value || 'text' in value)
    );

    if (looksLikeCollection) {
      return values
        .map((entry, index) => normalizeReviewEntry(entry, index))
        .filter((entry): entry is BusinessReview => Boolean(entry));
    }

    const single = normalizeReviewEntry(review, 0);
    return single ? [single] : [];
  }

  return [];
}

export function parseBusinessReviewReply(reviewReply: unknown): BusinessReviewReply | null {
  if (!reviewReply) return null;

  if (typeof reviewReply === 'string') {
    const content = reviewReply.trim();
    return content ? { content } : null;
  }

  if (typeof reviewReply === 'object') {
    const reply = reviewReply as Record<string, unknown>;
    const content = String(reply.content || reply.text || '').trim();
    if (!content) return null;
    return {
      content,
      date: String(reply.date || '').trim() || undefined,
    };
  }

  return null;
}

export function isReviewDeleted(review: BusinessReview): boolean {
  return Boolean(review.deleted);
}

export function isReviewHidden(review: BusinessReview): boolean {
  return Boolean(review.hidden);
}

export function isReviewVisiblePublic(review: BusinessReview): boolean {
  return !isReviewDeleted(review) && !isReviewHidden(review);
}

export function isReviewVisibleToMerchant(review: BusinessReview): boolean {
  return !isReviewDeleted(review);
}

/** Keep the first letter of each word; replace the rest with x. */
export function maskReviewAuthorName(name: string): string {
  const trimmed = name.trim() || 'Customer';
  return trimmed
    .split(/\s+/)
    .map((word) => {
      if (!word) return word;
      const first = word[0];
      if (word.length === 1) return first;
      return `${first}${'x'.repeat(word.length - 1)}`;
    })
    .join(' ');
}

export function isAnonymousPublic(review: BusinessReview): boolean {
  return Boolean(review.anonymous) && review.anonymityStatus !== 'revealed' && !isReviewDeleted(review);
}

export function publicReviewAuthor(review: BusinessReview): string {
  if (!isAnonymousPublic(review)) {
    return review.author.trim() || 'Customer';
  }
  return maskReviewAuthorName(review.author);
}

export function visiblePublicReviews(reviews: BusinessReview[]): BusinessReview[] {
  return reviews.filter(isReviewVisiblePublic);
}

export function visibleMerchantReviews(reviews: BusinessReview[]): BusinessReview[] {
  return reviews.filter(isReviewVisibleToMerchant);
}

export function toPublicReview(review: BusinessReview): BusinessReview {
  const anonymous = isAnonymousPublic(review);
  return {
    id: review.id,
    author: publicReviewAuthor(review),
    content: review.content,
    rating: review.rating,
    date: review.date,
    userId: review.userId,
    authorVerified: anonymous ? false : review.authorVerified,
    merchantReply: review.merchantReply,
    anonymous: anonymous || undefined,
    hidden: review.hidden || undefined,
  };
}

export function toPublicReviews(reviews: BusinessReview[]): BusinessReview[] {
  return visiblePublicReviews(reviews).map(toPublicReview);
}

export function toMerchantReview(review: BusinessReview): BusinessReview {
  return {
    ...toPublicReview(review),
    hidden: review.hidden || undefined,
    anonymous: isAnonymousPublic(review) || undefined,
  };
}

export function toMerchantReviews(reviews: BusinessReview[]): BusinessReview[] {
  return visibleMerchantReviews(reviews).map(toMerchantReview);
}

export function serializePublicReviewsForClient(review: unknown): BusinessReview[] {
  return toPublicReviews(parseBusinessReviews(review));
}

export function averageReviewRating(reviews: BusinessReview[], fallback?: number | null): number | null {
  const counted = reviews.filter((review) => !isReviewDeleted(review) && !isReviewHidden(review));
  if (counted.length > 0) {
    const total = counted.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((total / counted.length) * 10) / 10;
  }
  return typeof fallback === 'number' && Number.isFinite(fallback) ? fallback : null;
}

/** Public profile rating — only from visible submitted reviews, never stored DB fallback. */
export function getPublicReviewRating(reviews: BusinessReview[]): number | null {
  const visible = visiblePublicReviews(reviews);
  if (visible.length === 0) return null;
  const total = visible.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / visible.length) * 10) / 10;
}

export function getBusinessPublicRatingStats(review: unknown): {
  rating: number | null;
  reviewCount: number;
} {
  const reviews = visiblePublicReviews(parseBusinessReviews(review));
  return {
    rating: getPublicReviewRating(reviews),
    reviewCount: reviews.length,
  };
}

export function isReviewAuthorVerified(review: BusinessReview): boolean {
  if (isAnonymousPublic(review)) return false;
  return review.authorVerified ?? Boolean(review.userId);
}

export function serializeBusinessReviewsForStorage(reviews: BusinessReview[]) {
  return reviews.map((review) => ({
    id: review.id,
    author: review.author,
    content: review.content,
    rating: review.rating,
    date: review.date,
    ...(review.userId ? { userId: review.userId } : {}),
    ...(review.authorVerified || review.userId ? { authorVerified: true } : {}),
    ...(review.merchantReply ? { merchantReply: review.merchantReply } : {}),
    ...(review.anonymous ? { anonymous: true } : {}),
    ...(review.anonymousReason ? { anonymousReason: review.anonymousReason } : {}),
    ...(review.anonymityStatus ? { anonymityStatus: review.anonymityStatus } : {}),
    ...(review.hidden ? { hidden: true } : {}),
    ...(review.deleted ? { deleted: true } : {}),
  }));
}
