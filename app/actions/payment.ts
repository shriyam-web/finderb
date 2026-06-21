'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { getOwnedBusiness } from '@/app/actions/business';
import {
  type BillingCycle,
  type MerchantPlan,
  getPlanAmountInPaise,
  isValidBillingCycle,
  isValidMerchantPlan,
} from '@/lib/razorpay/plans';
import {
  createRazorpayOrder,
  isRazorpayConfigured,
  isRazorpayWebhookConfigured,
} from '@/lib/razorpay/server';
import { finalizeMerchantPayment } from '@/lib/razorpay/finalizeMerchantPayment';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

async function assertBusinessSession(businessId: string) {
  const sessionBusinessId = (await cookies()).get('business_id')?.value;
  if (!sessionBusinessId || sessionBusinessId !== businessId) {
    return { ok: false as const, error: 'Please sign in to your merchant account to continue payment.' };
  }
  return { ok: true as const };
}

export async function getRazorpayGatewayStatus() {
  return {
    configured: isRazorpayConfigured(),
    webhookConfigured: isRazorpayWebhookConfigured(),
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

  if (business.paymentStatus === 'completed') {
    return { success: false as const, error: 'Payment is already completed for this business.' };
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

  const supabase = createClient(await cookies());
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

  return {
    success: true as const,
    order: orderResult.order,
    keyId: orderResult.keyId,
    business: {
      businessName: String(business.businessName || business.name || ''),
      fullName: String(business.fullName || business.businessName || ''),
      email: String(business.email || business.workEmail || ''),
      mobile: String(business.mobile || ''),
    },
  };
}

export async function completeMerchantPayment(params: {
  businessId: string;
  plan: string;
  billingCycle: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const {
    businessId,
    plan,
    billingCycle,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  } = params;

  if (!businessId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
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
