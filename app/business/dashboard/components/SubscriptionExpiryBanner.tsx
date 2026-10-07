'use client';

import Link from 'next/link';
import { HiOutlineClock, HiOutlineCreditCard, HiOutlineExclamationTriangle } from 'react-icons/hi2';
import MerchantRechargeButton from '@/components/business/MerchantRechargeButton';
import type { MerchantSubscriptionStatus } from '@/lib/subscription/merchantSubscription';

type SubscriptionExpiryBannerProps = {
  businessId: string;
  businessName: string;
  fullName?: string;
  email?: string;
  mobile?: string;
  subscription: MerchantSubscriptionStatus;
  onOpenSubscription?: () => void;
};

export default function SubscriptionExpiryBanner({
  businessId,
  businessName,
  fullName,
  email,
  mobile,
  subscription,
}: SubscriptionExpiryBannerProps) {
  if (subscription.alertLevel === 'none') return null;

  const isExpired = subscription.alertLevel === 'expired';
  const isUrgent = subscription.alertLevel === 'urgent';

  const title = isExpired
    ? `Your ${subscription.planName} plan has expired`
    : isUrgent
      ? `Only ${subscription.daysRemaining} day${subscription.daysRemaining === 1 ? '' : 's'} left on your plan`
      : `Your plan expires in ${subscription.daysRemaining} days`;

  const description = isExpired
    ? 'Lead contact details stay hidden until you recharge.'
    : `Renew before ${subscription.expiresAt?.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })} to avoid interruption.`;

  const tone = isExpired
    ? 'border-rose-200 bg-rose-50 text-rose-950'
    : isUrgent
      ? 'border-orange-200 bg-orange-50 text-orange-950'
      : 'border-amber-200 bg-amber-50 text-amber-950';

  return (
    <div className={`h-full overflow-hidden rounded-xl border shadow-sm ${tone}`}>
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {isExpired ? (
            <HiOutlineExclamationTriangle size={20} className="mt-0.5 shrink-0" />
          ) : (
            <HiOutlineClock size={20} className="mt-0.5 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold">{title}</p>
            <p className="mt-0.5 text-xs opacity-90">{description}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <MerchantRechargeButton
            businessId={businessId}
            businessName={businessName}
            fullName={fullName}
            email={email}
            mobile={mobile}
            label={isExpired ? 'Recharge now' : 'Renew plan'}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#153551] px-4 py-2 text-sm font-semibold text-white hover:bg-[#215481]"
          />
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-current/20 px-4 py-2 text-sm font-semibold hover:bg-white/60"
          >
            <HiOutlineCreditCard size={16} />
            Compare plans
          </Link>
        </div>
      </div>
    </div>
  );
}
