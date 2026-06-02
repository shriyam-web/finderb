'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { House, LayoutGrid, Briefcase, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getSession } from '@/app/actions/user';

type TabItem = {
  label: string;
  href: string;
  icon: typeof House;
  center?: boolean;
};

function FinderBAiNavIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="text-white"
    >
      <circle cx="10.25" cy="10.25" r="5.75" stroke="currentColor" strokeWidth="2.25" />
      <path
        d="M14.25 14.25L19 19"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
      <path
        d="M10.25 7.1l0.55 1.15 1.15 0.55-1.15 0.55-0.55 1.15-0.55-1.15-1.15-0.55 1.15-0.55 0.55-1.15z"
        fill="currentColor"
      />
      <path
        d="M12.9 9.6l0.35 0.75 0.75 0.35-0.75 0.35-0.35 0.75-0.35-0.75-0.75-0.35 0.75-0.35 0.35-0.75z"
        fill="currentColor"
        opacity="0.85"
      />
    </svg>
  );
}

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
    { label: 'Home', icon: House, href: '/' },
    { label: 'Categories', icon: LayoutGrid, href: '/categories' },
    { label: 'FinderB AI', icon: House, href: '/?tab=ai', center: true },
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
  const centerActive = isTabActive(centerTab);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[9999] lg:hidden">
      <div className="pointer-events-auto relative mx-auto max-w-lg px-4 pb-4">
        <div className="relative h-[68px]">
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

          <Link
            href={centerTab.href}
            className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-[24px]"
            aria-label={centerTab.label}
          >
            <span
              className="absolute -inset-2 rounded-full bg-gradient-to-r from-blue-500/60 via-cyan-400/50 to-violet-500/60 blur-xl animate-ai-fab-glow"
              aria-hidden
            />
            <span
              className="absolute -inset-1 rounded-full border border-blue-400/40 animate-ping opacity-25"
              aria-hidden
            />
            <span
              className={`relative flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[length:220%_220%] ring-[3.5px] ring-white shadow-[0_8px_32px_rgba(37,99,235,0.55)] animate-ai-fab-gradient bg-gradient-to-br from-[#1d4ed8] via-[#06b6d4] to-[#7c3aed] ${
                centerActive ? 'shadow-[0_10px_36px_rgba(6,182,212,0.65)]' : ''
              }`}
            >
              <FinderBAiNavIcon />
            </span>
          </Link>

          <div className="absolute inset-x-0 bottom-0 grid h-full grid-cols-5 items-end px-1 pb-2">
            {tabs.map((tab) => {
              const active = isTabActive(tab);
              const Icon = tab.icon;

              if (tab.center) {
                return (
                  <div key={tab.label} className="flex flex-col items-center justify-end pb-0.5">
                    <div className="h-[26px]" aria-hidden />
                    <span
                      className={`text-[10px] font-semibold leading-none ${
                        active ? 'text-[#2563eb]' : 'text-[#64748b]'
                      }`}
                    >
                      {tab.label}
                    </span>
                  </div>
                );
              }

              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className="flex flex-col items-center justify-end gap-0.5 pb-0.5"
                >
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.25 : 1.75}
                    className={active ? 'text-[#2563eb]' : 'text-[#64748b]'}
                  />
                  <span
                    className={`text-[10px] leading-none ${
                      active ? 'font-bold text-[#2563eb]' : 'font-medium text-[#64748b]'
                    }`}
                  >
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
