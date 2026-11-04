'use client';

import Link from 'next/link';
import { ArrowRight, ChevronDown, Shield, TrendingUp, Users } from 'lucide-react';
import { MerchantAuthMain } from '@/components/business/MerchantAuthShell';
import { formatInr, PRICING_PLANS } from '@/lib/pricing/growthPro';
import { useSitePricing } from '@/components/SiteConfigProvider';

const HERO_POINTS = [
  { icon: Shield, label: 'No hidden fees' },
  { icon: TrendingUp, label: 'Upgrade when you need leads' },
] as const;

export default function PricingHero({ alreadyOnStarter = false }: { alreadyOnStarter?: boolean }) {
  const live = useSitePricing();
  const heroStats = [
    { value: '500+', label: 'Local listings' },
    { value: '1K+', label: 'Monthly searches' },
    { value: `${live.annualDiscount}%`, label: 'Max savings' },
  ];
  const scrollToPlans = () => {
    document.getElementById('pricing-plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="pricing-hero relative overflow-hidden border-b border-[#e8dfd4]/90">
      <div className="register-hero-bg pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pricing-hero-grid pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 top-0 h-[28rem] w-[28rem] rounded-full bg-[#f9b864]/25 blur-[120px]"
        aria-hidden
      />

      <MerchantAuthMain className="relative z-10 pb-6 pt-24 sm:pb-8 sm:pt-28">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          {/* Copy */}
          <div className="max-w-xl lg:max-w-none">
            <h1 className="pricing-hero-title text-[2.35rem] font-bold leading-[1.1] tracking-[-0.03em] text-[#0a1520] sm:text-5xl lg:text-[3.4rem]">
              Simple pricing for businesses that want to{' '}
              <span className="register-hero-headline-accent">grow locally</span>
            </h1>
            <p className="mt-5 max-w-lg text-[1.05rem] leading-[1.65] text-[#4a5568] sm:text-lg">
              You&apos;re on <strong className="font-semibold text-[#0a1520]">Starter</strong>{' '}
              by default. Move to Growth or Pro when you need leads, a verified badge, and priority
              placement in search.
            </p>

            <ul className="mt-7 flex flex-wrap gap-2.5">
              {HERO_POINTS.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-white/90 px-3.5 py-2 text-sm font-medium text-[#334155] backdrop-blur-sm"
                >
                  <Icon size={15} className="shrink-0 text-[#153551]" strokeWidth={2} />
                  {label}
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              {alreadyOnStarter ? (
                <button
                  type="button"
                  onClick={scrollToPlans}
                  className="register-hero-cta-btn inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-bold text-[#153551]"
                >
                  Upgrade
                  <ArrowRight size={16} strokeWidth={2.5} />
                </button>
              ) : (
                <Link
                  href="/business/register"
                  className="register-hero-cta-btn inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-bold text-[#153551]"
                >
                  Start for free
                  <ArrowRight size={16} strokeWidth={2.5} />
                </Link>
              )}
              <button
                type="button"
                onClick={scrollToPlans}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d4dde8] bg-white/80 px-7 py-3.5 text-sm font-semibold text-[#153551] transition-colors hover:border-[#153551]/30 hover:bg-white"
              >
                Compare plans
                <ChevronDown size={16} strokeWidth={2.25} />
              </button>
            </div>

            <div className="mt-10 flex items-center gap-3 text-sm text-[#64748b]">
              <Users size={16} className="shrink-0 text-[#153551]" strokeWidth={2} />
              <span>
                Join <strong className="font-semibold text-[#0a1520]">500+</strong> local businesses
                already using FinderB
              </span>
            </div>
          </div>

          {/* Snapshot card */}
          <div className="pricing-hero-card mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
            <div className="mb-5 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[#0a1520]">Plan snapshot</p>
              <span className="rounded-full bg-[#fff4e6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#c1621a]">
                Early bird pricing
              </span>
            </div>

            <div className="space-y-0 divide-y divide-[#eef2f6]">
              <div className="flex items-center justify-between gap-4 py-4 first:pt-0">
                <div>
                  <p className="font-semibold text-[#0a1520]">{PRICING_PLANS.free.name}</p>
                  <p className="mt-0.5 text-xs text-[#64748b]">Your current plan</p>
                </div>
                <p className="text-lg font-bold tabular-nums text-[#0a1520]">{formatInr(0)}</p>
              </div>

              <div className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-semibold text-[#0a1520]">{PRICING_PLANS.monthly.name}</p>
                  <p className="mt-0.5 text-xs font-medium text-[#c1621a]">
                    {live.monthlyDiscount}% off MRP
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#94a3b8] line-through tabular-nums">
                    {formatInr(live.growthMonthlyRetail)}
                  </p>
                  <p className="text-lg font-bold tabular-nums text-[#153551]">
                    {formatInr(live.growthMonthly)}
                    <span className="text-sm font-medium text-[#64748b]">/mo</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-semibold text-[#0a1520]">{PRICING_PLANS.annual.name}</p>
                  <p className="mt-0.5 text-xs text-[#64748b]">Lowest effective monthly rate</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold tabular-nums text-[#153551]">
                    {formatInr(live.annualPerMonth)}
                    <span className="text-sm font-medium text-[#64748b]">/mo</span>
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium text-[#94a3b8]">annual package only</p>
                </div>
              </div>
            </div>

            <p className="mt-5 border-t border-[#eef2f6] pt-4 text-xs leading-relaxed text-[#64748b]">
              All paid plans include leads, verified badge, priority search placement, and full
              analytics. Prices in INR · GST as applicable.
            </p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="pricing-hero-stats mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#e8dfd4] bg-[#e8dfd4] sm:grid-cols-3">
          {heroStats.map(({ value, label }) => (
            <div key={label} className="bg-white/95 px-5 py-5 text-center sm:py-6">
              <p className="text-2xl font-bold tabular-nums tracking-tight text-[#153551] sm:text-[1.65rem]">
                {value}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[#64748b]">
                {label}
              </p>
            </div>
          ))}
        </div>
      </MerchantAuthMain>
    </section>
  );
}
