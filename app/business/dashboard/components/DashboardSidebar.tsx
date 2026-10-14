'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import MerchantRechargeButton from '@/components/business/MerchantRechargeButton';
import { PricingPlanIcon } from '@/components/pricing/PricingPlanIcon';
import {
  HiOutlineArrowLeftOnRectangle,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineXMark,
} from 'react-icons/hi2';

export const SIDEBAR_WIDTH_PX = 288;

type MenuItem = {
  id: string;
  label: string;
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
  businessProfilePath?: string;
  businessEmail?: string;
  businessMobile?: string;
  businessFullName?: string;
  registrationNumber?: string;
  copiedId?: boolean;
  onCopyMerchantId?: (id: string) => void;
  isPaymentPending: boolean;
  showRenewalCta?: boolean;
  planName?: string;
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

function resolvePlanTone(planName: string): 'free' | 'monthly' | 'annual' {
  const normalized = planName.trim().toLowerCase();
  if (normalized.includes('pro')) return 'annual';
  if (normalized.includes('growth')) return 'monthly';
  return 'free';
}

export default function DashboardSidebar({
  menuItems,
  activeTab,
  onTabChange,
  isOpen,
  onClose,
  businessName,
  businessCategory,
  businessId,
  businessProfilePath,
  businessEmail,
  businessMobile,
  businessFullName,
  registrationNumber,
  copiedId,
  onCopyMerchantId,
  isPaymentPending,
  showRenewalCta = false,
  planName = 'Starter',
  profileImageUrl,
  onLogout,
}: DashboardSidebarProps) {
  const primaryNavItems = [
    ...menuItems.filter((item) => ['overview', 'listings', 'leads', 'reviews'].includes(item.id)),
    ...menuItems.filter((item) => item.id === 'subscription'),
  ];

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  const handleNavSelect = (tab: string) => {
    onTabChange(tab);
    onClose();
  };

  const renderMenuButton = (item: MenuItem, compact = false) => {
    const active = activeTab === item.id;
    const Icon = active ? item.activeIcon : item.icon;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => handleNavSelect(item.id)}
        className={`group relative flex w-full items-center gap-3 rounded-lg px-3 text-left transition-all ${
          compact ? 'py-2' : 'py-2.5'
        } ${
          active
            ? 'bg-gradient-to-r from-amber-50/80 to-zinc-50 text-zinc-900 shadow-sm ring-1 ring-amber-200/60'
            : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
        }`}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#f9b864]" aria-hidden />
        )}
        <Icon size={18} className={active ? 'text-[#215481]' : 'text-zinc-400 group-hover:text-zinc-600'} />
        <span className={`flex-1 text-sm ${active ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
        {typeof item.badge === 'number' && item.badge > 0 && (
          <span className="rounded-md bg-[#153551] px-1.5 py-0.5 text-[10px] font-semibold text-[#f9b864] tabular-nums">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
      </button>
    );
  };

  const profileBlock = (
    <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-100 text-sm font-semibold text-zinc-700">
        {profileImageUrl ? (
          <Image src={profileImageUrl} alt="" width={40} height={40} className="h-full w-full object-cover" />
        ) : (
          businessInitials(businessName || 'FB')
        )}
      </div>
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => handleNavSelect('overview')}
          className="truncate text-left text-sm font-semibold text-zinc-900 hover:text-[#215481]"
          title="Open dashboard overview"
        >
          {businessName}
        </button>
        {registrationNumber ? (
          <div className="mt-0.5 flex items-center gap-1.5">
            <p className="truncate font-mono text-[10px] text-zinc-500" title={registrationNumber}>
              ID {registrationNumber}
            </p>
            {onCopyMerchantId && (
              <button
                type="button"
                onClick={() => onCopyMerchantId(registrationNumber)}
                className="shrink-0 text-[10px] font-medium text-[#215481] hover:underline"
              >
                {copiedId ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
        ) : (
          <p className="truncate text-xs text-zinc-500">{businessCategory || 'Merchant account'}</p>
        )}
        {registrationNumber && businessCategory && (
          <p className="truncate text-xs text-zinc-500">{businessCategory}</p>
        )}
      </div>
    </div>
  );

  const paymentCta =
    (isPaymentPending || showRenewalCta) && businessId ? (
      <div className="mt-4 overflow-hidden rounded-lg border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-white p-3">
        <p className="text-xs font-semibold text-[#153551]">
          {isPaymentPending ? `${planName} — upgrade to unlock leads` : 'Plan renewal due soon'}
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          {isPaymentPending
            ? 'Upgrade to see who enquired and follow up by phone.'
            : 'Renew now to keep lead access without interruption.'}
        </p>
        <MerchantRechargeButton
          businessId={businessId}
          businessName={businessName}
          fullName={businessFullName}
          email={businessEmail}
          mobile={businessMobile}
          label={isPaymentPending ? 'Choose plan' : 'Renew plan'}
          className="mt-3 w-full rounded-lg bg-[#153551] py-2 text-xs font-semibold text-white hover:bg-[#215481] disabled:opacity-60"
        />
      </div>
    ) : null;

  const footerLinks = (
    <div className="shrink-0 border-t border-zinc-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {businessProfilePath && (
        <Link
          href={businessProfilePath}
          target="_blank"
          onClick={onClose}
          className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
        >
          <HiOutlineArrowTopRightOnSquare size={16} />
          Public profile
        </Link>
      )}
      <Link
        href="/"
        onClick={onClose}
        className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
      >
        FinderB home
      </Link>
      <button
        type="button"
        onClick={() => {
          onClose();
          onLogout();
        }}
        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-rose-700"
      >
        <HiOutlineArrowLeftOnRectangle size={16} />
        Sign out
      </button>
    </div>
  );

  const sidebarInner = (mobile = false) => (
    <>
      <div className={`shrink-0 px-4 ${mobile ? 'pt-3' : 'pt-6'}`}>
        {mobile ? (
          <div className="mb-4 flex items-center justify-between">
            <Image src="/businesslogo.png" alt="FinderB" width={100} height={30} className="h-7 w-auto" />
            <button type="button" onClick={onClose} className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100" aria-label="Close">
              <HiOutlineXMark size={20} />
            </button>
          </div>
        ) : (
          <Link href="/business/register" className="mb-6 inline-block">
            <Image src="/businesslogo.png" alt="FinderB Business" width={120} height={36} className="h-7 w-auto" priority />
          </Link>
        )}
        {profileBlock}
      </div>

      <nav className="merchant-sidebar-scroll min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wide text-zinc-400">Workspace</p>
        <div className="space-y-0.5">{menuItems.map((item) => renderMenuButton(item, mobile))}</div>
        {paymentCta}
      </nav>

      {footerLinks}
    </>
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[100] flex h-14 items-center gap-3 border-b border-zinc-200 bg-white px-4 lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => handleNavSelect('overview')}
            className="truncate text-sm font-semibold text-zinc-900 hover:text-[#215481]"
            title="Open dashboard overview"
          >
            {businessName}
          </button>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#caa24c] bg-gradient-to-r from-[#fff7df] via-[#fef2cc] to-[#fff7df] px-2.5 py-0.5 text-[10px] font-semibold text-[#6c4a08]">
            <span className="inline-flex h-3.5 w-3.5 items-center justify-center [&>svg]:h-3 [&>svg]:w-3">
              <PricingPlanIcon tone={resolvePlanTone(planName)} />
            </span>
            {planName}
          </span>
        </div>
      </header>

      <div className="h-14 lg:hidden" aria-hidden />

      <nav
        className="fixed inset-x-0 bottom-0 z-[100] flex border-t border-zinc-200 bg-white lg:hidden pb-[max(0.25rem,env(safe-area-inset-bottom))]"
        aria-label="Quick navigation"
      >
        {primaryNavItems.map((item) => {
          const active = activeTab === item.id;
          const Icon = active ? item.activeIcon : item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavSelect(item.id)}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                active ? 'text-[#215481]' : 'text-zinc-400'
              }`}
            >
              {active && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-[#f9b864]" aria-hidden />
              )}
              <Icon size={20} />
              {item.id === 'subscription' ? 'Plan' : item.label.split(' ')[0]}
            </button>
          );
        })}
      </nav>

      <div
        className={`fixed inset-0 z-[200] bg-zinc-900/30 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-[210] flex w-[min(288px,88vw)] flex-col border-r border-zinc-200 bg-white transition-transform lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        {sidebarInner(true)}
      </aside>

      <aside
        className="fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-zinc-200 bg-white lg:flex"
        style={{ width: SIDEBAR_WIDTH_PX }}
      >
        {sidebarInner(false)}
      </aside>
    </>
  );
}
