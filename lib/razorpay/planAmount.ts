import 'server-only';

import { MERCHANT_PLANS, type BillingCycle, type MerchantPlan } from '@/lib/razorpay/plans';

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
