'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X, Search, User, Briefcase, Globe, Megaphone, Users, UserCircle, Info } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: 'language', href: '#', icon: Globe },
    { name: 'Business listing and pricing', href: '/pricing', icon: Briefcase },
    { name: 'Login/ Signup', href: '/login', icon: User },
    { name: 'About', href: '/about', icon: Info },
    { name: 'Hirings', href: '/hirings', icon: Users },
    { name: 'Advertise', href: '/advertise', icon: Megaphone },
    { name: 'Profile', href: '/profile', icon: UserCircle },
  ];

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex-shrink-0 flex items-center group">
            <Image 
              src="/boomb logo.png" 
              alt="Boomb Logo" 
              width={180} 
              height={60} 
              className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              priority
              quality={100}
            />
          </Link>

          <div className="hidden lg:flex items-center space-x-4 xl:space-x-6 ml-auto">
            {menuItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href} 
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors flex items-center gap-1 text-xs xl:text-sm whitespace-nowrap"
              >
                {item.icon && <item.icon size={16} />}
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-blue-600 p-2"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 animate-in slide-in-from-top duration-300">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {menuItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href} 
                className="block px-3 py-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-md font-medium text-base flex items-center gap-2"
                onClick={() => setIsOpen(false)}
              >
                {item.icon && <item.icon size={20} />}
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
