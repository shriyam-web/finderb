'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Home, LayoutGrid, Search, Briefcase, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getSession } from '@/app/actions/user';

type TabItem = {
  label: string;
  href: string;
  icon: typeof Home;
  center?: boolean;
};

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

  const tabs: TabItem[] = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Categories', icon: LayoutGrid, href: '/categories' },
    { label: 'FinderB Ai', icon: Search, href: '/?tab=ai', center: true },
    { label: 'Business', icon: Briefcase, href: '/business/register' },
    { label: 'Account', icon: User, href: accountHref },
  ];

  const isTabActive = (tab: TabItem) => {
    if (tab.center) return isAiActive;
    if (tab.label === 'Home') return pathname === '/' && !isAiActive;
    if (tab.label === 'Categories') {
      return pathname === '/categories' || Boolean(pathname?.startsWith('/categories/'));
    }
    if (tab.label === 'Account') {
      return pathname === '/dashboard' || Boolean(pathname?.startsWith('/dashboard'));
    }
    if (tab.label === 'Business') {
      return pathname === tab.href || Boolean(pathname?.startsWith('/business'));
    }
    return pathname === tab.href;
  };

  const centerTab = tabs.find((t) => t.center)!;
  const sideTabs = tabs.filter((t) => !t.center);
  const leftTabs = sideTabs.slice(0, 2);
  const rightTabs = sideTabs.slice(2);
  const centerActive = isTabActive(centerTab);

  const renderTab = (tab: TabItem) => {
    const active = isTabActive(tab);
    const Icon = tab.icon;

    return (
      <Link
        key={tab.label}
        href={tab.href}
        className={`flex flex-1 flex-col items-center justify-end gap-1 pb-0.5 transition-colors ${
          active ? 'text-[#2563eb]' : 'text-[#64748b]'
        }`}
      >
        <Icon
          size={22}
          strokeWidth={active ? 2.5 : 1.75}
          className={active && tab.label === 'Home' ? 'fill-[#2563eb]' : ''}
        />
        <span className="text-[11px] font-medium leading-none">{tab.label}</span>
      </Link>
    );
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[9999] lg:hidden">
      <div className="pointer-events-auto relative mx-auto max-w-lg px-4 pb-4">
        <div className="relative h-[68px]">
          {/* Pill bar with center notch */}
          <svg
            className="absolute inset-0 h-full w-full drop-shadow-[0_4px_24px_rgba(15,23,42,0.12)]"
            viewBox="0 0 400 68"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              fill="#ffffff"
              d="M28 0
                 H142
                 C152 0 158 2 163 8
                 C170 18 178 26 200 28
                 C222 26 230 18 237 8
                 C242 2 248 0 258 0
                 H372
                 C386 0 400 14 400 28
                 V52
                 C400 62 392 68 382 68
                 H18
                 C8 68 0 62 0 52
                 V28
                 C0 14 14 0 28 0
                 Z"
            />
          </svg>

          {/* Center FAB */}
          <Link
            href={centerTab.href}
            className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-[22px]"
            aria-label={centerTab.label}
          >
            <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#2563eb] shadow-[0_6px_20px_rgba(37,99,235,0.45)] ring-4 ring-white">
              <Search size={26} className="text-white" strokeWidth={2.25} />
            </div>
          </Link>

          {/* Tab row */}
          <div className="absolute inset-x-0 bottom-0 flex h-full items-end px-3 pb-2">
            <div className="flex flex-1 items-end justify-around pr-6">{leftTabs.map(renderTab)}</div>

            <div className="flex w-[76px] shrink-0 flex-col items-center justify-end pb-0.5">
              <div className="h-[22px]" aria-hidden />
              <span
                className={`text-[11px] font-semibold leading-none ${
                  centerActive ? 'text-[#1e293b]' : 'text-[#64748b]'
                }`}
              >
                {centerTab.label}
              </span>
            </div>

            <div className="flex flex-1 items-end justify-around pl-6">{rightTabs.map(renderTab)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
