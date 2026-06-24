'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { assertBusinessSession } from '@/lib/security/session';
import { getOwnedBusiness } from '@/app/actions/business';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { cancelRazorpaySubscription } from '@/lib/razorpay/subscriptions';
import { applySubscriptionCancellation } from '@/lib/razorpay/finalizeMerchantSubscription';
import {
  formatAmountInr,
  formatSubscriptionDate,
  getMerchantSubscriptionStatus,
  getPlanDisplayName,
} from '@/lib/subscription/merchantSubscription';

export type MerchantPaymentHistoryItem = {
  id: string;
  plan: string;
  planName: string;
  billingCycle: string;
  amountPaise: number;
  amountDisplay: string;
  status: string;
  paymentType: string;
  orderId: string | null;
  paymentId: string | null;
  subscriptionId: string | null;
  source: string | null;
  planStartedAt: string | null;
  planExpiresAt: string | null;
  createdAt: string;
};

export async function getMerchantSubscriptionDetails(businessId: string) {
  if (!businessId) {
    return { success: false as const, error: 'Business ID is required' };
  }

  const session = await assertBusinessSession(businessId);
  if (!session.ok) {
    return { success: false as const, error: session.error };
  }

  const businessResult = await getOwnedBusiness(businessId);
  if (!businessResult.success || !businessResult.business) {
    return { success: false as const, error: businessResult.error || 'Business not found' };
  }

  const business = businessResult.business as Record<string, unknown>;
  const subscription = getMerchantSubscriptionStatus({
    paymentStatus: business.paymentStatus as string,
    selectedPlan: business.selectedPlan as string,
    billingCycle: business.billingCycle as string,
    planStartedAt: business.planStartedAt as string,
    planExpiresAt: business.planExpiresAt as string,
    updatedAt: business.updatedAt as string,
    createdAt: business.createdAt as string,
    autoRenewEnabled: business.autoRenewEnabled as boolean,
    mandateStatus: business.mandateStatus as string,
    subscriptionStatus: business.subscriptionStatus as string,
    razorpaySubscriptionId: business.razorpaySubscriptionId as string,
  });

  const supabase = createClient(await cookies());
  const { data: payments, error } = await supabase
    .from('merchant_payments')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[subscription] history fetch failed:', error);
    return { success: false as const, error: 'Could not load payment history' };
  }

  const history: MerchantPaymentHistoryItem[] = (payments ?? []).map((row) => ({
    id: String(row.id),
    plan: String(row.plan),
    planName: getPlanDisplayName(String(row.plan)),
    billingCycle: String(row.billing_cycle),
    amountPaise: Number(row.amount_paise),
    amountDisplay: formatAmountInr(Number(row.amount_paise)),
    status: String(row.status),
    paymentType: String(row.payment_type || 'one_time'),
    orderId: row.order_id ? String(row.order_id) : null,
    paymentId: row.payment_id ? String(row.payment_id) : null,
    subscriptionId: row.razorpay_subscription_id ? String(row.razorpay_subscription_id) : null,
    source: row.source ? String(row.source) : null,
    planStartedAt: row.plan_started_at ? String(row.plan_started_at) : null,
    planExpiresAt: row.plan_expires_at ? String(row.plan_expires_at) : null,
    createdAt: String(row.created_at),
  }));

  return {
    success: true as const,
    subscription: {
      ...subscription,
      startedAtDisplay: formatSubscriptionDate(subscription.startedAt),
      expiresAtDisplay: formatSubscriptionDate(subscription.expiresAt),
    },
    history,
  };
}

export async function cancelMerchantAutoRenew(businessId: string) {
  if (!businessId) {
    return { success: false as const, error: 'Business ID is required' };
  }

  const limit = await enforceRateLimit('payment', `cancel:${businessId}`);
  if (!limit.ok) return { success: false as const, error: limit.error };

  const session = await assertBusinessSession(businessId);
  if (!session.ok) {
    return { success: false as const, error: session.error };
  }

  const businessResult = await getOwnedBusiness(businessId);
  if (!businessResult.success || !businessResult.business) {
    return { success: false as const, error: 'Business not found' };
  }

  const business = businessResult.business as Record<string, unknown>;
  const subscriptionId = business.razorpaySubscriptionId
    ? String(business.razorpaySubscriptionId)
    : null;

  if (!subscriptionId) {
    return { success: false as const, error: 'No active auto-debit mandate found for this account.' };
  }

  if (!business.autoRenewEnabled) {
    return { success: false as const, error: 'Auto-debit is already turned off.' };
  }

  const cancelResult = await cancelRazorpaySubscription(subscriptionId, {
    cancelAtCycleEnd: true,
  });

  if (!cancelResult.success) {
    return { success: false as const, error: cancelResult.error };
  }

  const syncResult = await applySubscriptionCancellation({
    businessId,
    subscriptionId,
    status: cancelResult.subscription.status,
    cancelAtCycleEnd: true,
  });

  if (!syncResult.success) {
    return {
      success: false as const,
      error: 'Auto-debit cancelled at Razorpay but local status could not be updated. Contact support.',
    };
  }

  revalidatePath('/business/dashboard');
  revalidatePath('/admin/payments');

  return {
    success: true as const,
    message:
      'Auto-debit cancelled. Your current plan stays active until the end of this billing period; you will not be charged again unless you set up a new mandate.',
  };
}
