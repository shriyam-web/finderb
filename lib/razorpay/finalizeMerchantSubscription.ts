import 'server-only';

import { revalidatePath } from 'next/cache';
import { revalidateBusinessProfilePaths } from '@/lib/businessRevalidation';
import { createServiceClient } from '@/lib/supabase/service';
import {
  type BillingCycle,
  type MerchantPlan,
  getPlanAmountInPaise,
  isValidBillingCycle,
  isValidMerchantPlan,
} from '@/lib/razorpay/plans';
import type { RazorpaySubscriptionEntity } from '@/lib/razorpay/subscriptions';
import {
  ACTIVE_RAZORPAY_SUBSCRIPTION_STATUSES,
  getRazorpaySubscription,
  subscriptionPeriodFromEntity,
  verifyRazorpaySubscriptionSignature,
} from '@/lib/razorpay/subscriptions';
import { getRazorpayPayment, ensureRazorpayPaymentCaptured, verifyRazorpayPaymentSignature } from '@/lib/razorpay/server';
import { addBillingCycle } from '@/lib/subscription/merchantSubscription';

export type FinalizeSubscriptionAuthInput = {
  businessId: string;
  subscriptionId: string;
  paymentId: string;
  plan: string;
  billingCycle: string;
  razorpaySignature?: string;
  source: 'checkout' | 'webhook';
};

export type FinalizeSubscriptionRenewalInput = {
  businessId: string;
  subscriptionId: string;
  paymentId: string;
  plan: string;
  billingCycle: string;
  amountPaise: number;
  source: 'webhook';
};

export type FinalizeResult =
  | { success: true; alreadyCompleted?: boolean }
  | { success: false; error: string };

async function revalidateMerchantPaths(businessId: string) {
  revalidatePath('/business/dashboard');
  revalidatePath(`/business/payment/${businessId}`);
  revalidatePath('/admin/payments');
  const supabase = createServiceClient();
  if (!supabase) return;
  const { data } = await supabase
    .from('Business')
    .select('id, slug, businessName, city')
    .eq('id', businessId)
    .maybeSingle();
  if (data) revalidateBusinessProfilePaths(data);
}

async function assertPaymentNotReused(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  paymentId: string,
  businessId: string
): Promise<FinalizeResult | null> {
  const { data: existingPayment } = await supabase
    .from('merchant_payments')
    .select('id, status, business_id')
    .eq('payment_id', paymentId)
    .maybeSingle();

  if (existingPayment?.status === 'completed' && existingPayment.business_id === businessId) {
    return { success: true, alreadyCompleted: true };
  }

  const { data: duplicatePayment } = await supabase
    .from('merchant_payments')
    .select('id')
    .eq('payment_id', paymentId)
    .neq('business_id', businessId)
    .maybeSingle();

  if (duplicatePayment) {
    return { success: false, error: 'This payment has already been used' };
  }

  return null;
}

async function completePendingAuthPaymentRecord(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  input: {
    businessId: string;
    subscriptionId: string;
    paymentId: string;
    paymentPayload: Record<string, unknown>;
  },
) {
  await supabase
    .from('merchant_payments')
    .update({
      ...input.paymentPayload,
      status: 'completed',
      payment_id: input.paymentId,
    })
    .eq('business_id', input.businessId)
    .eq('razorpay_subscription_id', input.subscriptionId)
    .eq('payment_type', 'subscription_auth')
    .eq('status', 'pending');
}

const CHECKOUT_SUBSCRIPTION_STATUSES = new Set([
  ...ACTIVE_RAZORPAY_SUBSCRIPTION_STATUSES,
  'created',
]);

async function getRazorpaySubscriptionForCheckout(
  subscriptionId: string,
): Promise<RazorpaySubscriptionEntity | null> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const subscription = await getRazorpaySubscription(subscriptionId);
    if (
      subscription &&
      (ACTIVE_RAZORPAY_SUBSCRIPTION_STATUSES.has(subscription.status) ||
        subscription.status === 'created')
    ) {
      return subscription;
    }
    if (attempt < 4) {
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }

  return getRazorpaySubscription(subscriptionId);
}

async function getCapturedAuthorizationPayment(
  paymentId: string,
): Promise<{ ok: true; payment: NonNullable<Awaited<ReturnType<typeof getRazorpayPayment>>> } | { ok: false; error: string }> {
  const remotePayment = await getRazorpayPayment(paymentId);
  if (!remotePayment) {
    return { ok: false, error: 'Unable to verify authorization payment' };
  }

  const captured =
    remotePayment.status === 'captured'
      ? remotePayment
      : await ensureRazorpayPaymentCaptured(remotePayment);

  if (!captured || captured.status !== 'captured') {
    return {
      ok: false,
      error:
        'Authorization payment is not captured yet. If money was deducted, wait a minute and refresh your dashboard, or contact support.',
    };
  }

  return { ok: true, payment: captured };
}

export async function finalizeSubscriptionAuthorization(
  input: FinalizeSubscriptionAuthInput
): Promise<FinalizeResult> {
  const { businessId, subscriptionId, paymentId, plan, billingCycle, razorpaySignature, source } =
    input;

  if (!businessId || !subscriptionId || !paymentId) {
    return { success: false, error: 'Incomplete subscription details' };
  }

  if (!isValidMerchantPlan(plan) || !isValidBillingCycle(billingCycle) || billingCycle !== 'monthly') {
    return { success: false, error: 'Invalid monthly subscription details' };
  }

  if (source === 'checkout') {
    if (!razorpaySignature) {
      return { success: false, error: 'Missing payment signature' };
    }
    const signatureValid = verifyRazorpaySubscriptionSignature({
      paymentId,
      subscriptionId,
      signature: razorpaySignature,
    });
    if (!signatureValid) {
      return { success: false, error: 'Mandate verification failed' };
    }
  }

  const remoteSubscription =
    source === 'checkout'
      ? await getRazorpaySubscriptionForCheckout(subscriptionId)
      : await getRazorpaySubscription(subscriptionId);
  if (!remoteSubscription) {
    return { success: false, error: 'Unable to verify auto-debit setup. Please contact support if amount was deducted.' };
  }

  const subscriptionStatusOk =
    source === 'checkout'
      ? CHECKOUT_SUBSCRIPTION_STATUSES.has(remoteSubscription.status)
      : ACTIVE_RAZORPAY_SUBSCRIPTION_STATUSES.has(remoteSubscription.status);

  if (!subscriptionStatusOk) {
    return {
      success: false,
      error: `Subscription is not active (status: ${remoteSubscription.status})`,
    };
  }

  const notesBusinessId = remoteSubscription.notes?.businessId?.trim();
  if (notesBusinessId && notesBusinessId !== businessId) {
    return { success: false, error: 'Subscription business mismatch' };
  }

  const paymentResult = await getCapturedAuthorizationPayment(paymentId);
  if (!paymentResult.ok) {
    return { success: false, error: paymentResult.error };
  }
  const remotePayment = paymentResult.payment;
  const orderIdFromPayment = remotePayment.order_id?.trim() || null;

  const expectedAmount = getPlanAmountInPaise(plan as MerchantPlan, billingCycle as BillingCycle);
  if (remotePayment.amount !== expectedAmount) {
    return { success: false, error: 'Authorization amount mismatch' };
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false, error: 'Payment service is not configured' };
  }

  const reuse = await assertPaymentNotReused(supabase, paymentId, businessId);
  if (reuse && !reuse.success) return reuse;
  const alreadyCompleted = Boolean(reuse?.alreadyCompleted);

  const { data: business, error: businessError } = await supabase
    .from('Business')
    .select('id, razorpaySubscriptionId')
    .eq('id', businessId)
    .single();

  if (businessError || !business) {
    return { success: false, error: 'Business not found' };
  }

  if (
    business.razorpaySubscriptionId &&
    business.razorpaySubscriptionId !== subscriptionId
  ) {
    return { success: false, error: 'Subscription does not match merchant account' };
  }

  const { planStartedAt, planExpiresAt } = subscriptionPeriodFromEntity(
    remoteSubscription,
    billingCycle as BillingCycle
  );
  const nowIso = new Date().toISOString();

  if (!alreadyCompleted) {
    const { error: businessUpdateError } = await supabase
      .from('Business')
      .update({
        paymentStatus: 'completed',
        paymentId,
        orderId: orderIdFromPayment,
        selectedPlan: plan,
        billingCycle,
        planStartedAt: planStartedAt.toISOString(),
        planExpiresAt: planExpiresAt.toISOString(),
        razorpaySubscriptionId: subscriptionId,
        subscriptionStatus: remoteSubscription.status,
        autoRenewEnabled: true,
        mandateStatus: 'active',
        subscriptionCancelledAt: null,
        updatedAt: nowIso,
      })
      .eq('id', businessId);

    if (businessUpdateError) {
      console.error('[razorpay] subscription auth finalize failed:', businessUpdateError);
      return { success: false, error: 'Failed to activate subscription' };
    }
  }

  const paymentPayload = {
    business_id: businessId,
    plan,
    billing_cycle: billingCycle,
    amount_paise: expectedAmount,
    currency: 'INR',
    status: 'completed',
    payment_id: paymentId,
    order_id: orderIdFromPayment,
    razorpay_subscription_id: subscriptionId,
    payment_type: 'subscription_auth',
    source,
    plan_started_at: planStartedAt.toISOString(),
    plan_expires_at: planExpiresAt.toISOString(),
    updated_at: nowIso,
  };

  const { data: pending } = await supabase
    .from('merchant_payments')
    .select('id')
    .eq('business_id', businessId)
    .eq('razorpay_subscription_id', subscriptionId)
    .eq('status', 'pending')
    .maybeSingle();

  if (pending?.id) {
    await supabase.from('merchant_payments').update(paymentPayload).eq('id', pending.id);
  } else if (!alreadyCompleted) {
    await supabase.from('merchant_payments').insert({ ...paymentPayload, created_at: nowIso });
  } else {
    await completePendingAuthPaymentRecord(supabase, {
      businessId,
      subscriptionId,
      paymentId,
      paymentPayload,
    });
  }

  await revalidateMerchantPaths(businessId);
  return { success: true, alreadyCompleted };
}

export async function finalizeSubscriptionRenewal(
  input: FinalizeSubscriptionRenewalInput
): Promise<FinalizeResult> {
  const { businessId, subscriptionId, paymentId, plan, billingCycle, amountPaise, source } = input;

  if (!isValidMerchantPlan(plan) || !isValidBillingCycle(billingCycle)) {
    return { success: false, error: 'Invalid plan or billing cycle' };
  }

  const expectedAmount = getPlanAmountInPaise(plan as MerchantPlan, billingCycle as BillingCycle);
  if (amountPaise !== expectedAmount) {
    return { success: false, error: 'Renewal amount mismatch' };
  }

  const remotePayment = await getRazorpayPayment(paymentId);
  if (!remotePayment || remotePayment.status !== 'captured') {
    return { success: false, error: 'Renewal payment is not captured' };
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false, error: 'Payment service is not configured' };
  }

  const reuse = await assertPaymentNotReused(supabase, paymentId, businessId);
  if (reuse) return reuse;

  const { data: business, error: businessError } = await supabase
    .from('Business')
    .select('id, planExpiresAt, razorpaySubscriptionId, autoRenewEnabled')
    .eq('id', businessId)
    .single();

  if (businessError || !business) {
    return { success: false, error: 'Business not found' };
  }

  if (business.razorpaySubscriptionId && business.razorpaySubscriptionId !== subscriptionId) {
    return { success: false, error: 'Subscription mismatch for renewal' };
  }

  const remoteSubscription = await getRazorpaySubscription(subscriptionId);
  const period = remoteSubscription
    ? subscriptionPeriodFromEntity(remoteSubscription, billingCycle as BillingCycle)
    : null;

  const currentExpiresAt = business.planExpiresAt ? new Date(business.planExpiresAt) : new Date();
  const planStartedAt =
    period?.planStartedAt ??
    (currentExpiresAt > new Date() ? currentExpiresAt : new Date());
  const planExpiresAt =
    period?.planExpiresAt ?? addBillingCycle(planStartedAt, billingCycle as BillingCycle);

  const nowIso = new Date().toISOString();

  const { error: businessUpdateError } = await supabase
    .from('Business')
    .update({
      paymentStatus: 'completed',
      paymentId,
      planStartedAt: planStartedAt.toISOString(),
      planExpiresAt: planExpiresAt.toISOString(),
      razorpaySubscriptionId: subscriptionId,
      subscriptionStatus: remoteSubscription?.status ?? 'active',
      autoRenewEnabled: business.autoRenewEnabled !== false,
      mandateStatus: 'active',
      updatedAt: nowIso,
    })
    .eq('id', businessId);

  if (businessUpdateError) {
    console.error('[razorpay] subscription renewal finalize failed:', businessUpdateError);
    return { success: false, error: 'Failed to record renewal' };
  }

  await supabase.from('merchant_payments').insert({
    business_id: businessId,
    plan,
    billing_cycle: billingCycle,
    amount_paise: amountPaise,
    currency: 'INR',
    status: 'completed',
    payment_id: paymentId,
    order_id: remotePayment.order_id?.trim() || null,
    razorpay_subscription_id: subscriptionId,
    payment_type: 'subscription_renewal',
    source,
    plan_started_at: planStartedAt.toISOString(),
    plan_expires_at: planExpiresAt.toISOString(),
    created_at: nowIso,
    updated_at: nowIso,
  });

  await revalidateMerchantPaths(businessId);
  return { success: true };
}

export async function applySubscriptionCancellation(params: {
  businessId: string;
  subscriptionId: string;
  status: string;
  cancelAtCycleEnd: boolean;
}): Promise<FinalizeResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false, error: 'Payment service is not configured' };
  }

  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from('Business')
    .update({
      subscriptionStatus: params.status,
      autoRenewEnabled: false,
      mandateStatus: 'cancelled',
      subscriptionCancelledAt: nowIso,
      updatedAt: nowIso,
    })
    .eq('id', params.businessId)
    .eq('razorpaySubscriptionId', params.subscriptionId);

  if (error) {
    console.error('[razorpay] subscription cancellation sync failed:', error);
    return { success: false, error: 'Failed to update cancellation status' };
  }

  await revalidateMerchantPaths(params.businessId);
  return { success: true };
}

export async function applySubscriptionHalted(params: {
  businessId: string;
  subscriptionId: string;
  status: string;
}): Promise<FinalizeResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false, error: 'Payment service is not configured' };
  }

  const { error } = await supabase
    .from('Business')
    .update({
      subscriptionStatus: params.status,
      mandateStatus: 'failed',
      updatedAt: new Date().toISOString(),
    })
    .eq('id', params.businessId)
    .eq('razorpaySubscriptionId', params.subscriptionId);

  if (error) {
    return { success: false, error: 'Failed to update halted subscription' };
  }

  await revalidateMerchantPaths(params.businessId);
  return { success: true };
}

/** Re-export order signature verify for annual one-time flow. */
export { verifyRazorpayPaymentSignature };
