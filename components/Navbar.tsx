'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, User, Briefcase, Globe, Megaphone, Users, UserCircle, HelpCircle, ChevronDown, Home, ArrowRight } from 'lucide-react';

export default function Navbar({ whiteText: initialWhiteText = false }: { whiteText?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('English');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn] = useState(false); // Mock for now
  const pathname = usePathname();

  const whiteText = initialWhiteText || pathname === '/business/register';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Hirings', href: '/hirings', icon: Users },
    { name: 'Advertise', href: '/advertisements', icon: Megaphone },
    { name: 'About', href: '/about', icon: HelpCircle },
  ];

  const authItem = isLoggedIn
    ? { name: 'Profile', href: '/profile', icon: UserCircle }
    : { name: 'Login/ Signup', href: '/login', icon: User };

  const languages = ['English', 'Hindi', 'Bengali', 'Tamil', 'Telugu'];

  const isLight = !scrolled && whiteText;

  return (
    <nav className={`fixed top-0 w-full z-[1000] transition-all duration-700 ${
      scrolled 
        ? 'bg-white border-b border-gray-100 shadow-md py-2 sm:py-3' 
        : 'bg-transparent py-3 sm:py-6 border-b border-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center gap-4">
          <Link href="/" className="flex-shrink-0 flex items-center group">
            <Image 
              src={isLight ? "/logo-w2.png" : "/logo-n.png"} 
              alt="Boomb Logo" 
              width={180} 
              height={60} 
              className="h-8 sm:h-11 w-auto object-contain transition-all duration-500 group-hover:scale-105"
              priority
              quality={100}
            />
          </Link>

          <div className="hidden lg:flex items-center space-x-1 ml-auto">
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
                className={`font-medium px-3 py-2 rounded-xl transition-all duration-300 flex items-center gap-1.5 text-sm whitespace-nowrap ${
                  isLight 
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
              <Link 
                href="/business/register" 
                className="relative flex items-center gap-2 px-7 py-3 bg-gradient-to-br from-primary via-blue-600 to-indigo-600 text-white rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-500 font-medium text-xs group overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <Briefcase size={16} className="relative z-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500" />
                <span className="relative z-10">Register Business</span>
              </Link>

              <Link 
                href={authItem.href} 
                className={`flex items-center gap-2 px-6 py-3 border-2 rounded-2xl transition-all duration-500 font-medium text-xs shadow-sm hover:shadow-lg ${
                  isLight 
                    ? 'bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20' 
                    : 'bg-white/50 backdrop-blur-md text-primary border-primary/10 hover:bg-white hover:border-primary/30'
                }`}
              >
                <authItem.icon size={16} />
                {authItem.name}
              </Link>
            </div>
          </div>

          <div className="flex lg:hidden items-center gap-3">
            <Link 
              href={authItem.href} 
              className={`p-2.5 rounded-xl transition-colors ${
                scrolled 
                  ? 'text-blue-600 bg-blue-50' 
                  : isLight 
                    ? 'text-white bg-white/20 backdrop-blur-md' 
                    : 'text-gray-700 bg-white/50 backdrop-blur-sm'
              }`}
            >
              <authItem.icon size={22} />
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2.5 rounded-xl transition-colors ${
                scrolled 
                  ? 'text-gray-600 bg-gray-50' 
                  : isLight 
                    ? 'text-white bg-white/20 backdrop-blur-md' 
                    : 'text-gray-700 bg-white/50 backdrop-blur-sm'
              }`}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 top-[60px] sm:top-[72px] bg-white/98 backdrop-blur-3xl z-[1001] overflow-y-auto animate-in fade-in slide-in-from-bottom-5 duration-500">
          <div className="p-4 space-y-6">
            <div className="space-y-3">
              <button 
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="w-full flex items-center justify-between p-3.5 bg-gray-50/50 hover:bg-white text-gray-700 rounded-2xl transition-all text-xs font-semibold tracking-tight border border-gray-100/50 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-50">
                    <Globe size={16} className="text-primary" />
                  </div>
                  <span>{currentLang}</span>
                </div>
                <ChevronDown className={`transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''} text-gray-400`} size={14} />
              </button>
              
              {isLangOpen && (
                <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setCurrentLang(lang);
                        setIsLangOpen(false);
                      }}
                      className={`flex items-center justify-center py-2.5 rounded-xl text-[10px] font-bold transition-all ${currentLang === lang ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-50 text-gray-600 border border-gray-100/50'}`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-[9px] font-bold text-gray-400 ml-1 tracking-widest uppercase">Navigation</p>
              <div className="grid grid-cols-2 gap-2">
                {menuItems.map((item) => (
                  <Link 
                    key={item.name} 
                    href={item.href} 
                    className="flex items-center gap-3 p-3 bg-gray-50/50 hover:bg-white hover:shadow-md text-gray-700 hover:text-primary rounded-2xl transition-all text-[11px] font-bold border border-gray-100/50"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="p-1.5 bg-white rounded-lg shadow-sm">
                      <item.icon size={14} className="text-gray-400" />
                    </div>
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 pt-4 border-t border-gray-100">
              <Link 
                href="/business/register" 
                className="flex items-center justify-between p-3.5 bg-gradient-to-r from-primary via-blue-600 to-indigo-600 text-white rounded-2xl shadow-xl shadow-primary/20"
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                    <Briefcase size={18} className="text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-white/70 leading-none mb-0.5 uppercase tracking-wider">Partners</span>
                    <span className="text-xs font-bold">Register Business</span>
                  </div>
                </div>
                <ArrowRight className="text-white/60" size={16} />
              </Link>

              <Link 
                href={authItem.href} 
                className="flex items-center justify-between p-3.5 bg-white border border-gray-100 text-primary rounded-2xl shadow-sm"
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-xl text-gray-400 border border-gray-100">
                    <authItem.icon size={18} />
                  </div>
                  <span className="text-xs font-bold">{authItem.name}</span>
                </div>
                <ArrowRight className="text-gray-300" size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
