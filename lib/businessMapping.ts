import { parseCoordinate } from '@/lib/geo';
import { formatMerchantName } from '@/lib/formatMerchantName';
import { getBusinessPublicRatingStats } from '@/lib/businessReviews';
import { parseBusinessServices } from '@/lib/parseBusinessServices';

function parseBusinessServicesFromRecord(business: {
  serviceCategory?: string | null;
  keywords?: string[] | null;
}): string[] {
  return parseBusinessServices(business.serviceCategory);
}

export function mapBusinessRecord(business: Record<string, unknown>) {
  const { password: _password, ...safeBusiness } = business;
  const { rating, reviewCount } = getBusinessPublicRatingStats(safeBusiness.review);
  const services = parseBusinessServicesFromRecord({
    serviceCategory: business.serviceCategory as string | null | undefined,
    keywords: business.keywords as string[] | null | undefined,
  });

  const rawBusinessName = (safeBusiness.businessName as string) || '';
  const rawDisplayName = (safeBusiness.displayName as string) || '';
  const formattedBusinessName = formatMerchantName(rawBusinessName) || rawBusinessName;
  const formattedDisplayName = formatMerchantName(rawDisplayName) || rawDisplayName;
  const displayName =
    formattedBusinessName || formattedDisplayName || formatMerchantName('Business') || 'Business';

  return {
    ...safeBusiness,
    id: safeBusiness.id as string,
    slug: (safeBusiness.slug as string | null | undefined) ?? null,
    businessName: formattedBusinessName,
    name: displayName,
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
    image: (safeBusiness.profilePictureUrl as string) || undefined,
    profilePictureUrl: (safeBusiness.profilePictureUrl as string) || undefined,
    priceRange: safeBusiness.selectedPlan === 'free' ? 'Free listing' : 'Premium listing',
    rating,
    reviewsCount: reviewCount,
    services,
    website: (business.website as string) || undefined,
    instagramUrl: (business.instagramUrl as string) || undefined,
    facebookUrl: (business.facebookUrl as string) || undefined,
    whatsappNumber: (business.whatsappNumber as string) || undefined,
    youtubeUrl: (business.youtubeUrl as string) || undefined,
    timings: business.timings,
    yearsInBusiness:
      typeof business.yearsInBusiness === 'number' ? business.yearsInBusiness : null,
    isFinderBVerified: Boolean(business.isFinderBVerified || business.isVerified),
    paymentModes: Array.isArray(business.paymentModes) ? business.paymentModes : [],
    email: (business.email as string) || (business.workEmail as string) || undefined,
    businessAddress: (business.businessAddress as string) || undefined,
    images: Array.isArray(business.images) ? business.images : [],
    latitude: parseCoordinate(business.latitude),
    longitude: parseCoordinate(business.longitude),
    hasVerifiedBadge: Boolean(
      business.hasVerifiedBadge || business.isFinderBVerified || business.isVerified
    ),
    review: business.review,
    reviewReply: business.reviewReply,
    keywords: Array.isArray(business.keywords) ? business.keywords : [],
    discountRange: (business.discountRange as string | null) ?? null,
    displayName: formattedDisplayName || null,
    registrationNumber: (business.registrationNumber as string | null) ?? null,
  };
}
