import type { BillingCycle } from '@/lib/razorpay/plans';
import { PRICING_PLANS } from '@/lib/pricing/growthPro';

export const EXPIRY_WARNING_DAYS = 7;
export const EXPIRY_URGENT_DAYS = 3;

export type SubscriptionAlertLevel = 'none' | 'warning' | 'urgent' | 'expired';

export type MerchantSubscriptionInput = {
  paymentStatus?: string | null;
  selectedPlan?: string | null;
  billingCycle?: string | null;
  planStartedAt?: string | Date | null;
  planExpiresAt?: string | Date | null;
  updatedAt?: string | Date | null;
  createdAt?: string | Date | null;
  autoRenewEnabled?: boolean | null;
  mandateStatus?: string | null;
  subscriptionStatus?: string | null;
  razorpaySubscriptionId?: string | null;
};

export type MerchantSubscriptionStatus = {
  isActive: boolean;
  planName: string;
  planId: string;
  billingCycle: BillingCycle | null;
  startedAt: Date | null;
  expiresAt: Date | null;
  daysRemaining: number | null;
  alertLevel: SubscriptionAlertLevel;
  canRenew: boolean;
  isExpired: boolean;
  isPendingPayment: boolean;
  autoRenewEnabled: boolean;
  mandateStatus: string;
  subscriptionStatus: string | null;
  razorpaySubscriptionId: string | null;
  canCancelAutoRenew: boolean;
  mandateRevokePending: boolean;
  isMonthlyMandate: boolean;
};

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addBillingCycle(start: Date, billingCycle: BillingCycle): Date {
  const end = new Date(start);
  if (billingCycle === 'annual') {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end;
}

function resolveLegacyExpiry(input: MerchantSubscriptionInput): Date | null {
  if (input.paymentStatus !== 'completed') return null;
  const anchor = toDate(input.updatedAt) ?? toDate(input.createdAt);
  if (!anchor) return null;
  const cycle = input.billingCycle === 'annual' ? 'annual' : 'monthly';
  return addBillingCycle(anchor, cycle);
}

export function getDaysRemaining(expiresAt: Date | null, now = new Date()): number | null {
  if (!expiresAt) return null;
  const diffMs = startOfDay(expiresAt).getTime() - startOfDay(now).getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function getSubscriptionAlertLevel(daysRemaining: number | null): SubscriptionAlertLevel {
  if (daysRemaining === null) return 'none';
  if (daysRemaining <= 0) return 'expired';
  if (daysRemaining <= EXPIRY_URGENT_DAYS) return 'urgent';
  if (daysRemaining <= EXPIRY_WARNING_DAYS) return 'warning';
  return 'none';
}

export function isStarterPlan(planId?: string | null): boolean {
  const normalized = String(planId || 'free').toLowerCase();
  return normalized === 'free' || normalized === 'starter';
}

export function getPlanDisplayName(
  planId?: string | null,
  billingCycle?: string | null,
): string {
  const normalized = String(planId || 'free').toLowerCase();
  const cycle = billingCycle?.toLowerCase();

  if (normalized === 'free' || normalized === 'starter') {
    return PRICING_PLANS.free.name;
  }

  if (normalized === 'growth') {
    return PRICING_PLANS.monthly.name;
  }

  if (normalized === 'pro') {
    if (cycle === 'monthly') return PRICING_PLANS.monthly.name;
    return PRICING_PLANS.annual.name;
  }

  if (cycle === 'monthly') return PRICING_PLANS.monthly.name;
  if (cycle === 'annual') return PRICING_PLANS.annual.name;

  return PRICING_PLANS.free.name;
}

export function getPaidPlansLabel(): string {
  return `${PRICING_PLANS.monthly.name} or ${PRICING_PLANS.annual.name}`;
}

export function getMerchantSubscriptionStatus(
  input: MerchantSubscriptionInput,
  now = new Date()
): MerchantSubscriptionStatus {
  const planId = input.selectedPlan || 'free';
  const billingCycle =
    input.billingCycle === 'annual' || input.billingCycle === 'monthly'
      ? input.billingCycle
      : null;
  const startedAt = toDate(input.planStartedAt);
  const expiresAt = toDate(input.planExpiresAt) ?? resolveLegacyExpiry(input);
  const daysRemaining = getDaysRemaining(expiresAt, now);
  const isPendingPayment = input.paymentStatus === 'pending' || !input.paymentStatus;
  const paidCompleted = input.paymentStatus === 'completed';
  const isExpired = paidCompleted && daysRemaining !== null && daysRemaining <= 0;
  const isActive = paidCompleted && !isExpired;
  const alertLevel = paidCompleted ? getSubscriptionAlertLevel(daysRemaining) : 'none';

  const billingCycleMonthly = billingCycle === 'monthly';
  const autoRenewEnabled = Boolean(input.autoRenewEnabled);
  const mandateStatus = input.mandateStatus ? String(input.mandateStatus) : 'none';
  const subscriptionStatus = input.subscriptionStatus ? String(input.subscriptionStatus) : null;
  const razorpaySubscriptionId = input.razorpaySubscriptionId
    ? String(input.razorpaySubscriptionId)
    : null;
  const effectiveMandateStatus =
    paidCompleted && autoRenewEnabled && mandateStatus === 'pending' ? 'active' : mandateStatus;

  const mandateRevokePending =
    billingCycleMonthly &&
    !autoRenewEnabled &&
    effectiveMandateStatus === 'cancelled' &&
    subscriptionStatus !== 'cancelled' &&
    subscriptionStatus !== 'completed' &&
    subscriptionStatus !== 'expired' &&
    Boolean(razorpaySubscriptionId);

  const canCancelAutoRenew =
    (billingCycleMonthly &&
      autoRenewEnabled &&
      effectiveMandateStatus === 'active' &&
      subscriptionStatus !== 'cancelled' &&
      Boolean(razorpaySubscriptionId)) ||
    mandateRevokePending;

  const needsManualRenew =
    !isActive ||
    isExpired ||
    (daysRemaining !== null && daysRemaining <= EXPIRY_WARNING_DAYS) ||
    (billingCycleMonthly && !autoRenewEnabled && effectiveMandateStatus === 'cancelled');

  const planName = paidCompleted
    ? getPlanDisplayName(planId, billingCycle)
    : getPlanDisplayName('free');

  return {
    isActive,
    planName,
    planId,
    billingCycle,
    startedAt,
    expiresAt,
    daysRemaining,
    alertLevel,
    canRenew: needsManualRenew,
    isExpired,
    isPendingPayment: isPendingPayment && !paidCompleted,
    autoRenewEnabled,
    mandateStatus: effectiveMandateStatus,
    subscriptionStatus,
    razorpaySubscriptionId,
    canCancelAutoRenew,
    mandateRevokePending,
    isMonthlyMandate: billingCycleMonthly,
  };
}

export function formatSubscriptionDate(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatAmountInr(amountPaise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amountPaise / 100);
}

export function computeRenewalDates(input: {
  currentExpiresAt: Date | null;
  billingCycle: BillingCycle;
  now?: Date;
}): { planStartedAt: Date; planExpiresAt: Date } {
  const now = input.now ?? new Date();
  const activeUntil = input.currentExpiresAt && input.currentExpiresAt > now ? input.currentExpiresAt : now;
  const planStartedAt = input.currentExpiresAt && input.currentExpiresAt > now ? input.currentExpiresAt : now;
  const planExpiresAt = addBillingCycle(activeUntil, input.billingCycle);
  return { planStartedAt, planExpiresAt };
}
