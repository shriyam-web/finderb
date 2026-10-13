import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { revalidateBusinessProfilePaths } from '@/lib/businessRevalidation';
import {
  averageReviewRating,
  parseBusinessReviews,
  serializeBusinessReviewsForStorage,
  type BusinessReview,
} from '@/lib/businessReviews';
import { queueBusinessPush } from '@/lib/userNotifications.server';

export type SubmitBusinessReviewInput = {
  userId: string;
  fullName: string;
  businessId: string;
  rating: number;
  content: string;
};

export type SubmitBusinessReviewResult =
  | { success: true; reviews: BusinessReview[]; rating: number }
  | { success: false; error: string };

function dbClient() {
  return createServiceClient();
}

async function createMerchantReviewNotification(input: {
  businessId: string;
  reviewId: string;
  author: string;
  rating: number;
}) {
  const supabase = createServiceClient();
  if (!supabase) return;

  const author = input.author.trim() || 'A customer';
  const rating = Number.isFinite(input.rating) ? input.rating : 5;

  const { error } = await supabase.from('merchant_notifications').insert({
    business_id: input.businessId,
    type: 'new_review',
    title: 'New customer review',
    body: `${author} left a ${rating}-star review on your listing.`,
    metadata: {
      reviewId: input.reviewId,
      author,
      rating,
    },
  });

  if (error) {
    console.error('Create Merchant Review Notification Error:', error);
  }
}

/**
 * Persist a customer review for either website cookie auth or mobile Bearer auth.
 */
export async function submitBusinessReviewForUser(
  input: SubmitBusinessReviewInput
): Promise<SubmitBusinessReviewResult> {
  try {
    const businessId = input.businessId?.trim();
    const content = input.content?.trim();
    const rating = Number(input.rating);
    const userId = input.userId?.trim();

    if (!userId) {
      return { success: false, error: 'Please log in to post a review.' };
    }
    if (!businessId) {
      return { success: false, error: 'Business ID is required' };
    }
    if (!content || content.length < 10) {
      return { success: false, error: 'Please write at least 10 characters' };
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return { success: false, error: 'Please select a rating' };
    }

    const supabase = dbClient() ?? createClient(await cookies());
    const { data: business, error: fetchError } = await supabase
      .from('Business')
      .select('review, rating, slug, businessName, city')
      .eq('id', businessId)
      .single();

    if (fetchError || !business) {
      return { success: false, error: 'Business not found' };
    }

    const existing = parseBusinessReviews(business.review);
    if (existing.some((review) => review.userId === userId)) {
      return { success: false, error: 'You have already reviewed this business.' };
    }

    const newReview: BusinessReview = {
      id: crypto.randomUUID(),
      author: input.fullName?.trim() || 'FinderB user',
      content,
      rating,
      date: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      userId,
      authorVerified: true,
    };

    const nextReviews = [newReview, ...existing];
    const nextRating = averageReviewRating(nextReviews) ?? rating;

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
    queueBusinessPush({
      businessId,
      type: 'review',
      title: `New ${newReview.rating}-star review`,
      body: `${newReview.author || 'A customer'} reviewed ${business.businessName || 'your business'} on FinderB.`,
      url: '/business/dashboard?tab=reviews',
    });

    revalidateBusinessProfilePaths({
      id: businessId,
      slug: business.slug,
      businessName: business.businessName,
      city: business.city,
    });

    return {
      success: true,
      reviews: nextReviews,
      rating: nextRating,
    };
  } catch (error) {
    console.error('Submit Business Review Error:', error);
    return { success: false, error: 'Failed to submit review. Please try again.' };
  }
}
