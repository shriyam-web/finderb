import type { Business } from '@/lib/mockData';
import { isValidEstablishmentYear } from '@/lib/establishmentYear';

function hasText(value?: string | null, minLength = 2): boolean {
  const text = value?.trim();
  return Boolean(text && text.length >= minLength);
}

function hasTimings(timings: unknown): boolean {
  if (!timings || typeof timings !== 'object') return false;

  return Object.values(timings as Record<string, unknown>).some((entry) => {
    if (!entry || entry === 'Closed') return false;
    if (typeof entry === 'object' && (entry as { isClosed?: boolean }).isClosed) return false;
    return true;
  });
}

function hasReviews(review: unknown): boolean {
  if (!review) return false;
  if (Array.isArray(review)) return review.length > 0;
  if (typeof review === 'string') return review.trim().length > 0;
  if (typeof review === 'object') return Object.keys(review as object).length > 0;
  return false;
}

/** Higher score = more complete public profile. Used to rank featured listings. */
export function getBusinessProfileCompletenessScore(business: Business): number {
  let score = 0;

  if (business.profilePictureUrl || business.image) score += 12;

  const galleryCount = business.images?.length ?? 0;
  score += Math.min(galleryCount, 4) * 4;

  const about = business.about || business.description;
  if (hasText(about, 20)) score += 14;
  else if (hasText(about)) score += 7;

  if (hasText(business.businessAddress, 8)) score += 6;
  if (hasText(business.location)) score += 4;
  if (hasText(business.city)) score += 3;
  if (hasText(business.state)) score += 2;
    if (business?.latitude != null && business?.longitude != null && !(business.latitude === 0 && business.longitude === 0)) {
      score += 4;
    }

  if (hasText(business.category)) score += 5;
  if (hasText(business.contact)) score += 8;
  if (hasText(business.whatsappNumber)) score += 5;
  if (hasText(business.email)) score += 5;

  if (hasText(business.website)) score += 5;
  if (hasText(business.instagramUrl)) score += 3;
  if (hasText(business.facebookUrl)) score += 3;
  if (hasText(business.youtubeUrl)) score += 3;

  if (hasTimings(business.timings)) score += 8;
  if (isValidEstablishmentYear(business.yearsInBusiness)) score += 3;

  const serviceCount = business.services?.length ?? 0;
  if (serviceCount >= 3) score += 8;
  else if (serviceCount > 0) score += 4;

  const keywordCount = business.keywords?.length ?? 0;
  if (keywordCount >= 3) score += 4;
  else if (keywordCount > 0) score += 2;

  const paymentCount = business.paymentModes?.length ?? 0;
  if (paymentCount > 0) score += 3;

  if (
    business.discountRange &&
    business.discountRange !== 'No Discount' &&
    business.discountRange !== 'Seasonal Offer'
  ) {
    score += 2;
  }
  if (hasReviews(business.review)) score += 6;

  return score;
}

export function sortBusinessesByProfileCompleteness<T extends Business>(businesses: T[]): T[] {
  return [...businesses].sort((a, b) => {
    const scoreDiff =
      getBusinessProfileCompletenessScore(b) - getBusinessProfileCompletenessScore(a);
    if (scoreDiff !== 0) return scoreDiff;

    const reviewDiff = (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0);
    if (reviewDiff !== 0) return reviewDiff;

    return a.name.localeCompare(b.name);
  });
}
