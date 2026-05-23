'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Menu, X, User, Briefcase, Globe, Megaphone, Users, UserCircle, HelpCircle, ChevronDown, Home, ArrowRight, Settings, LogOut, LayoutDashboard, Building2 } from 'lucide-react';
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

  const whiteText = initialWhiteText || isAiTab;

  useEffect(() => {
    const checkSession = async () => {
      // Check user session
      const userResult = await getSession();
      if (userResult && userResult.success) {
        setIsLoggedIn(true);
        setUser(userResult.user);
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }

      // Check business session
      const businessResult = await getBusinessSession();
      if (businessResult && businessResult.success) {
        setIsBusinessLoggedIn(true);
        setBusiness(businessResult.business);
      } else {
        setIsBusinessLoggedIn(false);
        setBusiness(null);
      }
    };
    checkSession();
  }, [pathname]); // Check on every navigation

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
    { name: 'Advertise', href: '/advertisements', icon: Megaphone },
    { name: 'About', href: '/about', icon: HelpCircle },
  ];

  const languages = ['English', 'Hindi', 'Bengali', 'Tamil', 'Telugu'];

  const isLight = !scrolled && whiteText;

  return (
    <nav className={`fixed top-0 w-full z-[9999] transition-all duration-700 ${scrolled
      ? 'bg-white border-b border-gray-100 shadow-md py-2 sm:py-3'
      : 'bg-transparent py-3 sm:py-6 border-b border-transparent'
      }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-full">
          {/* Logo - Left aligned */}
          <Link href="/" className="relative z-[10002] flex items-center shrink-0">
            <Image
              src="/logo1.png"
              alt="FinderB Logo"
              width={160}
              height={50}
              className="h-8 sm:h-10 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop Menu - Right aligned */}
          <div className="hidden lg:flex items-center space-x-1">
            {/* Language Selector First */}
            <div className={`relative group/lang px-3 py-2 cursor-pointer flex items-center gap-1.5 transition-colors mr-2 ${isLight ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-primary'}`}>
              <Globe size={16} />
              <span className="text-xs font-medium">{currentLang}</span>
              <ChevronDown size={14} className="group-hover/lang:rotate-180 transition-transform duration-300" />

              <div className="absolute top-full right-0 w-32 bg-white/95 backdrop-blur-xl border border-gray-100 shadow-xl rounded-2xl py-2 opacity-0 invisible group-hover/lang:opacity-100 group-hover/lang:visible transition-all duration-300 translate-y-2 group-hover/lang:translate-y-0 z-50">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setCurrentLang(lang)}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-gray-600 hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div className={`w-px h-6 mx-2 transition-colors ${isLight ? 'bg-white/20' : 'bg-gray-200/50'}`} />

            {/* Menu Items */}
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`font-medium px-3 py-2 rounded-xl transition-all duration-300 flex items-center gap-1.5 text-sm whitespace-nowrap ${isLight
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                  }`}
              >
                {item.icon && <item.icon size={16} />}
                {item.name}
              </Link>
            ))}

            <div className={`w-px h-6 mx-2 transition-colors ${isLight ? 'bg-white/20' : 'bg-gray-200/50'}`} />

            {/* Business and Auth Actions */}
            <div className="flex items-center gap-3 ml-2">
              {!isBusinessLoggedIn && (
                <Link
                  href="/business/register"
                  className="relative flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl shadow-lg shadow-secondary/10 hover:shadow-secondary/30 hover:-translate-y-0.5 transition-all duration-500 font-bold text-[10px] group overflow-hidden uppercase tracking-widest"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  <span className="relative z-10">Register Business</span>
                </Link>
              )}

              {isBusinessLoggedIn && (
                <div className="relative">
                  <button
                    onClick={() => setIsBusinessMenuOpen(!isBusinessMenuOpen)}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-xl transition-all duration-300 font-medium text-xs shadow-sm hover:shadow-md ${isLight
                      ? 'bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20'
                      : 'bg-white/50 backdrop-blur-md text-gray-700 border-gray-200 hover:bg-white hover:border-gray-300'
                      }`}
                  >
                    <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
                      <Briefcase size={12} />
                    </div>
                    <span>{business?.businessName?.split(' ')[0] || 'Business'}</span>
                    <ChevronDown size={14} className={`transition-transform duration-300 ${isBusinessMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isBusinessMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsBusinessMenuOpen(false)}
                      />
                      <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-4 py-2 mb-1 border-b border-gray-50">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Business Portal</p>
                        </div>
                        <Link
                          href={`/business/dashboard?id=${business.id}`}
                          onClick={() => setIsBusinessMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                        >
                          <LayoutDashboard size={16} className="text-gray-400" />
                          Dashboard
                        </Link>
                        <Link
                          href={`/business/dashboard?id=${business.id}&tab=settings`}
                          onClick={() => setIsBusinessMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                        >
                          <Settings size={16} className="text-gray-400" />
                          Settings
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
                    <span>{user?.fullName?.split(' ')[0] || 'User'}</span>
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
              ) : (
                <Link
                  href="/login"
                  className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl transition-all duration-500 font-semibold text-[10px] uppercase tracking-wider shadow-sm hover:shadow-md ${isLight
                    ? 'bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20'
                    : 'bg-white/50 backdrop-blur-md text-primary border-primary/10 hover:bg-white hover:border-primary/30'
                    }`}
                >
                  <User size={16} />
                  <span>Login/ Signup</span>
                </Link>
              )}
            </div>
          </div>

          <div className="flex lg:hidden items-center gap-3">
            {!isBusinessLoggedIn && !isLoggedIn && (
              <Link
                href="/login"
                className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all ${
                  scrolled ? 'text-primary' : (isLight ? 'text-white border border-white/20 bg-white/10' : 'text-primary border border-primary/10 bg-white/50')
                }`}
              >
                Login
              </Link>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`relative z-[10002] p-2 rounded-xl transition-all active:scale-95 ${
                scrolled
                  ? 'text-gray-700 bg-gray-50'
                  : isLight
                    ? 'text-white bg-white/10 backdrop-blur-md border border-white/20'
                    : 'text-gray-700 bg-white/50 backdrop-blur-sm border border-gray-100'
              }`}
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
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

          {/* Header */}
          <div className="flex justify-between items-center p-6 relative z-10 border-b border-slate-50">
            <Link href="/" className="flex-shrink-0" onClick={() => setIsOpen(false)}>
              <Image
                src="/logo1.png"
                alt="FinderB Logo"
                width={140}
                height={50}
                className="h-9 w-auto object-contain"
              />
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-900 border border-slate-200 active:scale-95 transition-all"
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
                    <span className="text-base text-slate-800 tracking-tight">Account Dashboard</span>
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
                  <User size={18} />
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
