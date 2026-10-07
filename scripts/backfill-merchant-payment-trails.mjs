/**
 * Write missing merchant_payments rows from Razorpay + current Business.paymentId.
 *
 * Usage:
 *   node scripts/backfill-merchant-payment-trails.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function loadEnvFiles() {
  for (const file of ['.env', '.env.local']) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function planFromAmount(amountPaise) {
  if (Number(amountPaise) >= 200000) return { plan: 'pro', billingCycle: 'annual' };
  return { plan: 'pro', billingCycle: 'monthly' };
}

function amountPaiseForCycle(billingCycle) {
  return billingCycle === 'annual' ? 358800 : 49900;
}

loadEnvFiles();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase service credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function razorpayAuth() {
  if (!keyId || !keySecret) return null;
  return Buffer.from(`${keyId}:${keySecret}`).toString('base64');
}

async function razorpayGet(path) {
  const auth = razorpayAuth();
  if (!auth) return null;
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!response.ok) return null;
  return response.json();
}

async function upsertTrail(row) {
  if (row.payment_id) {
    const { data: existing } = await supabase
      .from('merchant_payments')
      .select('id')
      .eq('payment_id', row.payment_id)
      .limit(1);
    if (existing?.[0]?.id) {
      const { error } = await supabase.from('merchant_payments').update(row).eq('id', existing[0].id);
      if (error) throw new Error(error.message);
      return 'updated';
    }
  }
  const { error } = await supabase.from('merchant_payments').insert(row);
  if (error && /duplicate|unique/i.test(error.message)) return 'exists';
  if (error) throw new Error(error.message);
  return 'inserted';
}

const nowIso = new Date().toISOString();
let scanned = 0;
let written = 0;

const auth = razorpayAuth();
if (auth) {
  for (let page = 0; page < 20; page += 1) {
    const data = await razorpayGet(`/payments?count=100&skip=${page * 100}`);
    const items = data?.items ?? [];
    if (items.length === 0) break;
    scanned += items.length;
    for (const payment of items) {
      if (payment.status !== 'captured' && !payment.captured) continue;
      const businessId = payment.notes?.businessId?.trim();
      if (!businessId) continue;
      const guessed = planFromAmount(payment.amount);
      const action = await upsertTrail({
        business_id: businessId,
        plan: payment.notes?.plan?.trim() || guessed.plan,
        billing_cycle: payment.notes?.billingCycle?.trim() || guessed.billingCycle,
        amount_paise: payment.amount,
        currency: 'INR',
        status: 'completed',
        payment_type: payment.notes?.billingCycle === 'monthly' ? 'subscription_renewal' : 'one_time',
        order_id: payment.order_id || null,
        payment_id: payment.id,
        razorpay_subscription_id: payment.notes?.subscriptionId || null,
        source: 'razorpay_backfill',
        created_at: payment.created_at ? new Date(payment.created_at * 1000).toISOString() : nowIso,
        updated_at: nowIso,
      });
      if (action !== 'exists') written += 1;
    }
    if (items.length < 100) break;
  }
}

const { data: businesses, error: businessError } = await supabase
  .from('Business')
  .select('id, paymentId, orderId, selectedPlan, billingCycle, razorpaySubscriptionId, planStartedAt, planExpiresAt, paymentStatus, updatedAt, createdAt')
  .eq('paymentStatus', 'completed');

if (businessError) {
  console.error('Could not load businesses.');
  process.exit(1);
}

for (const business of businesses ?? []) {
  if (business.paymentId) {
    const billingCycle = business.billingCycle || 'monthly';
    const action = await upsertTrail({
      business_id: business.id,
      plan: business.selectedPlan || 'pro',
      billing_cycle: billingCycle,
      amount_paise: amountPaiseForCycle(billingCycle),
      currency: 'INR',
      status: 'completed',
      payment_type: business.razorpaySubscriptionId ? 'subscription_auth' : 'one_time',
      order_id: business.orderId || null,
      payment_id: business.paymentId,
      razorpay_subscription_id: business.razorpaySubscriptionId || null,
      source: 'business_backfill',
      plan_started_at: business.planStartedAt || null,
      plan_expires_at: business.planExpiresAt || null,
      created_at: business.updatedAt || business.createdAt || nowIso,
      updated_at: nowIso,
    });
    if (action !== 'exists') written += 1;
  }

  if (business.razorpaySubscriptionId && auth) {
    const invoices = await razorpayGet(
      `/invoices?subscription_id=${encodeURIComponent(business.razorpaySubscriptionId)}&count=100`,
    );
    let index = 0;
    for (const invoice of invoices?.items ?? []) {
      const paymentId = invoice.payment_id?.trim();
      if (!paymentId) continue;
      const payment = await razorpayGet(`/payments/${paymentId}`);
      if (!payment?.id) continue;
      const guessed = planFromAmount(payment.amount || amountPaiseForCycle(business.billingCycle || 'monthly'));
      const action = await upsertTrail({
        business_id: business.id,
        plan: business.selectedPlan || guessed.plan,
        billing_cycle: business.billingCycle || guessed.billingCycle,
        amount_paise: payment.amount || amountPaiseForCycle(business.billingCycle || 'monthly'),
        currency: 'INR',
        status: payment.status === 'captured' || payment.captured ? 'completed' : 'pending',
        payment_type: index === 0 ? 'subscription_auth' : 'subscription_renewal',
        order_id: payment.order_id || null,
        payment_id: payment.id,
        razorpay_subscription_id: business.razorpaySubscriptionId,
        source: 'razorpay_invoice',
        created_at: payment.created_at ? new Date(payment.created_at * 1000).toISOString() : nowIso,
        updated_at: nowIso,
      });
      if (action !== 'exists') written += 1;
      index += 1;
    }
  }
}

console.log(`Payment trail backfill finished. scanned=${scanned} written=${written}`);
