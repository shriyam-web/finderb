'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  ChevronRight,
  TrendingUp,
  Star,
  Check,
  ShieldCheck,
  MessageSquare,
  RefreshCw,
  Phone,
  Grid3X3,
} from 'lucide-react';
import CategoryIcon from '@/components/CategoryIcon';
import HomeHero from '@/components/HomeHero';
import { Business, Category } from '@/lib/mockData';

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
      <HomeHero
        variant="mobile"
        manualQuery={manualQuery}
        onQueryChange={onQueryChange}
        onSearch={onSearch}
      />

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

      {/* Meet FinderB AI banner */}
      <section className="mt-1 px-4 pb-1">
        <Link href="/?tab=ai" className="block">
          <Image
            src="/meet-ai.png"
            alt="Meet FinderB AI — Your smart assistant to find the best businesses near you"
            width={1200}
            height={320}
            className="h-auto w-full"
            sizes="(max-width: 1024px) 100vw, 400px"
          />
        </Link>
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
