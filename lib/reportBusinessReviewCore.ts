import {
  BUSINESS_REVIEW_FLAGS_PER_MONTH,
  isReviewVisibleToMerchant,
  parseBusinessReviews,
  publicReviewAuthor,
} from '@/lib/businessReviews';
import { countBusinessReviewFlagsThisMonth } from '@/lib/reviewModeration.server';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { createServiceClient } from '@/lib/supabase/service';

export type ReportReviewResult =
  | { success: true; alreadyReported: boolean }
  | { success: false; error: string };

/** `reporterKey` must come from a verified session (`user:<id>` or `business:<id>`). */
export async function reportBusinessReviewAs(
  reporterKey: string,
  data: { businessId: string; reviewId: string; reason: string },
): Promise<ReportReviewResult> {
  try {
    const writeLimit = await enforceRateLimit('write', 'review-report');
    if (!writeLimit.ok) return { success: false, error: writeLimit.error };

    const businessId = data.businessId?.trim();
    const reviewId = data.reviewId?.trim();
    const reason = data.reason?.trim();
    if (!businessId) return { success: false, error: 'Business ID is required' };
    if (!reviewId) return { success: false, error: 'Review ID is required' };
    if (!reason || reason.length < 8) {
      return { success: false, error: 'Please tell us why you are flagging this review.' };
    }
    if (reason.length > 500) {
      return { success: false, error: 'Reason must be 500 characters or fewer.' };
    }

    const service = createServiceClient();
    if (!service) {
      return { success: false, error: 'Reporting is temporarily unavailable.' };
    }

    const { data: business, error: fetchError } = await service
      .from('Business')
      .select('review, businessName')
      .eq('id', businessId)
      .single();

    if (fetchError || !business) {
      return { success: false, error: 'Business not found' };
    }

    const review = parseBusinessReviews(business.review).find(
      (entry) => entry.id === reviewId && isReviewVisibleToMerchant(entry)
    );
    if (!review) {
      return { success: false, error: 'Review not found' };
    }

    const isBusinessReporter = reporterKey.startsWith('business:');
    if (isBusinessReporter) {
      const used = await countBusinessReviewFlagsThisMonth(businessId);
      if (used >= BUSINESS_REVIEW_FLAGS_PER_MONTH) {
        return {
          success: false,
          error: `You can flag ${BUSINESS_REVIEW_FLAGS_PER_MONTH} reviews per month. Please try again next month.`,
        };
      }
    }

    const { error: insertError } = await service.from('review_reports').insert({
      business_id: businessId,
      review_id: reviewId,
      reporter_key: reporterKey,
      reporter_type: isBusinessReporter ? 'business' : 'user',
      status: 'open',
      reason,
    });

    if (insertError) {
      if (insertError.code === '23505') {
        return { success: true, alreadyReported: true };
      }
      throw insertError;
    }

    if (!isBusinessReporter) {
      const author = publicReviewAuthor(review);
      await service.from('merchant_notifications').insert({
        business_id: businessId,
        type: 'review_reported',
        title: 'Review reported',
        body: `A review from ${author.trim() || 'a customer'} was flagged: ${reason}`,
        metadata: {
          reviewId,
          author,
          reporterKey,
          reason,
        },
      });
    }

    return { success: true, alreadyReported: false };
  } catch (error) {
    console.error('Report Business Review Error:', error);
    return { success: false, error: 'Failed to report review. Please try again.' };
  }
}
