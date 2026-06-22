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
import { getRazorpayPayment, verifyRazorpayPaymentSignature } from '@/lib/razorpay/server';

export type FinalizeMerchantPaymentInput = {
  businessId: string;
  orderId: string;
  paymentId: string;
  plan: string;
  billingCycle: string;
  amountPaise: number;
  razorpaySignature?: string;
  source: 'checkout' | 'webhook';
};

export type FinalizeMerchantPaymentResult =
  | { success: true; alreadyCompleted?: boolean }
  | { success: false; error: string };

async function revalidateMerchantPaymentPaths(businessId: string) {
  revalidatePath('/business/dashboard');
  revalidatePath(`/business/payment/${businessId}`);
  const supabase = createServiceClient();
  if (!supabase) return;
  const { data } = await supabase
    .from('Business')
    .select('id, slug, businessName, city')
    .eq('id', businessId)
    .maybeSingle();
  if (data) revalidateBusinessProfilePaths(data);
}

export async function finalizeMerchantPayment(
  input: FinalizeMerchantPaymentInput
): Promise<FinalizeMerchantPaymentResult> {
  const {
    businessId,
    orderId,
    paymentId,
    plan,
    billingCycle,
    amountPaise,
    razorpaySignature,
    source,
  } = input;

  if (!businessId || !orderId || !paymentId) {
    return { success: false, error: 'Incomplete payment details' };
  }

  if (!isValidMerchantPlan(plan) || !isValidBillingCycle(billingCycle)) {
    return { success: false, error: 'Invalid plan or billing cycle' };
  }

  const expectedAmount = getPlanAmountInPaise(plan as MerchantPlan, billingCycle as BillingCycle);
  if (amountPaise !== expectedAmount) {
    return { success: false, error: 'Payment amount does not match selected plan' };
  }

  if (source === 'checkout') {
    if (!razorpaySignature) {
      return { success: false, error: 'Missing payment signature' };
    }
    const signatureValid = verifyRazorpayPaymentSignature({
      orderId,
      paymentId,
      signature: razorpaySignature,
    });
    if (!signatureValid) {
      return { success: false, error: 'Payment verification failed' };
    }
  } else {
    const remotePayment = await getRazorpayPayment(paymentId);
    if (!remotePayment) {
      return { success: false, error: 'Unable to verify payment with Razorpay' };
    }
    if (remotePayment.status !== 'captured') {
      return { success: false, error: `Payment is not captured (status: ${remotePayment.status})` };
    }
    if (remotePayment.order_id !== orderId) {
      return { success: false, error: 'Payment order mismatch' };
    }
    if (remotePayment.amount !== expectedAmount) {
      return { success: false, error: 'Remote payment amount mismatch' };
    }
    const remoteBusinessId = remotePayment.notes?.businessId;
    if (remoteBusinessId && remoteBusinessId !== businessId) {
      return { success: false, error: 'Payment business mismatch' };
    }
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false, error: 'Payment service is not configured' };
  }

  const { data: current, error: currentError } = await supabase
    .from('Business')
    .select('id, paymentStatus, paymentId, orderId')
    .eq('id', businessId)
    .single();

  if (currentError || !current) {
    return { success: false, error: 'Business not found' };
  }

  if (current.paymentStatus === 'completed') {
    if (current.paymentId === paymentId) {
      return { success: true, alreadyCompleted: true };
    }
    return { success: false, error: 'Payment is already completed for this business' };
  }

  if (current.orderId && current.orderId !== orderId) {
    return { success: false, error: 'Order does not match the pending checkout session' };
  }

  const { data: duplicatePayment } = await supabase
    .from('Business')
    .select('id')
    .eq('paymentId', paymentId)
    .neq('id', businessId)
    .maybeSingle();

  if (duplicatePayment) {
    return { success: false, error: 'This payment has already been used' };
  }

  const { error: updateError } = await supabase
    .from('Business')
    .update({
      paymentStatus: 'completed',
      paymentId,
      orderId,
      selectedPlan: plan,
      billingCycle,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', businessId);

  if (updateError) {
    console.error('[razorpay] finalize payment failed:', updateError);
    return { success: false, error: 'Failed to activate subscription' };
  }

  await revalidateMerchantPaymentPaths(businessId);
  return { success: true };
}
