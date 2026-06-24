'use client';

import { useEffect, useState } from 'react';
import {
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineCreditCard,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
import MerchantRechargeButton from '@/components/business/MerchantRechargeButton';
import { formatDateTimeInr } from '@/lib/formatDateTime';
import {
  cancelMerchantAutoRenew,
  getMerchantSubscriptionDetails,
  type MerchantPaymentHistoryItem,
} from '@/app/actions/subscription';
import { dashboard } from './dashboard-ui';
import { DashboardSectionHeader } from './DashboardShell';
import { PlanBadge, StatusBadge } from './StatusBadge';

type SubscriptionTabProps = {
  businessId: string;
  businessName: string;
  fullName?: string;
  email?: string;
  mobile?: string;
  onPaymentError?: (message: string) => void;
};

type SubscriptionView = {
  isActive: boolean;
  isExpired: boolean;
  isPendingPayment: boolean;
  canRenew: boolean;
  planName: string;
  billingCycle: string | null;
  daysRemaining: number | null;
  startedAtDisplay: string;
  expiresAtDisplay: string;
  autoRenewEnabled: boolean;
  mandateStatus: string;
  subscriptionStatus: string | null;
  canCancelAutoRenew: boolean;
  isMonthlyMandate: boolean;
};

function paymentTypeLabel(type: string) {
  if (type === 'subscription_auth') return 'Mandate setup';
  if (type === 'subscription_renewal') return 'Auto-debit';
  return 'One-time';
}

function historyStatusTone(status: string) {
  if (status === 'completed') return 'success' as const;
  if (status === 'pending') return 'warning' as const;
  if (status === 'failed') return 'danger' as const;
  return 'neutral' as const;
}

function formatDateTime(value: string | null) {
  return formatDateTimeInr(value);
}

export default function SubscriptionTab({
  businessId,
  businessName,
  fullName,
  email,
  mobile,
  onPaymentError,
}: SubscriptionTabProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState<SubscriptionView | null>(null);
  const [history, setHistory] = useState<MerchantPaymentHistoryItem[]>([]);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const reload = async () => {
    const result = await getMerchantSubscriptionDetails(businessId);
    if (result.success) {
      setSubscription(result.subscription);
      setHistory(result.history);
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError('');
      const result = await getMerchantSubscriptionDetails(businessId);
      if (cancelled) return;

      if (!result.success) {
        setError(result.error || 'Could not load subscription');
        setLoading(false);
        return;
      }

      setSubscription(result.subscription);
      setHistory(result.history);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  if (loading) {
    return (
      <div className={`${dashboard.panel} p-8 text-center text-sm text-zinc-500`}>
        Loading subscription details…
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className={`${dashboard.panel} p-8 text-center text-sm text-rose-700`}>
        {error || 'Subscription details unavailable'}
      </div>
    );
  }

  const showRenewCta = !subscription.isActive || subscription.canRenew;

  const handleCancelAutoRenew = async () => {
    const confirmed = window.confirm(
      'Cancel auto-debit? Your plan stays active until the current period ends. You will not be charged again unless you set up a new mandate.'
    );
    if (!confirmed) return;

    setCancelling(true);
    setCancelMessage(null);
    const result = await cancelMerchantAutoRenew(businessId);
    if (!result.success) {
      onPaymentError?.(result.error || 'Could not cancel auto-debit');
      setCancelling(false);
      return;
    }
    setCancelMessage(result.message);
    await reload();
    setCancelling(false);
  };

  return (
    <div className="space-y-6">
      <DashboardSectionHeader
        title="Subscription & billing"
        description="Track your Growth Pro plan, renewal dates, and payment history."
      />

      {subscription.isExpired && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          <HiOutlineExclamationTriangle className="mt-0.5 shrink-0" size={18} />
          <p>
            Your plan expired on <strong>{subscription.expiresAtDisplay}</strong>. Recharge to unlock lead
            contacts and premium visibility again.
          </p>
        </div>
      )}

      {!subscription.isActive && subscription.isPendingPayment && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <HiOutlineCreditCard className="mt-0.5 shrink-0" size={18} />
          <p>Complete your first recharge to activate Growth Pro and unlock lead contact details.</p>
        </div>
      )}

      {cancelMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <HiOutlineCheckCircle className="mt-0.5 shrink-0" size={18} />
          <p>{cancelMessage}</p>
        </div>
      )}

      {subscription.isMonthlyMandate && (
        <div className={`${dashboard.panel} p-5`}>
          <h3 className="text-sm font-semibold text-zinc-900">Monthly auto-debit mandate</h3>
          <p className="mt-1 text-sm text-zinc-600">
            {subscription.autoRenewEnabled
              ? 'Your Growth Pro plan renews automatically each month via Razorpay e-mandate (UPI Autopay / card mandate).'
              : subscription.mandateStatus === 'cancelled'
                ? 'Auto-debit is cancelled. Recharge manually before expiry to keep lead access.'
                : 'Complete mandate setup to enable automatic monthly billing.'}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge
              label={
                subscription.autoRenewEnabled
                  ? 'Auto-debit active'
                  : subscription.mandateStatus === 'cancelled'
                    ? 'Auto-debit cancelled'
                    : subscription.mandateStatus === 'pending'
                      ? 'Mandate pending'
                      : 'Auto-debit off'
              }
              tone={
                subscription.autoRenewEnabled
                  ? 'success'
                  : subscription.mandateStatus === 'failed'
                    ? 'danger'
                    : 'warning'
              }
              size="sm"
            />
            {subscription.subscriptionStatus && (
              <span className="text-xs capitalize text-zinc-500">
                Razorpay: {subscription.subscriptionStatus.replace(/_/g, ' ')}
              </span>
            )}
          </div>
          {subscription.canCancelAutoRenew && (
            <button
              type="button"
              onClick={() => void handleCancelAutoRenew()}
              disabled={cancelling}
              className="mt-4 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-50 disabled:opacity-60"
            >
              {cancelling ? 'Cancelling…' : 'Cancel auto-debit'}
            </button>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className={`${dashboard.panel} p-5 lg:col-span-2`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Current plan</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-zinc-900">{subscription.planName}</h2>
                <PlanBadge plan={subscription.planName} />
                {subscription.billingCycle && (
                  <StatusBadge
                    label={subscription.billingCycle === 'annual' ? 'Annual billing' : 'Monthly billing'}
                    tone="info"
                    size="sm"
                  />
                )}
              </div>
            </div>
            <StatusBadge
              label={
                subscription.isActive
                  ? 'Active'
                  : subscription.isExpired
                    ? 'Expired'
                    : 'Payment due'
              }
              tone={
                subscription.isActive ? 'success' : subscription.isExpired ? 'danger' : 'warning'
              }
              icon={
                subscription.isActive ? (
                  <HiOutlineCheckCircle size={12} />
                ) : (
                  <HiOutlineClock size={12} />
                )
              }
              pulse={!subscription.isActive}
            />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                <HiOutlineCalendarDays size={14} />
                Started
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-900">{subscription.startedAtDisplay}</p>
            </div>
            <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                <HiOutlineClock size={14} />
                Expires
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-900">{subscription.expiresAtDisplay}</p>
            </div>
            <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4">
              <p className="text-xs font-medium text-zinc-500">Days remaining</p>
              <p
                className={`mt-1 text-2xl font-bold tabular-nums ${
                  subscription.daysRemaining !== null && subscription.daysRemaining <= 7
                    ? 'text-amber-700'
                    : 'text-[#153551]'
                }`}
              >
                {subscription.daysRemaining !== null ? subscription.daysRemaining : '—'}
              </p>
            </div>
          </div>

          {showRenewCta && (
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-5">
              <MerchantRechargeButton
                businessId={businessId}
                businessName={businessName}
                fullName={fullName}
                email={email}
                mobile={mobile}
                label={subscription.isActive ? 'Renew early' : 'Recharge now'}
                onError={onPaymentError}
                className={dashboard.btnPrimary}
              />
              <p className="text-sm text-zinc-500">
                {subscription.isActive
                  ? 'Early renewal extends your plan from the current expiry date.'
                  : 'Choose monthly or annual billing on the pricing page.'}
              </p>
            </div>
          )}
        </div>

        <div className={`${dashboard.panel} p-5`}>
          <h3 className="text-sm font-semibold text-zinc-900">Plan benefits</h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600">
            <li>• View lead phone, email & WhatsApp</li>
            <li>• Verified partner badge on profile</li>
            <li>• Premium listing visibility</li>
            <li>• Lead center & analytics</li>
          </ul>
        </div>
      </div>

      <div className={`${dashboard.panel} overflow-hidden`}>
        <div className="border-b border-zinc-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-zinc-900">Payment history</h3>
          <p className="mt-0.5 text-sm text-zinc-500">All recharge attempts and completed transactions.</p>
        </div>

        {history.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-zinc-500">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Plan</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Transaction</th>
                  <th className="px-5 py-3 font-semibold">Valid until</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/60">
                    <td className="px-5 py-3">
                      <StatusBadge label={paymentTypeLabel(item.paymentType)} tone="info" size="sm" />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-zinc-600">{formatDateTime(item.createdAt)}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-zinc-800">{item.planName}</p>
                      <p className="text-xs capitalize text-zinc-500">{item.billingCycle}</p>
                    </td>
                    <td className="px-5 py-3 font-semibold tabular-nums">{item.amountDisplay}</td>
                    <td className="px-5 py-3">
                      <StatusBadge
                        label={item.status}
                        tone={historyStatusTone(item.status)}
                        size="sm"
                        className="capitalize"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <p className="max-w-[160px] truncate font-mono text-xs text-zinc-600" title={item.paymentId ?? undefined}>
                        {item.paymentId || item.orderId || '—'}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-zinc-600">
                      {item.planExpiresAt ? formatDateTime(item.planExpiresAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
