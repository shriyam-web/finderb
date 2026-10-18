import { safeUserError } from './safeError';
import { SITE_URL } from './supabase';
import { getStoredToken } from './session';
import type { MerchantReview } from './merchants';

export type SubmitReviewResult =
  | {
      success: true;
      reviews: MerchantReview[];
      rating: number;
    }
  | {
      success: false;
      error: string;
      unauthorized?: boolean;
    };

function mapReviews(raw: unknown): MerchantReview[] {
  if (!Array.isArray(raw)) return [];
  const mapped: MerchantReview[] = [];
  for (let index = 0; index < raw.length; index++) {
    const entry = raw[index];
    if (!entry || typeof entry !== 'object') continue;
    const row = entry as Record<string, unknown>;
    const content = String(row.content || '').trim();
    if (!content) continue;
    const rating = Number(row.rating);
    mapped.push({
      id: String(row.id || `r-${index}`),
      author: String(row.author || 'Customer').trim() || 'Customer',
      content,
      rating: Number.isFinite(rating) ? rating : 5,
      date: String(row.date || '').trim(),
      userId: typeof row.userId === 'string' ? row.userId : undefined,
      authorVerified: Boolean(row.authorVerified),
      anonymous: Boolean(row.anonymous) || undefined,
      hidden: Boolean(row.hidden) || undefined,
      merchantReply:
        row.merchantReply && typeof row.merchantReply === 'object'
          ? {
              content: String(
                (row.merchantReply as { content?: unknown }).content || '',
              ).trim(),
            }
          : undefined,
    });
  }
  return mapped;
}

export async function submitBusinessReview(input: {
  businessId: string;
  rating: number;
  content: string;
  anonymous?: boolean;
  anonymousReason?: string;
}): Promise<SubmitReviewResult> {
  const token = await getStoredToken();
  if (!token) {
    return {
      success: false,
      error: 'Please log in to post a review.',
      unauthorized: true,
    };
  }

  try {
    const res = await fetch(`${SITE_URL}/api/reviews/business`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        businessId: input.businessId,
        rating: input.rating,
        content: input.content,
        anonymous: Boolean(input.anonymous),
        anonymousReason: input.anonymousReason || '',
      }),
    });

    const text = await res.text();
    let data: {
      success?: boolean;
      error?: string;
      reviews?: unknown;
      rating?: number;
    };
    try {
      data = JSON.parse(text) as typeof data;
    } catch {
      return {
        success: false,
        error: `Server error (${res.status}). Please try again.`,
      };
    }

    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Failed to submit review.',
        unauthorized: res.status === 401,
      };
    }

    return {
      success: true,
      reviews: mapReviews(data.reviews),
      rating: Number(data.rating) || 0,
    };
  } catch (error) {
    return {
      success: false,
      error:
        safeUserError(error, 'Network error. Check your connection.'),
    };
  }
}

export async function reportBusinessReview(input: {
  businessId: string;
  reviewId: string;
  reason: string;
}): Promise<{ success: true } | { success: false; error: string; unauthorized?: boolean }> {
  const token = await getStoredToken();
  if (!token) {
    return { success: false, error: 'Please log in to report a review.', unauthorized: true };
  }

  try {
    const res = await fetch(`${SITE_URL}/api/reviews/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
    if (!data.success) {
      return {
        success: false,
        error: data.error || `Server error (${res.status}). Please try again.`,
        unauthorized: res.status === 401,
      };
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: safeUserError(error, 'Network error. Check your connection.'),
    };
  }
}
