'use client';

import { HiOutlineBell, HiOutlineCalendarDays } from 'react-icons/hi2';
import { KycStatusBadge, PaymentStatusBadge, VerifiedBadge } from './StatusBadge';

type DashboardHeaderProps = {
  activeTab: string;
  businessName: string;
  paymentStatus?: string;
  kycStatus?: string;
  isVerified?: boolean;
  unreadCount: number;
  isNotificationsOpen: boolean;
  onNotificationsToggle: () => void;
  onNotificationsClose: () => void;
  notifications: Array<{ title?: string; message: string; created_at: string }>;
};

const tabTitles: Record<string, string> = {
  overview: 'Overview',
  listings: 'My listing',
  leads: 'Lead center',
  jobs: 'Jobs',
  messages: 'Messages',
  settings: 'Settings',
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardHeader({
  activeTab,
  businessName,
  paymentStatus,
  kycStatus,
  isVerified,
  unreadCount,
  isNotificationsOpen,
  onNotificationsToggle,
  onNotificationsClose,
  notifications,
}: DashboardHeaderProps) {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="relative z-20 mb-7 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_30px_-12px_rgba(33,84,129,0.15)] md:mb-8">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#153551] via-[#215481] to-[#1a4367] px-5 py-5 md:px-7 md:py-6">
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#f9b864]/35 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-8 left-1/3 h-28 w-28 rounded-full bg-cyan-400/20 blur-3xl"
          aria-hidden
        />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f9b864] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#153551]">
              <HiOutlineCalendarDays size={13} />
              {today}
            </span>
            <p className="text-sm font-medium text-white/85">
              {getGreeting()},{' '}
              <span className="font-bold text-white">{businessName}</span>
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-[1.65rem]">
              {tabTitles[activeTab] || activeTab}
            </h1>
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={onNotificationsToggle}
              className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm transition-colors hover:bg-white/25"
              aria-label="Notifications"
              aria-expanded={isNotificationsOpen}
            >
              <HiOutlineBell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f9b864] px-1 text-[10px] font-bold text-[#153551] ring-2 ring-[#215481]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={onNotificationsClose} />
                <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:w-80">
                  <div className="border-b border-slate-100 bg-gradient-to-r from-secondary-50 to-white px-4 py-3">
                    <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto p-2">
                    {notifications.length > 0 ? (
                      notifications.map((n, i) => (
                        <div key={i} className="rounded-lg px-3 py-2.5 hover:bg-amber-50/50">
                          <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                          <p className="mt-0.5 text-xs text-slate-600">{n.message}</p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {new Date(n.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="py-8 text-center text-sm text-slate-500">No new notifications</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-amber-100/80 bg-gradient-to-r from-[#fff9f0] via-white to-[#f0f7ff] px-5 py-3 md:px-7">
        <PaymentStatusBadge status={paymentStatus} size="sm" />
        <KycStatusBadge status={kycStatus} size="sm" />
        {isVerified && <VerifiedBadge size="sm" />}
      </div>
    </header>
  );
}
