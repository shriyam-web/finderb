'use client';

import Link from 'next/link';
import { getBusinessProfilePath } from '@/lib/businessSlug';
import Image from 'next/image';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Menu, X, User, Briefcase, Globe, ChevronDown, Home, ArrowRight, Settings, LogIn, LogOut, LayoutDashboard, Building2, Newspaper, BookOpen } from 'lucide-react';
import { getSession, logoutUser } from '@/app/actions/user';
import { getBusinessSession, logoutBusiness } from '@/app/actions/business';
import { useRouter } from 'next/navigation';

function NavbarContent({ whiteText: initialWhiteText = false }: { whiteText?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
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
  }, [pathname, checkSession]); // Check on every navigation

  useEffect(() => {
    const handleSessionChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ type: 'user' | 'business' | 'none' }>;
      if (customEvent.detail?.type === 'user') {
        setIsLoggedIn(true);
        setIsBusinessLoggedIn(false);
        setUser(null);
        setBusiness(null);
      } else if (customEvent.detail?.type === 'business') {
        setIsBusinessLoggedIn(true);
        setIsLoggedIn(false);
        setBusiness(null);
        setUser(null);
      } else if (customEvent.detail?.type === 'none') {
        setIsLoggedIn(false);
        setUser(null);
        setIsBusinessLoggedIn(false);
        setBusiness(null);
      }
      checkSession();
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

  const menuItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Categories', href: '/categories', icon: LayoutDashboard },
    { name: 'Tourist Places', href: '/tourist-places', icon: Globe },
    { name: 'Blog', href: '/blog', icon: BookOpen },
    { name: 'Pricing', href: '/pricing', icon: Briefcase },
  ];

  const languages = ['English', 'Hindi', 'Bengali', 'Tamil', 'Telugu'];

  const isLight = !scrolled && whiteText;
  const showBusinessLogo = pathname === '/business/register';

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
              ) : isBusinessLoggedIn ? (
                <div className="relative">
                  <button
                    onClick={() => setIsBusinessMenuOpen(!isBusinessMenuOpen)}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-xl transition-all duration-300 font-medium text-xs shadow-sm hover:shadow-md ${isLight
                      ? 'bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20'
                      : 'bg-white/50 backdrop-blur-md text-gray-700 border-gray-200 hover:bg-white hover:border-gray-300'
                      }`}
                  >
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
                      <Briefcase size={12} />
                    </div>
                    <span>My Account</span>
                    <ChevronDown size={14} className={`transition-transform duration-300 ${isBusinessMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isBusinessMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsBusinessMenuOpen(false)}
                      />
                      <div className="absolute top-full right-0 mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-4 py-2 mb-1 border-b border-gray-50">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">My Account</p>
                          {business?.businessName && (
                            <p className="mt-0.5 truncate text-xs font-medium text-gray-700">{business.businessName}</p>
                          )}
                        </div>
                        <Link
                          href={`/business/dashboard?id=${business.id}`}
                          onClick={() => setIsBusinessMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-gray-600 hover:bg-primary/5 hover:text-primary transition-all"
                        >
                          <LayoutDashboard size={16} className="text-gray-400" />
                          Merchant dashboard
                        </Link>
                        <Link
                          href={getBusinessProfilePath(business)}
                          target="_blank"
                          onClick={() => setIsBusinessMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-gray-600 hover:bg-primary/5 hover:text-primary transition-all"
                        >
                          <Building2 size={16} className="text-gray-400" />
                          Public listing
                        </Link>
                        <div className="my-1 border-t border-gray-50" />
                        <button
                          onClick={handleBusinessLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-all"
                        >
                          <LogOut size={16} />
                          Log Out
                        </button>
                      </div>
                    </>
                  )}
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
            {isLoggedIn || isBusinessLoggedIn ? (
              <Link
                href={
                  isLoggedIn
                    ? '/dashboard'
                    : `/business/dashboard?id=${business?.id ?? ''}`
                }
                className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                  scrolled
                    ? 'text-primary border border-primary/10 bg-white'
                    : 'text-primary border border-primary/15 bg-white/90 shadow-sm backdrop-blur-sm'
                }`}
              >
                My Account
              </Link>
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
                className="relative z-[10002] flex h-10 w-10 items-center justify-center rounded-full text-[#475569] transition-all hover:bg-gray-50 active:scale-95"
                aria-label="Open menu"
              >
                <Menu size={24} strokeWidth={1.75} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Content */}
      <div className={`lg:hidden fixed inset-0 w-full h-full bg-white z-[10001] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] transform ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}>
        <div className="flex flex-col h-full bg-white relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-primary/5 blur-[100px] rounded-full" />
          <div className="absolute bottom-[-5%] left-[-5%] w-[50%] h-[30%] bg-secondary/5 blur-[80px] rounded-full" />

          {/* Header — no logo (navbar logo is enough); single close control */}
          <div className="flex items-center justify-between p-6 relative z-10 border-b border-slate-50">
            <p className="text-lg font-bold text-primary">Menu</p>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-900 transition-all active:scale-95"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 px-8 py-4 space-y-2 overflow-y-auto relative z-10">
            <div className="py-2">
              <div className="space-y-1">
                {menuItems.map((item, idx) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="group flex items-center justify-between py-3 px-2 rounded-2xl transition-all duration-300 active:bg-slate-50"
                    style={{
                      transitionDelay: `${idx * 50}ms`,
                      transform: isOpen ? 'translateX(0)' : 'translateX(20px)',
                      opacity: isOpen ? 1 : 0
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:text-primary group-hover:bg-primary/5 transition-colors">
                        <item.icon size={18} />
                      </div>
                      <span className="text-base text-slate-800 tracking-tight">{item.name}</span>
                    </div>
                    <ArrowRight size={16} className="text-slate-300 group-hover:text-primary transition-all group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="h-px w-full bg-slate-100 my-4" />

            <div className="py-0">
              {/* <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-1">Settings & Preferences</p> */}

              {/* Language Selector */}
              <div className="mb-2">
                <button
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="w-full flex items-center justify-between py-3 px-2 rounded-2xl bg-slate-50/50 border border-slate-100 active:bg-slate-100 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-white shadow-sm text-slate-400 border border-slate-100">
                      <Globe size={18} />
                    </div>
                    <span className="text-base font-semibold text-slate-800 tracking-tight">{currentLang}</span>
                  </div>
                  <ChevronDown className={`transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''} text-slate-400`} size={18} />
                </button>

                <div className={`grid grid-cols-2 gap-3 mt-2 px-1 transition-all duration-500 overflow-hidden ${isLangOpen ? 'max-h-[300px] opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setCurrentLang(lang);
                        setIsLangOpen(false);
                      }}
                      className={`flex items-center justify-center py-2.5 rounded-xl text-[10px] font-bold transition-all border ${currentLang === lang
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]'
                        : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                        }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Profile/Dashboard link if logged in */}
              {isLoggedIn && (
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between py-3 px-2 rounded-2xl active:bg-slate-50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                      <User size={18} />
                    </div>
                    <span className="text-base text-slate-800 tracking-tight">My Account</span>
                  </div>
                  <ArrowRight size={16} className="text-slate-300" />
                </Link>
              )}
              {isBusinessLoggedIn && !isLoggedIn && (
                <Link
                  href={`/business/dashboard?id=${business?.id ?? ''}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between py-3 px-2 rounded-2xl active:bg-slate-50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                      <Briefcase size={18} />
                    </div>
                    <span className="text-base text-slate-800 tracking-tight">My Account</span>
                  </div>
                  <ArrowRight size={16} className="text-slate-300" />
                </Link>
              )}
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-8 pb-12 relative z-10 border-t border-slate-50">
            {isBusinessLoggedIn ? (
              <div className="space-y-3">
                <Link
                  href={`/business/dashboard?id=${business.id}`}
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-xl shadow-indigo-200 active:scale-95 transition-all"
                >
                  <LayoutDashboard size={18} />
                  Business Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleBusinessLogout();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-slate-50 text-red-500 font-bold text-xs border border-red-50 active:scale-95 transition-all"
                >
                  <LogOut size={18} />
                  Sign Out Business
                </button>
              </div>
            ) : isLoggedIn ? (
              <button
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-slate-50 text-red-500 font-bold text-xs border border-red-50 active:scale-95 transition-all"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            ) : (
              <div className="space-y-3">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-primary text-white font-bold text-xs shadow-xl shadow-primary/20 active:scale-95 transition-all"
                >
                  <LogIn size={18} />
                  Login to Account
                </Link>
                <Link
                  href="/business/register"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white text-slate-900 font-bold text-xs border border-slate-200 active:scale-95 transition-all"
                >
                  <Briefcase size={18} className="text-secondary" />
                  Register Business
                </Link>
              </div>
            )}
            <p className="text-center text-[9px] text-slate-400 font-medium mt-6 uppercase tracking-widest opacity-60">FinderB v2.0 • Made with ❤️</p>
          </div>
        </div>
      </div>
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
