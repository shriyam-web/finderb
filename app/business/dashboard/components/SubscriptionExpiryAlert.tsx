'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HiOutlineClock, HiOutlineCreditCard, HiOutlineExclamationTriangle, HiOutlineXMark } from 'react-icons/hi2';
import MerchantRechargeButton from '@/components/business/MerchantRechargeButton';
import type { MerchantSubscriptionStatus } from '@/lib/subscription/merchantSubscription';
import { EXPIRY_URGENT_DAYS, EXPIRY_WARNING_DAYS } from '@/lib/subscription/merchantSubscription';

type SubscriptionExpiryAlertProps = {
  businessId: string;
  businessName: string;
  fullName?: string;
  email?: string;
  mobile?: string;
  subscription: MerchantSubscriptionStatus;
  onOpenSubscription?: () => void;
};

function getDismissKey(level: string, businessId: string) {
  const today = new Date().toISOString().slice(0, 10);
  return `finderb-subscription-alert:${businessId}:${level}:${today}`;
}

export default function SubscriptionExpiryAlert({
  businessId,
  businessName,
  fullName,
  email,
  mobile,
  subscription,
  onOpenSubscription,
}: SubscriptionExpiryAlertProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (subscription.alertLevel === 'none') {
      setVisible(false);
      return;
    }

    const key = getDismissKey(subscription.alertLevel, businessId);
    if (typeof window !== 'undefined' && window.localStorage.getItem(key)) {
      setVisible(false);
      return;
    }

    setVisible(true);
  }, [businessId, subscription.alertLevel]);

  if (!visible || subscription.alertLevel === 'none') return null;

  const dismiss = () => {
    const key = getDismissKey(subscription.alertLevel, businessId);
    window.localStorage.setItem(key, '1');
    setVisible(false);
  };

  const isExpired = subscription.alertLevel === 'expired';
  const isUrgent = subscription.alertLevel === 'urgent';

  const title = isExpired
    ? `Your ${subscription.lastPlanName ?? subscription.planName} plan has expired`
    : isUrgent
      ? `Only ${subscription.daysRemaining} day${subscription.daysRemaining === 1 ? '' : 's'} left on your plan`
      : `Your plan expires in ${subscription.daysRemaining} days`;

  const description = isExpired
    ? 'Lead contact details are hidden until you recharge. Renew now to restore full partner access.'
    : `Recharge before your plan ends on ${subscription.expiresAt?.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })} to avoid interruption.`;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-zinc-900/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscription-alert-title"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl"
      >
        <div
          className={`px-5 py-4 ${
            isExpired
              ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white'
              : isUrgent
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                : 'bg-gradient-to-r from-amber-500 to-[#f9b864] text-[#27272A]'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {isExpired ? (
                <HiOutlineExclamationTriangle size={24} className="mt-0.5 shrink-0" />
              ) : (
                <HiOutlineClock size={24} className="mt-0.5 shrink-0" />
              )}
              <div>
                <h2 id="subscription-alert-title" className="text-lg font-bold">
                  {title}
                </h2>
                <p className="mt-1 text-sm opacity-90">{description}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-md p-1 opacity-80 hover:opacity-100"
              aria-label="Dismiss alert"
            >
              <HiOutlineXMark size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-3 p-5">
          <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            <p>
              <span className="font-medium">Current plan:</span> {subscription.planName}
              {subscription.isActive && subscription.billingCycle ? ` · ${subscription.billingCycle}` : ''}
              {subscription.isExpired && subscription.lastPlanName
                ? ` (${subscription.lastPlanName} expired)`
                : ''}
            </p>
            {subscription.expiresAt && (
              <p className="mt-1">
                <span className="font-medium">Expires:</span>{' '}
                {subscription.expiresAt.toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <MerchantRechargeButton
              businessId={businessId}
              businessName={businessName}
              fullName={fullName}
              email={email}
              mobile={mobile}
              label={isExpired ? 'Recharge now' : 'Renew plan'}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#27272A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3F3F46]"
            />
            <button
              type="button"
              onClick={() => {
                dismiss();
                onOpenSubscription?.();
              }}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              <HiOutlineCreditCard size={16} />
              View subscription
            </button>
          </div>

          <p className="text-center text-xs text-zinc-400">
            Alerts show once per day when your plan is within {EXPIRY_WARNING_DAYS} days of expiry
            {EXPIRY_URGENT_DAYS < EXPIRY_WARNING_DAYS ? ` (${EXPIRY_URGENT_DAYS} days for urgent reminders)` : ''}.
            {' '}
            <Link href="/pricing" className="text-[#3F3F46] hover:underline">
              Compare plans
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
