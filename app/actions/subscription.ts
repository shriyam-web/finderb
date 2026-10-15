'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/service';
import { assertBusinessTab } from '@/lib/businessTeam/teamActor.server';
import { getOwnedBusiness } from '@/app/actions/business';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { cancelRazorpaySubscription, getRazorpaySubscription, TERMINAL_RAZORPAY_SUBSCRIPTION_STATUSES } from '@/lib/razorpay/subscriptions';
import { applySubscriptionCancellation } from '@/lib/razorpay/finalizeMerchantSubscription';
import { getPlanAmountInPaise, isValidBillingCycle, isValidMerchantPlan } from '@/lib/razorpay/plans';
import { getRazorpayPayment } from '@/lib/razorpay/server';
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
  currency: string;
  status: string;
  paymentType: string;
  orderId: string | null;
  paymentId: string | null;
  subscriptionId: string | null;
  source: string | null;
  planStartedAt: string | null;
  planExpiresAt: string | null;
  createdAt: string;
  updatedAt: string | null;
};

type PaymentRow = {
  id: string;
  plan: string;
  billing_cycle: string;
  amount_paise: number;
  currency?: string | null;
  status: string;
  payment_type?: string | null;
  order_id?: string | null;
  payment_id?: string | null;
  razorpay_subscription_id?: string | null;
  source?: string | null;
  plan_started_at?: string | null;
  plan_expires_at?: string | null;
  created_at: string;
  updated_at?: string | null;
};

function mapPaymentRow(row: PaymentRow): MerchantPaymentHistoryItem {
  return {
    id: String(row.id),
    plan: String(row.plan),
    planName: getPlanDisplayName(String(row.plan), String(row.billing_cycle)),
    billingCycle: String(row.billing_cycle),
    amountPaise: Number(row.amount_paise),
    amountDisplay: formatAmountInr(Number(row.amount_paise)),
    currency: row.currency ? String(row.currency) : 'INR',
    status: String(row.status),
    paymentType: String(row.payment_type || 'one_time'),
    orderId: row.order_id ? String(row.order_id) : null,
    paymentId: row.payment_id ? String(row.payment_id) : null,
    subscriptionId: row.razorpay_subscription_id ? String(row.razorpay_subscription_id) : null,
    source: row.source ? String(row.source) : null,
    planStartedAt: row.plan_started_at ? String(row.plan_started_at) : null,
    planExpiresAt: row.plan_expires_at ? String(row.plan_expires_at) : null,
    createdAt: String(row.created_at),
    updatedAt: row.updated_at ? String(row.updated_at) : null,
  };
}

function buildLegacyPaymentFromBusiness(
  business: Record<string, unknown>,
): MerchantPaymentHistoryItem | null {
  if (business.paymentStatus !== 'completed') return null;

  const paymentId = business.paymentId ? String(business.paymentId) : null;
  const orderId = business.orderId ? String(business.orderId) : null;
  const subscriptionId = business.razorpaySubscriptionId
    ? String(business.razorpaySubscriptionId)
    : null;

  if (!paymentId && !orderId && !subscriptionId) return null;

  const plan = String(business.selectedPlan || 'pro');
  const billingCycle = String(business.billingCycle || 'monthly');
  let amountPaise = 0;

  if (isValidMerchantPlan(plan) && isValidBillingCycle(billingCycle)) {
    amountPaise = getPlanAmountInPaise(plan, billingCycle);
  } else if (billingCycle === 'annual') {
    amountPaise = 358800;
  } else {
    amountPaise = 49900;
  }

  const createdAt = String(business.updatedAt || business.createdAt || new Date().toISOString());

  return {
    id: `legacy-${String(business.id)}`,
    plan,
    planName: getPlanDisplayName(plan, billingCycle),
    billingCycle,
    amountPaise,
    amountDisplay: formatAmountInr(amountPaise),
    currency: 'INR',
    status: 'completed',
    paymentType: subscriptionId ? 'subscription_auth' : 'one_time',
    orderId,
    paymentId,
    subscriptionId,
    source: 'legacy',
    planStartedAt: business.planStartedAt ? String(business.planStartedAt) : null,
    planExpiresAt: business.planExpiresAt ? String(business.planExpiresAt) : null,
    createdAt,
    updatedAt: business.updatedAt ? String(business.updatedAt) : null,
  };
}

function normalizePaymentHistory(items: MerchantPaymentHistoryItem[]): MerchantPaymentHistoryItem[] {
  const completedSubscriptionIds = new Set(
    items
      .filter((item) => item.status === 'completed' && item.subscriptionId)
      .map((item) => item.subscriptionId as string),
  );

  const filtered = items.filter((item) => {
    if (
      item.paymentType === 'subscription_auth' &&
      item.status === 'pending' &&
      item.subscriptionId &&
      completedSubscriptionIds.has(item.subscriptionId)
    ) {
      return false;
    }
    return true;
  });

  const paymentTypeRank = (type: string) => {
    if (type === 'subscription_auth') return 2;
    if (type === 'subscription_renewal') return 1;
    return 0;
  };

  const bestByPaymentId = new Map<string, MerchantPaymentHistoryItem>();
  const withoutPaymentId: MerchantPaymentHistoryItem[] = [];

  for (const item of filtered) {
    if (!item.paymentId) {
      withoutPaymentId.push(item);
      continue;
    }

    const existing = bestByPaymentId.get(item.paymentId);
    if (!existing || paymentTypeRank(item.paymentType) > paymentTypeRank(existing.paymentType)) {
      bestByPaymentId.set(item.paymentId, item);
    }
  }

  return [...bestByPaymentId.values(), ...withoutPaymentId].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function mergePaymentHistory(
  rows: PaymentRow[],
  business: Record<string, unknown>,
): MerchantPaymentHistoryItem[] {
  const history = rows.map(mapPaymentRow);
  const legacy = buildLegacyPaymentFromBusiness(business);

  if (!legacy) return normalizePaymentHistory(history);

  const alreadyRecorded = history.some(
    (item) =>
      Boolean(legacy.paymentId && item.paymentId === legacy.paymentId) ||
      Boolean(legacy.orderId && item.orderId === legacy.orderId),
  );

  if (alreadyRecorded) return normalizePaymentHistory(history);

  return normalizePaymentHistory([legacy, ...history]);
}

function patchOrderIdsFromBusiness(
  items: MerchantPaymentHistoryItem[],
  business: Record<string, unknown>,
): MerchantPaymentHistoryItem[] {
  const businessOrderId = business.orderId ? String(business.orderId) : null;
  const businessPaymentId = business.paymentId ? String(business.paymentId) : null;

  if (!businessOrderId) return items;

  return items.map((item) => {
    if (item.orderId) return item;
    if (businessPaymentId && item.paymentId === businessPaymentId) {
      return { ...item, orderId: businessOrderId };
    }
    return item;
  });
}

async function enrichPaymentHistoryOrderIds(
  items: MerchantPaymentHistoryItem[],
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
): Promise<MerchantPaymentHistoryItem[]> {
  const needsLookup = items.filter(
    (item) => !item.orderId && item.paymentId && item.status === 'completed' && item.paymentType === 'one_time',
  );

  if (needsLookup.length === 0) return items;

  const orderIdByPaymentId = new Map<string, string>();

  await Promise.all(
    needsLookup.map(async (item) => {
      const paymentId = item.paymentId as string;
      const remote = await getRazorpayPayment(paymentId);
      const orderId = remote?.order_id?.trim();
      if (!orderId) return;

      orderIdByPaymentId.set(paymentId, orderId);
      await supabase
        .from('merchant_payments')
        .update({ order_id: orderId, updated_at: new Date().toISOString() })
        .eq('id', item.id);
    }),
  );

  if (orderIdByPaymentId.size === 0) return items;

  return items.map((item) => {
    if (item.orderId || !item.paymentId) return item;
    const orderId = orderIdByPaymentId.get(item.paymentId);
    return orderId ? { ...item, orderId } : item;
  });
}

export async function getMerchantSubscriptionDetails(businessId: string) {
  if (!businessId) {
    return { success: false as const, error: 'Business ID is required' };
  }

  const session = await assertBusinessTab(businessId, 'subscription', 'view');
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

  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false as const, error: 'Payment history is temporarily unavailable.' };
  }

  const { data: payments, error } = await supabase
    .from('merchant_payments')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[subscription] history fetch failed:', error);
    return { success: false as const, error: 'Could not load payment history' };
  }

  const mergedHistory = mergePaymentHistory((payments ?? []) as PaymentRow[], business);
  const patchedHistory = patchOrderIdsFromBusiness(mergedHistory, business);
  const history = await enrichPaymentHistoryOrderIds(patchedHistory, supabase);

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

  const session = await assertBusinessTab(businessId, 'subscription', 'edit');
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

  const liveSubscription = await getRazorpaySubscription(subscriptionId);
  if (!liveSubscription) {
    return {
      success: false as const,
      error: 'Could not verify your auto-debit with the payment provider. Please try again.',
    };
  }

  if (TERMINAL_RAZORPAY_SUBSCRIPTION_STATUSES.has(liveSubscription.status)) {
    return { success: false as const, error: 'Auto-debit is already turned off.' };
  }

  if (!business.autoRenewEnabled && business.mandateStatus === 'cancelled') {
    // Local DB was updated earlier (e.g. scheduled cancel) but Razorpay mandate may still be live.
    console.warn('[subscription] revoking live Razorpay mandate after local cancel flag', {
      businessId,
      subscriptionId,
      razorpayStatus: liveSubscription.status,
    });
  } else if (!business.autoRenewEnabled) {
    return { success: false as const, error: 'Auto-debit is already turned off.' };
  }

  // Cancel immediately so Razorpay revokes the UPI mandate (user gets a notification in their
  // payment app). Plan access in FinderB stays until planExpiresAt — we do not shorten it.
  const cancelResult = await cancelRazorpaySubscription(subscriptionId, {
    cancelAtCycleEnd: false,
  });

  if (!cancelResult.success) {
    return { success: false as const, error: cancelResult.error };
  }

  const syncResult = await applySubscriptionCancellation({
    businessId,
    subscriptionId,
    status: cancelResult.subscription.status,
    cancelAtCycleEnd: false,
  });

  if (!syncResult.success) {
    return {
      success: false as const,
      error: 'Auto-debit was cancelled but your account could not be updated. Contact support.',
    };
  }

  revalidatePath('/business/dashboard');

  return {
    success: true as const,
    message:
      'Auto-debit cancelled. Your UPI/payment app should confirm the mandate revocation shortly. Your Growth Pro plan stays active until the end of this billing period.',
  };
}
