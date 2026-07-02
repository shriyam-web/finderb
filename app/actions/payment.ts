'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getOwnedBusiness } from '@/app/actions/business';
import { createServiceClient } from '@/lib/supabase/service';
import {
  type BillingCycle,
  type MerchantPlan,
  getPlanAmountInPaise,
  isMonthlyMandateBilling,
  isValidBillingCycle,
  isValidMerchantPlan,
} from '@/lib/razorpay/plans';
import {
  createRazorpayOrder,
  isRazorpayConfigured,
  isRazorpayWebhookConfigured,
} from '@/lib/razorpay/server';
import { finalizeMerchantPayment } from '@/lib/razorpay/finalizeMerchantPayment';
import { finalizeSubscriptionAuthorization } from '@/lib/razorpay/finalizeMerchantSubscription';
import {
  ACTIVE_RAZORPAY_SUBSCRIPTION_STATUSES,
  createRazorpaySubscription,
  isRazorpaySubscriptionsConfigured,
} from '@/lib/razorpay/subscriptions';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

function getPaymentDbClient() {
  const supabase = createServiceClient();
  if (!supabase) {
    return {
      ok: false as const,
      error: 'Payment service is not configured. Please contact support.',
    };
  }
  return { ok: true as const, supabase };
}

async function assertBusinessSession(businessId: string) {
  const sessionBusinessId = (await cookies()).get('business_id')?.value;
  if (!sessionBusinessId || sessionBusinessId !== businessId) {
    return { ok: false as const, error: 'Please sign in to your merchant account to continue payment.' };
  }
  return { ok: true as const };
}

function checkoutBusinessSummary(business: Record<string, unknown>) {
  return {
    businessName: String(business.businessName || business.name || ''),
    fullName: String(business.fullName || business.businessName || ''),
    email: String(business.email || business.workEmail || ''),
    mobile: String(business.mobile || ''),
  };
}

async function assertNoConflictingSubscription(
  business: Record<string, unknown>,
  billingCycle: BillingCycle
) {
  if (!isMonthlyMandateBilling(billingCycle)) return null;

  const subscriptionId = business.razorpaySubscriptionId
    ? String(business.razorpaySubscriptionId)
    : null;
  const subscriptionStatus = business.subscriptionStatus
    ? String(business.subscriptionStatus)
    : null;
  const autoRenew = Boolean(business.autoRenewEnabled);
  const mandateStatus = business.mandateStatus ? String(business.mandateStatus) : 'none';

  if (
    subscriptionId &&
    autoRenew &&
    mandateStatus === 'active' &&
    subscriptionStatus &&
    ACTIVE_RAZORPAY_SUBSCRIPTION_STATUSES.has(subscriptionStatus)
  ) {
    return {
      success: false as const,
      error:
        'You already have an active monthly auto-debit mandate. Cancel auto-renewal first if you want to change payment method.',
    };
  }

  return null;
}

export async function getRazorpayGatewayStatus() {
  return {
    configured: isRazorpayConfigured(),
    webhookConfigured: isRazorpayWebhookConfigured(),
    subscriptionsConfigured: isRazorpaySubscriptionsConfigured(),
  };
}

export async function getPaymentPageData(businessId: string) {
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

  return {
    success: true as const,
    business: businessResult.business,
    isAuthorized: true,
    razorpayConfigured: isRazorpayConfigured(),
    subscriptionsConfigured: isRazorpaySubscriptionsConfigured(),
  };
}

export async function createMerchantPaymentOrder(params: {
  businessId: string;
  plan: string;
  billingCycle: string;
}) {
  const { businessId, plan, billingCycle } = params;

  if (!businessId) {
    return { success: false as const, error: 'Business ID is required' };
  }

  const paymentLimit = await enforceRateLimit('payment', `order:${businessId}`);
  if (!paymentLimit.ok) return { success: false as const, error: paymentLimit.error };

  if (!isValidMerchantPlan(plan)) {
    return { success: false as const, error: 'Invalid plan selected' };
  }

  if (!isValidBillingCycle(billingCycle)) {
    return { success: false as const, error: 'Invalid billing cycle selected' };
  }

  const session = await assertBusinessSession(businessId);
  if (!session.ok) {
    return { success: false as const, error: session.error };
  }

  const businessResult = await getOwnedBusiness(businessId);
  if (!businessResult.success || !businessResult.business) {
    return { success: false as const, error: 'Business not found' };
  }

  const business = businessResult.business as Record<string, unknown>;
  const conflict = await assertNoConflictingSubscription(business, billingCycle);
  if (conflict) return conflict;

  if (isMonthlyMandateBilling(billingCycle)) {
    if (!isRazorpaySubscriptionsConfigured()) {
      return {
        success: false as const,
        error:
          'Monthly auto-debit is not configured. Add RAZORPAY_PLAN_ID_PRO_MONTHLY to your server environment.',
      };
    }

    const subscriptionResult = await createRazorpaySubscription({
      businessId,
      plan,
      billingCycle,
    });

    if (!subscriptionResult.success) {
      return { success: false as const, error: subscriptionResult.error };
    }

    const expectedAmount = getPlanAmountInPaise(plan, billingCycle);
    const db = getPaymentDbClient();
    if (!db.ok) {
      return { success: false as const, error: db.error };
    }
    const supabase = db.supabase;
    const nowIso = new Date().toISOString();

    const { error: businessUpdateError } = await supabase
      .from('Business')
      .update({
        selectedPlan: plan,
        billingCycle,
        razorpaySubscriptionId: subscriptionResult.subscription.id,
        subscriptionStatus: subscriptionResult.subscription.status,
        mandateStatus: 'pending',
        autoRenewEnabled: false,
        updatedAt: nowIso,
      })
      .eq('id', businessId);

    if (businessUpdateError) {
      console.error('[razorpay] failed to store pending subscription:', businessUpdateError);
      return { success: false as const, error: 'Could not start mandate setup. Please try again.' };
    }

    const { error: paymentRecordError } = await supabase.from('merchant_payments').insert({
      business_id: businessId,
      plan,
      billing_cycle: billingCycle,
      amount_paise: expectedAmount,
      currency: 'INR',
      status: 'pending',
      razorpay_subscription_id: subscriptionResult.subscription.id,
      payment_type: 'subscription_auth',
      created_at: nowIso,
      updated_at: nowIso,
    });

    if (paymentRecordError) {
      console.error('[razorpay] failed to create pending subscription record:', paymentRecordError);
    }

    return {
      success: true as const,
      checkoutMode: 'subscription' as const,
      subscription: {
        id: subscriptionResult.subscription.id,
      },
      keyId: subscriptionResult.keyId,
      business: checkoutBusinessSummary(business),
    };
  }

  const orderResult = await createRazorpayOrder({
    businessId,
    plan,
    billingCycle,
  });

  if (!orderResult.success) {
    return { success: false as const, error: orderResult.error };
  }

  const expectedAmount = getPlanAmountInPaise(plan, billingCycle);
  if (orderResult.order.amount !== expectedAmount) {
    return { success: false as const, error: 'Order amount mismatch. Please refresh and try again.' };
  }

  const db = getPaymentDbClient();
  if (!db.ok) {
    return { success: false as const, error: db.error };
  }
  const supabase = db.supabase;
  const { error: pendingOrderError } = await supabase
    .from('Business')
    .update({
      orderId: orderResult.order.id,
      selectedPlan: plan,
      billingCycle,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', businessId);

  if (pendingOrderError) {
    console.error('[razorpay] failed to store pending order id:', pendingOrderError);
    return { success: false as const, error: 'Could not start checkout. Please try again.' };
  }

  const nowIso = new Date().toISOString();
  const { error: paymentRecordError } = await supabase.from('merchant_payments').insert({
    business_id: businessId,
    plan,
    billing_cycle: billingCycle,
    amount_paise: expectedAmount,
    currency: 'INR',
    status: 'pending',
    order_id: orderResult.order.id,
    payment_type: 'one_time',
    created_at: nowIso,
    updated_at: nowIso,
  });

  if (paymentRecordError) {
    console.error('[razorpay] failed to create pending payment record:', paymentRecordError);
  }

  return {
    success: true as const,
    checkoutMode: 'order' as const,
    order: orderResult.order,
    keyId: orderResult.keyId,
    business: checkoutBusinessSummary(business),
  };
}

export async function completeMerchantPayment(params: {
  businessId: string;
  plan: string;
  billingCycle: string;
  razorpayOrderId?: string;
  razorpaySubscriptionId?: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const {
    businessId,
    plan,
    billingCycle,
    razorpayOrderId,
    razorpaySubscriptionId,
    razorpayPaymentId,
    razorpaySignature,
  } = params;

  if (!businessId || !razorpayPaymentId || !razorpaySignature) {
    return { success: false as const, error: 'Incomplete payment details received' };
  }

  const paymentLimit = await enforceRateLimit('payment', `complete:${businessId}`);
  if (!paymentLimit.ok) return { success: false as const, error: paymentLimit.error };

  if (!isValidMerchantPlan(plan) || !isValidBillingCycle(billingCycle)) {
    return { success: false as const, error: 'Invalid plan or billing cycle' };
  }

  const session = await assertBusinessSession(businessId);
  if (!session.ok) {
    return { success: false as const, error: session.error };
  }

  const businessResult = await getOwnedBusiness(businessId);
  if (!businessResult.success || !businessResult.business) {
    return { success: false as const, error: 'Business not found' };
  }

  const business = businessResult.business as Record<string, unknown>;

  if (isMonthlyMandateBilling(billingCycle as BillingCycle)) {
    if (!razorpaySubscriptionId) {
      return { success: false as const, error: 'Missing subscription reference for mandate setup' };
    }

    const pendingSubscriptionId = business.razorpaySubscriptionId
      ? String(business.razorpaySubscriptionId)
      : null;

    if (pendingSubscriptionId && pendingSubscriptionId !== razorpaySubscriptionId) {
      return {
        success: false as const,
        error: 'This mandate setup does not match your active checkout session. Please try again.',
      };
    }

    const result = await finalizeSubscriptionAuthorization({
      businessId,
      subscriptionId: razorpaySubscriptionId,
      paymentId: razorpayPaymentId,
      plan,
      billingCycle,
      razorpaySignature,
      source: 'checkout',
    });

    if (!result.success) {
      return { success: false as const, error: result.error };
    }

    const updatedBusiness = await getOwnedBusiness(businessId);
    if (!updatedBusiness.success || !updatedBusiness.business) {
      return { success: false as const, error: 'Mandate recorded but business could not be reloaded' };
    }

    revalidatePath('/business/dashboard');
    revalidatePath(`/business/payment/${businessId}`);

    return {
      success: true as const,
      business: updatedBusiness.business,
      alreadyCompleted: result.alreadyCompleted,
    };
  }

  if (!razorpayOrderId) {
    return { success: false as const, error: 'Missing order reference for payment' };
  }

  const pendingOrderId = business.orderId ? String(business.orderId) : null;

  if (pendingOrderId && pendingOrderId !== razorpayOrderId) {
    return {
      success: false as const,
      error: 'This payment does not match your active checkout session. Please start payment again.',
    };
  }

  const amountPaise = getPlanAmountInPaise(plan as MerchantPlan, billingCycle as BillingCycle);

  const result = await finalizeMerchantPayment({
    businessId,
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    plan,
    billingCycle,
    amountPaise,
    razorpaySignature,
    source: 'checkout',
  });

  if (!result.success) {
    return { success: false as const, error: result.error };
  }

  const updatedBusiness = await getOwnedBusiness(businessId);
  if (!updatedBusiness.success || !updatedBusiness.business) {
    return { success: false as const, error: 'Payment recorded but business could not be reloaded' };
  }

  revalidatePath('/business/dashboard');
  revalidatePath(`/business/payment/${businessId}`);

  return { success: true as const, business: updatedBusiness.business, alreadyCompleted: result.alreadyCompleted };
}
