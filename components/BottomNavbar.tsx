'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { House, LayoutGrid, Briefcase, User, type LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSession } from '@/app/actions/user';
import { getBusinessSession } from '@/app/actions/business';

type TabId = 'home' | 'categories' | 'ai' | 'business' | 'account';

type TabItem = {
  id: TabId;
  label: string;
  href: string;
  icon: LucideIcon;
  center?: boolean;
  avatarUrl?: string | null;
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

function shortNavLabel(name: string, maxLen = 11): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  const firstWord = trimmed.split(/\s+/)[0] ?? trimmed;
  if (firstWord.length <= maxLen) return firstWord;
  return `${firstWord.slice(0, maxLen - 1)}…`;
}

function NavTabIcon({
  avatarUrl,
  fallbackIcon: Icon,
  active,
  label,
}: {
  avatarUrl?: string | null;
  fallbackIcon: LucideIcon;
  active: boolean;
  label: string;
}) {
  if (avatarUrl) {
    return (
      <span
        className={`relative h-5 w-5 shrink-0 overflow-hidden rounded-full ring-2 ${
          active ? 'ring-[#215481]' : 'ring-slate-200'
        }`}
      >
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        <span className="sr-only">{label}</span>
      </span>
    );
  }

  return (
    <Icon
      size={20}
      strokeWidth={active ? 2 : 1.75}
      className={active ? 'text-[#215481]' : 'text-slate-400'}
    />
  );
}

export default function BottomNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAiActive, setIsAiActive] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [businessAvatarUrl, setBusinessAvatarUrl] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleMobileMenuChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ open: boolean }>;
      setMobileMenuOpen(Boolean(customEvent.detail?.open));
    };

    window.addEventListener('finderb-mobile-menu-change', handleMobileMenuChange);
    return () => window.removeEventListener('finderb-mobile-menu-change', handleMobileMenuChange);
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    setIsAiActive(tab === 'ai' || tab === 'finderb-ai');
    if (tab === 'finderb-ai') {
      router.replace('/?tab=ai');
    }
  }, [searchParams, router]);

  const checkSession = useCallback(async () => {
    const [userResult, businessResult] = await Promise.all([getSession(), getBusinessSession()]);

    if (userResult?.success && userResult.user) {
      setUserName(userResult.user.fullName || null);
      setUserAvatarUrl(
        typeof userResult.user.avatarUrl === 'string' && userResult.user.avatarUrl.trim()
          ? userResult.user.avatarUrl
          : null
      );
      setBusinessName(null);
      setBusinessAvatarUrl(null);
      setBusinessId(null);
      return;
    }

    setUserName(null);
    setUserAvatarUrl(null);

    if (businessResult?.success && businessResult.business?.id) {
      const business = businessResult.business;
      setBusinessName(business.name || business.businessName || null);
      setBusinessAvatarUrl(business.profilePictureUrl || business.image || null);
      setBusinessId(business.id);
      return;
    }

    setBusinessName(null);
    setBusinessAvatarUrl(null);
    setBusinessId(null);
  }, []);

  useEffect(() => {
    void checkSession();
  }, [pathname, checkSession]);

  useEffect(() => {
    const handleSessionChange = () => {
      void checkSession();
    };

    window.addEventListener('finderb-session-change', handleSessionChange);
    return () => window.removeEventListener('finderb-session-change', handleSessionChange);
  }, [checkSession]);

  const tabs: TabItem[] = useMemo(() => {
    const accountLabel = userName ? shortNavLabel(userName) || 'Account' : 'Account';
    const businessLabel = businessName ? shortNavLabel(businessName, 13) || 'Business' : 'Business';
    const accountHref = userName ? '/dashboard' : '/login';
    const businessHref = businessId
      ? `/business/dashboard?id=${businessId}`
      : '/business/register';

    return [
      { id: 'home', label: 'Home', icon: House, href: '/' },
      { id: 'categories', label: 'Categories', icon: LayoutGrid, href: '/categories' },
      { id: 'ai', label: 'FinderB AI', icon: House, href: '/?tab=ai', center: true },
      {
        id: 'business',
        label: businessLabel,
        icon: Briefcase,
        href: businessHref,
        avatarUrl: businessAvatarUrl,
      },
      {
        id: 'account',
        label: accountLabel,
        icon: User,
        href: accountHref,
        avatarUrl: userAvatarUrl,
      },
    ];
  }, [userName, userAvatarUrl, businessName, businessAvatarUrl, businessId]);

  const isTabActive = (tab: TabItem) => {
    if (tab.center) return isAiActive;
    if (tab.id === 'home') return pathname === '/' && !isAiActive;
    if (tab.id === 'categories') {
      return pathname === '/categories' || Boolean(pathname?.startsWith('/categories/'));
    }
    if (tab.id === 'account') {
      return (
        pathname === '/dashboard' ||
        Boolean(pathname?.startsWith('/dashboard/'))
      );
    }
    if (tab.id === 'business') {
      return Boolean(pathname?.startsWith('/business'));
    }
    return pathname === tab.href;
  };

  const centerTab = tabs.find((t) => t.center)!;
  const centerActive = isTabActive(centerTab);

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-[9999] transition-all duration-300 lg:hidden ${
        mobileMenuOpen ? 'pointer-events-none translate-y-full opacity-0' : ''
      }`}
    >
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 bg-white"
        style={{ height: 'calc(6.75rem + env(safe-area-inset-bottom, 0px))' }}
        aria-hidden
      />
      <div className="pointer-events-auto relative mx-auto max-w-lg px-4 pb-3">
        <div className="relative h-[58px]">
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
            className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-[20px]"
            aria-label={centerTab.label}
          >
            <span
              className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-blue-500/55 via-cyan-400/45 to-violet-500/55 blur-md animate-ai-fab-glow"
              aria-hidden
            />
            <span
              className={`relative flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[length:220%_220%] ring-[3px] ring-white shadow-[0_6px_24px_rgba(37,99,235,0.5)] animate-ai-fab-gradient bg-gradient-to-br from-[#1d4ed8] via-[#06b6d4] to-[#7c3aed] ${
                centerActive ? 'shadow-[0_8px_28px_rgba(6,182,212,0.55)]' : ''
              }`}
            >
              <FinderBAiNavIcon />
            </span>
          </Link>

          <div className="absolute inset-0 grid grid-cols-5 items-center px-1 py-2">
            {tabs.map((tab) => {
              const active = isTabActive(tab);

              if (tab.center) {
                return (
                  <div
                    key={tab.id}
                    className="flex h-full flex-col items-center justify-end gap-1"
                  >
                    <div className="h-5 w-5 shrink-0" aria-hidden />
                    <span
                      className={`text-[10px] leading-none tracking-tight ${
                        active ? 'font-medium text-[#215481]' : 'font-normal text-slate-500'
                      }`}
                    >
                      {tab.label}
                    </span>
                  </div>
                );
              }

              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className="flex h-full flex-col items-center justify-end gap-1"
                  title={tab.label}
                >
                  <NavTabIcon
                    avatarUrl={tab.avatarUrl}
                    fallbackIcon={tab.icon}
                    active={active}
                    label={tab.label}
                  />
                  <span
                    className={`max-w-[4.25rem] truncate text-[10px] leading-none tracking-tight ${
                      active ? 'font-medium text-[#215481]' : 'font-normal text-slate-500'
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
