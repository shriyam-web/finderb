'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Home, LayoutGrid, Zap, Briefcase } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function BottomNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAiActive, setIsAiActive] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    setIsAiActive(tab === 'ai' || tab === 'finderb-ai');
    if (tab === 'finderb-ai') {
      router.replace('/?tab=ai');
    }
  }, [searchParams, router]);

  const tabs = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Categories', icon: LayoutGrid, href: '/categories' },
    { label: 'FinderB Ai', icon: Zap, href: '/?tab=ai', center: true },
    { label: 'Business', icon: Briefcase, href: '/business/register' },
  ];

  const isTabActive = (tab: (typeof tabs)[0]) => {
    if (tab.label === 'FinderB Ai') return isAiActive;
    if (tab.label === 'Home') return pathname === '/' && !isAiActive;
    if (tab.label === 'Categories') {
      return pathname === '/categories' || Boolean(pathname?.startsWith('/categories/'));
    }
    return pathname === tab.href || pathname?.startsWith('/business');
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[9999] pointer-events-none">
      <div className="pointer-events-auto relative mx-auto max-w-lg">
        {/* Curved top bar */}
        <svg
          className="absolute bottom-0 left-0 w-full text-white drop-shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
          viewBox="0 0 390 72"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M0 24 C0 24 0 72 0 72 L390 72 L390 24 C390 24 320 24 280 8 C240 0 150 0 110 8 C70 24 0 24 0 24 Z"
          />
        </svg>

        <div className="relative flex h-[68px] items-end justify-around px-2 pb-2">
          {tabs.map((tab) => {
            const active = isTabActive(tab);
            const isCenter = tab.center;

            if (isCenter) {
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className="relative -top-5 flex w-[72px] flex-col items-center gap-0.5"
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-full shadow-[0_4px_14px_rgba(37,99,235,0.45)] ${
                      active ? 'bg-[#2563eb]' : 'bg-[#2563eb]'
                    }`}
                  >
                    <tab.icon size={24} className="text-white" strokeWidth={2} />
                  </div>
                  <span
                    className={`text-[10px] font-semibold ${
                      active ? 'text-[#2563eb]' : 'text-[#64748b]'
                    }`}
                  >
                    {tab.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={`flex min-w-[64px] flex-col items-center justify-end gap-1 pb-1 transition-colors ${
                  tab.label === 'Business' && active
                    ? 'text-amber-500'
                    : active
                      ? 'text-[#2563eb]'
                      : 'text-[#94a3b8]'
                }`}
              >
                <tab.icon size={22} strokeWidth={active ? 2.25 : 1.75} />
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
