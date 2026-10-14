'use server';

import { createDataClient } from '@/utils/supabase/server';
import {
  BUSINESS_REVIEW_FLAGS_PER_MONTH,
  normalizeReviewReplyForStorage,
  parseBusinessReviews,
  serializeBusinessReviewsForStorage,
  toMerchantReviews,
  validateReviewReplyContent,
} from '@/lib/businessReviews';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { assertBusinessSession, getSessionBusinessId, getSessionUserId } from '@/lib/security/session';
import { revalidateBusinessProfilePaths } from '@/lib/businessRevalidation';
import { submitBusinessReviewForUser } from '@/lib/submitBusinessReviewCore';
import { reportBusinessReviewAs } from '@/lib/reportBusinessReviewCore';
import { countBusinessReviewFlagsThisMonth } from '@/lib/reviewModeration.server';
import { userOwnsOrManagesBusiness } from '@/lib/reviewIdentity.server';

async function getLoggedInUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const supabase = await createDataClient();
  const { data: user, error } = await supabase
    .from('User')
    .select('id, fullName')
    .eq('id', userId)
    .single();

  if (error || !user) return null;
  return user as { id: string; fullName: string };
}

export async function getBusinessReviewEligibility(businessId: string) {
  const listingId = businessId?.trim();
  if (!listingId) {
    return { canReview: false as const, reason: 'missing' as const };
  }

  const businessSessionId = await getSessionBusinessId();
  if (businessSessionId && businessSessionId === listingId) {
    return { canReview: false as const, reason: 'own' as const };
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return { canReview: false as const, reason: 'login' as const };
  }

  if (await userOwnsOrManagesBusiness(userId, listingId)) {
    return { canReview: false as const, reason: 'own' as const };
  }

  return { canReview: true as const, reason: null };
}

export async function getMerchantReviewFlagQuota(businessId: string) {
  const listingId = businessId?.trim();
  if (!listingId) {
    return { success: false as const, error: 'Business ID is required' };
  }
  const auth = await assertBusinessSession(listingId);
  if (!auth.ok) return { success: false as const, error: auth.error };
  const used = await countBusinessReviewFlagsThisMonth(listingId);
  return {
    success: true as const,
    flagsUsed: used,
    flagsRemaining: Math.max(0, BUSINESS_REVIEW_FLAGS_PER_MONTH - used),
    flagsLimit: BUSINESS_REVIEW_FLAGS_PER_MONTH,
  };
}

export async function submitBusinessReview(data: {
  businessId: string;
  rating: number;
  content: string;
  anonymous?: boolean;
  anonymousReason?: string;
}) {
  const writeLimit = await enforceRateLimit('write', 'business-review');
  if (!writeLimit.ok) return { success: false as const, error: writeLimit.error };

  const user = await getLoggedInUser();
  if (!user) {
    return { success: false as const, error: 'Please log in to post a review.' };
  }

  return submitBusinessReviewForUser({
    userId: user.id,
    fullName: user.fullName,
    businessId: data.businessId,
    rating: data.rating,
    content: data.content,
    anonymous: data.anonymous,
    anonymousReason: data.anonymousReason,
  });
}

export async function upsertMerchantReviewReply(data: {
  businessId: string;
  reviewId: string;
  content: string;
}) {
  try {
    const writeLimit = await enforceRateLimit('write', 'merchant-review-reply');
    if (!writeLimit.ok) return { success: false as const, error: writeLimit.error };

    const businessId = data.businessId?.trim();
    const reviewId = data.reviewId?.trim();
    const content = data.content ?? '';

    if (!businessId) return { success: false as const, error: 'Business ID is required' };
    if (!reviewId) return { success: false as const, error: 'Review ID is required' };

    const validationError = validateReviewReplyContent(content);
    if (validationError) {
      return { success: false as const, error: validationError };
    }

    const merchantReply = normalizeReviewReplyForStorage(content);
    if (!merchantReply) {
      return { success: false as const, error: 'Reply cannot be empty' };
    }

    const auth = await assertBusinessSession(businessId);
    if (!auth.ok) {
      return { success: false as const, error: auth.error };
    }

    const supabase = await createDataClient();
    const { data: business, error: fetchError } = await supabase
      .from('Business')
      .select('review, slug, businessName, city')
      .eq('id', businessId)
      .single();

    if (fetchError || !business) {
      return { success: false as const, error: 'Business not found' };
    }

    const reviews = parseBusinessReviews(business.review);
    const reviewIndex = reviews.findIndex((review) => review.id === reviewId);
    if (reviewIndex === -1) {
      return { success: false as const, error: 'Review not found' };
    }

    const nextReviews = reviews.map((review, index) =>
      index === reviewIndex ? { ...review, merchantReply } : review
    );

    const { error: updateError } = await supabase
      .from('Business')
      .update({
        review: serializeBusinessReviewsForStorage(nextReviews),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', businessId);

    if (updateError) throw updateError;

    revalidateBusinessProfilePaths({
      id: businessId,
      slug: business.slug,
      businessName: business.businessName,
      city: business.city,
    });

    return {
      success: true as const,
      reviews: toMerchantReviews(nextReviews),
    };
  } catch (error) {
    console.error('Upsert Merchant Review Reply Error:', error);
    return { success: false as const, error: 'Failed to save reply. Please try again.' };
  }
}

async function getReviewReporterKey(): Promise<string | null> {
  const userId = await getSessionUserId();
  if (userId) return `user:${userId}`;

  const businessId = await getSessionBusinessId();
  if (businessId) return `business:${businessId}`;

  return null;
}

export async function reportBusinessReview(data: {
  businessId: string;
  reviewId: string;
  reason: string;
}) {
  const reporterKey = await getReviewReporterKey();
  if (!reporterKey) {
    return { success: false as const, error: 'Please sign in to report a review.' };
  }
  return reportBusinessReviewAs(reporterKey, data);
}

export async function flagMerchantReview(data: {
  businessId: string;
  reviewId: string;
  reason: string;
}) {
  const businessId = data.businessId?.trim();
  if (!businessId) return { success: false as const, error: 'Business ID is required' };

  const auth = await assertBusinessSession(businessId);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  const result = await reportBusinessReviewAs(`business:${businessId}`, {
    businessId,
    reviewId: data.reviewId,
    reason: data.reason,
  });
  if (!result.success) return result;

  const used = await countBusinessReviewFlagsThisMonth(businessId);
  return {
    ...result,
    flagsUsed: used,
    flagsRemaining: Math.max(0, BUSINESS_REVIEW_FLAGS_PER_MONTH - used),
    flagsLimit: BUSINESS_REVIEW_FLAGS_PER_MONTH,
  };
}
