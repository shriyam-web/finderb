'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  HiOutlineArrowLeftOnRectangle,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineBars3,
  HiOutlineCreditCard,
  HiOutlineRocketLaunch,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineXMark,
} from 'react-icons/hi2';

type MenuItem = {
  id: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  activeIcon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number;
};

type DashboardSidebarProps = {
  menuItems: MenuItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  businessName: string;
  businessCategory?: string;
  businessId?: string;
  isVerified?: boolean;
  isPaymentPending: boolean;
  profileImageUrl?: string | null;
  onLogout: () => void;
};

function businessInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function DashboardSidebar({
  menuItems,
  activeTab,
  onTabChange,
  isOpen,
  onToggle,
  onClose,
  businessName,
  businessCategory,
  businessId,
  isVerified,
  isPaymentPending,
  profileImageUrl,
  onLogout,
}: DashboardSidebarProps) {
  const sidebarBody = (
    <>
      <div className="relative overflow-hidden px-5 pb-5 pt-6 lg:pt-7">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-90"
          aria-hidden
          style={{
            background:
              'linear-gradient(135deg, rgba(249,184,100,0.22) 0%, rgba(33,84,129,0.08) 45%, transparent 70%)',
          }}
        />
        <div className="relative">
          <Link href="/business/register" className="inline-flex items-center gap-2.5">
            <Image
              src="/businesslogo.png"
              alt="FinderB Business"
              width={128}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-500/80">
            Partner portal
          </p>
        </div>

        <div className="relative mt-5 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/90 p-3.5 shadow-[0_8px_30px_-18px_rgba(21,53,81,0.35)]">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-secondary-400 via-primary-400 to-primary-600 opacity-80" />
              <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[10px] bg-white">
                {profileImageUrl ? (
                  <Image src={profileImageUrl} alt="" width={44} height={44} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-primary-700">
                    {businessInitials(businessName || 'FB')}
                  </span>
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900">{businessName}</p>
              <p className="truncate text-xs text-slate-500">
                {businessCategory || 'Business partner'}
              </p>
              {isVerified && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold text-primary-700">
                  <HiOutlineShieldCheck size={11} />
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <nav className="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        <div>
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Menu
          </p>
          <div className="space-y-1">
            {menuItems.map((item) => {
              const active = activeTab === item.id;
              const Icon = active ? item.activeIcon : item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onTabChange(item.id);
                    onClose();
                  }}
                  className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-primary-50 via-white to-secondary-50 text-primary-800 shadow-[inset_3px_0_0_0_#f9b864,0_4px_18px_-12px_rgba(33,84,129,0.45)]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      active
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-primary-50 group-hover:text-primary-600'
                    }`}
                  >
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm ${active ? 'font-semibold' : 'font-medium'}`}>
                      {item.label}
                    </span>
                    <span className="block truncate text-[11px] text-slate-400 group-hover:text-slate-500">
                      {item.hint}
                    </span>
                  </span>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className="shrink-0 rounded-full bg-secondary-400 px-2 py-0.5 text-[10px] font-bold text-primary-900">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-1">
          <div className="relative overflow-hidden rounded-2xl border border-secondary-200/70 bg-gradient-to-br from-secondary-50 via-white to-primary-50 p-4">
            <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-secondary-300/30 blur-xl" />
            <div className="relative flex items-start gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-secondary-600 shadow-sm">
                {isPaymentPending ? <HiOutlineRocketLaunch size={16} /> : <HiOutlineSparkles size={16} />}
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary-600/70">
                  {isPaymentPending ? 'Upgrade plan' : 'Premium active'}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">
                  {isPaymentPending ? 'Unlock lead contacts' : 'Lead center live'}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  {isPaymentPending
                    ? 'See customer phone numbers and respond faster.'
                    : 'You receive enquiries from profile and category.'}
                </p>
              </div>
            </div>
            {isPaymentPending && businessId ? (
              <Link
                href={`/business/payment/${businessId}`}
                className="relative mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary-700 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-primary-800"
              >
                <HiOutlineCreditCard size={14} />
                Activate leads
              </Link>
            ) : (
              <button
                type="button"
                className="relative mt-3 w-full rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:border-primary-200 hover:text-primary-700"
              >
                Manage plan
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="border-t border-slate-200/80 bg-slate-50/50 p-3">
        {businessId && (
          <Link
            href={`/business/${businessId}`}
            target="_blank"
            className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-white hover:text-primary-700"
          >
            <HiOutlineArrowTopRightOnSquare size={18} className="text-slate-400" />
            View public profile
          </Link>
        )}
        <Link
          href="/"
          className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-white hover:text-primary-700"
        >
          <span className="flex h-[18px] w-[18px] items-center justify-center rounded-md bg-primary-100 text-[10px] font-bold text-primary-700">
            F
          </span>
          Back to FinderB
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <HiOutlineArrowLeftOnRectangle size={18} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-[60] flex items-center justify-between border-t border-slate-200/90 bg-white/95 px-3 py-2 shadow-[0_-8px_30px_-20px_rgba(15,39,59,0.35)] backdrop-blur-md lg:hidden pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {menuItems.slice(0, 4).map((item) => {
          const active = activeTab === item.id;
          const Icon = active ? item.activeIcon : item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition-colors ${
                active ? 'text-primary-700' : 'text-slate-400'
              }`}
            >
              {active && (
                <span className="absolute -top-0.5 h-1 w-8 rounded-full bg-secondary-400" />
              )}
              <Icon size={20} />
              <span className="text-[10px] font-semibold">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onToggle}
          className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 ${
            isOpen ? 'text-primary-700' : 'text-slate-400'
          }`}
        >
          <HiOutlineBars3 size={20} />
          <span className="text-[10px] font-semibold">More</span>
        </button>
      </nav>

      <div className="sticky top-0 z-[60] flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <Link href="/business/register">
          <Image src="/businesslogo.png" alt="FinderB Business" width={100} height={30} className="h-7 w-auto" />
        </Link>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
          aria-label="Toggle menu"
        >
          {isOpen ? <HiOutlineXMark size={22} /> : <HiOutlineBars3 size={22} />}
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-[55] bg-slate-900/30 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-[58] flex h-screen w-[280px] flex-col border-r border-slate-200/80 bg-white transition-transform duration-300 ease-out lg:sticky lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl shadow-slate-900/10' : '-translate-x-full'
        } pt-14 lg:pt-0 pb-24 lg:pb-0`}
      >
        {sidebarBody}
      </aside>
    </>
  );
}
