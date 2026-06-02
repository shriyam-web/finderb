'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Home, LayoutGrid, Zap, Briefcase, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getSession } from '@/app/actions/user';

export default function BottomNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAiActive, setIsAiActive] = useState(false);
  const [accountHref, setAccountHref] = useState('/login');

  useEffect(() => {
    const tab = searchParams.get('tab');
    setIsAiActive(tab === 'ai' || tab === 'finderb-ai');
    if (tab === 'finderb-ai') {
      router.replace('/?tab=ai');
    }
  }, [searchParams, router]);

  useEffect(() => {
    getSession().then((result) => {
      setAccountHref(result?.success ? '/dashboard' : '/login');
    });
  }, [pathname]);

  const sideTabs = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Categories', icon: LayoutGrid, href: '/categories' },
  ];

  const centerTab = { label: 'FinderB Ai', icon: Zap, href: '/?tab=ai' };

  const rightTabs = [
    { label: 'Business', icon: Briefcase, href: '/business/register' },
    { label: 'Account', icon: User, href: accountHref },
  ];

  const isTabActive = (label: string, href: string) => {
    if (label === 'FinderB Ai') return isAiActive;
    if (label === 'Home') return pathname === '/' && !isAiActive;
    if (label === 'Categories') {
      return pathname === '/categories' || Boolean(pathname?.startsWith('/categories/'));
    }
    if (label === 'Account') {
      return pathname === '/dashboard' || pathname?.startsWith('/dashboard');
    }
    if (label === 'Business') {
      return pathname === href || pathname?.startsWith('/business');
    }
    return pathname === href;
  };

  const renderSideTab = (tab: (typeof sideTabs)[0]) => {
    const active = isTabActive(tab.label, tab.href);
    return (
      <Link
        key={tab.label}
        href={tab.href}
        className={`flex flex-1 flex-col items-center justify-end gap-0.5 pb-1 transition-colors ${
          active ? 'text-[#2563eb]' : 'text-[#94a3b8]'
        }`}
      >
        <tab.icon size={20} strokeWidth={active ? 2.25 : 1.75} />
        <span className="text-[9px] font-semibold leading-none">{tab.label}</span>
      </Link>
    );
  };

  const centerActive = isTabActive(centerTab.label, centerTab.href);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[9999] pointer-events-none">
      <div className="pointer-events-auto relative mx-auto max-w-lg">
        <svg
          className="absolute bottom-0 left-0 w-full text-white drop-shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
          viewBox="0 0 390 76"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M0 26 L0 76 L390 76 L390 26 C340 26 300 10 260 4 C220 0 170 0 130 4 C90 10 50 26 0 26 Z"
          />
        </svg>

        <div className="relative flex h-[72px] items-end px-1 pb-2">
          <div className="flex flex-1 items-end justify-evenly">{sideTabs.map(renderSideTab)}</div>

          <Link
            href={centerTab.href}
            className="relative -top-5 mx-1 flex w-[68px] shrink-0 flex-col items-center gap-0.5"
          >
            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#2563eb] shadow-[0_4px_14px_rgba(37,99,235,0.45)]">
              <centerTab.icon size={22} className="text-white" strokeWidth={2} />
            </div>
            <span
              className={`max-w-[68px] truncate text-center text-[9px] font-semibold leading-none ${
                centerActive ? 'text-[#2563eb]' : 'text-[#64748b]'
              }`}
            >
              {centerTab.label}
            </span>
          </Link>

          <div className="flex flex-1 items-end justify-evenly">{rightTabs.map(renderSideTab)}</div>
        </div>
      </div>
    </div>
  );
}
