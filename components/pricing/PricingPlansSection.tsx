'use client';

import {
  CompareCell,
  CurrentPlanBadge,
  EarlyBirdAppliedBadge,
  PricingCtaButton,
  PricingPlanCard,
} from '@/components/pricing/PricingPlanCard';
import { PricingPlanIcon } from '@/components/pricing/PricingPlanIcon';
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

export type PricingPlansSectionProps = {
  mode?: 'pricing' | 'register';
  loadingPlan?: 'monthly' | 'annual' | null;
  onChoosePro?: (billing: 'monthly' | 'annual') => void;
  onChooseFree?: () => void;
  sectionId?: string;
};

export default function PricingPlansSection({
  mode = 'pricing',
  loadingPlan = null,
  onChoosePro,
  onChooseFree,
  sectionId = 'pricing-plans',
}: PricingPlansSectionProps) {
  const isRegister = mode === 'register';
  const sectionPad = isRegister ? 'pt-4 pb-3 sm:pt-5 sm:pb-4' : 'py-12 sm:py-16';
  const headerMb = isRegister ? 'mb-3' : 'mb-10';
  const comparePad = isRegister ? 'pt-3 pb-4 sm:pt-4 sm:pb-5' : 'py-14 sm:py-16';
  const plansGridGap = isRegister ? 'gap-4 lg:gap-4' : 'gap-6 lg:gap-5';

  const handlePro = (billing: 'monthly' | 'annual') => {
    onChoosePro?.(billing);
  };

  return (
    <>
      <section id={sectionId} className={`relative scroll-mt-24 ${sectionPad}`}>
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#f5f2ed] via-[#faf8f5] to-[#fff9ed]"
          aria-hidden
        />
        <MerchantAuthMain className="relative z-10">
          <div className={`${headerMb} flex flex-wrap items-end justify-between gap-4`}>
            <div>
              {!isRegister ? (
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#215481]">
                  Pricing
                </p>
              ) : null}
              <h2
                className={`pricing-section-title text-2xl font-bold tracking-[-0.02em] text-[#0a1520] sm:text-3xl ${
                  isRegister ? '' : 'mt-2'
                }`}
              >
                {isRegister ? 'Choose how you want to grow' : 'Pick your plan'}
              </h2>
              <p className="mt-1.5 text-sm font-medium text-[#5c4a3d]">
                {isRegister ? (
                  <>
                    Start with a listing, then upgrade anytime for leads and premium visibility — up to{' '}
                    <span className="font-extrabold text-[#c1621a]">{GROWTH_PRO_ANNUAL_DISCOUNT_PERCENT}% off</span>{' '}
                    launch pricing on Pro.
                  </>
                ) : (
                  <>
                    Up to{' '}
                    <span className="font-extrabold text-[#c1621a]">{GROWTH_PRO_ANNUAL_DISCOUNT_PERCENT}% off</span>{' '}
                    MRP · limited launch pricing
                  </>
                )}
              </p>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#a89888]">
              INR · GST applicable
            </p>
          </div>

          <div className={`pricing-plans-grid grid grid-cols-1 lg:grid-cols-3 lg:items-stretch ${plansGridGap}`}>
            <PricingPlanCard
              tone="free"
              badge={isRegister ? undefined : <CurrentPlanBadge />}
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
              cta={
                isRegister ? (
                  <PricingCtaButton variant="outline" onClick={onChooseFree}>
                    Get started
                  </PricingCtaButton>
                ) : undefined
              }
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
                  onClick={() => handlePro('monthly')}
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
                    onClick={() => handlePro('annual')}
                  >
                    {loadingPlan === 'annual' ? 'Please wait…' : PRICING_PLANS.annual.cta}
                  </PricingCtaButton>
                }
              />
            </div>
          </div>
        </MerchantAuthMain>
      </section>

      <section className={`border-t border-[#e8dfd4]/80 bg-white ${comparePad}`}>
        <MerchantAuthMain>
          <h2 className="pricing-section-title text-2xl font-bold tracking-[-0.02em] text-[#0a1520]">
            Compare plans
          </h2>
          <p className="mt-1.5 text-sm font-medium text-[#5c4a3d]">What you get at each tier</p>

          <div className={`${isRegister ? 'mt-3' : 'mt-8'} block sm:hidden`}>
            <div className="overflow-x-auto rounded-2xl border border-[#e8dfd4] bg-white shadow-[0_16px_48px_-28px_rgba(21,53,81,0.15)]">
              <table className="w-full min-w-[360px] border-collapse text-left">
                <thead>
                  <tr className="pricing-compare-head">
                    <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">
                      Feature
                    </th>
                    <th className="px-2 py-3 text-center">
                      <p className="text-[11px] font-extrabold text-white">{PRICING_PLANS.free.compareLabel}</p>
                      <p className="mt-0.5 text-[10px] font-medium text-white/55">{formatInr(0)}</p>
                    </th>
                    <th className="px-2 py-3 text-center">
                      <p className="text-[11px] font-extrabold text-white">{PRICING_PLANS.monthly.compareLabel}</p>
                      <p className="mt-0.5 text-[10px] font-medium text-white/55">
                        {formatInr(GROWTH_PRO_OFFER_MONTHLY)}/mo
                      </p>
                    </th>
                    <th className="pricing-compare-annual-col px-2 py-3 text-center">
                      <p className="pricing-compare-annual-label text-[11px] font-extrabold text-white">
                        {PRICING_PLANS.annual.compareLabel}
                      </p>
                      <p className="mt-0.5 text-[10px] font-bold text-[#c1621a]">
                        {formatInr(GROWTH_PRO_EFFECTIVE_MONTHLY_ANNUAL)}/mo*
                      </p>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PLAN_COMPARE_ROWS.map((row, i) => (
                    <tr key={row.label} className={i % 2 === 0 ? 'bg-[#fffdf9]' : 'bg-white'}>
                      <td className="px-3 py-2.5 text-[12px] font-semibold leading-5 text-[#0a1520]">
                        {row.label}
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <div className="flex justify-center">
                          <CompareCell value={row.free} />
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <div className="flex justify-center">
                          <CompareCell value={row.monthly} />
                        </div>
                      </td>
                      <td className="pricing-compare-annual-col px-2 py-2.5 text-center">
                        <div className="flex justify-center">
                          <CompareCell value={row.annual} highlight />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] font-medium text-[#a89888]">Swipe to compare plans</p>
          </div>

          <div className={`pricing-compare-wrap ${isRegister ? 'mt-3' : 'mt-8'} hidden overflow-x-auto rounded-2xl sm:block`}>
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
            *{formatInr(GROWTH_PRO_EFFECTIVE_MONTHLY_ANNUAL)}/month when {formatInr(GROWTH_PRO_OFFER_ANNUAL)} is paid
            annually.
          </p>
        </MerchantAuthMain>
      </section>
    </>
  );
}
