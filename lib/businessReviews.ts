export type BusinessReview = {
  id: string;
  author: string;
  content: string;
  rating: number;
  date: string;
  userId?: string;
  merchantReply?: BusinessReviewReply;
};

export type BusinessReviewReply = {
  content: string;
  date?: string;
};

export const REVIEW_REPLY_MIN_LENGTH = 10;
export const REVIEW_REPLY_MAX_LENGTH = 500;

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

export function normalizeReviewReplyForStorage(content: string): BusinessReviewReply | null {
  const trimmed = content.trim();
  if (!trimmed) return null;
  return { content: trimmed, date: new Date().toISOString() };
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
  return {
    id: String(entry.id || `review-${index}`),
    author: String(entry.author || entry.name || 'Customer').trim() || 'Customer',
    content,
    rating: Number.isFinite(rating) && rating >= 1 && rating <= 5 ? rating : 5,
    date: String(entry.date || entry.createdAt || '').trim(),
    userId: entry.userId ? String(entry.userId) : undefined,
    merchantReply,
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
    const single = normalizeReviewEntry(review, 0);
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

export function averageReviewRating(reviews: BusinessReview[], fallback?: number | null): number | null {
  if (reviews.length > 0) {
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((total / reviews.length) * 10) / 10;
  }
  return typeof fallback === 'number' && Number.isFinite(fallback) ? fallback : null;
}

/** Public profile rating — only from real submitted reviews, never stored DB fallback. */
export function getPublicReviewRating(reviews: BusinessReview[]): number | null {
  if (reviews.length === 0) return null;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / reviews.length) * 10) / 10;
}

export function getBusinessPublicRatingStats(review: unknown): {
  rating: number | null;
  reviewCount: number;
} {
  const reviews = parseBusinessReviews(review);
  return {
    rating: getPublicReviewRating(reviews),
    reviewCount: reviews.length,
  };
}

export function serializeBusinessReviewsForStorage(reviews: BusinessReview[]) {
  return reviews.map((review) => ({
    id: review.id,
    author: review.author,
    content: review.content,
    rating: review.rating,
    date: review.date,
    ...(review.userId ? { userId: review.userId } : {}),
    ...(review.merchantReply ? { merchantReply: review.merchantReply } : {}),
  }));
}
