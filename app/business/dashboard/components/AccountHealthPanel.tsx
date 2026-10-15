'use client';

import Link from 'next/link';
import {
  type AccountHealthItem,
  type AccountHealthSummary,
  getHealthStatusLabel,
} from '@/lib/dashboard/accountHealth';
import type { MissingProfileField } from '@/lib/dashboard/profileCompletion';
import MerchantRechargeButton from '@/components/business/MerchantRechargeButton';
import { dashboard } from './dashboard-ui';

const dotClass: Record<AccountHealthItem['status'], string> = {
  complete: 'bg-emerald-500',
  attention: 'bg-amber-500',
  review: 'bg-sky-500',
  blocked: 'bg-rose-500',
};

type AccountHealthPanelProps = {
  health: AccountHealthSummary;
  businessId?: string;
  businessProfilePath?: string;
  businessName: string;
  fullName?: string;
  email?: string;
  mobile?: string;
  missingFields: MissingProfileField[];
  hasPublicPhotos?: boolean;
  paymentError?: string | null;
  onPaymentError: (msg: string) => void;
  onOpenSettingsField: (settingsKey: string) => void;
  onOpenKyc: () => void;
};

function HealthRow({
  item,
  action,
}: {
  item: AccountHealthItem;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 gap-3">
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotClass[item.status]}`} aria-hidden />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-medium text-zinc-900">{item.label}</p>
            <span className="text-xs text-zinc-400">·</span>
            <span className="text-xs font-medium text-zinc-500">{getHealthStatusLabel(item.status)}</span>
          </div>
          <p className="mt-0.5 text-sm leading-relaxed text-zinc-600">{item.detail}</p>
        </div>
      </div>
      {action && <div className="shrink-0 sm:pl-4">{action}</div>}
    </div>
  );
}

export default function AccountHealthPanel({
  health,
  businessId,
  businessProfilePath,
  businessName,
  fullName,
  email,
  mobile,
  missingFields,
  hasPublicPhotos = true,
  paymentError,
  onPaymentError,
  onOpenSettingsField,
  onOpenKyc,
}: AccountHealthPanelProps) {
  const subscription = health.items.find((i) => i.id === 'subscription');
  const kyc = health.items.find((i) => i.id === 'kyc');
  const profile = health.items.find((i) => i.id === 'profile');

  const handleMissingClick = (field: MissingProfileField) => {
    if (field.action === 'kyc') {
      onOpenKyc();
      return;
    }
    if (field.settingsKey) {
      onOpenSettingsField(field.settingsKey);
    }
  };

  return (
    <div className={`${dashboard.panel} p-5 md:p-6`}>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-100 pb-4">
        <div>
          <h2 className={dashboard.sectionTitle}>Account readiness</h2>
          <p className={dashboard.sectionDesc}>{health.headline}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums text-[#27272A]">{health.score}%</p>
          <p className="text-xs text-zinc-500">Ready</p>
        </div>
      </div>

      <div className="divide-y divide-zinc-100">
        {subscription && (
          <HealthRow
            item={subscription}
            action={
              subscription.status !== 'complete' && businessId ? (
                <div className="flex flex-col items-stretch gap-2 sm:items-end">
                  {paymentError && <p className="text-xs text-rose-700">{paymentError}</p>}
                  <MerchantRechargeButton
                    businessId={businessId}
                    businessName={businessName}
                    fullName={fullName}
                    email={email}
                    mobile={mobile}
                    label="Choose plan"
                    onError={onPaymentError}
                    className={dashboard.btnPrimary}
                  />
                </div>
              ) : undefined
            }
          />
        )}

        {kyc && (
          <HealthRow
            item={kyc}
            action={
              kyc.status === 'attention' || kyc.status === 'blocked' ? (
                <button type="button" onClick={onOpenKyc} className={dashboard.btnPrimary}>
                  About KYC
                </button>
              ) : undefined
            }
          />
        )}

        {profile && <HealthRow item={profile} />}
      </div>

      {missingFields.filter((f) => f.action === 'settings').length > 0 && profile?.status !== 'complete' && (
        <div className="mt-4 border-t border-zinc-100 pt-4">
          <p className="text-xs font-medium text-zinc-600">
            {missingFields.filter((f) => f.action === 'settings').length} profile field
            {missingFields.filter((f) => f.action === 'settings').length > 1 ? 's' : ''} left — click to fill
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {missingFields
              .filter((field) => field.action === 'settings')
              .map((field) => (
              <button
                key={field.key}
                type="button"
                onClick={() => handleMissingClick(field)}
                className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-800 hover:border-[#3F3F46]/40 hover:bg-white"
              >
                {field.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {businessProfilePath && hasPublicPhotos ? (
        <p className="mt-4 border-t border-zinc-100 pt-4">
          <Link
            href={businessProfilePath}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-[#3F3F46] hover:underline"
          >
            View live public profile →
          </Link>
        </p>
      ) : (
        <p className="mt-4 border-t border-zinc-100 pt-4 text-sm text-rose-700">
          Public profile is hidden until you add at least one photo.
        </p>
      )}
    </div>
  );
}
