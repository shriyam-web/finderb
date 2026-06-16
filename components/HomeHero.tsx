'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import {
  Search,
  MapPin,
  ChevronDown,
  ChevronRight,
  Mic,
  RefreshCw,
} from 'lucide-react';
import { HERO_TRUST_BADGES, POPULAR_SEARCHES, HERO_CITIES_BY_STATE, isHeroCitySelected } from '@/lib/homeHeroConstants';
import { useUserLocationState } from '@/hooks/useUserCoords';

type HomeHeroProps = {
  variant: 'mobile' | 'desktop';
  manualQuery: string;
  onQueryChange: (value: string) => void;
  onSearch: (query?: string) => void;
  onVoiceSearch?: () => void;
  voiceActive?: boolean;
};

function HeroLocationField({ compact = false }: { compact?: boolean }) {
  const {
    effectiveSearchLocation,
    isLocating,
    isResolvingCity,
    requestLocation,
    setSearchLocation,
  } = useUserLocationState();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);

  const isPending = isLocating || isResolvingCity;
  const label = effectiveSearchLocation || (isPending ? 'Detecting…' : 'Near you');
  const showRetry = !effectiveSearchLocation && !isPending;

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateDropdownPosition = () => {
    const el = rootRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const viewportPadding = 12;
    const preferredWidth = compact ? rect.width : Math.min(256, rect.width);
    const maxWidth = window.innerWidth - viewportPadding * 2;
    const width = Math.min(preferredWidth, maxWidth);
    let left = rect.left;

    if (left + width > window.innerWidth - viewportPadding) {
      left = window.innerWidth - viewportPadding - width;
    }
    left = Math.max(viewportPadding, left);

    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 8,
      left,
      width,
      zIndex: 10000,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;

    updateDropdownPosition();

    const onScrollOrResize = () => updateDropdownPosition();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [open, compact]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest('[data-hero-location-dropdown]')) return;
      setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const handleUseMyLocation = () => {
    setSearchLocation(null);
    requestLocation();
    setOpen(false);
  };

  const handlePickCity = (city: string) => {
    setSearchLocation(city);
    setOpen(false);
  };

  const dropdown = open ? (
    <div
      data-hero-location-dropdown
      role="listbox"
      aria-label="Choose location"
      style={dropdownStyle}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5"
    >
      <button
        type="button"
        onClick={handleUseMyLocation}
        className="flex w-full items-center gap-2 border-b border-slate-100 px-3 py-2.5 text-left text-xs font-semibold text-[#2563eb] transition-colors hover:bg-blue-50"
      >
        <MapPin size={14} strokeWidth={2.25} />
        Use my current location
      </button>
      <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Choose city
      </p>
      <ul className="max-h-64 overflow-y-auto pb-1">
        {HERO_CITIES_BY_STATE.map((group) => (
          <li key={group.state}>
            <p className="sticky top-0 z-[1] border-b border-slate-100 bg-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {group.state}
            </p>
            <ul>
              {group.cities.map((city) => {
                const selected = isHeroCitySelected(effectiveSearchLocation, city);
                return (
                  <li key={`${group.state}-${city}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => handlePickCity(city)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 ${
                        selected ? 'bg-blue-50/80 font-semibold text-[#2563eb]' : 'text-slate-700'
                      }`}
                    >
                      <MapPin size={13} className={selected ? 'text-[#2563eb]' : 'text-slate-400'} />
                      {city}
                    </button>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  ) : null;

  return (
    <div ref={rootRef} className={`relative z-20 min-w-0 ${compact ? 'flex-1' : ''}`}>
      <div className={`flex items-center gap-1.5 ${compact ? 'w-full' : ''}`}>
        <MapPin
          size={compact ? 17 : 16}
          className="shrink-0 text-[#2563eb]"
          strokeWidth={2.25}
        />
        <span
          className={`min-w-0 flex-1 truncate font-semibold text-[#1e293b] ${
            compact ? 'text-[13px]' : 'text-sm'
          } ${showRetry ? 'text-[#64748b]' : ''}`}
          title={label}
        >
          {label}
        </span>
        {showRetry ? (
          <button
            type="button"
            onClick={requestLocation}
            className={`inline-flex shrink-0 items-center gap-1 rounded-md font-semibold text-[#2563eb] transition-colors hover:bg-[#2563eb]/10 ${
              compact ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs'
            }`}
          >
            <RefreshCw size={compact ? 12 : 13} strokeWidth={2.25} />
            Retry
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-label="Change search location"
            className={`inline-flex shrink-0 items-center justify-center rounded-md text-[#64748b] transition-colors hover:bg-slate-100 hover:text-[#2563eb] ${
              compact ? 'h-7 w-7' : 'h-8 w-8'
            } ${open ? 'bg-slate-100 text-[#2563eb]' : ''}`}
          >
            <ChevronDown
              size={compact ? 15 : 14}
              className={`transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>

      {mounted && dropdown ? createPortal(dropdown, document.body) : null}
    </div>
  );
}

export default function HomeHero({
  variant,
  manualQuery,
  onQueryChange,
  onSearch,
  onVoiceSearch,
  voiceActive = false,
}: HomeHeroProps) {
  const isDesktop = variant === 'desktop';

  return (
    <section
      className={`relative overflow-visible bg-gradient-to-b from-white via-[#f5f9ff] to-[#e8f2fc] ${
        isDesktop ? 'hidden lg:block' : 'lg:hidden'
      } ${isDesktop ? 'pb-10' : 'pb-6'}`}
    >
      <div
        className={`pointer-events-none absolute right-0 z-[1] ${
          isDesktop
            ? 'top-24 bottom-32 w-[min(42%,460px)]'
            : 'top-[4.5rem] bottom-48 w-[min(44vw,188px)]'
        }`}
        aria-hidden
      >
        <div className="relative h-full w-full pb-3">
          <Image
            src="/hero-new.png"
            alt=""
            fill
            className="object-contain object-right object-bottom"
            sizes={isDesktop ? '(min-width: 1024px) 42vw, 44vw' : '44vw'}
            priority
          />
        </div>
      </div>

      <div
        className={`relative z-[2] ${isDesktop ? 'mx-auto max-w-7xl px-8 pb-2 pt-28' : 'pt-[4.5rem]'}`}
      >
        <div className={isDesktop ? 'relative max-w-2xl' : 'pl-4 pr-1'}>
          <div className={isDesktop ? '' : 'max-w-[62%]'}>
            {isDesktop ? (
              <h1 className="text-left text-[36px] font-extrabold leading-tight tracking-tight text-[#0f172a]">
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
                isDesktop ? 'mt-1.5 text-base leading-snug' : 'mt-1 text-[12px] leading-snug'
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

            {isDesktop && (
              <div className="mt-3 flex max-w-md gap-1">
                {HERO_TRUST_BADGES.map(
                  ({ title, subtitle, icon: Icon, badgeBg, iconWrap, iconColor }) => (
                    <div
                      key={title}
                      className={`flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1.5 py-1 ${badgeBg}`}
                    >
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${iconWrap}`}
                      >
                        <Icon size={14} className={iconColor} strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0 leading-[1.05]">
                        <p className="text-[11px] font-bold text-[#0f172a]">{title}</p>
                        <p className="text-[10px] text-[#94a3b8]">{subtitle}</p>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        <div className={`${isDesktop ? 'mt-4 max-w-2xl' : 'mt-3 px-4'} relative z-30`}>
          {isDesktop ? (
            <div className="relative z-30 flex items-stretch overflow-visible rounded-xl border border-gray-100/80 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.07)]">
              <div className="flex min-w-0 flex-[1.4] items-center gap-2 border-r border-gray-100 px-3.5 py-2.5">
                <Search size={18} className="shrink-0 text-[#94a3b8]" strokeWidth={2} />
                <input
                  type="text"
                  value={manualQuery}
                  disabled={voiceActive}
                  onChange={(e) => onQueryChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !voiceActive && onSearch()}
                  placeholder="Search anything... (e.g. Dentist, CA, Gym, Salon)"
                  className="min-w-0 flex-1 border-none bg-transparent text-sm text-[#334155] placeholder:text-[#94a3b8] focus:ring-0 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={onVoiceSearch}
                  aria-label={voiceActive ? 'Stop voice search' : 'Start voice search'}
                  className={`shrink-0 rounded-lg p-1 transition-all ${
                    voiceActive
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'text-[#94a3b8] hover:bg-slate-50 hover:text-[#2563eb]'
                  }`}
                >
                  <Mic size={17} strokeWidth={2} className={voiceActive ? 'animate-bounce' : ''} />
                </button>
              </div>
              <div className="relative z-30 flex min-w-0 flex-[1.1] items-center overflow-visible border-r border-gray-100 px-3.5 py-2.5">
                <HeroLocationField />
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
            <div className="relative z-30 overflow-visible rounded-2xl border border-gray-100/80 bg-white text-left shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-2 border-b border-gray-100 px-3.5 py-3">
                <Search size={18} className="shrink-0 text-[#94a3b8]" strokeWidth={2} />
                <input
                  type="text"
                  value={manualQuery}
                  disabled={voiceActive}
                  onChange={(e) => onQueryChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !voiceActive && onSearch()}
                  placeholder="Search anything... (e.g. Dentist, CA, Gym, Salon)"
                  className="min-w-0 flex-1 border-none bg-transparent text-[13px] text-[#334155] placeholder:text-[#94a3b8] focus:ring-0 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={onVoiceSearch}
                  aria-label={voiceActive ? 'Stop voice search' : 'Start voice search'}
                  className={`shrink-0 rounded-lg p-1 transition-all ${
                    voiceActive
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'text-[#94a3b8] hover:bg-slate-50 hover:text-[#2563eb]'
                  }`}
                >
                  <Mic size={18} strokeWidth={2} className={voiceActive ? 'animate-bounce' : ''} />
                </button>
              </div>

              <div className="border-b border-gray-100 px-3.5 py-2.5">
                <HeroLocationField compact />
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