'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  MapPin,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Star,
  Check,
  ShieldCheck,
  MessageSquare,
  RefreshCw,
  Phone,
  Grid3X3,
  Briefcase,
  Stethoscope,
  UtensilsCrossed,
  Dumbbell,
  Home,
  Scale,
  Car,
  Sparkles,
  Mic,
  LocateFixed,
  Scissors,
  Zap,
} from 'lucide-react';
import CategoryIcon from '@/components/CategoryIcon';
import { Business, Category } from '@/lib/mockData';

const MOBILE_POPULAR_SEARCHES = [
  { term: 'CA', icon: Briefcase, iconColor: 'text-blue-600' },
  { term: 'Dentist', icon: Stethoscope, iconColor: 'text-emerald-600' },
  { term: 'Restaurant', icon: UtensilsCrossed, iconColor: 'text-orange-500' },
  { term: 'Gym', icon: Dumbbell, iconColor: 'text-violet-600' },
  { term: 'Salon', icon: Scissors, iconColor: 'text-pink-500' },
  { term: 'PG', icon: Home, iconColor: 'text-slate-600' },
  { term: 'Lawyer', icon: Scale, iconColor: 'text-slate-600' },
  { term: 'Car Service', icon: Car, iconColor: 'text-slate-600' },
  { term: 'Makeup Artist', icon: Sparkles, iconColor: 'text-slate-600' },
];

const HERO_TRUST_BADGES = [
  {
    title: 'Trusted',
    subtitle: 'Verified Listings',
    icon: ShieldCheck,
    badgeBg: 'bg-blue-50',
    iconWrap: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    title: 'Local',
    subtitle: 'Near You',
    icon: MapPin,
    badgeBg: 'bg-emerald-50',
    iconWrap: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    title: 'Fast',
    subtitle: 'Quick Results',
    icon: Zap,
    badgeBg: 'bg-amber-50',
    iconWrap: 'bg-amber-100',
    iconColor: 'text-amber-500',
  },
] as const;

const MOBILE_TRENDING = [
  { label: 'Best Cafes in Delhi', trend: 12 },
  { label: 'CA Services Near You', trend: 7 },
  { label: 'Home Interior Designers', trend: 15 },
  { label: 'PG in Delhi', trend: 5 },
];

type MobileHomeProps = {
  manualQuery: string;
  onQueryChange: (value: string) => void;
  onSearch: (query?: string) => void;
  categories: Category[];
  businesses: Business[];
  isBusinessesLoading: boolean;
};

export default function MobileHome({
  manualQuery,
  onQueryChange,
  onSearch,
  categories,
  businesses,
  isBusinessesLoading,
}: MobileHomeProps) {
  const gridCategories = categories.slice(0, 7);
  const featured = businesses.slice(0, 6);

  return (
    <div className="lg:hidden bg-white">
      {/* Hero — matches hero-new mock */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#f4f8ff] to-white pb-5">
        {/* Illustration: flush right, no gap */}
        <div
          className="pointer-events-none absolute right-0 top-[3.5rem] z-[1] h-[252px] w-[min(68vw,320px)]"
          aria-hidden
        >
          <div className="relative h-full w-full origin-right scale-[1.12]">
            <Image
              src="/hero-new.png"
              alt=""
              fill
              className="object-contain object-right"
              sizes="68vw"
              priority
            />
          </div>
        </div>

        <div className="relative z-[2] pt-[4.5rem]">
          <div className="pl-4 pr-1">
            <div className="max-w-[54%]">
              <h1 className="text-left text-[21px] font-extrabold leading-[1.12] tracking-tight text-[#0f172a]">
                Find trusted{' '}
                <span className="text-[#2563eb]">businesses near you</span>
              </h1>
              <p className="mt-1 text-left text-[12px] leading-snug text-[#64748b]">
                Search millions of listings across India
              </p>

              <div className="mt-3 flex gap-1">
                {HERO_TRUST_BADGES.map(
                  ({ title, subtitle, icon: Icon, badgeBg, iconWrap, iconColor }) => (
                    <div
                      key={title}
                      className={`flex min-w-0 flex-1 items-center gap-1 rounded-md px-1 py-1 ${badgeBg}`}
                    >
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${iconWrap}`}
                      >
                        <Icon size={12} className={iconColor} strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0 leading-none">
                        <p className="text-[9px] font-bold text-[#0f172a]">{title}</p>
                        <p className="mt-px truncate text-[7px] text-[#94a3b8]">{subtitle}</p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 px-4">
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
              <button type="button" className="shrink-0 p-0.5 text-[#94a3b8]" aria-label="Voice search">
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
          </div>

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
              {MOBILE_POPULAR_SEARCHES.map(({ term, icon: Icon, iconColor }) => (
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
        </div>
      </section>

      {/* Popular Categories */}
      <section className="mt-2 bg-white px-4 py-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-[#0f2a4a]">Popular Categories</h2>
          <Link href="/categories" className="text-[13px] font-medium text-[#2563eb]">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {gridCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories?id=${cat.id}`}
              className="flex flex-col items-center rounded-xl border border-gray-100 bg-white px-1 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
            >
              <div className="mb-2 flex h-10 w-10 items-center justify-center">
                <CategoryIcon
                  icon={cat.icon}
                  name={cat.name}
                  size={36}
                  className="h-9 w-9"
                  imageClassName="object-contain"
                />
              </div>
              <p className="line-clamp-2 text-center text-[11px] font-semibold leading-tight text-[#334155]">
                {cat.name}
              </p>
            </Link>
          ))}
          <Link
            href="/categories"
            className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white px-1 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f5f9]">
              <Grid3X3 size={22} className="text-[#64748b]" />
            </div>
            <p className="text-center text-[11px] font-semibold text-[#334155]">More</p>
          </Link>
        </div>
      </section>

      {/* Trending */}
      <section className="mt-2 px-4 py-2">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-1 text-[15px] font-bold text-[#0f2a4a]">
              Trending This Week
              <span aria-hidden>🔥</span>
            </h2>
            <Link href="/categories" className="text-[13px] font-medium text-[#2563eb]">
              View All
            </Link>
          </div>
          <ul className="divide-y divide-gray-100">
            {MOBILE_TRENDING.map((item, idx) => (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() => onSearch(item.label)}
                  className="flex w-full items-center gap-2 py-3 text-left"
                >
                  <span className="w-4 shrink-0 text-xs font-medium text-[#94a3b8]">{idx + 1}</span>
                  <span className="min-w-0 flex-1 text-[13px] font-medium text-[#334155]">
                    {item.label}
                  </span>
                  <span className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-[#22c55e]">
                    <TrendingUp size={12} strokeWidth={2.5} />
                    {item.trend}%
                  </span>
                  <ChevronRight size={14} className="shrink-0 text-[#cbd5e1]" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Featured Verified */}
      <section className="mt-3 bg-white px-4 py-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-[#0f2a4a]">Featured Verified Businesses</h2>
          <Link href="/categories" className="text-[13px] font-medium text-[#2563eb]">
            View All
          </Link>
        </div>
        <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
          {isBusinessesLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[220px] w-[200px] shrink-0 animate-pulse rounded-xl bg-gray-100"
                />
              ))
            : featured.map((biz) => (
                <Link
                  key={biz.id}
                  href={`/business/${biz.id}`}
                  className="w-[200px] shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                >
                  <div className="relative h-[110px]">
                    <Image
                      src={biz.profilePictureUrl || biz.image || '/fallback.jpg'}
                      alt={biz.name}
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                    <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded bg-[#22c55e] px-1.5 py-0.5">
                      <Check size={9} className="text-white" strokeWidth={3} />
                      <span className="text-[8px] font-bold uppercase text-white">Verified</span>
                    </div>
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="line-clamp-1 text-[13px] font-bold text-[#0f2a4a]">{biz.name}</p>
                    <p className="line-clamp-1 text-[11px] text-[#94a3b8]">{biz.category}</p>
                    <div className="flex items-center gap-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={10}
                            className={
                              s <= Math.round(biz.rating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-gray-200 text-gray-200'
                            }
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-medium text-[#475569]">
                        {biz.rating}{' '}
                        <span className="text-[#94a3b8]">({biz.reviewsCount ?? 0})</span>
                      </span>
                    </div>
                    <div className="flex items-start gap-1 text-[10px] text-[#94a3b8]">
                      <MapPin size={11} className="mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{biz.location}</span>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </section>

      {/* Trust icons */}
      <section className="bg-white px-4 pb-3 pt-3">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Verified\nBusinesses', icon: ShieldCheck, bg: 'bg-blue-50', color: 'text-blue-600' },
            { label: 'Real Customer\nReviews', icon: MessageSquare, bg: 'bg-emerald-50', color: 'text-emerald-600' },
            { label: 'Updated\nDaily', icon: RefreshCw, bg: 'bg-violet-50', color: 'text-violet-600' },
            { label: 'Instant\nContact', icon: Phone, bg: 'bg-orange-50', color: 'text-orange-500' },
          ].map(({ label, icon: Icon, bg, color }) => (
            <div key={label} className="flex flex-col items-center text-center">
              <div className={`mb-1.5 flex h-10 w-10 items-center justify-center rounded-full ${bg}`}>
                <Icon size={18} className={color} />
              </div>
              <p className="whitespace-pre-line text-[9px] font-semibold leading-tight text-[#475569]">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
