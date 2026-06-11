export type BillingCycle = 'monthly' | 'annual';
export type MerchantPlan = 'pro';

export const MERCHANT_PLANS = {
  pro: {
    id: 'pro' as const,
    name: 'Growth Pro',
    description: 'Unlock lead contacts, verified badge, and premium visibility',
    prices: {
      monthly: { amountInPaise: 29900, display: '₹299' },
      annual: { amountInPaise: 299000, display: '₹2,990' },
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
