'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  HiOutlineCheckCircle,
  HiOutlineCreditCard,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
import {
  GROWTH_PRO_OFFER_ANNUAL,
  GROWTH_PRO_OFFER_MONTHLY,
  PRICING_PLANS,
  formatInr,
} from '@/lib/pricing/growthPro';
import { getPaidPlansLabel } from '@/lib/subscription/merchantSubscription';
import { formatDateTimeInr } from '@/lib/formatDateTime';
import {
  cancelMerchantAutoRenew,
  getMerchantSubscriptionDetails,
  type MerchantPaymentHistoryItem,
} from '@/app/actions/subscription';
import SubscriptionInsightsPanel from './SubscriptionInsightsPanel';
import { dashboard } from './dashboard-ui';

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
  mandateRevokePending: boolean;
  isMonthlyMandate: boolean;
  startedAt: string | null;
  expiresAt: string | null;
};

function paymentTypeLabel(type: string) {
  if (type === 'subscription_auth') return 'Monthly auto-debit';
  if (type === 'subscription_renewal') return 'Monthly renewal';
  return 'One-time';
}

function formatDateTime(value: string | null) {
  return formatDateTimeInr(value);
}

function planPriceShort(planName: string, billingCycle: string | null): string {
  if (planName === PRICING_PLANS.free.name) return 'Free';
  if (billingCycle === 'annual' || planName === PRICING_PLANS.annual.name) {
    return `${formatInr(GROWTH_PRO_OFFER_ANNUAL)} / year`;
  }
  return `${formatInr(GROWTH_PRO_OFFER_MONTHLY)} / month`;
}

function statusTextClass(status: string) {
  if (status === 'completed') return 'text-emerald-700';
  if (status === 'pending') return 'text-amber-700';
  if (status === 'failed') return 'text-rose-700';
  return 'text-zinc-600';
}

function PaymentReferencesCell({ item }: { item: MerchantPaymentHistoryItem }) {
  const refs: { label: string; value: string }[] = [];
  if (item.paymentId) refs.push({ label: 'Txn', value: item.paymentId });
  if (item.orderId) refs.push({ label: 'Order', value: item.orderId });
  if (item.subscriptionId) refs.push({ label: 'Recurring', value: item.subscriptionId });

  if (refs.length === 0) return <span className="text-zinc-400">—</span>;

  return (
    <div className="space-y-1 text-xs text-zinc-700">
      {refs.map((ref) => (
        <div key={ref.label} className="break-all">
          <span className="text-zinc-500">{ref.label}: </span>
          <span className="font-mono">{ref.value}</span>
        </div>
      ))}
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-x-4 gap-y-1 border-b border-zinc-100 py-3 text-sm last:border-0 sm:grid-cols-[9rem_1fr]">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-zinc-900">{children}</dd>
    </div>
  );
}

export default function SubscriptionTab({
  businessId,
  onPaymentError,
}: SubscriptionTabProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState<SubscriptionView | null>(null);
  const [history, setHistory] = useState<MerchantPaymentHistoryItem[]>([]);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const toIso = (value: unknown): string | null => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    return null;
  };

  const mapSubscription = (raw: Record<string, unknown>): SubscriptionView => ({
    isActive: Boolean(raw.isActive),
    isExpired: Boolean(raw.isExpired),
    isPendingPayment: Boolean(raw.isPendingPayment),
    canRenew: Boolean(raw.canRenew),
    planName: String(raw.planName),
    billingCycle: raw.billingCycle ? String(raw.billingCycle) : null,
    daysRemaining: typeof raw.daysRemaining === 'number' ? raw.daysRemaining : null,
    startedAtDisplay: String(raw.startedAtDisplay),
    expiresAtDisplay: String(raw.expiresAtDisplay),
    autoRenewEnabled: Boolean(raw.autoRenewEnabled),
    mandateStatus: String(raw.mandateStatus),
    subscriptionStatus: raw.subscriptionStatus ? String(raw.subscriptionStatus) : null,
    canCancelAutoRenew: Boolean(raw.canCancelAutoRenew),
    mandateRevokePending: Boolean(raw.mandateRevokePending),
    isMonthlyMandate: Boolean(raw.isMonthlyMandate),
    startedAt: toIso(raw.startedAt),
    expiresAt: toIso(raw.expiresAt),
  });

  const reload = async () => {
    const result = await getMerchantSubscriptionDetails(businessId);
    if (result.success) {
      setSubscription(mapSubscription(result.subscription as Record<string, unknown>));
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
      setSubscription(mapSubscription(result.subscription as Record<string, unknown>));
      setHistory(result.history);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  if (loading) {
    return <div className={`${dashboard.panel} p-8 text-center text-sm text-zinc-500`}>Loading…</div>;
  }

  if (error || !subscription) {
    return (
      <div className={`${dashboard.panel} p-8 text-center text-sm text-rose-700`}>
        {error || 'Could not load your subscription'}
      </div>
    );
  }

  const showRenewCta = !subscription.isActive || subscription.canRenew;
  const statusLabel = subscription.isActive
    ? 'Active'
    : subscription.isExpired
      ? 'Expired'
      : 'Payment due';
  const statusClass = subscription.isActive
    ? 'text-emerald-700'
    : subscription.isExpired
      ? 'text-rose-700'
      : 'text-amber-700';
  const daysLow =
    subscription.daysRemaining !== null && subscription.daysRemaining <= 7 && subscription.isActive;

  const autoDebitLabel = subscription.autoRenewEnabled
    ? 'On'
    : subscription.mandateRevokePending
      ? 'Cancel pending in payment app'
      : subscription.mandateStatus === 'cancelled'
        ? 'Cancelled'
        : subscription.mandateStatus === 'pending'
          ? 'Pending setup'
          : 'Off';

  const handleCancelAutoRenew = async () => {
    const confirmed = window.confirm(
      subscription.mandateRevokePending
        ? 'Your auto-debit was marked cancelled earlier but the UPI mandate may still be active. Revoke it now? Your Growth Pro plan stays active until the current period ends.'
        : 'Cancel auto-debit? This revokes the UPI mandate in your payment app (you may get a confirmation there). Your Growth Pro plan stays active until the current period ends.'
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
    <div className="space-y-8">
      {subscription.isExpired && (
        <div className="flex gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          <HiOutlineExclamationTriangle className="mt-0.5 shrink-0" size={18} />
          <p>
            Plan expired on {subscription.expiresAtDisplay}. Pay again to restore lead contacts.
          </p>
        </div>
      )}

      {!subscription.isActive && subscription.isPendingPayment && (
        <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <HiOutlineCreditCard className="mt-0.5 shrink-0" size={18} />
          <p>Upgrade to {getPaidPlansLabel()} to view enquiry contact details.</p>
        </div>
      )}

      {cancelMessage && (
        <div className="flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <HiOutlineCheckCircle className="mt-0.5 shrink-0" size={18} />
          <p>{cancelMessage}</p>
        </div>
      )}

      <section>
        <h2 className="text-sm font-semibold text-zinc-900">Plan details</h2>
        <div className={`${dashboard.panel} mt-3 px-5 py-1 md:px-6`}>
          <dl>
            <DetailRow label="Plan">{subscription.planName}</DetailRow>
            <DetailRow label="Status">
              <span className={statusClass}>{statusLabel}</span>
            </DetailRow>
            <DetailRow label="Price">
              {planPriceShort(subscription.planName, subscription.billingCycle)}
            </DetailRow>
            {subscription.billingCycle && (
              <DetailRow label="Billing">
                {subscription.billingCycle === 'annual' ? 'Annual' : 'Monthly'}
              </DetailRow>
            )}
            <DetailRow label="Started">{subscription.startedAtDisplay}</DetailRow>
            <DetailRow label="Valid until">{subscription.expiresAtDisplay}</DetailRow>
            {subscription.isActive && subscription.daysRemaining !== null && (
              <DetailRow label="Days left">
                <span className={daysLow ? 'text-amber-800' : undefined}>
                  {subscription.daysRemaining}
                </span>
              </DetailRow>
            )}
            {subscription.isMonthlyMandate && (
              <DetailRow label="Auto-debit">
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>{autoDebitLabel}</span>
                  {subscription.canCancelAutoRenew && (
                    <button
                      type="button"
                      onClick={() => void handleCancelAutoRenew()}
                      disabled={cancelling}
                      className="text-rose-700 hover:underline disabled:opacity-60"
                    >
                      {cancelling
                        ? 'Cancelling…'
                        : subscription.mandateRevokePending
                          ? 'Revoke mandate'
                          : 'Cancel'}
                    </button>
                  )}
                </span>
              </DetailRow>
            )}
          </dl>

          {showRenewCta && (
            <div className="flex flex-wrap gap-2 border-t border-zinc-100 py-4">
              <Link href={`/business/payment/${businessId}?checkout=1&billing=monthly`} className={dashboard.btnPrimary}>
                Growth — {formatInr(GROWTH_PRO_OFFER_MONTHLY)}/mo
              </Link>
              <Link
                href={`/business/payment/${businessId}?checkout=1&billing=annual`}
                className={dashboard.btnSecondary}
              >
                Pro — {formatInr(GROWTH_PRO_OFFER_ANNUAL)}/yr
              </Link>
            </div>
          )}
        </div>
      </section>

      <SubscriptionInsightsPanel
        history={history}
        startedAt={subscription.startedAt}
        expiresAt={subscription.expiresAt}
        daysRemaining={subscription.daysRemaining}
        isActive={subscription.isActive}
        planName={subscription.planName}
      />

      <section>
        <h2 className="text-sm font-semibold text-zinc-900">Payment history</h2>

        <div className={`${dashboard.surface} mt-3`}>
          {history.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-zinc-500 md:px-6">
              No payments on record.
              {showRenewCta && (
                <div className="mt-4">
                  <Link href={`/pricing?businessId=${businessId}`} className={dashboard.btnPrimary}>
                    View plans
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[820px] w-full text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
                  <tr>
                    <th className="px-5 py-2.5 font-medium md:px-6">Date</th>
                    <th className="px-5 py-2.5 font-medium md:px-6">Plan</th>
                    <th className="px-5 py-2.5 font-medium md:px-6">Amount</th>
                    <th className="px-5 py-2.5 font-medium md:px-6">Type</th>
                    <th className="px-5 py-2.5 font-medium md:px-6">Status</th>
                    <th className="px-5 py-2.5 font-medium md:px-6">From</th>
                    <th className="px-5 py-2.5 font-medium md:px-6">Until</th>
                    <th className="px-5 py-2.5 font-medium md:px-6">References</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td className="whitespace-nowrap px-5 py-3 text-zinc-700 md:px-6">
                        {formatDateTime(item.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-zinc-900 md:px-6">
                        {item.planName}
                        <span className="text-zinc-500"> ({item.billingCycle})</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 tabular-nums text-zinc-900 md:px-6">
                        {item.amountDisplay}
                      </td>
                      <td className="px-5 py-3 text-zinc-700 md:px-6">
                        {paymentTypeLabel(item.paymentType)}
                      </td>
                      <td className={`px-5 py-3 font-medium md:px-6 ${statusTextClass(item.status)}`}>
                        {item.status === 'completed' ? 'Paid' : item.status === 'pending' ? 'Pending' : item.status}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-zinc-600 md:px-6">
                        {item.planStartedAt ? formatDateTime(item.planStartedAt) : '—'}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-zinc-600 md:px-6">
                        {item.planExpiresAt ? formatDateTime(item.planExpiresAt) : '—'}
                      </td>
                      <td className="min-w-[150px] px-5 py-3 md:px-6">
                        <PaymentReferencesCell item={item} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <p className="text-sm text-zinc-500">
        Billing help:{' '}
        <a href="mailto:support@finderb.com" className="text-[#215481] hover:underline">
          support@finderb.com
        </a>
        {' · '}
        <Link href="/pricing" className="text-[#215481] hover:underline">
          Pricing
        </Link>
      </p>
    </div>
  );
}
