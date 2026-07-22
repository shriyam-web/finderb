'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useSearchParams } from 'next/navigation';
import { Menu, X, User, Briefcase, Globe, ChevronDown, Home, ArrowRight, Settings, LogIn, LogOut, LayoutDashboard, Newspaper, BookOpen, ClipboardList, CreditCard, MessageSquare, ExternalLink, Users, Star } from 'lucide-react';
import { getSession, logoutUser } from '@/app/actions/user';
import { getBusinessSession, logoutBusiness } from '@/app/actions/business';
import { useRouter } from 'next/navigation';
import { getBusinessProfilePath } from '@/lib/businessSlug';
import { Plus_Jakarta_Sans } from 'next/font/google';

const mobileMenuFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
});

function NavbarContent({ whiteText: initialWhiteText = false }: { whiteText?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [currentLang, setCurrentLang] = useState('English');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isBusinessMenuOpen, setIsBusinessMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isBusinessLoggedIn, setIsBusinessLoggedIn] = useState(false);
  const [business, setBusiness] = useState<any>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isAiTab = searchParams.get('tab') === 'ai';
  const isOnLoginPage = pathname === '/login';
  const loginHref = isOnLoginPage ? '/business/login' : '/login';
  const loginLabel = isOnLoginPage ? 'Business Login' : 'Login / Sign Up';

  const whiteText = initialWhiteText || isAiTab;
  const isLight = !scrolled && whiteText;

  const businessDashboardHref = business?.id
    ? `/business/dashboard?id=${business.id}`
    : '/business/dashboard';

  const businessDisplayName =
    business?.displayName || business?.name || business?.businessName || 'My Business';

  const businessAvatarUrl =
    (typeof business?.profilePictureUrl === 'string' && business.profilePictureUrl) ||
    (typeof business?.image === 'string' && business.image) ||
    null;

  const businessDashboardTabHref = (tab: string) =>
    business?.id
      ? `/business/dashboard?id=${business.id}&tab=${tab}`
      : `/business/dashboard?tab=${tab}`;

  const businessMenuItems = business
    ? [
        { label: 'Overview', href: businessDashboardTabHref('overview'), icon: LayoutDashboard },
        { label: 'My Listing', href: businessDashboardTabHref('listings'), icon: ClipboardList },
        { label: 'Leads', href: businessDashboardTabHref('leads'), icon: Users },
        { label: 'Reviews', href: businessDashboardTabHref('reviews'), icon: Star },
        { label: 'Jobs', href: businessDashboardTabHref('jobs'), icon: Briefcase },
        { label: 'My Subscription', href: businessDashboardTabHref('subscription'), icon: CreditCard },
        { label: 'Messages', href: businessDashboardTabHref('messages'), icon: MessageSquare },
        { label: 'Settings', href: businessDashboardTabHref('settings'), icon: Settings },
        {
          label: 'View Public Profile',
          href: getBusinessProfilePath(business),
          icon: ExternalLink,
        },
      ]
    : [];

  const closeBusinessMenu = () => setIsBusinessMenuOpen(false);

  const checkSession = useCallback(async () => {
    const userResult = await getSession();
    if (userResult && userResult.success) {
      setIsLoggedIn(true);
      setUser(userResult.user);
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }

    const businessResult = await getBusinessSession();
    if (businessResult && businessResult.success) {
      setIsBusinessLoggedIn(true);
      setBusiness(businessResult.business);
    } else {
      setIsBusinessLoggedIn(false);
      setBusiness(null);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [pathname, checkSession]);

  useEffect(() => {
    setIsUserMenuOpen(false);
    setIsBusinessMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleSessionChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ type: 'user' | 'business' | 'none' }>;
      if (customEvent.detail?.type === 'none') {
        setIsLoggedIn(false);
        setUser(null);
        setIsBusinessLoggedIn(false);
        setBusiness(null);
      }
      void checkSession();
    };

    window.addEventListener('finderb-session-change', handleSessionChange);
    return () => window.removeEventListener('finderb-session-change', handleSessionChange);
  }, [checkSession]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setIsLoggedIn(false);
    setUser(null);
    setIsUserMenuOpen(false);
    router.push('/login');
  };

  const handleBusinessLogout = async () => {
    await logoutBusiness();
    setIsBusinessLoggedIn(false);
    setBusiness(null);
    setIsBusinessMenuOpen(false);
    router.push('/business/login');
  };

  const renderBusinessMenuPanel = (compact = false) => (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={closeBusinessMenu}
        aria-hidden
      />
      <div
        className={`absolute top-full right-0 z-50 mt-2 animate-in fade-in zoom-in-95 rounded-2xl border border-gray-100 bg-white py-2 shadow-xl duration-200 ${
          compact ? 'w-56' : 'w-52'
        }`}
      >
        <div className="mb-1 border-b border-gray-50 px-4 py-2.5">
          <p className="text-sm font-normal text-slate-500">
            My Business
          </p>
          <p className="mt-0.5 truncate text-sm font-normal text-slate-700">
            {businessDisplayName}
          </p>
        </div>
        {businessMenuItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={closeBusinessMenu}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-normal text-slate-600 transition-all hover:bg-primary/5 hover:text-primary"
          >
            <item.icon size={16} className="text-gray-400" />
            {item.label}
          </Link>
        ))}
        <div className="my-1 border-t border-gray-50" />
        <button
          type="button"
          onClick={() => {
            closeBusinessMenu();
            void handleBusinessLogout();
          }}
          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-normal text-red-500 transition-all hover:bg-red-50"
        >
          <LogOut size={16} />
          Log Out
        </button>
      </div>
    </>
  );

  const renderBusinessTrigger = ({
    compact = false,
  }: {
    compact?: boolean;
  }) => (
    <button
      type="button"
      onClick={() => {
        setIsBusinessMenuOpen((open) => !open);
        setIsUserMenuOpen(false);
      }}
      className={
        compact
          ? `inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-normal transition-all ${
              scrolled
                ? 'border-primary/10 bg-white text-slate-600'
                : 'border-primary/15 bg-white/90 text-slate-600 backdrop-blur-sm'
            }`
          : `flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-normal transition-all duration-300 ${
              isLight
                ? 'border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20'
                : 'border-gray-200 bg-white/50 text-slate-600 backdrop-blur-md hover:border-gray-300 hover:bg-white'
            }`
      }
      aria-expanded={isBusinessMenuOpen}
      aria-haspopup="menu"
    >
      {businessAvatarUrl ? (
        <span className="h-5 w-5 shrink-0 overflow-hidden rounded-full ring-1 ring-primary/15">
          <img src={businessAvatarUrl} alt="" className="h-full w-full object-cover" />
        </span>
      ) : (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-normal text-white">
          <Briefcase size={12} />
        </span>
      )}
      <span>
        {compact
          ? 'My Business'
          : businessDisplayName.split(/\s+/)[0] || 'My Business'}
      </span>
      <ChevronDown
        size={14}
        className={`shrink-0 transition-transform duration-300 ${isBusinessMenuOpen ? 'rotate-180' : ''}`}
      />
    </button>
  );

  useEffect(() => {
    setMenuMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIsLangOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('finderb-mobile-menu-change', { detail: { open: isOpen } })
    );
  }, [isOpen]);

  const menuItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Categories', href: '/categories', icon: LayoutDashboard },
    { name: 'Tourist Places', href: '/tourist-places', icon: Globe },
    { name: 'Blog', href: '/blog', icon: BookOpen },
    { name: 'FinderB News', href: '/news', icon: Newspaper },
    { name: 'FinderB Job', href: '/categories/job', icon: ClipboardList },
    { name: 'Pricing', href: '/pricing', icon: Briefcase },
  ];

  const languages = ['English', 'Hindi', 'Bengali', 'Tamil', 'Telugu'];

  const showBusinessLogo = pathname === '/business/register';

  const mobileMenu = (
    <>
      <button
        type="button"
        aria-label="Close menu"
        onClick={() => setIsOpen(false)}
        className={`lg:hidden fixed inset-0 z-[10050] bg-stone-900/25 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <div
        className={`lg:hidden fixed inset-y-0 right-0 z-[10051] flex w-[min(78vw,18.5rem)] flex-col overflow-hidden border-l border-stone-200/80 bg-[#fafaf9] shadow-[-12px_0_28px_rgba(28,25,23,0.12)] transition-transform duration-300 ease-out ${mobileMenuFont.className} ${
          isOpen ? 'translate-x-0' : 'pointer-events-none translate-x-full'
        }`}
      >
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-end border-b border-stone-200/70 px-2.5 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition-all hover:bg-stone-100 hover:text-stone-800 active:scale-95"
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-1.5">
            <div className="space-y-0.5">
              {menuItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`group flex items-center justify-between rounded-lg px-2 py-2 transition-colors ${
                      active ? 'bg-teal-50' : 'hover:bg-white active:bg-stone-100'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                          active
                            ? 'bg-[#0f766e] text-white'
                            : 'bg-white text-stone-500 ring-1 ring-stone-200/80 group-hover:text-[#0f766e]'
                        }`}
                      >
                        <item.icon size={14} strokeWidth={2.1} />
                      </div>
                      <span
                        className={`truncate text-[13px] ${
                          active
                            ? 'font-semibold text-[#115e59]'
                            : 'font-medium text-stone-800'
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>
                    <ArrowRight
                      size={13}
                      className={`shrink-0 transition-transform ${
                        active
                          ? 'text-[#0f766e]'
                          : 'text-stone-300 group-hover:translate-x-0.5 group-hover:text-stone-400'
                      }`}
                    />
                  </Link>
                );
              })}
            </div>

            <div className="my-2 h-px bg-stone-200/80" />

            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex w-full items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-white"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-stone-500 ring-1 ring-stone-200/80">
                    <Globe size={14} />
                  </div>
                  <span className="text-[13px] font-medium text-stone-800">{currentLang}</span>
                </div>
                <ChevronDown
                  className={`text-stone-400 transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''}`}
                  size={14}
                />
              </button>

              <div
                className={`grid grid-cols-2 gap-1 overflow-hidden px-1 transition-all duration-300 ${
                  isLangOpen ? 'mb-1 max-h-20 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                {languages.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setCurrentLang(lang);
                      setIsLangOpen(false);
                    }}
                    className={`rounded-md py-1.5 text-[11px] font-semibold transition-colors ${
                      currentLang === lang
                        ? 'bg-[#0f766e] text-white'
                        : 'bg-white text-stone-600 ring-1 ring-stone-200/80 hover:bg-stone-50'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              {isLoggedIn && (
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-white"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-stone-500 ring-1 ring-stone-200/80">
                      <User size={14} />
                    </div>
                    <span className="text-[13px] font-medium text-stone-800">My Account</span>
                  </div>
                  <ArrowRight size={13} className="text-stone-300" />
                </Link>
              )}
              {isBusinessLoggedIn && !isLoggedIn && business && (
                <Link
                  href={businessDashboardHref}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-white"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-stone-500 ring-1 ring-stone-200/80">
                      <Briefcase size={14} />
                    </div>
                    <span className="text-[13px] font-medium text-stone-800">My Business</span>
                  </div>
                  <ArrowRight size={13} className="text-stone-300" />
                </Link>
              )}
            </div>
          </div>

          <div className="shrink-0 border-t border-stone-200/70 px-2.5 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            {isBusinessLoggedIn && business ? (
              <div className="grid grid-cols-1 gap-1.5">
                <Link
                  href={businessDashboardHref}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-[#0f766e] py-2 text-[12px] font-semibold text-white transition-all active:scale-[0.98]"
                >
                  <LayoutDashboard size={13} />
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    handleBusinessLogout();
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-red-100 bg-red-50 py-2 text-[12px] font-semibold text-red-500 transition-all active:scale-[0.98]"
                >
                  <LogOut size={13} />
                  Sign Out
                </button>
              </div>
            ) : isBusinessLoggedIn ? (
              <button
                type="button"
                onClick={() => {
                  handleBusinessLogout();
                  setIsOpen(false);
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-100 bg-red-50 py-2 text-[12px] font-semibold text-red-500 transition-all active:scale-[0.98]"
              >
                <LogOut size={13} />
                Sign Out
              </button>
            ) : isLoggedIn ? (
              <button
                type="button"
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-100 bg-red-50 py-2 text-[12px] font-semibold text-red-500 transition-all active:scale-[0.98]"
              >
                <LogOut size={13} />
                Sign Out
              </button>
            ) : (
              <div className="grid grid-cols-1 gap-1.5">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-[#0f766e] py-2 text-[12px] font-semibold text-white transition-all active:scale-[0.98]"
                >
                  <LogIn size={13} />
                  Login
                </Link>
                <Link
                  href="/business/register"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white py-2 text-[12px] font-semibold text-stone-800 transition-all hover:bg-stone-50 active:scale-[0.98]"
                >
                  <Briefcase size={13} className="text-[#0f766e]" />
                  Register Business
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <nav className={`fixed top-0 w-full z-[9999] transition-all duration-700 ${
      scrolled
        ? 'bg-white border-b border-gray-100 shadow-md py-2 sm:py-3'
        : 'bg-transparent py-3 sm:py-6 border-b border-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-full">
          {/* Logo - Left aligned */}
          <Link
            href={showBusinessLogo ? '/business/register' : '/'}
            className={`relative z-[10002] flex items-center shrink-0 ${isOpen ? 'max-lg:hidden' : ''}`}
          >
            <Image
              src={showBusinessLogo ? '/businesslogo.png' : '/logo1.png'}
              alt={showBusinessLogo ? 'FinderB Business' : 'FinderB Logo'}
              width={160}
              height={50}
              className="h-8 sm:h-10 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop Menu - Right aligned */}
          <div className="hidden lg:flex w-full items-center justify-between">
            <div className="ml-8 flex items-center gap-2">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'text-primary'
                      : 'text-slate-700 hover:text-primary'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3 ml-2">
              {!isBusinessLoggedIn && (
                <Link
                  href="/business/register"
                  className="relative flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[11px] font-semibold text-white transition-all hover:bg-primary/90"
                >
                  <span className="relative z-10">+ Register Business</span>
                </Link>
              )}

              {isLoggedIn ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-xl transition-all duration-300 font-medium text-xs shadow-sm hover:shadow-md ${isLight
                      ? 'bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20'
                      : 'bg-white/50 backdrop-blur-md text-gray-700 border-gray-200 hover:bg-white hover:border-gray-300'
                      }`}
                  >
                    <div className="w-5 h-5 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
                      {user?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 1)}
                    </div>
                    <span>{user?.fullName?.split(' ')[0] || 'My Account'}</span>
                    <ChevronDown size={14} className={`transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isUserMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-4 py-2 mb-1 border-b border-gray-50">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">My Account</p>
                        </div>
                        <Link
                          href="/dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-gray-600 hover:bg-primary/5 hover:text-primary transition-all"
                        >
                          <LayoutDashboard size={16} className="text-gray-400" />
                          Dashboard
                        </Link>
                        <Link
                          href="/dashboard?tab=profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-gray-600 hover:bg-primary/5 hover:text-primary transition-all"
                        >
                          <User size={16} className="text-gray-400" />
                          Profile
                        </Link>
                        <Link
                          href="/dashboard?tab=settings"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-gray-600 hover:bg-primary/5 hover:text-primary transition-all"
                        >
                          <Settings size={16} className="text-gray-400" />
                          Settings
                        </Link>
                        <div className="my-1 border-t border-gray-50" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-all"
                        >
                          <LogOut size={16} />
                          Log Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : isBusinessLoggedIn && business ? (
                <div className="relative">
                  {renderBusinessTrigger({ compact: false })}
                  {isBusinessMenuOpen && renderBusinessMenuPanel()}
                </div>
              ) : (
                <Link
                  href={loginHref}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-semibold text-slate-700 transition-all hover:border-primary/30 hover:text-primary"
                >
                  <LogIn size={16} />
                  <span>{loginLabel}</span>
                </Link>
              )}
            </div>
          </div>

          <div className="flex lg:hidden items-center gap-2">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                  scrolled
                    ? 'text-primary border border-primary/10 bg-white'
                    : 'text-primary border border-primary/15 bg-white/90 shadow-sm backdrop-blur-sm'
                }`}
              >
                My Account
              </Link>
            ) : isBusinessLoggedIn ? (
              <div className="relative z-[10002]">
                {renderBusinessTrigger({ compact: true })}
                {isBusinessMenuOpen && renderBusinessMenuPanel(true)}
              </div>
            ) : (
              <Link
                href={loginHref}
                className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all ${
                  scrolled
                    ? 'border border-primary/10 bg-white text-primary'
                    : 'border border-primary/15 bg-white/90 text-primary backdrop-blur-sm'
                }`}
              >
                <LogIn size={14} />
                {loginLabel}
              </Link>
            )}


            {!isOpen && (
              <button
                onClick={() => setIsOpen(true)}
                className="relative z-[10002] flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0f766e] shadow-sm ring-1 ring-teal-100 transition-all hover:bg-teal-50 active:scale-95"
                aria-label="Open menu"
              >
                <Menu size={24} strokeWidth={1.75} />
              </button>
            )}
          </div>
        </div>
      </div>

      {menuMounted ? createPortal(mobileMenu, document.body) : null}
    </nav>
  );
}

export default function Navbar(props: { whiteText?: boolean }) {
  return (
    <Suspense fallback={null}>
      <NavbarContent {...props} />
    </Suspense>
  );
}
