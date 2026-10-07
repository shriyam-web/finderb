import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import { getRazorpayPayment, listRazorpayPaymentsPage } from '@/lib/razorpay/server';
import { listRazorpaySubscriptionInvoices } from '@/lib/razorpay/subscriptions';

export type MerchantPaymentTrailInput = {
  businessId: string;
  plan: string;
  billingCycle: string;
  amountPaise: number;
  status: 'completed' | 'pending' | 'failed';
  paymentType: 'one_time' | 'subscription_auth' | 'subscription_renewal';
  orderId?: string | null;
  paymentId?: string | null;
  subscriptionId?: string | null;
  source?: string | null;
  planStartedAt?: string | null;
  planExpiresAt?: string | null;
  createdAt?: string | null;
};

function trailRow(input: MerchantPaymentTrailInput, nowIso: string) {
  return {
    business_id: input.businessId,
    plan: input.plan,
    billing_cycle: input.billingCycle,
    amount_paise: input.amountPaise,
    currency: 'INR',
    status: input.status,
    payment_type: input.paymentType,
    order_id: input.orderId || null,
    payment_id: input.paymentId || null,
    razorpay_subscription_id: input.subscriptionId || null,
    source: input.source || null,
    plan_started_at: input.planStartedAt || null,
    plan_expires_at: input.planExpiresAt || null,
    updated_at: nowIso,
  };
}

function isUniqueViolation(message: string) {
  return /duplicate|unique/i.test(message);
}

function planFromAmount(amountPaise: number): { plan: string; billingCycle: string } {
  if (amountPaise >= 200000) return { plan: 'pro', billingCycle: 'annual' };
  return { plan: 'pro', billingCycle: 'monthly' };
}

function amountPaiseForCycle(billingCycle: string) {
  return billingCycle === 'annual' ? 358800 : 49900;
}

export async function upsertMerchantPaymentTrail(
  input: MerchantPaymentTrailInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, error: 'Payment service is not configured' };

  const nowIso = new Date().toISOString();
  const row = trailRow(input, nowIso);

  if (input.paymentId) {
    const { data: existing } = await supabase
      .from('merchant_payments')
      .select('id')
      .eq('payment_id', input.paymentId)
      .limit(1);
    if (existing?.[0]?.id) {
      const { error } = await supabase.from('merchant_payments').update(row).eq('id', existing[0].id);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    }
  }

  if (input.orderId) {
    const { data: pending } = await supabase
      .from('merchant_payments')
      .select('id')
      .eq('business_id', input.businessId)
      .eq('order_id', input.orderId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);
    if (pending?.[0]?.id) {
      const { error } = await supabase.from('merchant_payments').update(row).eq('id', pending[0].id);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    }
  }

  if (
    input.subscriptionId &&
    input.status === 'completed' &&
    input.paymentType === 'subscription_auth'
  ) {
    const { data: pending } = await supabase
      .from('merchant_payments')
      .select('id')
      .eq('business_id', input.businessId)
      .eq('razorpay_subscription_id', input.subscriptionId)
      .eq('payment_type', 'subscription_auth')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);
    if (pending?.[0]?.id) {
      const { error } = await supabase.from('merchant_payments').update(row).eq('id', pending[0].id);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    }
  }

  const { error: insertError } = await supabase.from('merchant_payments').insert({
    ...row,
    created_at: input.createdAt || nowIso,
  });
  if (!insertError) return { ok: true };

  if (input.paymentId && isUniqueViolation(insertError.message)) {
    const { error } = await supabase.from('merchant_payments').update(row).eq('payment_id', input.paymentId);
    if (!error) return { ok: true };
    return { ok: false, error: error.message };
  }

  return { ok: false, error: insertError.message };
}

export async function syncRazorpayPaymentIntoTrail(params: {
  businessId: string;
  paymentId: string;
  plan?: string;
  billingCycle?: string;
  subscriptionId?: string | null;
  paymentType?: MerchantPaymentTrailInput['paymentType'];
  source?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const remote = await getRazorpayPayment(params.paymentId);
  if (!remote) return { ok: false, error: 'Could not load Razorpay payment' };

  const notesPlan = remote.notes?.plan?.trim();
  const notesCycle = remote.notes?.billingCycle?.trim();
  const guessed = planFromAmount(remote.amount);
  const status =
    remote.status === 'captured' || remote.captured
      ? 'completed'
      : remote.status === 'failed'
        ? 'failed'
        : 'pending';

  return upsertMerchantPaymentTrail({
    businessId: params.businessId,
    plan: params.plan || notesPlan || guessed.plan,
    billingCycle: params.billingCycle || notesCycle || guessed.billingCycle,
    amountPaise: remote.amount,
    status,
    paymentType: params.paymentType || (params.subscriptionId ? 'subscription_renewal' : 'one_time'),
    orderId: remote.order_id || null,
    paymentId: remote.id,
    subscriptionId: params.subscriptionId || remote.notes?.subscriptionId || null,
    source: params.source || 'razorpay_sync',
    createdAt: remote.created_at ? new Date(remote.created_at * 1000).toISOString() : null,
  });
}

export async function syncSubscriptionInvoiceTrails(params: {
  businessId: string;
  subscriptionId: string;
  plan?: string;
  billingCycle?: string;
}): Promise<number> {
  const invoices = await listRazorpaySubscriptionInvoices(params.subscriptionId);
  let written = 0;
  for (const invoice of invoices) {
    const paymentId = invoice.payment_id?.trim();
    if (!paymentId) continue;
    const result = await syncRazorpayPaymentIntoTrail({
      businessId: params.businessId,
      paymentId,
      plan: params.plan,
      billingCycle: params.billingCycle || 'monthly',
      subscriptionId: params.subscriptionId,
      paymentType: written === 0 ? 'subscription_auth' : 'subscription_renewal',
      source: 'razorpay_invoice',
    });
    if (result.ok) written += 1;
  }
  return written;
}

export async function backfillMerchantPaymentTrailsFromRazorpay(maxPages = 20): Promise<{
  scanned: number;
  written: number;
}> {
  const supabase = createServiceClient();
  if (!supabase) return { scanned: 0, written: 0 };

  let scanned = 0;
  let written = 0;

  for (let page = 0; page < maxPages; page += 1) {
    const items = await listRazorpayPaymentsPage(page * 100, 100);
    if (items.length === 0) break;
    scanned += items.length;

    for (const payment of items) {
      if (payment.status !== 'captured' && !payment.captured) continue;
      const businessId = payment.notes?.businessId?.trim();
      if (!businessId) continue;
      const guessed = planFromAmount(payment.amount);
      const result = await upsertMerchantPaymentTrail({
        businessId,
        plan: payment.notes?.plan?.trim() || guessed.plan,
        billingCycle: payment.notes?.billingCycle?.trim() || guessed.billingCycle,
        amountPaise: payment.amount,
        status: 'completed',
        paymentType: payment.notes?.billingCycle === 'monthly' ? 'subscription_renewal' : 'one_time',
        orderId: payment.order_id || null,
        paymentId: payment.id,
        subscriptionId: payment.notes?.subscriptionId || null,
        source: 'razorpay_backfill',
        createdAt: payment.created_at ? new Date(payment.created_at * 1000).toISOString() : null,
      });
      if (result.ok) written += 1;
    }

    if (items.length < 100) break;
  }

  const { data: businesses } = await supabase
    .from('Business')
    .select('id, paymentId, orderId, selectedPlan, billingCycle, razorpaySubscriptionId, planStartedAt, planExpiresAt, paymentStatus')
    .eq('paymentStatus', 'completed');

  for (const business of businesses ?? []) {
    const paymentId = business.paymentId ? String(business.paymentId) : '';
    if (paymentId) {
      const billingCycle = String(business.billingCycle || 'monthly');
      const result = await upsertMerchantPaymentTrail({
        businessId: String(business.id),
        plan: String(business.selectedPlan || 'pro'),
        billingCycle,
        amountPaise: amountPaiseForCycle(billingCycle),
        status: 'completed',
        paymentType: business.razorpaySubscriptionId ? 'subscription_auth' : 'one_time',
        orderId: business.orderId ? String(business.orderId) : null,
        paymentId,
        subscriptionId: business.razorpaySubscriptionId ? String(business.razorpaySubscriptionId) : null,
        source: 'business_backfill',
        planStartedAt: business.planStartedAt ? String(business.planStartedAt) : null,
        planExpiresAt: business.planExpiresAt ? String(business.planExpiresAt) : null,
      });
      if (result.ok) written += 1;
    }

    const subscriptionId = business.razorpaySubscriptionId
      ? String(business.razorpaySubscriptionId)
      : '';
    if (subscriptionId) {
      written += await syncSubscriptionInvoiceTrails({
        businessId: String(business.id),
        subscriptionId,
        plan: String(business.selectedPlan || 'pro'),
        billingCycle: String(business.billingCycle || 'monthly'),
      });
    }
  }

  return { scanned, written };
}
