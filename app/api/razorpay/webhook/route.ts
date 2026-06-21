import { NextResponse } from 'next/server';
import { finalizeMerchantPayment } from '@/lib/razorpay/finalizeMerchantPayment';
import {
  ensureRazorpayPaymentCaptured,
  getRazorpayWebhookSecret,
  verifyRazorpayWebhookSignature,
  type RazorpayPaymentEntity,
} from '@/lib/razorpay/server';
import { isValidBillingCycle, isValidMerchantPlan } from '@/lib/razorpay/plans';

export const dynamic = 'force-dynamic';

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: RazorpayPaymentEntity;
    };
  };
};

const HANDLED_EVENTS = new Set(['payment.captured', 'payment.authorized']);

function extractPaymentEntity(body: RazorpayWebhookPayload): RazorpayPaymentEntity | null {
  return body.payload?.payment?.entity ?? null;
}

function extractPaymentMeta(payment: RazorpayPaymentEntity) {
  const notes = payment.notes ?? {};
  const businessId = notes.businessId?.trim();
  const plan = notes.plan?.trim() || 'pro';
  const billingCycle = notes.billingCycle?.trim() || 'monthly';

  if (!businessId) return null;
  if (!isValidMerchantPlan(plan) || !isValidBillingCycle(billingCycle)) return null;

  return {
    businessId,
    plan,
    billingCycle,
    orderId: payment.order_id,
    paymentId: payment.id,
    amountPaise: payment.amount,
  };
}

export async function POST(request: Request) {
  if (!getRazorpayWebhookSecret()) {
    console.error('[razorpay webhook] RAZORPAY_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature');

  if (!signature || !verifyRazorpayWebhookSignature(rawBody, signature)) {
    console.error('[razorpay webhook] invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let body: RazorpayWebhookPayload;
  try {
    body = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = body.event;
  if (!event || !HANDLED_EVENTS.has(event)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const payment = extractPaymentEntity(body);
  if (!payment) {
    return NextResponse.json({ error: 'Missing payment entity' }, { status: 400 });
  }

  const meta = extractPaymentMeta(payment);
  if (!meta) {
    console.error('[razorpay webhook] missing or invalid payment notes', payment.id);
    return NextResponse.json({ error: 'Invalid payment metadata' }, { status: 400 });
  }

  let capturedPayment = payment;
  if (event === 'payment.authorized' || payment.status === 'authorized') {
    const ensured = await ensureRazorpayPaymentCaptured(payment);
    if (!ensured) {
      return NextResponse.json({ ok: true, pending: 'awaiting_capture' });
    }
    capturedPayment = ensured;
  }

  if (capturedPayment.status !== 'captured') {
    return NextResponse.json({ ok: true, pending: capturedPayment.status });
  }

  const result = await finalizeMerchantPayment({
    businessId: meta.businessId,
    orderId: meta.orderId,
    paymentId: meta.paymentId,
    plan: meta.plan,
    billingCycle: meta.billingCycle,
    amountPaise: meta.amountPaise,
    source: 'webhook',
  });

  if (!result.success) {
    console.error('[razorpay webhook] finalize failed:', result.error, meta);
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return NextResponse.json({
    ok: true,
    event,
    alreadyCompleted: result.alreadyCompleted ?? false,
  });
}
