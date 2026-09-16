export type MerchantReview = {
  id: string;
  author: string;
  content: string;
  rating: number;
  date: string;
  userId?: string;
  authorVerified?: boolean;
  merchantReply?: { content: string };
};

export type Merchant = {
  id: string;
  slug: string | null;
  name: string;
  category: string;
  location: string;
  city: string | null;
  state: string | null;
  about: string | null;
  image: string | null;
  images: string[];
  rating: number | null;
  reviewsCount: number;
  reviews: MerchantReview[];
  contact: string;
  email: string | null;
  website: string | null;
  whatsappNumber: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  isVerified: boolean;
  discountRange: string | null;
  latitude: number | null;
  longitude: number | null;
  timings: unknown;
  services: string[];
  keywords: string[];
  paymentModes: string[];
  businessAddress: string | null;
  yearsInBusiness: number | null;
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
  id?: string | null;
  slug?: string | null;
  name?: string | null;
  city?: string | null;
}): string {
  const persisted = m.slug?.trim();
  if (persisted) return persisted;
  // Prefer stable id over invented slugs so detail fetch never 404s.
  const id = m.id?.trim();
  if (id) return id;
  const base = slugify(m.name || 'business') || 'business';
  const city = m.city ? slugify(m.city) : '';
  if (!city || base.includes(city)) return base.slice(0, 96);
  return `${base}-${city}`.slice(0, 96);
}

function parseCoordinate(value: unknown): number | null {
  if (value == null || value === '') return null;
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return null;
  return num;
}

function firstUrl(...candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    const trimmed = candidate.trim();
    if (trimmed && trimmed !== 'Not Set') return trimmed;
  }
  return null;
}

function normalizeHref(value: unknown): string | null {
  const raw = firstUrl(value);
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  if (/^[\w.-]+\.[\w.-]+/.test(raw)) return `https://${raw}`;
  return raw;
}

function parseGallery(images: unknown, profile: string | null): string[] {
  const list: string[] = [];
  const seen = new Set<string>();
  const push = (url: string | null) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    list.push(url);
  };
  push(profile);
  if (Array.isArray(images)) {
    for (const item of images) {
      push(firstUrl(item));
    }
  }
  return list;
}

export function parseBusinessServices(serviceCategory?: string | null): string[] {
  if (!serviceCategory?.trim()) return [];
  return [
    ...new Set(
      serviceCategory
        .split(/[,|]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ].slice(0, 10);
}

function parseReviews(review: unknown): MerchantReview[] {
  if (!review) return [];

  const normalize = (raw: unknown, index: number): MerchantReview | null => {
    if (typeof raw === 'string') {
      const content = raw.trim();
      if (!content) return null;
      return {
        id: `r-${index}`,
        author: 'Customer',
        content,
        rating: 5,
        date: '',
      };
    }
    if (!raw || typeof raw !== 'object') return null;
    const entry = raw as Record<string, unknown>;
    const content = String(entry.content || entry.text || '').trim();
    if (!content) return null;
    const rating = Number(entry.rating);
    return {
      id: String(entry.id || `r-${index}`),
      author: String(entry.author || entry.name || 'Customer').trim() || 'Customer',
      content,
      rating: Number.isFinite(rating) ? rating : 5,
      date: String(entry.date || entry.createdAt || '').trim(),
      userId: typeof entry.userId === 'string' ? entry.userId : undefined,
      authorVerified: Boolean(entry.authorVerified),
      merchantReply:
        entry.merchantReply && typeof entry.merchantReply === 'object'
          ? {
              content: String(
                (entry.merchantReply as { content?: unknown }).content || ''
              ).trim(),
            }
          : undefined,
    };
  };

  if (Array.isArray(review)) {
    return review
      .map((entry, index) => normalize(entry, index))
      .filter((entry): entry is MerchantReview => Boolean(entry));
  }

  if (typeof review === 'object') {
    const values = Object.values(review as Record<string, unknown>);
    return values
      .map((entry, index) => normalize(entry, index))
      .filter((entry): entry is MerchantReview => Boolean(entry));
  }

  return [];
}

function ratingStats(reviews: MerchantReview[]): {
  rating: number | null;
  reviewsCount: number;
} {
  if (!reviews.length) return { rating: null, reviewsCount: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return {
    rating: Math.round((sum / reviews.length) * 10) / 10,
    reviewsCount: reviews.length,
  };
}

function isPlaceholderEmail(email: string): boolean {
  return /@finderb\.com$/i.test(email);
}

function completenessScore(m: Merchant): number {
  let score = 0;
  if (m.image) score += 12;
  if ((m.about || '').length > 20) score += 14;
  if (m.location) score += 4;
  if (m.city) score += 3;
  if (m.category) score += 5;
  if (m.contact) score += 8;
  if (m.rating) score += 6;
  if (m.isVerified) score += 10;
  if (m.latitude != null && m.longitude != null) score += 4;
  if (m.services.length) score += 4;
  return score;
}

export function mapMerchantRow(row: Record<string, unknown>): Merchant {
  const displayName = String(row.displayName || '').trim();
  const businessName = String(row.businessName || '').trim();
  const name = displayName || businessName || 'Business';
  const reviews = parseReviews(row.review);
  const { rating, reviewsCount } = ratingStats(reviews);
  const profile = firstUrl(row.profilePictureUrl);
  const images = parseGallery(row.images, profile);
  const emailRaw = firstUrl(row.email, row.workEmail);
  const email = emailRaw && !isPlaceholderEmail(emailRaw) ? emailRaw : null;

  return {
    id: String(row.id),
    slug: (row.slug as string | null) ?? null,
    name,
    category: String(row.category || ''),
    location: String(row.location || row.city || ''),
    city: (row.city as string | null) ?? null,
    state: (row.state as string | null) ?? null,
    about: (row.about as string | null) ?? null,
    image: images[0] || null,
    images,
    rating,
    reviewsCount,
    reviews,
    contact: String(row.publicPhone || row.mobile || '').trim(),
    email,
    website: normalizeHref(row.website),
    whatsappNumber: firstUrl(row.whatsappNumber),
    instagramUrl: normalizeHref(row.instagramUrl),
    facebookUrl: normalizeHref(row.facebookUrl),
    youtubeUrl: normalizeHref(row.youtubeUrl),
    isVerified: Boolean(row.isFinderBVerified || row.hasVerifiedBadge),
    discountRange: (row.discountRange as string | null) ?? null,
    latitude: parseCoordinate(row.latitude),
    longitude: parseCoordinate(row.longitude),
    timings: row.timings ?? null,
    services: parseBusinessServices(
      typeof row.serviceCategory === 'string' ? row.serviceCategory : null,
    ),
    keywords: Array.isArray(row.keywords)
      ? row.keywords.filter((k): k is string => typeof k === 'string' && !!k.trim())
      : [],
    paymentModes: Array.isArray(row.paymentModes)
      ? row.paymentModes.filter((k): k is string => typeof k === 'string' && !!k.trim())
      : [],
    businessAddress: firstUrl(row.businessAddress),
    yearsInBusiness:
      typeof row.yearsInBusiness === 'number' && Number.isFinite(row.yearsInBusiness)
        ? row.yearsInBusiness
        : null,
  };
}

export function merchantHasPublicPhoto(merchant: Pick<Merchant, 'image' | 'images'>): boolean {
  return Boolean(merchant.image?.trim() || merchant.images?.length);
}

export function rankMerchants(merchants: Merchant[]): Merchant[] {
  return [...merchants]
    .filter(merchantHasPublicPhoto)
    .sort((a, b) => completenessScore(b) - completenessScore(a));
}

export function hasPublicOffer(discountRange: string | null | undefined): boolean {
  const label = discountRange?.trim();
  if (!label) return false;
  return !['No Discount', 'Seasonal Offer', 'Seasonal deal'].includes(label);
}

export function digitsOnlyPhone(value: string): string {
  return value.replace(/\D/g, '');
}

export function whatsAppHref(phone: string, message?: string): string | null {
  const digits = digitsOnlyPhone(phone);
  if (digits.length < 8) return null;
  const base = `https://wa.me/${digits}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function directionsHref(merchant: Pick<
  Merchant,
  'latitude' | 'longitude' | 'businessAddress' | 'location' | 'city' | 'name'
>): string | null {
  if (merchant.latitude != null && merchant.longitude != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${merchant.latitude},${merchant.longitude}`;
  }
  const query =
    merchant.businessAddress ||
    [merchant.location, merchant.city, merchant.name].filter(Boolean).join(', ');
  if (!query) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}
