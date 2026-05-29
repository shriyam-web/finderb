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
    { label: 'FinderB Ai', icon: Zap, href: '/?tab=ai' },
    { label: 'Business', icon: Briefcase, href: '/business/register' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-gray-100 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const isHome = tab.label === 'Home';
          const isAi = tab.label === 'FinderB Ai';
          const isCategories = tab.label === 'Categories';
          const isBusiness = tab.label === 'Business';

          let reallyActive = false;
          if (isAi) {
            reallyActive = isAiActive;
          } else if (isHome) {
            reallyActive = pathname === '/' && !isAiActive;
          } else if (isCategories) {
            reallyActive =
              pathname === '/categories' || Boolean(pathname?.startsWith('/categories/'));
          } else {
            reallyActive = pathname === tab.href;
          }

          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300 ${
                isBusiness
                  ? 'bg-amber-400 text-white'
                  : (reallyActive ? 'text-primary' : 'text-gray-400')
              }`}
            >
              <tab.icon 
                size={20} 
                className={`transition-transform duration-300 ${reallyActive ? 'animate-pulse scale-110' : ''}`} 
              />
              <span className="text-[10px] font-semibold tracking-normal">{tab.label}</span>
              {reallyActive && (
                <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isBusiness ? 'bg-white' : 'bg-primary'}`} />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
