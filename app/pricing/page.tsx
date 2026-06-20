'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  CompareCell,
  CurrentPlanBadge,
  EarlyBirdAppliedBadge,
  PricingCtaButton,
  PricingPlanCard,
} from '@/components/pricing/PricingPlanCard';
import { PricingPlanIcon } from '@/components/pricing/PricingPlanIcon';
import PricingHero from '@/components/pricing/PricingHero';
import { MerchantAuthMain } from '@/components/business/MerchantAuthShell';
import {
  formatInr,
  FREE_LISTING_INCLUDED,
  FREE_LISTING_LOCKED,
  GROWTH_PRO_ANNUAL_DISCOUNT_PERCENT,
  GROWTH_PRO_EFFECTIVE_MONTHLY_ANNUAL,
  GROWTH_PRO_FEATURES,
  GROWTH_PRO_MONTHLY_DISCOUNT_PERCENT,
  GROWTH_PRO_OFFER_ANNUAL,
  GROWTH_PRO_OFFER_MONTHLY,
  GROWTH_PRO_RETAIL_ANNUAL,
  GROWTH_PRO_RETAIL_MONTHLY,
  PLAN_COMPARE_ROWS,
  PRICING_PLANS,
} from '@/lib/pricing/growthPro';

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<'monthly' | 'annual' | null>(null);

  const handlePayment = (plan: 'monthly' | 'annual') => {
    setLoadingPlan(plan);
    setTimeout(() => {
      setLoadingPlan(null);
      window.location.href = `/business/register?plan=pro&billing=${plan}`;
    }, 1000);
  };

  return (
    <div className="pricing-page min-h-screen">
      {loadingPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#faf8f5]/95 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#f9b864] border-t-[#153551]" />
        </div>
      )}

      <PricingHero />

      {/* Plans */}
      <section id="pricing-plans" className="relative scroll-mt-24 py-12 sm:py-16">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#f5f2ed] via-[#faf8f5] to-[#fff9ed]" aria-hidden />
        <MerchantAuthMain className="relative z-10">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="pricing-section-title text-2xl font-bold tracking-[-0.02em] text-[#0a1520] sm:text-3xl">
                Pick your plan
              </h2>
              <p className="mt-1.5 text-sm font-medium text-[#5c4a3d]">
                Up to{' '}
                <span className="font-extrabold text-[#c1621a]">{GROWTH_PRO_ANNUAL_DISCOUNT_PERCENT}% off</span>{' '}
                MRP · limited launch pricing
              </p>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#a89888]">
              INR · GST applicable
            </p>
          </div>

          <div className="pricing-plans-grid grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch lg:gap-5">
            <PricingPlanCard
              tone="free"
              badge={<CurrentPlanBadge />}
              icon={<PricingPlanIcon tone="free" />}
              name={PRICING_PLANS.free.name}
              tagline={PRICING_PLANS.free.tagline}
              price={
                <p className="pricing-price text-[2.75rem] font-extrabold leading-none tracking-tight text-[#0a1520] tabular-nums sm:text-5xl">
                  {formatInr(0)}
                </p>
              }
              featuresHeading="Included on Starter:"
              includedFeatures={FREE_LISTING_INCLUDED}
              lockedFeatures={FREE_LISTING_LOCKED}
            />

            <PricingPlanCard
              tone="monthly"
              badge={<EarlyBirdAppliedBadge />}
              discountPercent={GROWTH_PRO_MONTHLY_DISCOUNT_PERCENT}
              icon={<PricingPlanIcon tone="monthly" />}
              name={PRICING_PLANS.monthly.name}
              tagline={PRICING_PLANS.monthly.tagline}
              price={
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/45 line-through tabular-nums">
                    {formatInr(GROWTH_PRO_RETAIL_MONTHLY)}/mo
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
                    <span className="pricing-price text-[2.75rem] font-extrabold leading-none tracking-tight text-[#f9b864] tabular-nums sm:text-5xl">
                      {formatInr(GROWTH_PRO_OFFER_MONTHLY)}
                    </span>
                    <span className="text-sm font-bold uppercase tracking-wide text-white/60">/mo</span>
                  </div>
                </div>
              }
              featuresHeading="Everything in Starter, plus:"
              includedFeatures={GROWTH_PRO_FEATURES}
              cta={
                <PricingCtaButton
                  variant="navy"
                  disabled={loadingPlan !== null}
                  onClick={() => handlePayment('monthly')}
                >
                  {loadingPlan === 'monthly' ? 'Please wait…' : PRICING_PLANS.monthly.cta}
                </PricingCtaButton>
              }
            />

            <div className="pricing-plan-spotlight">
              <PricingPlanCard
                tone="annual"
                highlighted
                badge={<EarlyBirdAppliedBadge />}
                discountPercent={GROWTH_PRO_ANNUAL_DISCOUNT_PERCENT}
                icon={<PricingPlanIcon tone="annual" />}
                name={PRICING_PLANS.annual.name}
                tagline={PRICING_PLANS.annual.tagline}
                price={
                  <div>
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="pricing-price text-[2.85rem] font-extrabold leading-none tracking-tight text-[#f9b864] tabular-nums sm:text-[3.15rem]">
                        {formatInr(GROWTH_PRO_EFFECTIVE_MONTHLY_ANNUAL)}
                      </span>
                      <span className="text-sm font-bold uppercase tracking-wide text-white/70">/mo</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-baseline gap-x-2 text-sm sm:text-base">
                      <span className="font-semibold text-white/45 line-through tabular-nums">
                        {formatInr(GROWTH_PRO_RETAIL_ANNUAL)}/yr
                      </span>
                      <span className="font-extrabold tabular-nums text-white">
                        {formatInr(GROWTH_PRO_OFFER_ANNUAL)}/yr
                      </span>
                    </div>
                  </div>
                }
                featuresHeading="Everything in Starter, plus:"
                includedFeatures={GROWTH_PRO_FEATURES}
                cta={
                  <PricingCtaButton
                    variant="glow"
                    disabled={loadingPlan !== null}
                    onClick={() => handlePayment('annual')}
                  >
                    {loadingPlan === 'annual' ? 'Please wait…' : PRICING_PLANS.annual.cta}
                  </PricingCtaButton>
                }
              />
            </div>
          </div>
        </MerchantAuthMain>
      </section>

      {/* Compare */}
      <section className="border-t border-[#e8dfd4]/80 bg-white py-14 sm:py-16">
        <MerchantAuthMain>
          <h2 className="pricing-section-title text-2xl font-bold tracking-[-0.02em] text-[#0a1520]">Compare plans</h2>
          <p className="mt-1.5 text-sm font-medium text-[#5c4a3d]">What you get at each tier</p>

          <div className="pricing-compare-wrap mt-8 overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="pricing-compare-head">
                  <th className="px-5 py-4 text-left text-sm font-bold text-white/80">Feature</th>
                  <th className="px-5 py-4 text-center">
                    <p className="text-sm font-extrabold text-white">{PRICING_PLANS.free.compareLabel}</p>
                    <p className="mt-0.5 text-xs font-medium text-white/55">{formatInr(0)}</p>
                  </th>
                  <th className="px-5 py-4 text-center">
                    <p className="text-sm font-extrabold text-white">{PRICING_PLANS.monthly.compareLabel}</p>
                    <p className="mt-0.5 text-xs font-medium text-white/55">
                      {formatInr(GROWTH_PRO_OFFER_MONTHLY)}/mo
                    </p>
                  </th>
                  <th className="pricing-compare-annual-col px-5 py-4 text-center">
                    <p className="pricing-compare-annual-label text-sm font-extrabold text-white">
                      {PRICING_PLANS.annual.compareLabel}
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-[#c1621a]">
                      {formatInr(GROWTH_PRO_EFFECTIVE_MONTHLY_ANNUAL)}/mo*
                    </p>
                  </th>
                </tr>
              </thead>
              <tbody>
                {PLAN_COMPARE_ROWS.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? 'bg-[#fffdf9]' : 'bg-white'}>
                    <td className="px-5 py-3.5 text-sm font-semibold text-[#0a1520]">{row.label}</td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex justify-center">
                        <CompareCell value={row.free} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex justify-center">
                        <CompareCell value={row.monthly} />
                      </div>
                    </td>
                    <td className="pricing-compare-annual-col px-5 py-3.5 text-center">
                      <div className="flex justify-center">
                        <CompareCell value={row.annual} highlight />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs font-medium text-[#a89888]">
            *{formatInr(GROWTH_PRO_EFFECTIVE_MONTHLY_ANNUAL)}/month when {formatInr(GROWTH_PRO_OFFER_ANNUAL)} is paid annually.
          </p>
        </MerchantAuthMain>
      </section>

      {/* Closing CTA */}
      <section className="pricing-close-cta py-16 sm:py-20">
        <MerchantAuthMain className="text-center">
          <h2 className="pricing-section-title text-2xl font-bold tracking-[-0.02em] text-white sm:text-4xl">
            Ready to grow?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/75 sm:text-base">
            Start free today — upgrade when you want leads at{' '}
            <span className="font-bold text-[#f9b864]">{formatInr(GROWTH_PRO_OFFER_MONTHLY)}/mo</span> or{' '}
            <span className="font-bold text-[#f9b864]">{formatInr(GROWTH_PRO_EFFECTIVE_MONTHLY_ANNUAL)}/mo</span>{' '}
            annual.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => handlePayment('annual')}
              disabled={loadingPlan !== null}
              className="register-hero-cta-btn inline-flex items-center gap-2 px-8 py-4 text-sm font-bold text-[#153551] disabled:opacity-60"
            >
              Claim annual plan
              <ArrowRight size={16} strokeWidth={2.5} />
            </button>
            <Link
              href="/business/register"
              className="inline-flex items-center justify-center rounded-xl border-2 border-white/25 px-8 py-4 text-sm font-bold text-white hover:bg-white/10"
            >
              List free first
            </Link>
          </div>
        </MerchantAuthMain>
      </section>
    </div>
  );
}
