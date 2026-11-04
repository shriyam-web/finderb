import { hasBusinessMapPin, isBusinessWhatsappVerified } from './unverifiedContact';

export type MerchantReview = {
  id: string;
  author: string;
  content: string;
  rating: number;
  date: string;
  userId?: string;
  authorVerified?: boolean;
  anonymous?: boolean;
  hidden?: boolean;
  merchantReply?: { content: string };
};

function maskReviewAuthorName(name: string): string {
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
  phoneVerified: boolean;
  emailVerified: boolean;
  whatsappVerified: boolean;
  hasMapPin: boolean;
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

/**
 * Phone uploads are often HEIC, and Cloudinary `f_auto` can answer with AVIF.
 * Android's image decoder then paints a blank frame. Always ask for a JPEG.
 */
function forceCloudinaryJpeg(url: string): string {
  const marker = '/upload/';
  const idx = url.indexOf(marker);
  if (idx < 0) return url;
  const after = url.slice(idx + marker.length);
  const slash = after.indexOf('/');
  const first = slash === -1 ? after : after.slice(0, slash);
  const rest = slash === -1 ? '' : after.slice(slash + 1);
  const versionOnly = /^v\d+$/.test(first);
  const looksLikeTransform =
    !versionOnly &&
    (first.includes(',') ||
      /^(f_|w_|h_|q_|c_|g_|e_|dpr_|fl_|b_|a_|ar_|bo_|t_|l_|o_)/.test(first));
  if (!looksLikeTransform) {
    return `${url.slice(0, idx + marker.length)}f_jpg,q_auto,c_limit,w_720/${after}`;
  }
  let chain = /(^|,)f_[a-z0-9]+/.test(first)
    ? first.replace(/(^|,)f_[a-z0-9]+/, '$1f_jpg')
    : `f_jpg,${first}`;
  if (!/(^|,)q_/.test(chain)) chain = `${chain},q_auto`;
  if (!/(^|,)w_/.test(chain) && !/(^|,)h_/.test(chain)) chain = `${chain},c_limit,w_720`;
  return `${url.slice(0, idx + marker.length)}${chain}${rest ? `/${rest}` : ''}`;
}

/** Smaller JPEG for list cards so photos appear with the business, not after it. */
export function listingThumbUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  return url.replace(/w_\d+/, 'w_360').replace('c_limit', 'c_fill');
}

/** Same photo at a chosen width and Cloudinary quality, still forced to JPEG. */
export function cloudinarySized(
  url: string | null | undefined,
  width: number,
  quality: 'auto:low' | 'auto:good' | 'auto:best',
): string | null {
  if (!url) return null;
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  const marker = '/upload/';
  const idx = url.indexOf(marker);
  const after = url.slice(idx + marker.length);
  const slash = after.indexOf('/');
  const first = slash === -1 ? after : after.slice(0, slash);
  const rest = slash === -1 ? '' : after.slice(slash);
  const q = `q_${quality}`;
  const versionOnly = slash <= 0 || /^v\d+$/.test(first);
  if (versionOnly) {
    return `${url.slice(0, idx + marker.length)}f_jpg,${q},c_limit,w_${width}/${after}`;
  }
  let chain = /(^|,)f_[a-z0-9]+/.test(first)
    ? first.replace(/(^|,)f_[a-z0-9]+/, '$1f_jpg')
    : `f_jpg,${first}`;
  chain = /(^|,)q_[^,]*/.test(chain) ? chain.replace(/(^|,)q_[^,]*/, `$1${q}`) : `${chain},${q}`;
  chain = /(^|,)w_\d+/.test(chain) ? chain.replace(/(^|,)w_\d+/, `$1w_${width}`) : `${chain},c_limit,w_${width}`;
  return `${url.slice(0, idx + marker.length)}${chain}${rest}`;
}

/** Make a stored photo URL loadable in the app, including Cloudinary originals. */
function normalizeImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  let url = value.trim().replace(/^['"]+|['"]+$/g, '');
  if (!url || url === 'Not Set') return null;
  if (url.startsWith('//')) url = `https:${url}`;
  else if (url.startsWith('http://')) url = `https://${url.slice('http://'.length)}`;
  if (url.includes(' ')) url = encodeURI(url);
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    url = forceCloudinaryJpeg(url);
  }
  return url;
}

function urlFromGalleryItem(item: unknown): string | null {
  if (typeof item === 'string') return normalizeImageUrl(item);
  if (!item || typeof item !== 'object') return null;
  const record = item as Record<string, unknown>;
  return normalizeImageUrl(record.secure_url ?? record.url ?? record.src);
}

/** Postgres text[] sometimes arrives as `{a,b}` instead of a JS array. */
function splitPgArray(raw: string): string[] | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return null;
  const body = trimmed.slice(1, -1);
  if (!body.trim()) return [];
  const out: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    if (quoted) {
      if (ch === '"' && body[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (ch === '\\' && body[i + 1]) {
        current += body[i + 1];
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      out.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  out.push(current.trim());
  return out.filter(Boolean);
}

function galleryItems(images: unknown): unknown[] {
  if (Array.isArray(images)) return images;
  if (typeof images !== 'string') return [];
  const trimmed = images.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return Array.isArray(parsed) ? parsed : [trimmed];
  } catch {
    return splitPgArray(trimmed) ?? [trimmed];
  }
}

function parseGallery(images: unknown, profile: string | null): string[] {
  const list: string[] = [];
  const seen = new Set<string>();
  const push = (url: string | null) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    list.push(url);
  };
  push(normalizeImageUrl(profile));
  for (const item of galleryItems(images)) {
    if (typeof item === 'string' && (item.trim().startsWith('[') || item.trim().startsWith('{'))) {
      for (const nested of galleryItems(item)) push(urlFromGalleryItem(nested));
      continue;
    }
    push(urlFromGalleryItem(item));
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
    if (entry.deleted) return null;
    const rating = Number(entry.rating);
    const anonymous =
      Boolean(entry.anonymous) && String(entry.anonymityStatus || '') !== 'revealed';
    const rawAuthor = String(entry.author || entry.name || 'Customer').trim() || 'Customer';
    return {
      id: String(entry.id || `r-${index}`),
      author: anonymous ? maskReviewAuthorName(rawAuthor) : rawAuthor,
      content,
      rating: Number.isFinite(rating) ? rating : 5,
      date: String(entry.date || entry.createdAt || '').trim(),
      userId: typeof entry.userId === 'string' ? entry.userId : undefined,
      authorVerified: anonymous ? false : entry.authorVerified === true,
      anonymous: anonymous || undefined,
      hidden: Boolean(entry.hidden) || undefined,
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

export const PUBLIC_REVIEW_PREVIEW = 5;
export const PUBLIC_REVIEW_PAGE = 50;

/** Newest dated reviews first. Undated rows keep their stored order after those. */
export function reviewsNewestFirst(reviews: MerchantReview[]): MerchantReview[] {
  return [...reviews].sort((a, b) => {
    const at = Date.parse(a.date || '');
    const bt = Date.parse(b.date || '');
    const aOk = Number.isFinite(at);
    const bOk = Number.isFinite(bt);
    if (aOk && bOk && at !== bt) return bt - at;
    if (aOk && !bOk) return -1;
    if (!aOk && bOk) return 1;
    return 0;
  });
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
  const rawName = displayName || businessName || 'Business';
  const name = rawName.length <= 50 ? rawName : `${rawName.slice(0, 49).trimEnd()}…`;
  const reviews = parseReviews(row.review).filter((review) => !review.hidden);
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
    phoneVerified: Boolean(row.mobileVerified),
    emailVerified: Boolean(row.emailVerified),
    whatsappVerified: isBusinessWhatsappVerified({
      whatsappVerified: Boolean(row.whatsappVerified),
      whatsappNumber: firstUrl(row.whatsappNumber),
      publicPhone: String(row.publicPhone || ''),
      mobile: String(row.mobile || ''),
      mobileVerified: Boolean(row.mobileVerified),
    }),
    hasMapPin: hasBusinessMapPin({
      latitude: parseCoordinate(row.latitude),
      longitude: parseCoordinate(row.longitude),
    }),
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

export function directionsHref(
  merchant: Pick<
    Merchant,
    'latitude' | 'longitude' | 'businessAddress' | 'location' | 'city' | 'name'
  >,
  origin?: { lat: number; lng: number } | null,
): string | null {
  if (merchant.latitude != null && merchant.longitude != null) {
    const from =
      origin && Number.isFinite(origin.lat) && Number.isFinite(origin.lng)
        ? `&origin=${origin.lat},${origin.lng}`
        : '';
    return `https://www.google.com/maps/dir/?api=1&destination=${merchant.latitude},${merchant.longitude}${from}&travelmode=driving`;
  }
  const query =
    merchant.businessAddress ||
    [merchant.location, merchant.city, merchant.name].filter(Boolean).join(', ');
  if (!query) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}
