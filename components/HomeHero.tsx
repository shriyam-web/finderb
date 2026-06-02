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
      } ${isDesktop ? 'pb-10' : 'pb-5'}`}
    >
      <div
        className={`pointer-events-none absolute right-0 z-[1] ${
          isDesktop
            ? 'top-16 h-[min(420px,52vh)] w-[min(46%,520px)]'
            : 'top-[3.85rem] h-[184px] w-[min(49vw,205px)]'
        }`}
        aria-hidden
      >
        <Image
          src="/hero-new.png"
          alt=""
          fill
          className="object-contain object-right"
          sizes={isDesktop ? '(min-width: 1024px) 46vw, 49vw' : '49vw'}
          priority
        />
      </div>

      <div
        className={`relative z-[2] ${isDesktop ? 'mx-auto max-w-7xl px-8 pb-2 pt-28' : 'pt-[4.5rem]'}`}
      >
        <div className={isDesktop ? 'relative max-w-2xl' : 'pl-4 pr-1'}>
          <div className={isDesktop ? '' : 'max-w-[62%]'}>
            <h1
              className={`text-left font-extrabold tracking-tight ${
                isDesktop
                  ? 'text-[42px] leading-[1.1]'
                  : 'text-[20px] leading-[1.15]'
              }`}
            >
              <span className={`block text-[#0f172a] ${isDesktop ? '' : 'whitespace-nowrap'}`}>
                Find trusted businesses
              </span>
              <span className={`block text-[#2563eb] ${isDesktop ? 'mt-1' : 'mt-0.5'}`}>
                near you
              </span>
            </h1>
            <p
              className={`mt-1.5 text-left text-[#64748b] ${
                isDesktop ? 'text-lg leading-snug' : 'text-[12px] leading-snug'
              }`}
            >
              <span className="block">Search millions of listings</span>
              <span className="block">across India</span>
            </p>

            <div
              className={`mt-3 flex gap-1 ${isDesktop ? 'max-w-md' : 'max-w-[10.75rem] gap-0.5'}`}
            >
              {HERO_TRUST_BADGES.map(
                ({ title, subtitle, icon: Icon, badgeBg, iconWrap, iconColor }) => (
                  <div
                    key={title}
                    className={`flex min-w-0 flex-1 items-center rounded ${
                      isDesktop ? 'gap-2 px-2 py-1.5' : 'gap-0.5 px-0.5 py-0.5'
                    } ${badgeBg}`}
                  >
                    <div
                      className={`flex shrink-0 items-center justify-center rounded-full ${iconWrap} ${
                        isDesktop ? 'h-9 w-9' : 'h-5 w-5'
                      }`}
                    >
                      <Icon
                        size={isDesktop ? 18 : 10}
                        className={iconColor}
                        strokeWidth={2.5}
                      />
                    </div>
                    <div className="min-w-0 leading-[1.05]">
                      <p
                        className={`font-bold text-[#0f172a] ${
                          isDesktop ? 'text-sm' : 'text-[8px]'
                        }`}
                      >
                        {title}
                      </p>
                      <p className={isDesktop ? 'text-xs text-[#94a3b8]' : 'text-[6px] text-[#94a3b8]'}>
                        {subtitle}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <div className={`${isDesktop ? 'mt-6 max-w-xl' : 'mt-3 px-4'}`}>
          <div className="overflow-hidden rounded-2xl border border-gray-100/80 bg-white text-left shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
            <div
              className={`flex items-center gap-2 border-b border-gray-100 ${
                isDesktop ? 'px-4 py-3.5' : 'px-3.5 py-3'
              }`}
            >
              <Search
                size={isDesktop ? 20 : 18}
                className="shrink-0 text-[#94a3b8]"
                strokeWidth={2}
              />
              <input
                type="text"
                value={manualQuery}
                onChange={(e) => onQueryChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                placeholder="Search anything... (e.g. Dentist, CA, Gym, Salon)"
                className={`min-w-0 flex-1 border-none bg-transparent text-[#334155] placeholder:text-[#94a3b8] focus:ring-0 ${
                  isDesktop ? 'text-[15px]' : 'text-[13px]'
                }`}
              />
              <button
                type="button"
                className="shrink-0 p-0.5 text-[#94a3b8]"
                aria-label="Voice search"
              >
                <Mic size={isDesktop ? 20 : 18} strokeWidth={2} />
              </button>
            </div>

            <div
              className={`flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-gray-100 ${
                isDesktop ? 'px-4 py-3' : 'px-3.5 py-2.5'
              }`}
            >
              <MapPin
                size={isDesktop ? 18 : 17}
                className="shrink-0 text-[#2563eb]"
                strokeWidth={2.25}
              />
              <span className={`font-semibold text-[#1e293b] ${isDesktop ? 'text-sm' : 'text-[13px]'}`}>
                New Delhi
              </span>
              <div className="ml-auto flex min-w-0 items-center gap-1">
                <button
                  type="button"
                  className={`flex items-center gap-1 font-medium text-[#2563eb] ${
                    isDesktop ? 'text-xs' : 'text-[11px]'
                  }`}
                >
                  <LocateFixed size={isDesktop ? 14 : 13} strokeWidth={2.25} />
                  <span className="whitespace-nowrap">Use my current location</span>
                </button>
                <ChevronDown size={isDesktop ? 16 : 15} className="shrink-0 text-[#94a3b8]" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSearch()}
              className={`flex w-full items-center justify-center gap-2 bg-[#2563eb] font-bold text-white active:bg-[#1d4ed8] ${
                isDesktop ? 'py-4 text-base' : 'py-3.5 text-[15px]'
              }`}
            >
              <Search size={isDesktop ? 20 : 18} strokeWidth={2.5} />
              Search
            </button>
          </div>
        </div>

        <div className={`${isDesktop ? 'mt-8 max-w-4xl' : 'mt-5 px-4'}`}>
          <div className="mb-3 flex items-center justify-between">
            <h2
              className={`font-bold text-[#0f172a] ${isDesktop ? 'text-lg' : 'text-[15px]'}`}
            >
              Popular Searches
            </h2>
            <button
              type="button"
              onClick={() => onSearch()}
              className={`flex items-center gap-0.5 font-semibold text-[#2563eb] ${
                isDesktop ? 'text-sm' : 'text-[13px]'
              }`}
            >
              View All
              <ChevronRight size={isDesktop ? 18 : 16} strokeWidth={2.25} />
            </button>
          </div>
          <div
            className={`flex gap-2 ${isDesktop ? 'flex-wrap' : 'scrollbar-hide overflow-x-auto pb-0.5'}`}
          >
            {POPULAR_SEARCHES.map(({ term, icon: Icon, iconColor }) => (
              <button
                key={term}
                type="button"
                onClick={() => onSearch(term)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-white font-semibold text-[#334155] shadow-[0_1px_3px_rgba(0,0,0,0.06)] ${
                  isDesktop ? 'px-4 py-2.5 text-sm' : 'px-3.5 py-2 text-[12px]'
                }`}
              >
                <Icon
                  size={isDesktop ? 16 : 15}
                  className={`shrink-0 ${iconColor}`}
                  strokeWidth={2}
                />
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
