import 'server-only';
import { createServiceClient } from '@/lib/supabase/service';
import { pickPublicBusinessEmail } from '@/lib/placeholderEmail';
import { sendListingLiveEmail } from '@/lib/email/sendListingLiveEmail';
import { sendListingLiveWhatsApp } from '@/lib/whatsapp/sendListingLiveWhatsApp';
import { buildListingLiveCopy } from '@/lib/business/listingLiveCopy';
import { recordMerchantNotification } from '@/lib/merchantAlert.server';
import { queueBusinessPush } from '@/lib/userNotifications.server';
import { extractIndianMobileDigits, isValidIndianMobileDigits } from '@/lib/indianPhone';
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
  preview?: boolean;
  reason?: string;
  to?: string;
  showUpgradeCta?: boolean;
  emailSent?: boolean;
  whatsappSent?: boolean;
  notificationSent?: boolean;
  title?: string;
  paragraphs?: string[];
  whatsappNext?: string;
  pushBody?: string;
};

type NotifyOptions = { preview?: boolean };

const BUSINESS_COLUMNS =
  'id, businessName, displayName, fullName, owner_name, slug, city, status, email, workEmail, emailVerified, mobileVerified, whatsappVerified, mobile, whatsappNumber, publicPhone, owner_mobile, selectedPlan, billingCycle, paymentStatus, planStartedAt, planExpiresAt, updatedAt, createdAt, autoRenewEnabled, mandateStatus, subscriptionStatus, razorpaySubscriptionId';

function text(value: unknown) {
  return String(value || '').trim();
}

/**
 * Email, WhatsApp, and in-app alert after admin activates a listing.
 * Sends whenever approval happens, including hours after registration.
 * Expects Business.status to already be Active unless preview is set.
 */
export async function notifyListingLive(
  businessId: string,
  options: NotifyOptions = {},
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
    .select(BUSINESS_COLUMNS)
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
  if (!options.preview && status !== 'active') {
    return {
      success: false,
      sent: false,
      skipped: true,
      reason: `Listing status is ${business.status || 'unknown'}, expected Active`,
    };
  }

  if (!options.preview) {
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
  }

  const to = pickPublicBusinessEmail(business.email, business.workEmail);
  const businessName =
    text(business.displayName || business.businessName) || 'Your business';
  const ownerName = text(business.owner_name || business.fullName);

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

  const planActive = subscription.isActive && !isStarterPlan(business.selectedPlan);
  const copy = buildListingLiveCopy({
    ownerName,
    businessName,
    emailVerified: Boolean(business.emailVerified),
    phoneVerified: Boolean(business.mobileVerified),
    planActive,
  });

  const profileUrl = buildCanonicalProfileQrLink({
    id: String(business.id),
    slug: business.slug,
    businessName: business.businessName,
    displayName: business.displayName,
    city: business.city,
  });
  const dashboardUrl = `${SITE_ORIGIN}/business/dashboard`;
  const verifyWebUrl = `${dashboardUrl}?tab=settings`;
  const verifyAppUrl = `${dashboardUrl}?tab=account`;
  const planUrl = `${dashboardUrl}?tab=subscription`;
  const needsVerify = copy.needsEmail || copy.needsPhone;
  const primaryUrl = needsVerify ? verifyWebUrl : copy.needsPlan ? planUrl : profileUrl;
  const primaryLabel = needsVerify ? 'Verify email and phone' : copy.needsPlan ? 'Choose a plan' : 'View live listing';
  const pushUrl = needsVerify ? verifyAppUrl : copy.needsPlan ? planUrl : profileUrl;

  const phone = [business.whatsappNumber, business.mobile, business.owner_mobile, business.publicPhone]
    .map((value) => extractIndianMobileDigits(text(value)))
    .find((digits) => isValidIndianMobileDigits(digits)) || '';

  if (options.preview) {
    return {
      success: true,
      sent: false,
      preview: true,
      to: to || undefined,
      showUpgradeCta: copy.needsPlan,
      title: copy.title,
      paragraphs: copy.paragraphs,
      whatsappNext: copy.whatsappNext,
      pushBody: copy.pushBody,
      emailSent: false,
      whatsappSent: false,
      notificationSent: false,
      reason: [
        to ? 'email ready' : 'no email',
        phone ? 'whatsapp ready' : 'no whatsapp',
        business.whatsappVerified ? 'whatsapp verified' : 'whatsapp not verified',
      ].join('; '),
    };
  }

  let emailSent = false;
  if (to) {
    emailSent = await sendListingLiveEmail({
      to,
      businessName,
      subject: copy.subject,
      paragraphs: copy.paragraphs,
      profileUrl,
      dashboardUrl,
      primaryLabel,
      primaryUrl,
    });
  }

  let whatsappSent = false;
  if (phone) {
    whatsappSent = await sendListingLiveWhatsApp({
      mobile: phone,
      ownerName: ownerName || businessName,
      businessName,
      nextStep: copy.whatsappNext,
    });
  }

  const notificationId = await recordMerchantNotification({
    businessId: id,
    type: 'listing-live',
    title: copy.title,
    body: copy.inAppBody,
    metadata: {
      profileUrl,
      url: pushUrl,
      needsEmail: copy.needsEmail,
      needsPhone: copy.needsPhone,
      needsPlan: copy.needsPlan,
    },
  });
  const notificationSent = Boolean(notificationId);

  queueBusinessPush({
    businessId: id,
    type: 'listing',
    title: copy.title,
    body: copy.pushBody,
    url: pushUrl,
    notificationId: notificationId || undefined,
  });

  const sent = emailSent || whatsappSent || notificationSent;
  const gaps = [
    !to ? 'no email on file' : !emailSent ? 'email was not sent' : '',
    !phone ? 'no phone on file' : !whatsappSent ? 'WhatsApp was not sent' : '',
    !notificationSent ? 'in-app alert was not saved' : '',
  ].filter(Boolean);

  return {
    success: sent,
    sent,
    to: to || undefined,
    showUpgradeCta: copy.needsPlan,
    emailSent,
    whatsappSent,
    notificationSent,
    title: copy.title,
    reason: gaps.length ? gaps.join('; ') : undefined,
  };
}
