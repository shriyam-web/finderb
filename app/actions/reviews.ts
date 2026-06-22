'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { revalidateBusinessProfilePaths } from '@/lib/businessRevalidation';
import {
  averageReviewRating,
  parseBusinessReviews,
  type BusinessReview,
} from '@/lib/businessReviews';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

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
    };

    const nextReviews = [newReview, ...existing];
    const nextRating = averageReviewRating(nextReviews);

    const { error: updateError } = await supabase
      .from('Business')
      .update({
        review: nextReviews,
        rating: nextRating,
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
      rating: nextRating,
    };
  } catch (error) {
    console.error('Submit Business Review Error:', error);
    return { success: false as const, error: 'Failed to submit review. Please try again.' };
  }
}
