import type { MerchantSubscriptionStatus } from '@/lib/subscription/merchantSubscription';

export type HealthItemStatus = 'complete' | 'attention' | 'review' | 'blocked';

export type AccountHealthItem = {
  id: string;
  label: string;
  detail: string;
  status: HealthItemStatus;
  priority: number;
};

export type AccountHealthSummary = {
  score: number;
  items: AccountHealthItem[];
  openCount: number;
  headline: string;
};

const statusLabel: Record<HealthItemStatus, string> = {
  complete: 'Complete',
  attention: 'Action required',
  review: 'In review',
  blocked: 'Blocked',
};

export function getHealthStatusLabel(status: HealthItemStatus): string {
  return statusLabel[status];
}

export function getAccountHealth(input: {
  paymentStatus?: string;
  kycStatus?: string;
  completionPercent: number;
  subscription?: Pick<
    MerchantSubscriptionStatus,
    'isActive' | 'isExpired' | 'daysRemaining' | 'expiresAt' | 'planName' | 'alertLevel'
  >;
}): AccountHealthSummary {
  const items: AccountHealthItem[] = [];

  const subscription = input.subscription;
  const paymentComplete = subscription?.isActive ?? input.paymentStatus === 'completed';
  const isExpired = subscription?.isExpired ?? false;
  const daysRemaining = subscription?.daysRemaining ?? null;

  let subscriptionDetail = 'Enquiries are coming in — activate Pro to see who to call back.';
  if (paymentComplete) {
    subscriptionDetail = 'You can view customer phone numbers and email on every enquiry.';
    if (daysRemaining !== null) {
      subscriptionDetail += ` Plan valid until ${subscription?.expiresAt?.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })} (${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left).`;
    }
  } else if (isExpired) {
    subscriptionDetail = 'Your plan has expired — recharge to unlock lead contact details again.';
  }

  items.push({
    id: 'subscription',
    label: 'Lead access',
    detail: subscriptionDetail,
    status: paymentComplete ? 'complete' : isExpired ? 'blocked' : 'attention',
    priority: paymentComplete ? 0 : isExpired ? 2 : 1,
  });

  const kyc = (input.kycStatus || 'pending').toLowerCase();
  let kycStatus: HealthItemStatus = 'attention';
  let kycDetail = 'Complete business identity verification (KYC) to unlock full partner status.';

  if (kyc === 'approved' || kyc === 'verified') {
    kycStatus = 'complete';
    kycDetail = 'Your business identity is verified on FinderB.';
  } else if (kyc === 'submitted') {
    kycStatus = 'review';
    kycDetail = 'KYC submitted — verification is in progress.';
  }

  items.push({
    id: 'kyc',
    label: 'Business verification (KYC)',
    detail: kycDetail,
    status: kycStatus,
    priority: kycStatus === 'complete' ? 0 : kycStatus === 'review' ? 2 : 1,
  });

  const profileComplete = input.completionPercent >= 100;
  items.push({
    id: 'profile',
    label: 'Public profile completeness',
    detail: profileComplete
      ? 'Your listing shows full business information to customers.'
      : `${input.completionPercent}% complete — incomplete profiles receive fewer enquiries.`,
    status: profileComplete ? 'complete' : input.completionPercent >= 70 ? 'review' : 'attention',
    priority: profileComplete ? 0 : input.completionPercent >= 70 ? 2 : 1,
  });

  // Score only reflects merchant-actionable readiness (subscription, KYC, profile).
  // FinderB trust badge is awarded separately by the platform — not part of this score.
  const openCount = items.filter((i) => i.status === 'attention' || i.status === 'blocked').length;
  const completeCount = items.filter((i) => i.status === 'complete').length;
  const score = Math.round((completeCount / items.length) * 100);

  let headline = 'Your partner account is fully operational.';
  if (openCount > 0) {
    headline = `${openCount} item${openCount > 1 ? 's' : ''} need${openCount === 1 ? 's' : ''} your attention before you reach full visibility.`;
  } else if (items.some((i) => i.status === 'review')) {
    headline = 'Verification in progress — you can still update your profile meanwhile.';
  }

  return {
    score,
    items: items.sort((a, b) => b.priority - a.priority),
    openCount,
    headline,
  };
}
