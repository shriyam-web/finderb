import 'server-only';

import crypto from 'crypto';
import {
  type BillingCycle,
  type MerchantPlan,
  getPlanAmountInPaise,
  getRazorpayPlanId,
  isMonthlyMandateBilling,
  MANDATE_TOTAL_MONTHLY_CYCLES,
} from '@/lib/razorpay/plans';

export type RazorpaySubscriptionEntity = {
  id: string;
  entity: string;
  plan_id: string;
  status: string;
  current_start: number | null;
  current_end: number | null;
  ended_at: number | null;
  charge_at: number | null;
  start_at: number | null;
  end_at: number | null;
  total_count: number;
  paid_count: number;
  remaining_count: number;
  customer_id: string | null;
  notes?: Record<string, string>;
};

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  return { keyId, keySecret };
}

function getRazorpayBasicAuth(): string | null {
  const { keyId, keySecret } = getRazorpayCredentials();
  if (!keyId || !keySecret) return null;
  return Buffer.from(`${keyId}:${keySecret}`).toString('base64');
}

export function isRazorpaySubscriptionsConfigured(): boolean {
  const auth = getRazorpayBasicAuth();
  if (!auth) return false;
  try {
    getRazorpayPlanId('pro', 'monthly');
    return true;
  } catch {
    return false;
  }
}

export function verifyRazorpaySubscriptionSignature(params: {
  paymentId: string;
  subscriptionId: string;
  signature: string;
}): boolean {
  const { keySecret } = getRazorpayCredentials();
  if (!keySecret) return false;

  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${params.paymentId}|${params.subscriptionId}`)
    .digest('hex');

  try {
    const expectedBuf = Buffer.from(expected, 'hex');
    const signatureBuf = Buffer.from(params.signature, 'hex');
    if (expectedBuf.length !== signatureBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch {
    return false;
  }
}

async function razorpayRequest<T>(
  path: string,
  init?: RequestInit
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const auth = getRazorpayBasicAuth();
  if (!auth) {
    return { ok: false, error: 'Payment gateway is not configured.' };
  }

  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('[razorpay subscriptions] request failed:', path, data);
    return {
      ok: false,
      error: data?.error?.description || 'Razorpay subscription request failed.',
    };
  }

  return { ok: true, data: data as T };
}

/** Mandate consent window at Razorpay checkout (not “until 2126”). Merchants can still cancel anytime. */
export { MANDATE_VALIDITY_YEARS } from '@/lib/razorpay/plans';

const AUTH_CHECKOUT_EXPIRY_SEC = 60 * 60 * 24 * 7;

export async function createRazorpaySubscription(params: {
  businessId: string;
  plan: MerchantPlan;
  billingCycle: BillingCycle;
}): Promise<
  | { success: true; subscription: RazorpaySubscriptionEntity; keyId: string }
  | { success: false; error: string }
> {
  if (!isMonthlyMandateBilling(params.billingCycle)) {
    return { success: false, error: 'Subscriptions with mandate are only used for monthly billing.' };
  }

  const { keyId } = getRazorpayCredentials();
  if (!keyId) {
    return { success: false, error: 'Payment gateway is not configured.' };
  }

  let planId: string;
  try {
    planId = getRazorpayPlanId(params.plan, params.billingCycle);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Razorpay plan is not configured.';
    return { success: false, error: message };
  }

  const nowSec = Math.floor(Date.now() / 1000);

  const result = await razorpayRequest<RazorpaySubscriptionEntity>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      plan_id: planId,
      total_count: MANDATE_TOTAL_MONTHLY_CYCLES,
      quantity: 1,
      customer_notify: true,
      expire_by: nowSec + AUTH_CHECKOUT_EXPIRY_SEC,
      notes: {
        businessId: params.businessId,
        plan: params.plan,
        billingCycle: params.billingCycle,
      },
    }),
  });

  if (!result.ok) {
    return { success: false, error: result.error };
  }

  const expectedAmount = getPlanAmountInPaise(params.plan, params.billingCycle);
  const planResult = await razorpayRequest<{ item: { amount: number } }>(`/plans/${planId}`);
  if (planResult.ok && planResult.data.item?.amount !== expectedAmount) {
    console.error('[razorpay] plan amount mismatch', {
      planId,
      expected: expectedAmount,
      actual: planResult.data.item?.amount,
    });
    return {
      success: false,
      error: 'Billing plan configuration mismatch. Contact support before proceeding.',
    };
  }

  return { success: true, subscription: result.data, keyId };
}

export async function getRazorpaySubscription(
  subscriptionId: string
): Promise<RazorpaySubscriptionEntity | null> {
  const result = await razorpayRequest<RazorpaySubscriptionEntity>(`/subscriptions/${subscriptionId}`);
  return result.ok ? result.data : null;
}

export async function cancelRazorpaySubscription(
  subscriptionId: string,
  options: { cancelAtCycleEnd: boolean }
): Promise<{ success: true; subscription: RazorpaySubscriptionEntity } | { success: false; error: string }> {
  const result = await razorpayRequest<RazorpaySubscriptionEntity>(
    `/subscriptions/${subscriptionId}/cancel`,
    {
      method: 'POST',
      body: JSON.stringify({
        cancel_at_cycle_end: options.cancelAtCycleEnd ? 1 : 0,
      }),
    }
  );

  if (!result.ok) {
    return { success: false, error: result.error };
  }

  return { success: true, subscription: result.data };
}

export function subscriptionPeriodFromEntity(
  subscription: RazorpaySubscriptionEntity,
  billingCycle: BillingCycle
): { planStartedAt: Date; planExpiresAt: Date } {
  const now = new Date();

  if (subscription.current_start && subscription.current_end) {
    return {
      planStartedAt: new Date(subscription.current_start * 1000),
      planExpiresAt: new Date(subscription.current_end * 1000),
    };
  }

  const planStartedAt = now;
  const planExpiresAt = new Date(now);
  if (billingCycle === 'annual') {
    planExpiresAt.setFullYear(planExpiresAt.getFullYear() + 1);
  } else {
    planExpiresAt.setMonth(planExpiresAt.getMonth() + 1);
  }

  return { planStartedAt, planExpiresAt };
}

export const ACTIVE_RAZORPAY_SUBSCRIPTION_STATUSES = new Set([
  'authenticated',
  'active',
  'pending',
]);

export const TERMINAL_RAZORPAY_SUBSCRIPTION_STATUSES = new Set(['cancelled', 'completed', 'expired']);
