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
import {
  flattenBusinessReviews,
  matchesReviewQuery,
  sortReviewsNewest,
  type AdminReviewListRow,
} from '@/lib/reviewAdminList';
import { recordMerchantNotification } from '@/lib/merchantAlert.server';
import {
  reviewFlagOutcomeTitle,
  reviewFlagReplyBody,
} from '@/lib/reviewFlagOutcome';
import { queueBusinessPush } from '@/lib/userNotifications.server';

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

async function notifyBusinessFlagOutcome(input: {
  businessId: string;
  reviewId: string;
  status: 'hidden' | 'deleted' | 'dismissed';
  author?: string | null;
}) {
  const supabase = db();
  if (!supabase) return;
  const { data } = await supabase
    .from('review_reports')
    .select('id')
    .eq('business_id', input.businessId)
    .eq('review_id', input.reviewId)
    .eq('reporter_type', 'business')
    .limit(1);
  if (!data?.length) return;

  const author = input.author?.trim() || 'a customer';
  const title = reviewFlagOutcomeTitle(input.status);
  const body = reviewFlagReplyBody(author);
  const notificationId = await recordMerchantNotification({
    businessId: input.businessId,
    type: 'review_flag_outcome',
    title,
    body,
    metadata: {
      reviewId: input.reviewId,
      author,
      status: input.status,
    },
  });
  queueBusinessPush({
    businessId: input.businessId,
    type: 'review',
    title,
    body,
    url: `/business/dashboard?tab=reviews&reviewId=${encodeURIComponent(input.reviewId)}`,
    reviewId: input.reviewId,
    notificationId: notificationId || undefined,
  });
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
      if (reportStatus === 'hidden' || reportStatus === 'deleted') {
        await notifyBusinessFlagOutcome({
          businessId,
          reviewId,
          status: reportStatus,
          author: publicReviewAuthor(next),
        });
      }
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

  const { data: report, error: loadError } = await supabase
    .from('review_reports')
    .select('id, business_id, review_id, reporter_type')
    .eq('id', input.reportId)
    .maybeSingle();
  if (loadError || !report) {
    return { success: false, error: 'Could not update this flag.' };
  }

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

  let author = 'a customer';
  const loaded = await loadBusinessReviews(String(report.business_id));
  const review = loaded?.reviews.find((item) => item.id === String(report.review_id));
  if (review) author = publicReviewAuthor(review);

  await notifyBusinessFlagOutcome({
    businessId: String(report.business_id),
    reviewId: String(report.review_id),
    status: 'dismissed',
    author,
  });
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

function flattenLoadedBusiness(row: {
  id: string;
  businessName?: string | null;
  displayName?: string | null;
  city?: string | null;
  slug?: string | null;
  review: unknown;
}) {
  return flattenBusinessReviews(row);
}

async function loadBusinessReviewRows(): Promise<AdminReviewListRow[]> {
  const supabase = db();
  if (!supabase) return [];
  const pageSize = 200;
  const maxPages = 40;
  const rows: AdminReviewListRow[] = [];
  for (let page = 0; page < maxPages; page += 1) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from('Business')
      .select('id, businessName, displayName, slug, city, review')
      .not('review', 'is', null)
      .order('updatedAt', { ascending: false })
      .range(from, to);
    if (error) {
      console.error('[review-moderation] list businesses', error);
      break;
    }
    const batch = data || [];
    rows.push(...batch.flatMap((row) => flattenLoadedBusiness(row as {
      id: string;
      businessName?: string | null;
      displayName?: string | null;
      city?: string | null;
      slug?: string | null;
      review: unknown;
    })));
    if (batch.length < pageSize) break;
  }
  return rows;
}

function reviewCounts(rows: AdminReviewListRow[]) {
  return {
    all: rows.length,
    visible: rows.filter((row) => !row.hidden && !row.deleted).length,
    hidden: rows.filter((row) => row.hidden && !row.deleted).length,
    removed: rows.filter((row) => row.deleted).length,
    anonymousPending: rows.filter((row) => row.anonymous && !row.deleted && row.anonymity_status === 'pending').length,
  };
}

export async function listAllReviews(query = '') {
  const allRows = sortReviewsNewest(await loadBusinessReviewRows());
  const rows = allRows.filter((row) => matchesReviewQuery(row, query));
  return {
    rows,
    counts: reviewCounts(allRows),
  };
}

export async function listAnonymousReviews(status?: string) {
  const rows = (await loadBusinessReviewRows()).filter((row) => row.anonymous && !row.deleted);
  const filtered =
    status === 'pending' || status === 'allowed' || status === 'revealed'
      ? rows.filter((row) => row.anonymity_status === status)
      : rows;
  return sortReviewsNewest(filtered);
}

export async function listReviewFlags(reporterType: 'user' | 'business', status = 'open') {
  const supabase = db();
  if (!supabase) return [];
  let query = supabase
    .from('review_reports')
    .select('*')
    .eq('reporter_type', reporterType)
    .order('created_at', { ascending: false })
    .limit(200);
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) {
    console.error('[review-moderation] list flags', error);
    return [];
  }
  const rows = (data || []) as ReviewFlagRow[];
  const businessIds = [...new Set(rows.map((row) => row.business_id).filter(Boolean))];
  if (!businessIds.length) return rows;
  const { data: businesses } = await supabase
    .from('Business')
    .select('id, businessName, displayName, slug, city, review')
    .in('id', businessIds);
  const reviewByKey = new Map(
    (businesses || []).flatMap((business) =>
      flattenBusinessReviews(business as {
        id: string;
        businessName?: string | null;
        displayName?: string | null;
        city?: string | null;
        slug?: string | null;
        review: unknown;
      }).map((review) => [`${review.business_id}:${review.review_id}`, review]),
    ),
  );
  return rows.map((row) => {
    const extra = reviewByKey.get(`${row.business_id}:${row.review_id}`);
    return extra
      ? {
          ...row,
          author_name: extra.author_name,
          display_name: extra.public_name,
          public_name: extra.public_name,
          content: extra.content,
          rating: extra.rating,
          business_name: extra.business_name,
          city: extra.city,
          slug: extra.slug,
          date: extra.date,
          anonymous: extra.anonymous,
          anonymous_reason: extra.anonymous_reason,
          hidden: extra.hidden,
          deleted: extra.deleted,
          anonymity_status: extra.anonymity_status,
          reply: extra.reply,
        }
      : row;
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
  if (q.length < 2) {
    const listed = await listAllReviews('');
    return {
      businesses: [],
      matches: [],
      rows: listed.rows,
      counts: listed.counts,
    };
  }

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
