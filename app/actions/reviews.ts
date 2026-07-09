'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { revalidateBusinessProfilePaths } from '@/lib/businessRevalidation';
import {
  averageReviewRating,
  normalizeReviewReplyForStorage,
  parseBusinessReviews,
  serializeBusinessReviewsForStorage,
  validateReviewReplyContent,
  type BusinessReview,
} from '@/lib/businessReviews';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { assertBusinessSession } from '@/lib/security/session';
import { createMerchantReviewNotification } from '@/app/actions/merchantNotifications';
import { createServiceClient } from '@/lib/supabase/service';

async function getLoggedInUser() {
  const userId = (await cookies()).get('user_id')?.value;
  if (!userId) return null;

  const supabase = createClient(await cookies());
  const { data: user, error } = await supabase
    .from('User')
    .select('id, fullName')
    .eq('id', userId)
    .single();

  if (error || !user) return null;
  return user as { id: string; fullName: string };
}

export async function submitBusinessReview(data: {
  businessId: string;
  rating: number;
  content: string;
}) {
  try {
    const writeLimit = await enforceRateLimit('write', 'business-review');
    if (!writeLimit.ok) return { success: false as const, error: writeLimit.error };

    const user = await getLoggedInUser();
    if (!user) {
      return { success: false as const, error: 'Please log in to post a review.' };
    }

    const businessId = data.businessId?.trim();
    const content = data.content?.trim();
    const rating = Number(data.rating);

    if (!businessId) return { success: false as const, error: 'Business ID is required' };
    if (!content || content.length < 10) {
      return { success: false as const, error: 'Please write at least 10 characters' };
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return { success: false as const, error: 'Please select a rating' };
    }

    const supabase = createClient(await cookies());
    const { data: business, error: fetchError } = await supabase
      .from('Business')
      .select('review, rating, slug, businessName, city')
      .eq('id', businessId)
      .single();

    if (fetchError || !business) {
      return { success: false as const, error: 'Business not found' };
    }

    const existing = parseBusinessReviews(business.review);
    if (existing.some((review) => review.userId === user.id)) {
      return { success: false as const, error: 'You have already reviewed this business.' };
    }

    const newReview: BusinessReview = {
      id: crypto.randomUUID(),
      author: user.fullName?.trim() || 'FinderB user',
      content,
      rating,
      date: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      userId: user.id,
      authorVerified: true,
    };

    const nextReviews = [newReview, ...existing];
    const nextRating = averageReviewRating(nextReviews);

    const { error: updateError } = await supabase
      .from('Business')
      .update({
        review: serializeBusinessReviewsForStorage(nextReviews),
        rating: nextRating,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', businessId);

    if (updateError) throw updateError;

    await createMerchantReviewNotification({
      businessId,
      reviewId: newReview.id,
      author: newReview.author,
      rating: newReview.rating,
    });

    revalidateBusinessProfilePaths({
      id: businessId,
      slug: business.slug,
      businessName: business.businessName,
      city: business.city,
    });
    return {
      success: true as const,
      reviews: nextReviews,
      rating: nextRating,
    };
  } catch (error) {
    console.error('Submit Business Review Error:', error);
    return { success: false as const, error: 'Failed to submit review. Please try again.' };
  }
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

    const supabase = createClient(await cookies());
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
      reviews: nextReviews,
    };
  } catch (error) {
    console.error('Upsert Merchant Review Reply Error:', error);
    return { success: false as const, error: 'Failed to save reply. Please try again.' };
  }
}

async function getReviewReporterKey(): Promise<string | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;
  if (userId) return `user:${userId}`;

  const businessId = cookieStore.get('business_id')?.value;
  if (businessId) return `business:${businessId}`;

  return null;
}

export async function reportBusinessReview(data: {
  businessId: string;
  reviewId: string;
  reason: string;
}) {
  try {
    const writeLimit = await enforceRateLimit('write', 'review-report');
    if (!writeLimit.ok) return { success: false as const, error: writeLimit.error };

    const businessId = data.businessId?.trim();
    const reviewId = data.reviewId?.trim();
    const reason = data.reason?.trim();
    if (!businessId) return { success: false as const, error: 'Business ID is required' };
    if (!reviewId) return { success: false as const, error: 'Review ID is required' };
    if (!reason || reason.length < 8) {
      return { success: false as const, error: 'Please tell us why you are flagging this review.' };
    }
    if (reason.length > 500) {
      return { success: false as const, error: 'Reason must be 500 characters or fewer.' };
    }

    const reporterKey = await getReviewReporterKey();
    if (!reporterKey) {
      return { success: false as const, error: 'Please sign in to report a review.' };
    }

    const supabase = createClient(await cookies());
    const { data: business, error: fetchError } = await supabase
      .from('Business')
      .select('review, businessName')
      .eq('id', businessId)
      .single();

    if (fetchError || !business) {
      return { success: false as const, error: 'Business not found' };
    }

    const reviews = parseBusinessReviews(business.review);
    const review = reviews.find((entry) => entry.id === reviewId);
    if (!review) {
      return { success: false as const, error: 'Review not found' };
    }

    const service = createServiceClient();
    if (!service) {
      return { success: false as const, error: 'Reporting is temporarily unavailable.' };
    }

    const { error: insertError } = await service.from('review_reports').insert({
      business_id: businessId,
      review_id: reviewId,
      reporter_key: reporterKey,
      reason,
    });

    if (insertError) {
      if (insertError.code === '23505') {
        return { success: true as const, alreadyReported: true as const };
      }
      throw insertError;
    }

    await service.from('merchant_notifications').insert({
      business_id: businessId,
      type: 'review_reported',
      title: 'Review reported',
      body: `A review from ${review.author.trim() || 'a customer'} was flagged: ${reason}`,
      metadata: {
        reviewId,
        author: review.author,
        reporterKey,
        reason,
      },
    });

    return { success: true as const, alreadyReported: false as const };
  } catch (error) {
    console.error('Report Business Review Error:', error);
    return { success: false as const, error: 'Failed to report review. Please try again.' };
  }
}
