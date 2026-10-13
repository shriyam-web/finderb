import 'server-only';
import { createServiceClient } from '@/lib/supabase/service';
import { pickPublicBusinessEmail } from '@/lib/placeholderEmail';
import { sendListingLiveEmail } from '@/lib/email/sendListingLiveEmail';
import {
  getMerchantSubscriptionStatus,
  isStarterPlan,
} from '@/lib/subscription/merchantSubscription';
import { buildCanonicalProfileQrLink } from '@/lib/businessProfileLink';
import { revalidateBusinessProfilePaths } from '@/lib/businessRevalidation';
import { getBusinessProfilePath } from '@/lib/businessSlug';
import { queueIndexNow } from '@/lib/indexNow.server';
import { SITE_ORIGIN } from '@/lib/siteSeo';

export type NotifyListingLiveResult = {
  success: boolean;
  sent: boolean;
  skipped?: boolean;
  reason?: string;
  to?: string;
  showUpgradeCta?: boolean;
};

/**
 * Sends the “you’re live” email after admin activates a listing.
 * Expects Business.status to already be Active.
 */
export async function notifyListingLive(
  businessId: string,
): Promise<NotifyListingLiveResult> {
  const id = String(businessId || '').trim();
  if (!id) {
    return { success: false, sent: false, reason: 'businessId is required' };
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false, sent: false, reason: 'Service client unavailable' };
  }

  const { data: business, error } = await supabase
    .from('Business')
    .select(
      'id, businessName, displayName, slug, city, status, email, workEmail, selectedPlan, billingCycle, paymentStatus, planStartedAt, planExpiresAt, updatedAt, createdAt, autoRenewEnabled, mandateStatus, subscriptionStatus, razorpaySubscriptionId',
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[listing-live] load failed', error.message);
    return { success: false, sent: false, reason: 'Could not load business' };
  }

  if (!business) {
    return { success: false, sent: false, reason: 'Business not found' };
  }

  const status = String(business.status || '').toLowerCase();
  if (status !== 'active') {
    return {
      success: false,
      sent: false,
      skipped: true,
      reason: `Listing status is ${business.status || 'unknown'}, expected Active`,
    };
  }

  try {
    revalidateBusinessProfilePaths({
      id: String(business.id),
      slug: business.slug,
      businessName: business.businessName,
      name: business.displayName,
      city: business.city,
    });
  } catch (revalidateError) {
    console.warn('[listing-live] revalidate failed', revalidateError);
  }
  queueIndexNow([getBusinessProfilePath({ id: String(business.id), slug: business.slug })]);

  const to = pickPublicBusinessEmail(business.email, business.workEmail);
  if (!to) {
    return {
      success: true,
      sent: false,
      skipped: true,
      reason: 'No real merchant email on file',
    };
  }

  const businessName =
    String(business.displayName || business.businessName || 'Your business').trim() ||
    'Your business';

  const subscription = getMerchantSubscriptionStatus({
    paymentStatus: business.paymentStatus,
    selectedPlan: business.selectedPlan,
    billingCycle: business.billingCycle,
    planStartedAt: business.planStartedAt,
    planExpiresAt: business.planExpiresAt,
    updatedAt: business.updatedAt,
    createdAt: business.createdAt,
    autoRenewEnabled: business.autoRenewEnabled,
    mandateStatus: business.mandateStatus,
    subscriptionStatus: business.subscriptionStatus,
    razorpaySubscriptionId: business.razorpaySubscriptionId,
  });

  const showUpgradeCta =
    !subscription.isActive || isStarterPlan(business.selectedPlan);

  const profileUrl = buildCanonicalProfileQrLink({
    id: String(business.id),
    slug: business.slug,
    businessName: business.businessName,
    displayName: business.displayName,
    city: business.city,
  });

  const dashboardUrl = `${SITE_ORIGIN}/business/dashboard`;
  const upgradeUrl = `${SITE_ORIGIN}/pricing`;

  const sent = await sendListingLiveEmail({
    to,
    businessName,
    profileUrl,
    dashboardUrl,
    showUpgradeCta,
    upgradeUrl,
  });

  if (!sent) {
    return {
      success: false,
      sent: false,
      to,
      showUpgradeCta,
      reason: 'Email provider failed or is not configured',
    };
  }

  return { success: true, sent: true, to, showUpgradeCta };
}
