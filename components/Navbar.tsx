'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, User, Briefcase, Globe, Megaphone, Users, UserCircle, HelpCircle, ChevronDown, Home } from 'lucide-react';

export default function Navbar({ whiteText: initialWhiteText = false }: { whiteText?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('English');
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

  const isLight = false; // Background is no longer transparent, so we don't need white text mode

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-700 ${
      scrolled 
        ? 'bg-white border-b border-gray-100 shadow-md py-3' 
        : 'bg-white py-6 border-b border-gray-50'
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
        <div className="lg:hidden fixed inset-0 top-[72px] bg-white/95 backdrop-blur-2xl z-50 overflow-y-auto animate-in fade-in slide-in-from-bottom-5 duration-500">
          <div className="p-6 space-y-8">
            <div className="space-y-4">
              <p className="text-[10px] font-medium text-gray-400 ml-2">Select Language</p>
              <div className="grid grid-cols-2 gap-3">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setCurrentLang(lang);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-center py-4 rounded-3xl text-xs font-medium transition-all ${currentLang === lang ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-medium text-gray-400 ml-2">Menu</p>
              <div className="grid grid-cols-1 gap-3">
                {menuItems.map((item) => (
                  <Link 
                    key={item.name} 
                    href={item.href} 
                    className="flex items-center justify-between p-5 bg-gray-50/50 hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 text-gray-700 hover:text-primary rounded-3xl transition-all font-medium tracking-tight border border-transparent hover:border-gray-100"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white rounded-xl shadow-sm">
                        <item.icon size={20} className="text-gray-400" />
                      </div>
                      {item.name}
                    </div>
                    <ChevronDown className="-rotate-90 text-gray-300" size={18} />
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-8 border-t border-gray-100">
              <Link 
                href="/business/register" 
                className="flex items-center justify-between p-6 bg-gradient-to-r from-primary via-blue-600 to-indigo-600 text-white rounded-[2.5rem] shadow-2xl shadow-primary/30"
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center gap-5">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <Briefcase size={28} className="text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium text-white/60 leading-none mb-1.5">For Partners</span>
                    <span className="text-xl font-medium tracking-tight">Register Business</span>
                  </div>
                </div>
                <ChevronDown className="-rotate-90 text-white/40" size={24} />
              </Link>

              <Link 
                href={authItem.href} 
                className="flex items-center justify-between p-6 bg-white border-2 border-gray-100 text-primary rounded-[2.5rem] shadow-sm"
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center gap-5">
                  <div className="p-3 bg-gray-50 rounded-2xl text-gray-400">
                    <authItem.icon size={28} />
                  </div>
                  <span className="text-xl font-medium tracking-tight">{authItem.name}</span>
                </div>
                <ChevronDown className="-rotate-90 text-gray-200" size={24} />
              </Link>
            </div>
          </div>
        </div>
      )}



    </nav>
  );
}
