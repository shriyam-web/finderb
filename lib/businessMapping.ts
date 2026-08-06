import { parseCoordinate } from '@/lib/geo';
import { pickPublicBusinessEmail } from '@/lib/placeholderEmail';
import { formatMerchantName } from '@/lib/formatMerchantName';
import { getBusinessPublicRatingStats } from '@/lib/businessReviews';
import { hasPublicTrustBadge } from '@/lib/businessVerification';
import { parseBusinessServices } from '@/lib/parseBusinessServices';
import { getPlanDisplayName } from '@/lib/subscription/merchantSubscription';
import { normalizeExternalHref } from '@/lib/validateProfileUrl';

function parseBusinessServicesFromRecord(business: {
  serviceCategory?: string | null;
  keywords?: string[] | null;
}): string[] {
  return parseBusinessServices(business.serviceCategory);
}

/** Used when a listing image is missing or fails to load. */
export const BUSINESS_IMAGE_FALLBACK = '/fallback.jpg';

function firstNonEmptyUrl(...candidates: unknown[]): string | undefined {
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    const trimmed = candidate.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

/** Normalize gallery payloads from Supabase/Prisma (array, JSON string, empties). */
export function normalizeBusinessImages(images: unknown): string[] {
  let list: unknown[] = [];

  if (Array.isArray(images)) {
    list = images;
  } else if (typeof images === 'string') {
    const trimmed = images.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      list = Array.isArray(parsed) ? parsed : [trimmed];
    } catch {
      list = [trimmed];
    }
  }

  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    const url = firstNonEmptyUrl(item);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

function firstGalleryImage(images: unknown): string | undefined {
  return normalizeBusinessImages(images)[0];
}

/** Best photo for cards/lists: profile pic, then first gallery image. */
export function getBusinessListingImage(business: {
  profilePictureUrl?: string | null;
  image?: string | null;
  images?: unknown;
}): string | undefined {
  return firstNonEmptyUrl(
    business.profilePictureUrl,
    business.image,
    firstGalleryImage(business.images)
  );
}

/** Always returns a usable image URL for next/image. */
export function resolveBusinessListingImage(business: {
  profilePictureUrl?: string | null;
  image?: string | null;
  images?: unknown;
}): string {
  return getBusinessListingImage(business) || BUSINESS_IMAGE_FALLBACK;
}

/** Cover + gallery, de-duplicated, for profile / My Listing photo strips. */
export function getBusinessGalleryImages(business: {
  profilePictureUrl?: string | null;
  image?: string | null;
  images?: unknown;
}): string[] {
  const gallery = normalizeBusinessImages(business.images);
  const cover = firstNonEmptyUrl(business.profilePictureUrl, business.image);
  if (!cover) return gallery;
  return [cover, ...gallery.filter((url) => url !== cover)];
}

/** Keep cover in the gallery array so merchant Settings always shows uploaded photos. */
export function syncBusinessImagesWithCover(
  images: unknown,
  profilePictureUrl?: string | null
): string[] {
  const gallery = normalizeBusinessImages(images);
  const cover = firstNonEmptyUrl(profilePictureUrl);
  if (!cover) return gallery;
  if (gallery.includes(cover)) return gallery;
  return [cover, ...gallery];
}

/** Public listings require at least one usable photo (profile or gallery). */
export function businessHasPublicPhoto(business: {
  profilePictureUrl?: string | null;
  image?: string | null;
  images?: unknown;
}): boolean {
  return Boolean(getBusinessListingImage(business));
}

export function filterBusinessesWithPublicPhotos<
  T extends {
    profilePictureUrl?: string | null;
    image?: string | null;
    images?: unknown;
  },
>(businesses: T[]): T[] {
  return businesses.filter(businessHasPublicPhoto);
}

export function mapBusinessRecord(business: Record<string, unknown>) {
  const {
    password: _password,
    owner_name: _ownerName,
    owner_mobile: _ownerMobile,
    ...safeBusiness
  } = business;
  const { rating, reviewCount } = getBusinessPublicRatingStats(safeBusiness.review);
  const services = parseBusinessServicesFromRecord({
    serviceCategory: business.serviceCategory as string | null | undefined,
    keywords: business.keywords as string[] | null | undefined,
  });

  const rawBusinessName = (safeBusiness.businessName as string) || '';
  const rawDisplayName = (safeBusiness.displayName as string) || '';
  const formattedBusinessName = formatMerchantName(rawBusinessName) || rawBusinessName;
  const formattedDisplayName = formatMerchantName(rawDisplayName) || rawDisplayName;
  const publicName =
    formattedDisplayName || formattedBusinessName || formatMerchantName('Business') || 'Business';

  const profilePictureUrl = firstNonEmptyUrl(safeBusiness.profilePictureUrl);
  const galleryImages = syncBusinessImagesWithCover(business.images, profilePictureUrl);
  const listingImage = profilePictureUrl || galleryImages[0];

  return {
    ...safeBusiness,
    id: safeBusiness.id as string,
    slug: (safeBusiness.slug as string | null | undefined) ?? null,
    businessName: formattedBusinessName,
    name: publicName,
    location: (safeBusiness.location as string) || (safeBusiness.city as string) || '',
    city: (safeBusiness.city as string | null) ?? null,
    state: (safeBusiness.state as string | null) ?? null,
    country: (safeBusiness.country as string | null) ?? null,
    category: (safeBusiness.category as string) || '',
    description: (safeBusiness.about as string) || '',
    about: (safeBusiness.about as string | null) ?? null,
    contact: (safeBusiness.publicPhone as string) || '',
    publicPhone: (safeBusiness.publicPhone as string) || '',
    mobile: (safeBusiness.mobile as string) || '',
    serviceCategory: (safeBusiness.serviceCategory as string | null) ?? null,
    profileQrLink: (safeBusiness.profileQrLink as string | null) ?? null,
    image: listingImage,
    profilePictureUrl,
    priceRange: `${getPlanDisplayName(
      safeBusiness.selectedPlan as string | undefined,
      safeBusiness.billingCycle as string | undefined,
    )} plan`,
    rating,
    reviewsCount: reviewCount,
    services,
    website: normalizeExternalHref(business.website as string) || undefined,
    instagramUrl: normalizeExternalHref(business.instagramUrl as string) || undefined,
    facebookUrl: normalizeExternalHref(business.facebookUrl as string) || undefined,
    whatsappNumber: (business.whatsappNumber as string) || undefined,
    youtubeUrl: normalizeExternalHref(business.youtubeUrl as string) || undefined,
    timings: business.timings,
    yearsInBusiness:
      typeof business.yearsInBusiness === 'number' ? business.yearsInBusiness : null,
    isFinderBVerified: hasPublicTrustBadge({
      isFinderBVerified: Boolean(business.isFinderBVerified),
      hasVerifiedBadge: Boolean(business.hasVerifiedBadge),
    }),
    paymentModes: Array.isArray(business.paymentModes) ? business.paymentModes : [],
    // Placeholder logins (…@finderb.com) are credentials, not contact info —
    // skip them so those profiles read as "email missing" everywhere.
    email: pickPublicBusinessEmail(
      business.email as string | null | undefined,
      business.workEmail as string | null | undefined,
    ),
    businessAddress: (business.businessAddress as string) || undefined,
    images: galleryImages,
    latitude: parseCoordinate(business.latitude),
    longitude: parseCoordinate(business.longitude),
    hasVerifiedBadge: hasPublicTrustBadge({
      isFinderBVerified: Boolean(business.isFinderBVerified),
      hasVerifiedBadge: Boolean(business.hasVerifiedBadge),
    }),
    review: business.review,
    reviewReply: business.reviewReply,
    keywords: Array.isArray(business.keywords) ? business.keywords : [],
    discountRange: (business.discountRange as string | null) ?? null,
    displayName: formattedDisplayName || null,
    registrationNumber: (business.registrationNumber as string | null) ?? null,
    hasActiveJobs: Boolean(business.hasActiveJobs),
  };
}

/** Merchant dashboard record — includes private owner contact fields. */
export function mapOwnedBusinessRecord(business: Record<string, unknown>) {
  return {
    ...mapBusinessRecord(business),
    status: String(business.status || 'Pending'),
    ownerName: String(business.owner_name || '').trim(),
    ownerMobile: String(business.owner_mobile || '').trim(),
    kycStatus: String(business.kycStatus || 'pending'),
  };
}
