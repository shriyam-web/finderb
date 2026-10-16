import 'server-only';

import {
  ACTIVE_RAZORPAY_SUBSCRIPTION_STATUSES,
  cancelRazorpaySubscription,
} from '@/lib/razorpay/subscriptions';
import { parseBusinessReviews, serializeBusinessReviewsForStorage } from '@/lib/businessReviews';
import { escapeIlikePattern } from '@/lib/searchMatch';
import { createServiceClient } from '@/lib/supabase/service';
import { revalidateBusinessProfilePaths } from '@/lib/businessRevalidation';

export const BUSINESS_DELETION_GRACE_DAYS = 90;

type ServiceClient = NonNullable<ReturnType<typeof createServiceClient>>;

/** Reviews stay on business pages, but without the deleted user's name or id. */
async function anonymizeReviewsByUser(supabase: ServiceClient, userId: string) {
  const { data, error } = await supabase
    .from('Business')
    .select('id, review')
    .filter('review', 'cs', JSON.stringify([{ userId }]));
  if (error) {
    console.error('[account-delete] find reviews', error);
    return;
  }

  for (const row of data ?? []) {
    const reviews = parseBusinessReviews(row.review).map((review) =>
      review.userId === userId
        ? { ...review, author: 'Former FinderB user', userId: undefined, authorVerified: false }
        : review
    );
    const { error: updateError } = await supabase
      .from('Business')
      .update({ review: serializeBusinessReviewsForStorage(reviews) })
      .eq('id', row.id);
    if (updateError) console.error('[account-delete] anonymize review', row.id, updateError);
  }
}

export async function deleteUserAccountById(
  userId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const id = userId.trim();
  if (!id) {
    return { success: false, error: 'Account not found.' };
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false, error: 'Account deletion is not configured on the server.' };
  }

  const { data: user, error: loadError } = await supabase
    .from('User')
    .select('id, supabaseAuthId')
    .eq('id', id)
    .maybeSingle();

  if (loadError) {
    console.error('[account-delete] load', loadError);
    return { success: false, error: 'Could not load your account.' };
  }
  if (!user) {
    return { success: false, error: 'Account not found.' };
  }

  await supabase.from('user_push_tokens').delete().eq('user_id', id);
  await anonymizeReviewsByUser(supabase, id);

  const authId = typeof user.supabaseAuthId === 'string' ? user.supabaseAuthId.trim() : '';
  if (authId) {
    const { error: authError } = await supabase.auth.admin.deleteUser(authId);
    if (authError) {
      console.warn('[account-delete] supabase auth', authError.message);
    }
  }

  const { error: deleteError } = await supabase.from('User').delete().eq('id', id);
  if (deleteError) {
    console.error('[account-delete] delete', deleteError);
    return { success: false, error: 'Could not delete your account. Please email support@finderb.com.' };
  }

  return { success: true };
}

function listingPathsOf(row: {
  id: string;
  slug?: string | null;
  displayName?: string | null;
  businessName?: string | null;
  city?: string | null;
}) {
  revalidateBusinessProfilePaths({
    id: row.id,
    slug: row.slug,
    name: row.displayName,
    businessName: row.businessName,
    city: row.city,
  });
}

export async function applyDueBusinessDeletion(businessId: string): Promise<boolean> {
  const id = businessId.trim();
  if (!id) return false;
  const supabase = createServiceClient();
  if (!supabase) return false;
  const { data, error } = await supabase
    .from('Business')
    .select('id, deletionScheduledAt')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    console.warn('[account-delete] schedule lookup', error.message);
    return false;
  }
  const due = data?.deletionScheduledAt ? new Date(String(data.deletionScheduledAt)).getTime() : NaN;
  if (!Number.isFinite(due) || due > Date.now()) return false;
  const result = await deleteBusinessAccountById(id);
  return result.success;
}

export async function scheduleBusinessDeletion(businessId: string): Promise<
  { success: true; message: string; deletionScheduledAt: string } | { success: false; error: string }
> {
  const id = businessId.trim();
  if (!id) return { success: false, error: 'Business ID is required' };
  const { ownershipDetailsLock } = await import('@/lib/ownershipRequest.server');
  const locked = await ownershipDetailsLock(id);
  if (locked.locked) return { success: false, error: locked.error };
  const supabase = createServiceClient();
  if (!supabase) return { success: false, error: 'Could not schedule deletion.' };
  const deletionScheduledAt = new Date(
    Date.now() + BUSINESS_DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { data, error } = await supabase
    .from('Business')
    .update({
      status: 'inactive',
      deletionScheduledAt,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, slug, businessName, displayName, city, status, deletionScheduledAt')
    .maybeSingle();
  if (error || !data) return { success: false, error: 'Could not schedule deletion.' };
  listingPathsOf(data);
  return {
    success: true,
    deletionScheduledAt: String(data.deletionScheduledAt || deletionScheduledAt),
    message:
      'Your public page is down. The account will be completely deleted after 90 days. Until then you can log in to cancel the deletion.',
  };
}

export async function cancelScheduledBusinessDeletion(businessId: string): Promise<
  { success: true; message: string } | { success: false; error: string }
> {
  const id = businessId.trim();
  if (!id) return { success: false, error: 'Business ID is required' };
  const supabase = createServiceClient();
  if (!supabase) return { success: false, error: 'Could not cancel deletion.' };
  const { data, error } = await supabase
    .from('Business')
    .update({
      status: 'Active',
      deletionScheduledAt: null,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, slug, businessName, displayName, city, status')
    .maybeSingle();
  if (error || !data) return { success: false, error: 'Could not cancel deletion.' };
  listingPathsOf(data);
  return {
    success: true,
    message: 'Deletion cancelled. Your public page can show again.',
  };
}

/**
 * Removes a merchant account: the listing disappears, sign-in stops working, and personal and KYC
 * data is erased. Payment records stay because Indian tax law requires keeping them.
 */
export async function deleteBusinessAccountById(
  businessId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const id = businessId.trim();
  if (!id) {
    return { success: false, error: 'Account not found.' };
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false, error: 'Account deletion is not configured on the server.' };
  }

  const { data: business, error: loadError } = await supabase
    .from('Business')
    .select('id, razorpaySubscriptionId, subscriptionStatus')
    .eq('id', id)
    .maybeSingle();

  if (loadError) {
    console.error('[account-delete] load business', loadError);
    return { success: false, error: 'Could not load your account.' };
  }
  if (!business) {
    return { success: false, error: 'Account not found.' };
  }

  const subscriptionId = String(business.razorpaySubscriptionId || '').trim();
  const subscriptionStatus = String(business.subscriptionStatus || '').trim();
  if (subscriptionId && ACTIVE_RAZORPAY_SUBSCRIPTION_STATUSES.has(subscriptionStatus)) {
    const cancelled = await cancelRazorpaySubscription(subscriptionId, { cancelAtCycleEnd: false });
    if (!cancelled.success) {
      console.error('[account-delete] cancel subscription', cancelled.error);
      return {
        success: false,
        error: 'Could not cancel your plan. Please email support@finderb.com to delete this account.',
      };
    }
  }

  await Promise.all([
    supabase.from('jobs').delete().eq('business_id', id),
    supabase.from('tourist_place_merchants').delete().eq('business_id', id),
    supabase.from('business_change_requests').delete().eq('business_id', id),
    supabase.from('merchant_notifications').delete().eq('business_id', id),
    supabase.from('support_login_tokens').delete().eq('business_id', id),
    supabase.from('user_push_tokens').delete().eq('user_id', id),
    ...[1, 2, 3, 4, 5].map((slot) =>
      supabase
        .from('categories')
        .update({ [`position_${slot}_business_id`]: null })
        .eq(`position_${slot}_business_id`, id)
    ),
  ]);

  const { error: updateError } = await supabase
    .from('Business')
    .update({
      status: 'Deleted',
      fullName: '',
      businessName: 'Deleted business',
      displayName: null,
      workEmail: `deleted:${id}`,
      email: null,
      mobile: `deleted:${id}`,
      publicPhone: '',
      whatsappNumber: null,
      owner_name: null,
      owner_mobile: null,
      password: null,
      businessAddress: '',
      location: null,
      latitude: null,
      longitude: null,
      about: null,
      images: [],
      profilePictureUrl: null,
      website: null,
      instagramUrl: null,
      facebookUrl: null,
      youtubeUrl: null,
      keywords: null,
      review: null,
      reviewReply: null,
      slug: null,
      profileQrLink: null,
      registrationNumber: null,
      panNumber: null,
      aadharNumber: null,
      panUrl: null,
      aadharUrl: null,
      msmeGstUrl: null,
      autoRenewEnabled: false,
      deletionScheduledAt: null,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) {
    console.error('[account-delete] scrub business', updateError);
    return { success: false, error: 'Could not delete your account. Please email support@finderb.com.' };
  }

  return { success: true };
}

/**
 * One email or mobile belongs to one account type. When a business is registered with a
 * FinderB user's email or mobile, that user account becomes the business and is removed.
 * Returns the ids of the removed user accounts.
 */
export async function removeUserAccountsMovedToBusiness(email: string, mobile: string): Promise<string[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const normalizedEmail = email.trim().toLowerCase();
  const digits = mobile.replace(/\D/g, '').slice(-10);
  const [byEmail, byPhone] = await Promise.all([
    normalizedEmail
      ? supabase.from('User').select('id').ilike('email', escapeIlikePattern(normalizedEmail))
      : Promise.resolve({ data: [], error: null }),
    digits.length === 10
      ? supabase.from('User').select('id').ilike('phone', `%${digits}`)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (byEmail.error || byPhone.error) {
    console.error('[account-delete] moved-to-business lookup', byEmail.error ?? byPhone.error);
    return [];
  }

  const ids = [...new Set([...(byEmail.data ?? []), ...(byPhone.data ?? [])].map((row) => String(row.id)))];
  const removed: string[] = [];
  for (const id of ids) {
    const result = await deleteUserAccountById(id);
    if (result.success) removed.push(id);
    else console.error('[account-delete] moved-to-business', id, result.error);
  }
  return removed;
}
