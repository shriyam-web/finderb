export type Merchant = {
  id: string;
  slug: string | null;
  name: string;
  category: string;
  location: string;
  city: string | null;
  about: string | null;
  image: string | null;
  rating: number | null;
  reviewsCount: number;
  contact: string;
  isVerified: boolean;
  discountRange: string | null;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[''`]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function resolveMerchantSlug(m: {
  slug?: string | null;
  name?: string | null;
  city?: string | null;
}): string {
  const persisted = m.slug?.trim();
  if (persisted) return persisted;
  const base = slugify(m.name || 'business') || 'business';
  const city = m.city ? slugify(m.city) : '';
  if (!city || base.includes(city)) return base.slice(0, 96);
  return `${base}-${city}`.slice(0, 96);
}

function parseReviews(review: unknown): Array<{ rating: number }> {
  if (!review) return [];
  if (Array.isArray(review)) {
    return review
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return null;
        const rating = Number((entry as { rating?: number }).rating);
        if (!Number.isFinite(rating)) return null;
        return { rating };
      })
      .filter(Boolean) as Array<{ rating: number }>;
  }
  return [];
}

function ratingStats(review: unknown): { rating: number | null; reviewsCount: number } {
  const reviews = parseReviews(review);
  if (!reviews.length) return { rating: null, reviewsCount: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return {
    rating: Math.round((sum / reviews.length) * 10) / 10,
    reviewsCount: reviews.length,
  };
}

function completenessScore(m: Merchant & { about?: string | null; contact?: string }): number {
  let score = 0;
  if (m.image) score += 12;
  if ((m.about || '').length > 20) score += 14;
  if (m.location) score += 4;
  if (m.city) score += 3;
  if (m.category) score += 5;
  if (m.contact) score += 8;
  if (m.rating) score += 6;
  if (m.isVerified) score += 10;
  return score;
}

export function mapMerchantRow(row: Record<string, unknown>): Merchant {
  const displayName = String(row.displayName || '').trim();
  const businessName = String(row.businessName || '').trim();
  const name = displayName || businessName || 'Business';
  const { rating, reviewsCount } = ratingStats(row.review);
  const profile =
    typeof row.profilePictureUrl === 'string' && row.profilePictureUrl.trim()
      ? row.profilePictureUrl.trim()
      : null;
  const galleryFirst = Array.isArray(row.images)
    ? row.images.find((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : null;
  const image = profile || galleryFirst || null;

  return {
    id: String(row.id),
    slug: (row.slug as string | null) ?? null,
    name,
    category: String(row.category || ''),
    location: String(row.location || row.city || ''),
    city: (row.city as string | null) ?? null,
    about: (row.about as string | null) ?? null,
    image,
    rating,
    reviewsCount,
    contact: String(row.publicPhone || row.mobile || ''),
    isVerified: Boolean(row.isFinderBVerified || row.hasVerifiedBadge),
    discountRange: (row.discountRange as string | null) ?? null,
  };
}

export function merchantHasPublicPhoto(merchant: Pick<Merchant, 'image'>): boolean {
  return Boolean(merchant.image?.trim());
}

export function rankMerchants(merchants: Merchant[]): Merchant[] {
  return [...merchants]
    .filter(merchantHasPublicPhoto)
    .sort((a, b) => completenessScore(b) - completenessScore(a));
}
