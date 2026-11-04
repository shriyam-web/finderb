import {
  GROWTH_PRO_RETAIL_MONTHLY,
  GROWTH_PRO_OFFER_MONTHLY,
  GROWTH_PRO_RETAIL_ANNUAL,
  GROWTH_PRO_OFFER_ANNUAL,
} from '@/lib/pricing/growthPro';

export type BillingCycle = 'monthly' | 'annual';
export type MerchantPlan = 'pro';

export const MERCHANT_PLANS = {
  pro: {
    id: 'pro' as const,
    name: 'Pro',
    description: 'Unlock lead contacts, verified badge, and premium visibility',
    prices: {
      monthly: { amountInPaise: GROWTH_PRO_OFFER_MONTHLY * 100, display: '₹499' },
      annual: { amountInPaise: GROWTH_PRO_OFFER_ANNUAL * 100, display: '₹3,588' },
    },
    retailPrices: {
      monthly: GROWTH_PRO_RETAIL_MONTHLY,
      annual: GROWTH_PRO_RETAIL_ANNUAL,
    },
    features: [
      'Top ranking in search results',
      'Verified partner badge',
      'Lead center with contact details',
      'Premium analytics',
      'Priority support',
      'Custom profile URL',
    ],
  },
} as const;

export async function getPlanAmountInPaise(
  plan: MerchantPlan,
  billingCycle: BillingCycle,
): Promise<number> {
  const { getSiteConfig } = await import('@/lib/siteConfig');
  const config = await getSiteConfig();
  const rupees = billingCycle === 'annual' ? config.pricing.proAnnual : config.pricing.growthMonthly;
  const fallback = MERCHANT_PLANS[plan].prices[billingCycle].amountInPaise;
  if (!Number.isFinite(rupees) || rupees < 1) return fallback;
  return Math.round(rupees) * 100;
}

export function getPlanDisplayPrice(plan: MerchantPlan, billingCycle: BillingCycle): string {
  return MERCHANT_PLANS[plan].prices[billingCycle].display;
}

export function isValidBillingCycle(value: string): value is BillingCycle {
  return value === 'monthly' || value === 'annual';
}

export function isValidMerchantPlan(value: string): value is MerchantPlan {
  return value === 'pro';
}

/** Monthly plans use Razorpay Subscriptions + e-mandate auto-debit. */
export function isMonthlyMandateBilling(billingCycle: BillingCycle): boolean {
  return billingCycle === 'monthly';
}

/** Shown on Razorpay mandate consent — avoids the default 100-year Razorpay max. */
export const MANDATE_VALIDITY_YEARS = 5;

/** Monthly billing cycles for mandate window (use total_count, not end_at). */
export const MANDATE_TOTAL_MONTHLY_CYCLES = MANDATE_VALIDITY_YEARS * 12;

export function getRazorpayPlanId(plan: MerchantPlan, billingCycle: BillingCycle): string {
  if (plan !== 'pro') {
    throw new Error('Unsupported plan for Razorpay billing.');
  }

  if (billingCycle === 'monthly') {
    const planId = process.env.RAZORPAY_PLAN_ID_PRO_MONTHLY?.trim();
    if (!planId) {
      throw new Error('Monthly auto-debit is not available right now. Please contact support.');
    }
    return planId;
  }

  const annualPlanId = process.env.RAZORPAY_PLAN_ID_PRO_ANNUAL?.trim();
  if (annualPlanId) return annualPlanId;

  throw new Error('Annual billing uses one-time checkout; no subscription plan ID required.');
}
