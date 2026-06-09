export type BusinessReview = {
  id: string;
  author: string;
  content: string;
  rating: number;
  date: string;
  userId?: string;
};

export type BusinessReviewReply = {
  content: string;
  date?: string;
};

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
  return {
    id: String(entry.id || `review-${index}`),
    author: String(entry.author || entry.name || 'Customer').trim() || 'Customer',
    content,
    rating: Number.isFinite(rating) && rating >= 1 && rating <= 5 ? rating : 5,
    date: String(entry.date || entry.createdAt || '').trim(),
    userId: entry.userId ? String(entry.userId) : undefined,
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
