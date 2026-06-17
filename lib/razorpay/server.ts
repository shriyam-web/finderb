import crypto from 'crypto';
import {
  type BillingCycle,
  type MerchantPlan,
  getPlanAmountInPaise,
} from '@/lib/razorpay/plans';

export type RazorpayOrderResponse = {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
};

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  return { keyId, keySecret };
}

export function isRazorpayConfigured(): boolean {
  const { keyId, keySecret } = getRazorpayCredentials();
  return Boolean(keyId && keySecret);
}

export function getPublicRazorpayKeyId(): string | undefined {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
}

export async function createRazorpayOrder(params: {
  businessId: string;
  plan: MerchantPlan;
  billingCycle: BillingCycle;
}): Promise<{ success: true; order: RazorpayOrderResponse; keyId: string } | { success: false; error: string }> {
  const { keyId, keySecret } = getRazorpayCredentials();

  if (!keyId || !keySecret) {
    return {
      success: false,
      error: 'Payment gateway is not configured. Please add Razorpay keys to your environment.',
    };
  }

  const amount = getPlanAmountInPaise(params.plan, params.billingCycle);
  const receipt = `biz_${params.businessId.slice(0, 8)}_${Date.now()}`;

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      amount,
      currency: 'INR',
      receipt,
      notes: {
        businessId: params.businessId,
        plan: params.plan,
        billingCycle: params.billingCycle,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Razorpay order creation failed:', data);
    return {
      success: false,
      error: data?.error?.description || 'Failed to create payment order. Please try again.',
    };
  }

  return {
    success: true,
    order: {
      id: data.id,
      amount: data.amount,
      currency: data.currency,
      receipt: data.receipt,
    },
    keyId,
  };
}

export function verifyRazorpayPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const { keySecret } = getRazorpayCredentials();
  if (!keySecret) return false;

  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${params.orderId}|${params.paymentId}`)
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
