import { NextResponse } from 'next/server';
import { finalizeMerchantPayment } from '@/lib/razorpay/finalizeMerchantPayment';
import {
  applySubscriptionCancellation,
  applySubscriptionHalted,
  finalizeSubscriptionAuthorization,
  finalizeSubscriptionRenewal,
} from '@/lib/razorpay/finalizeMerchantSubscription';
import {
  ensureRazorpayPaymentCaptured,
  getRazorpayWebhookSecret,
  verifyRazorpayWebhookSignature,
  type RazorpayPaymentEntity,
} from '@/lib/razorpay/server';
import type { RazorpaySubscriptionEntity } from '@/lib/razorpay/subscriptions';
import { isValidBillingCycle, isValidMerchantPlan } from '@/lib/razorpay/plans';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: { entity?: RazorpayPaymentEntity };
    subscription?: { entity?: RazorpaySubscriptionEntity };
  };
};

const PAYMENT_EVENTS = new Set(['payment.captured', 'payment.authorized']);
const SUBSCRIPTION_EVENTS = new Set([
  'subscription.authenticated',
  'subscription.activated',
  'subscription.charged',
  'subscription.cancelled',
  'subscription.halted',
  'subscription.completed',
]);

function extractPaymentEntity(body: RazorpayWebhookPayload): RazorpayPaymentEntity | null {
  return body.payload?.payment?.entity ?? null;
}

function extractSubscriptionEntity(body: RazorpayWebhookPayload): RazorpaySubscriptionEntity | null {
  return body.payload?.subscription?.entity ?? null;
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

async function resolveBusinessIdForSubscription(subscription: RazorpaySubscriptionEntity) {
  const fromNotes = subscription.notes?.businessId?.trim();
  if (fromNotes) return fromNotes;

  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from('Business')
    .select('id')
    .eq('razorpaySubscriptionId', subscription.id)
    .maybeSingle();

  return data?.id ?? null;
}

async function handleOneTimePayment(event: string, payment: RazorpayPaymentEntity) {
  const meta = extractPaymentMeta(payment);
  if (!meta) {
    console.error('[razorpay webhook] missing or invalid payment notes', payment.id);
    return NextResponse.json({ error: 'Invalid payment metadata' }, { status: 400 });
  }

  if (meta.billingCycle === 'monthly') {
    return NextResponse.json({ ok: true, ignored: 'monthly_uses_subscription_flow' });
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

  return NextResponse.json({ ok: true, event, alreadyCompleted: result.alreadyCompleted ?? false });
}

async function handleSubscriptionEvent(event: string, body: RazorpayWebhookPayload) {
  const subscription = extractSubscriptionEntity(body);
  if (!subscription) {
    return NextResponse.json({ error: 'Missing subscription entity' }, { status: 400 });
  }

  const businessId = await resolveBusinessIdForSubscription(subscription);
  if (!businessId) {
    console.error('[razorpay webhook] could not resolve business for subscription', subscription.id);
    return NextResponse.json({ error: 'Unknown subscription' }, { status: 422 });
  }

  const plan = subscription.notes?.plan?.trim() || 'pro';
  const billingCycle = subscription.notes?.billingCycle?.trim() || 'monthly';
  if (!isValidMerchantPlan(plan) || !isValidBillingCycle(billingCycle)) {
    return NextResponse.json({ error: 'Invalid subscription metadata' }, { status: 400 });
  }

  if (event === 'subscription.cancelled' || event === 'subscription.completed') {
    const result = await applySubscriptionCancellation({
      businessId,
      subscriptionId: subscription.id,
      status: subscription.status,
      cancelAtCycleEnd: true,
    });
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    return NextResponse.json({ ok: true, event });
  }

  if (event === 'subscription.halted') {
    const result = await applySubscriptionHalted({
      businessId,
      subscriptionId: subscription.id,
      status: subscription.status,
    });
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    return NextResponse.json({ ok: true, event });
  }

  if (event === 'subscription.charged') {
    const payment = extractPaymentEntity(body);
    if (!payment) {
      return NextResponse.json({ error: 'Missing charge payment entity' }, { status: 400 });
    }

    const captured = await ensureRazorpayPaymentCaptured(payment);
    if (!captured || captured.status !== 'captured') {
      return NextResponse.json({ ok: true, pending: 'awaiting_capture' });
    }

    const result = await finalizeSubscriptionRenewal({
      businessId,
      subscriptionId: subscription.id,
      paymentId: captured.id,
      plan,
      billingCycle,
      amountPaise: captured.amount,
      source: 'webhook',
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    return NextResponse.json({ ok: true, event, alreadyCompleted: result.alreadyCompleted ?? false });
  }

  if (event === 'subscription.authenticated' || event === 'subscription.activated') {
    const payment = extractPaymentEntity(body);
    if (!payment) {
      return NextResponse.json({ ok: true, pending: 'awaiting_auth_payment' });
    }

    const captured = await ensureRazorpayPaymentCaptured(payment);
    if (!captured || captured.status !== 'captured') {
      return NextResponse.json({ ok: true, pending: 'awaiting_capture' });
    }

    const result = await finalizeSubscriptionAuthorization({
      businessId,
      subscriptionId: subscription.id,
      paymentId: captured.id,
      plan,
      billingCycle,
      source: 'webhook',
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    return NextResponse.json({ ok: true, event, alreadyCompleted: result.alreadyCompleted ?? false });
  }

  return NextResponse.json({ ok: true, ignored: true });
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
  if (!event) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (SUBSCRIPTION_EVENTS.has(event)) {
    return handleSubscriptionEvent(event, body);
  }

  if (PAYMENT_EVENTS.has(event)) {
    const payment = extractPaymentEntity(body);
    if (!payment) {
      return NextResponse.json({ error: 'Missing payment entity' }, { status: 400 });
    }
    return handleOneTimePayment(event, payment);
  }

  return NextResponse.json({ ok: true, ignored: true });
}
