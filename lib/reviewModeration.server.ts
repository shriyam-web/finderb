import 'server-only';

import {
  averageReviewRating,
  parseBusinessReviews,
  publicReviewAuthor,
  serializeBusinessReviewsForStorage,
  type BusinessReview,
  type ReviewAnonymityStatus,
} from '@/lib/businessReviews';
import { revalidateBusinessProfilePaths } from '@/lib/businessRevalidation';
import { escapeIlikePattern } from '@/lib/searchMatch';
import { createServiceClient } from '@/lib/supabase/service';

type ServiceClient = NonNullable<ReturnType<typeof createServiceClient>>;

export type ReviewModerationAction =
  | 'hide'
  | 'unhide'
  | 'delete'
  | 'restore'
  | 'allowAnonymous'
  | 'revealAnonymous';

function db(): ServiceClient | null {
  return createServiceClient();
}

function anonymityStatusOf(review: BusinessReview): ReviewAnonymityStatus {
  if (review.anonymityStatus) return review.anonymityStatus;
  return review.anonymous ? 'pending' : 'allowed';
}

export async function upsertReviewModerationRow(input: {
  businessId: string;
  businessName?: string | null;
  review: BusinessReview;
}): Promise<void> {
  const supabase = db();
  if (!supabase) return;

  const { error } = await supabase.from('review_moderation').upsert(
    {
      business_id: input.businessId,
      review_id: input.review.id,
      business_name: input.businessName?.trim() || null,
      author_name: input.review.author.trim() || 'Customer',
      display_name: publicReviewAuthor(input.review),
      content: input.review.content,
      rating: input.review.rating,
      anonymous: Boolean(input.review.anonymous),
      anonymous_reason: input.review.anonymousReason?.trim() || null,
      anonymity_status: anonymityStatusOf(input.review),
      hidden: Boolean(input.review.hidden),
      deleted: Boolean(input.review.deleted),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'business_id,review_id' }
  );

  if (error) {
    console.error('[review-moderation] upsert', error);
  }
}

async function loadBusinessReviews(businessId: string) {
  const supabase = db();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('Business')
    .select('id, review, slug, businessName, city')
    .eq('id', businessId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    supabase,
    business: data as {
      id: string;
      review: unknown;
      slug: string | null;
      businessName: string | null;
      city: string | null;
    },
    reviews: parseBusinessReviews(data.review),
  };
}

async function saveReviews(
  loaded: NonNullable<Awaited<ReturnType<typeof loadBusinessReviews>>>,
  reviews: BusinessReview[]
) {
  const nextRating = averageReviewRating(reviews);
  const { error } = await loaded.supabase
    .from('Business')
    .update({
      review: serializeBusinessReviewsForStorage(reviews),
      rating: nextRating,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', loaded.business.id);

  if (error) throw error;

  revalidateBusinessProfilePaths({
    id: loaded.business.id,
    slug: loaded.business.slug,
    businessName: loaded.business.businessName,
    city: loaded.business.city,
  });

  return { reviews, rating: nextRating };
}

export async function moderateStoredReview(input: {
  businessId: string;
  reviewId: string;
  action: ReviewModerationAction;
  adminId?: string | null;
  adminNote?: string | null;
}): Promise<{ success: true; review: BusinessReview } | { success: false; error: string }> {
  try {
    const businessId = input.businessId.trim();
    const reviewId = input.reviewId.trim();
    if (!businessId || !reviewId) {
      return { success: false, error: 'Business and review are required.' };
    }

    const loaded = await loadBusinessReviews(businessId);
    if (!loaded) return { success: false, error: 'Business not found.' };

    const index = loaded.reviews.findIndex((review) => review.id === reviewId);
    if (index === -1) return { success: false, error: 'Review not found.' };

    const current = loaded.reviews[index];
    let next: BusinessReview = { ...current };
    const note = input.adminNote?.trim() || null;

    switch (input.action) {
      case 'hide':
        next = { ...next, hidden: true };
        break;
      case 'unhide':
        next = { ...next, hidden: false };
        break;
      case 'delete':
        next = { ...next, deleted: true, hidden: true };
        break;
      case 'restore':
        next = { ...next, deleted: false, hidden: false };
        break;
      case 'allowAnonymous':
        if (!next.anonymous) {
          return { success: false, error: 'This review is not anonymous.' };
        }
        next = { ...next, anonymityStatus: 'allowed' };
        break;
      case 'revealAnonymous':
        if (!next.anonymous) {
          return { success: false, error: 'This review is not anonymous.' };
        }
        next = { ...next, anonymityStatus: 'revealed' };
        break;
      default:
        return { success: false, error: 'Unknown action.' };
    }

    const reviews = loaded.reviews.map((review, i) => (i === index ? next : review));
    await saveReviews(loaded, reviews);
    await upsertReviewModerationRow({
      businessId,
      businessName: loaded.business.businessName,
      review: next,
    });

    const supabase = loaded.supabase;
    const reportStatus =
      input.action === 'hide'
        ? 'hidden'
        : input.action === 'delete'
          ? 'deleted'
          : input.action === 'unhide' || input.action === 'restore'
            ? 'dismissed'
            : null;

    if (reportStatus) {
      await supabase
        .from('review_reports')
        .update({
          status: reportStatus,
          admin_note: note,
          reviewed_at: new Date().toISOString(),
          reviewed_by: input.adminId || null,
        })
        .eq('business_id', businessId)
        .eq('review_id', reviewId)
        .eq('status', 'open');
    }

    if (input.action === 'allowAnonymous' || input.action === 'revealAnonymous') {
      await supabase
        .from('review_moderation')
        .update({
          admin_note: note,
          anonymity_reviewed_at: new Date().toISOString(),
          anonymity_reviewed_by: input.adminId || null,
          updated_at: new Date().toISOString(),
        })
        .eq('business_id', businessId)
        .eq('review_id', reviewId);
    }

    return { success: true, review: next };
  } catch (error) {
    console.error('[review-moderation] action', error);
    return { success: false, error: 'Could not update this review. Please try again.' };
  }
}

export async function dismissReviewReport(input: {
  reportId: string;
  adminId?: string | null;
  adminNote?: string | null;
}): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = db();
  if (!supabase) return { success: false, error: 'Moderation is unavailable.' };

  const { error } = await supabase
    .from('review_reports')
    .update({
      status: 'dismissed',
      admin_note: input.adminNote?.trim() || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: input.adminId || null,
    })
    .eq('id', input.reportId);

  if (error) {
    console.error('[review-moderation] dismiss report', error);
    return { success: false, error: 'Could not update this flag.' };
  }
  return { success: true };
}

export function startOfCurrentMonthIso(now = new Date()): string {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString();
}

export type ReviewModerationRow = {
  id: string;
  business_id: string;
  review_id: string;
  business_name: string | null;
  author_name: string | null;
  display_name: string | null;
  content: string | null;
  rating: number | null;
  anonymous: boolean;
  anonymous_reason: string | null;
  anonymity_status: string;
  hidden: boolean;
  deleted: boolean;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

export type ReviewFlagRow = {
  id: string;
  business_id: string;
  review_id: string;
  reporter_key: string;
  reporter_type: string | null;
  reason: string | null;
  status: string | null;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export async function listAnonymousReviews(status?: string) {
  const supabase = db();
  if (!supabase) return [];
  let query = supabase
    .from('review_moderation')
    .select('*')
    .eq('anonymous', true)
    .eq('deleted', false)
    .order('created_at', { ascending: false })
    .limit(200);
  if (status === 'pending' || status === 'allowed' || status === 'revealed') {
    query = query.eq('anonymity_status', status);
  }
  const { data, error } = await query;
  if (error) {
    console.error('[review-moderation] list anonymous', error);
    return [];
  }
  return (data || []) as ReviewModerationRow[];
}

export async function listReviewFlags(reporterType: 'user' | 'business', status = 'open') {
  const supabase = db();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('review_reports')
    .select('*')
    .eq('reporter_type', reporterType)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) {
    console.error('[review-moderation] list flags', error);
    return [];
  }
  const rows = (data || []) as ReviewFlagRow[];
  const ids = [...new Set(rows.map((row) => row.review_id).filter(Boolean))];
  if (!ids.length) return rows;
  const { data: moderation } = await supabase
    .from('review_moderation')
    .select('business_id, review_id, author_name, display_name, content, rating, business_name, anonymous')
    .in('review_id', ids);
  const byKey = new Map(
    (moderation || []).map((row) => [`${row.business_id}:${row.review_id}`, row])
  );
  return rows.map((row) => {
    const extra = byKey.get(`${row.business_id}:${row.review_id}`) as
      | {
          author_name?: string;
          display_name?: string;
          content?: string;
          rating?: number;
          business_name?: string;
          anonymous?: boolean;
        }
      | undefined;
    return extra ? { ...row, ...extra } : row;
  });
}

function mapMerchantSearchRow(row: Record<string, unknown>, focusReviewId?: string) {
  const reviews = parseBusinessReviews(row.review).filter((review) => !review.deleted);
  return {
    id: String(row.id),
    businessName: String(row.businessName || row.displayName || 'Business'),
    displayName: row.displayName ? String(row.displayName) : null,
    slug: row.slug ? String(row.slug) : null,
    city: row.city ? String(row.city) : null,
    focusReviewId: focusReviewId || null,
    reviews: focusReviewId ? reviews.filter((review) => review.id === focusReviewId) : reviews,
  };
}

export async function searchReviews(query: string) {
  const supabase = db();
  if (!supabase) return { businesses: [] as ReturnType<typeof mapMerchantSearchRow>[], matches: [] as ReviewModerationRow[] };
  const q = query.trim();
  if (q.length < 2) return { businesses: [], matches: [] };

  const looksLikeId = /^[a-z0-9_-]{8,}$/i.test(q) && !/\s/.test(q);
  const like = `%${escapeIlikePattern(q.replace(/,/g, ' '))}%`;
  const orParts = [`businessName.ilike.${like}`, `displayName.ilike.${like}`];
  if (looksLikeId) orParts.push(`id.eq.${q}`);

  const [byReviewId, byMerchant] = await Promise.all([
    looksLikeId
      ? supabase.from('review_moderation').select('*').eq('review_id', q).limit(20)
      : Promise.resolve({ data: [] as ReviewModerationRow[], error: null }),
    supabase
      .from('Business')
      .select('id, businessName, displayName, slug, city, review')
      .or(orParts.join(','))
      .limit(12),
  ]);

  if (looksLikeId && (!byReviewId.data || byReviewId.data.length === 0)) {
    const { data } = await supabase
      .from('Business')
      .select('id, businessName, displayName, slug, city, review')
      .filter('review', 'cs', JSON.stringify([{ id: q }]))
      .limit(8);
    return {
      businesses: (data || []).map((row) => mapMerchantSearchRow(row as Record<string, unknown>, q)),
      matches: [] as ReviewModerationRow[],
    };
  }

  return {
    businesses: (byMerchant.data || []).map((row) => mapMerchantSearchRow(row as Record<string, unknown>)),
    matches: (byReviewId.data || []) as ReviewModerationRow[],
  };
}

export async function countBusinessReviewFlagsThisMonth(businessId: string): Promise<number> {
  const supabase = db();
  if (!supabase) return 0;
  const { count } = await supabase
    .from('review_reports')
    .select('id', { count: 'exact', head: true })
    .eq('reporter_key', `business:${businessId}`)
    .gte('created_at', startOfCurrentMonthIso());
  return count ?? 0;
}
