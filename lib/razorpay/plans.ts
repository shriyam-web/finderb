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
    name: 'Growth Pro',
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

export function getPlanAmountInPaise(plan: MerchantPlan, billingCycle: BillingCycle): number {
  return MERCHANT_PLANS[plan].prices[billingCycle].amountInPaise;
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
