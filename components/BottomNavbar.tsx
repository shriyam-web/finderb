'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, LayoutGrid, Zap, User } from 'lucide-react';

export default function BottomNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Categories', icon: LayoutGrid, href: '/categories' },
    { label: 'FinderB Ai', icon: Zap, href: '/?tab=ai' },
    { label: 'Account', icon: User, href: '/dashboard' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-white/80 backdrop-blur-xl border-t border-gray-100 pb-safe">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.label === 'Home' && pathname === '/' && !tab.href.includes('tab=ai'));
          // Special case for AI tab which is a query param
          const isAiActive = tab.label === 'FinderB Ai' && typeof window !== 'undefined' && window.location.search.includes('tab=ai');
          
          const reallyActive = tab.label === 'FinderB Ai' ? isAiActive : (tab.label === 'Home' ? (pathname === '/' && !isAiActive) : isActive);

          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
                reallyActive ? 'text-primary' : 'text-gray-400'
              }`}
            >
              <tab.icon size={20} className={reallyActive ? 'animate-pulse' : ''} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
              {reallyActive && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
