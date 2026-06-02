'use client';

import Image from 'next/image';
import {
  Search,
  MapPin,
  ChevronDown,
  ChevronRight,
  Mic,
  LocateFixed,
} from 'lucide-react';
import { HERO_TRUST_BADGES, POPULAR_SEARCHES } from '@/lib/homeHeroConstants';

type HomeHeroProps = {
  variant: 'mobile' | 'desktop';
  manualQuery: string;
  onQueryChange: (value: string) => void;
  onSearch: (query?: string) => void;
};

export default function HomeHero({
  variant,
  manualQuery,
  onQueryChange,
  onSearch,
}: HomeHeroProps) {
  const isDesktop = variant === 'desktop';

  return (
    <section
      className={`relative overflow-hidden bg-gradient-to-b from-white via-[#f5f9ff] to-[#e8f2fc] ${
        isDesktop ? 'hidden lg:block' : 'lg:hidden'
      } ${isDesktop ? 'pb-4' : 'pb-5'}`}
    >
      <div
        className={`pointer-events-none absolute right-0 z-[1] ${
          isDesktop
            ? 'top-20 h-[min(210px,28vh)] w-[min(38%,400px)]'
            : 'top-[3.85rem] h-[184px] w-[min(49vw,205px)]'
        }`}
        aria-hidden
      >
        <Image
          src="/hero-new.png"
          alt=""
          fill
          className="object-contain object-right"
          sizes={isDesktop ? '(min-width: 1024px) 38vw, 49vw' : '49vw'}
          priority
        />
      </div>

      <div
        className={`relative z-[2] ${isDesktop ? 'mx-auto max-w-7xl px-8 pb-1 pt-24' : 'pt-[4.5rem]'}`}
      >
        <div className={isDesktop ? 'relative max-w-xl' : 'pl-4 pr-1'}>
          <div className={isDesktop ? '' : 'max-w-[62%]'}>
            {isDesktop ? (
              <h1 className="text-left text-[32px] font-extrabold leading-tight tracking-tight text-[#0f172a]">
                Find trusted{' '}
                <span className="text-[#2563eb]">businesses near you</span>
              </h1>
            ) : (
              <h1 className="text-left text-[20px] font-extrabold leading-[1.15] tracking-tight">
                <span className="block whitespace-nowrap text-[#0f172a]">
                  Find trusted businesses
                </span>
                <span className="mt-0.5 block text-[#2563eb]">near you</span>
              </h1>
            )}
            <p
              className={`text-left text-[#64748b] ${
                isDesktop ? 'mt-1 text-sm leading-snug' : 'mt-1 text-[12px] leading-snug'
              }`}
            >
              {isDesktop ? (
                'Search millions of listings across India'
              ) : (
                <>
                  <span className="block">Search millions of listings</span>
                  <span className="block">across India</span>
                </>
              )}
            </p>

            <div
              className={`flex gap-0.5 ${
                isDesktop ? 'mt-2 max-w-sm' : 'mt-2.5 max-w-[10.75rem]'
              }`}
            >
              {HERO_TRUST_BADGES.map(
                ({ title, subtitle, icon: Icon, badgeBg, iconWrap, iconColor }) => (
                  <div
                    key={title}
                    className={`flex min-w-0 flex-1 items-center rounded ${
                      isDesktop ? 'gap-1 px-1 py-0.5' : 'gap-0.5 px-0.5 py-0.5'
                    } ${badgeBg}`}
                  >
                    <div
                      className={`flex shrink-0 items-center justify-center rounded-full ${iconWrap} ${
                        isDesktop ? 'h-6 w-6' : 'h-5 w-5'
                      }`}
                    >
                      <Icon
                        size={isDesktop ? 12 : 10}
                        className={iconColor}
                        strokeWidth={2.5}
                      />
                    </div>
                    <div className="min-w-0 leading-[1.05]">
                      <p
                        className={`font-bold text-[#0f172a] ${
                          isDesktop ? 'text-[10px]' : 'text-[8px]'
                        }`}
                      >
                        {title}
                      </p>
                      <p
                        className={
                          isDesktop ? 'text-[9px] text-[#94a3b8]' : 'text-[6px] text-[#94a3b8]'
                        }
                      >
                        {subtitle}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <div className={`${isDesktop ? 'mt-3 max-w-2xl' : 'mt-3 px-4'}`}>
          {isDesktop ? (
            <div className="flex items-stretch overflow-hidden rounded-xl border border-gray-100/80 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.07)]">
              <div className="flex min-w-0 flex-[1.4] items-center gap-2 border-r border-gray-100 px-3 py-2">
                <Search size={18} className="shrink-0 text-[#94a3b8]" strokeWidth={2} />
                <input
                  type="text"
                  value={manualQuery}
                  onChange={(e) => onQueryChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                  placeholder="Search anything... (e.g. Dentist, CA, Gym, Salon)"
                  className="min-w-0 flex-1 border-none bg-transparent text-sm text-[#334155] placeholder:text-[#94a3b8] focus:ring-0"
                />
                <button type="button" className="shrink-0 text-[#94a3b8]" aria-label="Voice search">
                  <Mic size={17} strokeWidth={2} />
                </button>
              </div>
              <div className="flex items-center gap-1.5 border-r border-gray-100 px-3 py-2">
                <MapPin size={16} className="shrink-0 text-[#2563eb]" strokeWidth={2.25} />
                <span className="whitespace-nowrap text-sm font-semibold text-[#1e293b]">New Delhi</span>
                <ChevronDown size={14} className="shrink-0 text-[#94a3b8]" />
              </div>
              <button
                type="button"
                onClick={() => onSearch()}
                className="flex shrink-0 items-center justify-center gap-1.5 bg-[#2563eb] px-5 text-sm font-bold text-white hover:bg-[#1d4ed8]"
              >
                <Search size={17} strokeWidth={2.5} />
                Search
              </button>
            </div>
          ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100/80 bg-white text-left shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-2 border-b border-gray-100 px-3.5 py-3">
              <Search size={18} className="shrink-0 text-[#94a3b8]" strokeWidth={2} />
              <input
                type="text"
                value={manualQuery}
                onChange={(e) => onQueryChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                placeholder="Search anything... (e.g. Dentist, CA, Gym, Salon)"
                className="min-w-0 flex-1 border-none bg-transparent text-[13px] text-[#334155] placeholder:text-[#94a3b8] focus:ring-0"
              />
              <button
                type="button"
                className="shrink-0 p-0.5 text-[#94a3b8]"
                aria-label="Voice search"
              >
                <Mic size={18} strokeWidth={2} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-gray-100 px-3.5 py-2.5">
              <MapPin size={17} className="shrink-0 text-[#2563eb]" strokeWidth={2.25} />
              <span className="text-[13px] font-semibold text-[#1e293b]">New Delhi</span>
              <div className="ml-auto flex min-w-0 items-center gap-1">
                <button
                  type="button"
                  className="flex items-center gap-1 text-[11px] font-medium text-[#2563eb]"
                >
                  <LocateFixed size={13} strokeWidth={2.25} />
                  <span className="whitespace-nowrap">Use my current location</span>
                </button>
                <ChevronDown size={15} className="shrink-0 text-[#94a3b8]" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSearch()}
              className="flex w-full items-center justify-center gap-2 bg-[#2563eb] py-3.5 text-[15px] font-bold text-white active:bg-[#1d4ed8]"
            >
              <Search size={18} strokeWidth={2.5} />
              Search
            </button>
          </div>
          )}
        </div>

        {!isDesktop && (
        <div className="mt-5 px-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-[#0f172a]">Popular Searches</h2>
            <button
              type="button"
              onClick={() => onSearch()}
              className="flex items-center gap-0.5 text-[13px] font-semibold text-[#2563eb]"
            >
              View All
              <ChevronRight size={16} strokeWidth={2.25} />
            </button>
          </div>
          <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-0.5">
            {POPULAR_SEARCHES.map(({ term, icon: Icon, iconColor }) => (
              <button
                key={term}
                type="button"
                onClick={() => onSearch(term)}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-[#334155] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
              >
                <Icon size={15} className={`shrink-0 ${iconColor}`} strokeWidth={2} />
                {term}
              </button>
            ))}
          </div>
        </div>
        )}
      </div>
    </section>
  );
}
