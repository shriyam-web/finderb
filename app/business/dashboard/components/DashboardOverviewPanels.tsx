'use client';

import {
  HiOutlineArrowTrendingUp,
  HiOutlineArrowUpRight,
  HiOutlineChevronRight,
  HiOutlineEye,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import { KycStatusBadge, PaymentStatusBadge } from './StatusBadge';

type StatCard = {
  label: string;
  value: string;
  change: string;
  isUp: boolean;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  sub: string;
  theme: {
    card: string;
    icon: string;
    value: string;
    label: string;
    sub: string;
    chip: string;
  };
};

type DashboardStatsGridProps = {
  stats: StatCard[];
  completionPercent: number;
  leadCount: number;
};

export default function DashboardStatsGrid({ stats, completionPercent, leadCount }: DashboardStatsGridProps) {
  const performanceBars = [
    { label: 'Profile traffic', value: 85, gradient: 'from-sky-400 to-blue-600' },
    { label: 'Lead response', value: leadCount > 0 ? 72 : 24, gradient: 'from-amber-400 to-orange-500' },
    { label: 'Profile strength', value: completionPercent, gradient: 'from-emerald-400 to-teal-600' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`relative overflow-hidden rounded-2xl p-5 shadow-lg transition-transform hover:-translate-y-0.5 ${stat.theme.card}`}
          >
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/15 blur-2xl" aria-hidden />
            <div className="relative flex items-start justify-between gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.theme.icon}`}>
                <stat.icon size={22} />
              </div>
              <span className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-1 text-xs font-bold ${stat.theme.chip}`}>
                {stat.isUp && <HiOutlineArrowUpRight size={12} />}
                {stat.change}
              </span>
            </div>
            <p className={`relative mt-4 text-3xl font-bold tracking-tight ${stat.theme.value}`}>{stat.value}</p>
            <p className={`relative mt-0.5 text-sm font-semibold ${stat.theme.label}`}>{stat.label}</p>
            <p className={`relative mt-2 text-xs ${stat.theme.sub}`}>{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:col-span-3 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#3F3F46]">Health check</p>
              <h3 className="text-base font-bold text-slate-900">Performance metrics</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#3F3F46] to-[#71717A] text-white">
              <HiOutlineArrowTrendingUp size={20} />
            </div>
          </div>
          <div className="space-y-4">
            {performanceBars.map((bar) => (
              <div key={bar.label} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{bar.label}</span>
                  <span className="font-bold text-slate-900">{bar.value}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${bar.gradient} transition-all duration-700`}
                    style={{ width: `${bar.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#f9b864] via-[#f5c078] to-[#e8a045] p-5 shadow-lg shadow-amber-500/20 lg:col-span-2 md:p-6">
          <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/30 blur-2xl" aria-hidden />
          <div className="relative">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#27272A]/15">
              <HiOutlineSparkles size={22} className="text-[#27272A]" />
            </div>
            <h3 className="text-lg font-bold text-[#27272A]">Grow on FinderB</h3>
            <p className="mt-2 text-sm font-medium leading-relaxed text-[#27272A]/85">
              Reply to leads within 30 minutes and keep your profile above 80% complete for better search ranking.
            </p>
            <p className="mt-4 inline-flex rounded-lg bg-[#27272A]/10 px-3 py-1.5 text-xs font-bold text-[#27272A]">
              3× more visibility for complete profiles
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

type ProfileCompletionCardProps = {
  completionPercent: number;
  missingFields: string[];
  onOpenSettings: () => void;
};

export function ProfileCompletionCard({
  completionPercent,
  missingFields,
  onOpenSettings,
}: ProfileCompletionCardProps) {
  if (completionPercent >= 100) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="h-1.5 bg-gradient-to-r from-[#f9b864] via-[#3F3F46] to-violet-500" aria-hidden />
      <div className="p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-violet-700">Profile boost</p>
              <h3 className="text-lg font-bold text-slate-900">
                You&apos;re at {completionPercent}% — almost there
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Full profiles get more trust and more enquiries from FinderB customers.
              </p>
            </div>
            {missingFields.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {missingFields.slice(0, 5).map((field) => (
                  <span
                    key={field}
                    className="rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-900"
                  >
                    {field}
                  </span>
                ))}
                {missingFields.length > 5 && (
                  <span className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-900">
                    +{missingFields.length - 5} more
                  </span>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3F3F46] to-[#71717A] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:brightness-110"
            >
              Complete profile <HiOutlineChevronRight size={16} />
            </button>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-2 rounded-2xl border-2 border-amber-200 bg-gradient-to-b from-amber-50 to-white px-8 py-6">
            <div className="relative h-24 w-24">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="#fde68a" strokeWidth="8" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="url(#profileRing)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeLinecap="round"
                  strokeDasharray={263.89}
                  strokeDashoffset={263.89 - (263.89 * completionPercent) / 100}
                  className="transition-all duration-700"
                />
                <defs>
                  <linearGradient id="profileRing" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f9b864" />
                    <stop offset="50%" stopColor="#3F3F46" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-slate-900">
                {completionPercent}%
              </span>
            </div>
            <p className="text-xs font-bold text-amber-800">Strength score</p>
          </div>
        </div>
      </div>
    </div>
  );
}

type MerchantInfoPanelProps = {
  business: Record<string, unknown> | null;
  businessId?: string;
  businessProfilePath?: string;
  open: boolean;
  onToggle: () => void;
  copiedId: boolean;
  onCopyId: (id: string) => void;
};

export function MerchantInfoPanel({
  business,
  businessId,
  businessProfilePath,
  open,
  onToggle,
  copiedId,
  onCopyId,
}: MerchantInfoPanelProps) {
  const fields = [
    { label: 'Merchant ID', value: (business?.registrationNumber as string) || 'Not generated', mono: true, copyable: Boolean(business?.registrationNumber), tint: 'from-sky-50 to-white border-sky-100' },
    { label: 'Business name', value: (business?.businessName as string) || (business?.displayName as string) || '—', mono: false, copyable: false, tint: 'from-amber-50 to-white border-amber-100' },
    { label: 'Email', value: (business?.email as string) || (business?.workEmail as string) || '—', mono: false, copyable: false, tint: 'from-violet-50 to-white border-violet-100' },
    { label: 'Phone', value: (business?.publicPhone as string) || (business?.mobile as string) || '—', mono: false, copyable: false, tint: 'from-emerald-50 to-white border-emerald-100' },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 bg-gradient-to-r from-[#f0f7ff] via-white to-[#fff9f0] px-5 py-4 text-left hover:brightness-[0.99] md:px-6"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#3F3F46]">Your account</p>
          <h3 className="text-base font-bold text-slate-900">Merchant credentials</h3>
        </div>
        <div className="flex items-center gap-3">
          {businessProfilePath && (
            <a
              href={businessProfilePath}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hidden items-center gap-1.5 rounded-lg bg-[#3F3F46] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#27272A] sm:inline-flex"
            >
              <HiOutlineEye size={14} />
              Live profile
            </a>
          )}
          <HiOutlineChevronRight
            size={20}
            className={`text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 pb-6 pt-4 md:px-6">
          <div className="mb-4 flex flex-wrap gap-2">
            <PaymentStatusBadge status={business?.paymentStatus as string} size="sm" />
            <KycStatusBadge status={business?.kycStatus as string} size="sm" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <div
                key={field.label}
                className={`rounded-xl border bg-gradient-to-br p-3.5 ${field.tint}`}
              >
                <p className="text-xs font-bold text-slate-500">{field.label}</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className={`text-sm font-bold text-slate-900 ${field.mono ? 'font-mono' : ''}`}>{field.value}</p>
                  {field.copyable && Boolean(business?.registrationNumber) && (
                    <button
                      type="button"
                      onClick={() => {
                        const id = business?.registrationNumber;
                        if (id) onCopyId(String(id));
                      }}
                      className="text-xs font-bold text-sky-700 hover:text-sky-900"
                    >
                      {copiedId ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
