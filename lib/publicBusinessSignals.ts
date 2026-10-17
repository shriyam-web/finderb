import { getProfileCompletion } from '@/lib/dashboard/profileCompletion';
import { getBusinessPublicRatingStats } from '@/lib/businessReviews';
import { averageLeadResponseMs, formatResponseDuration } from '@/lib/leadRead';
import { getPublicSupabase } from '@/lib/supabase/public';

/** A public rating counts as good once several reviews sit at 4 or above. */
const GOOD_REVIEW_RATING = 4;
const GOOD_REVIEW_COUNT = 3;
/** Replies within about 4 hours count as a good response time. */
const GOOD_RESPONSE_MS = 4 * 60 * 60 * 1000;

export type PublicBusinessSignals = {
  bestInCategory: boolean;
  averageResponse: string | null;
};

function completionSource(business: Record<string, unknown>): Record<string, unknown> {
  return {
    ...business,
    ownerName: business.ownerName || business.owner_name,
    ownerMobile: business.ownerMobile || business.owner_mobile,
  };
}

export async function loadPublicBusinessSignals(
  business: Record<string, unknown>,
): Promise<PublicBusinessSignals> {
  const empty: PublicBusinessSignals = { bestInCategory: false, averageResponse: null };
  const businessId = String(business.id || '').trim();
  if (!businessId) return empty;

  const { rating, reviewCount } = getBusinessPublicRatingStats(business.review);
  let completion = 0;
  try {
    completion = getProfileCompletion(completionSource(business)).percentage;
  } catch {
    completion = 0;
  }
  let averageResponseMs: number | null = null;

  try {
    const supabase = getPublicSupabase();
    const { data, error } = await supabase
      .from('leads')
      .select('created_at, merchant_read_at')
      .eq('business_id', businessId);
    if (!error && data) {
      averageResponseMs = averageLeadResponseMs(data);
    }
  } catch {
    averageResponseMs = null;
  }

  const goodReviews =
    rating != null && rating >= GOOD_REVIEW_RATING && reviewCount >= GOOD_REVIEW_COUNT;
  const goodResponse = averageResponseMs != null && averageResponseMs <= GOOD_RESPONSE_MS;

  return {
    bestInCategory: goodReviews && goodResponse && completion > 90,
    averageResponse: averageResponseMs == null ? null : formatResponseDuration(averageResponseMs),
  };
}
