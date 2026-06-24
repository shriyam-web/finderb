'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { MerchantAuthMain } from '@/components/business/MerchantAuthShell';
import { MERCHANT_PLANS, type BillingCycle } from '@/lib/razorpay/plans';
import {
  EARLY_BIRD_BADGE_LABEL,
  formatInr,
  GROWTH_PRO_ANNUAL_DISCOUNT_PERCENT,
  GROWTH_PRO_EFFECTIVE_MONTHLY_ANNUAL,
  GROWTH_PRO_FEATURES,
  GROWTH_PRO_MONTHLY_DISCOUNT_PERCENT,
  GROWTH_PRO_OFFER_ANNUAL,
  GROWTH_PRO_OFFER_MONTHLY,
  GROWTH_PRO_RETAIL_ANNUAL,
  GROWTH_PRO_RETAIL_MONTHLY,
  PRICING_PLANS,
} from '@/lib/pricing/growthPro';

type BusinessSummary = {
  businessName?: string;
  registrationNumber?: string;
  paymentStatus?: string;
};

type MerchantPaymentCheckoutProps = {
  business: BusinessSummary;
  billingCycle: BillingCycle;
  onBillingChange: (cycle: BillingCycle) => void;
  paying: boolean;
  error: string;
  isAuthorized: boolean;
  razorpayConfigured: boolean;
  checkoutRequested: boolean;
  onPay: () => void;
  onBack: () => void;
};

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: '256-bit secure checkout' },
  { icon: Lock, label: 'Powered by Razorpay' },
  { icon: BadgeCheck, label: 'Cancel anytime' },
] as const;

function BillingOption({
  active,
  title,
  subtitle,
  price,
  retail,
  period,
  badge,
  discount,
  onSelect,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  price: string;
  retail: string;
  period: string;
  badge?: string;
  discount?: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative w-full rounded-2xl border-2 p-4 text-left transition-all sm:p-5 ${
        active
          ? 'border-[#153551] bg-gradient-to-br from-[#fff9ed] to-white shadow-[0_12px_40px_-20px_rgba(21,53,81,0.35)]'
          : 'border-[#e8dfd4] bg-white hover:border-[#153551]/25 hover:bg-[#fffdf9]'
      }`}
    >
      {badge && (
        <span className="absolute -top-2.5 right-4 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          {badge}
        </span>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#0a1520]">{title}</p>
          <p className="mt-0.5 text-xs text-[#5c4a3d]">{subtitle}</p>
        </div>
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
            active ? 'border-[#153551] bg-[#153551]' : 'border-[#d4c4b0] bg-white'
          }`}
        >
          {active && <span className="h-2 w-2 rounded-full bg-white" />}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-[#a89888] line-through tabular-nums">{retail}</p>
          <p className="mt-0.5 text-2xl font-extrabold tabular-nums text-[#153551]">
            {price}
            <span className="ml-1 text-sm font-bold text-[#5c4a3d]">{period}</span>
          </p>
        </div>
        {discount && (
          <span className="rounded-full bg-[#fff3e0] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#c1621a]">
            {discount}
          </span>
        )}
      </div>
    </button>
  );
}

export function MerchantPaymentLoading() {
  return (
    <div className="merchant-auth-page flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#153551]" />
        <p className="mt-4 text-sm font-semibold text-[#5c4a3d]">Preparing checkout…</p>
      </div>
    </div>
  );
}

export function MerchantPaymentError({
  message,
}: {
  message: string;
}) {
  return (
    <div className="merchant-auth-page flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
        <AlertCircle className="h-7 w-7 text-red-500" />
      </div>
      <p className="max-w-md text-center text-sm text-[#5c4a3d]">{message}</p>
      <Link
        href="/business/login"
        className="inline-flex items-center gap-2 rounded-xl bg-[#153551] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#215481]"
      >
        Go to merchant login
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}

export function MerchantPaymentSuccess({
  businessId,
  businessName,
}: {
  businessId: string;
  businessName?: string;
}) {
  return (
    <div className="pricing-page min-h-screen">
      <section className="relative overflow-hidden border-b border-[#e8dfd4]/90">
        <div className="register-hero-bg pointer-events-none absolute inset-0" aria-hidden />
        <MerchantAuthMain className="relative z-10 flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 shadow-[0_20px_50px_-20px_rgba(16,185,129,0.5)]">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#c1621a]">
            <Sparkles size={14} />
            Payment successful
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#0a1520] sm:text-4xl">
            Growth Pro is active
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-[#5c4a3d] sm:text-base">
            {businessName ? (
              <>
                <span className="font-semibold text-[#153551]">{businessName}</span> can now unlock lead
                contacts, verified badge, and premium visibility.
              </>
            ) : (
              'Lead contacts, verified badge, and premium visibility are now unlocked.'
            )}
          </p>
          <Link
            href={`/business/dashboard?id=${businessId}`}
            className="register-hero-cta-btn mt-8 inline-flex items-center gap-2 px-8 py-4 text-sm font-bold text-[#153551]"
          >
            Open dashboard
            <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
        </MerchantAuthMain>
      </section>
    </div>
  );
}

export default function MerchantPaymentCheckout({
  business,
  billingCycle,
  onBillingChange,
  paying,
  error,
  isAuthorized,
  razorpayConfigured,
  checkoutRequested,
  onPay,
  onBack,
}: MerchantPaymentCheckoutProps) {
  const plan = MERCHANT_PLANS.pro;
  const isAnnual = billingCycle === 'annual';

  return (
    <div className="pricing-page min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#e8dfd4]/90">
        <div className="register-hero-bg pointer-events-none absolute inset-0" aria-hidden />
        <div
          className="pricing-hero-grid pointer-events-none absolute inset-0 opacity-[0.35]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-32 top-0 h-[24rem] w-[24rem] rounded-full bg-[#f9b864]/20 blur-[100px]"
          aria-hidden
        />

        <MerchantAuthMain className="relative z-10 pb-10 pt-28 sm:pb-12 sm:pt-32">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-xl border border-[#e8dfd4] bg-white/80 px-4 py-2 text-sm font-semibold text-[#153551] backdrop-blur-sm transition-colors hover:bg-white"
            >
              <ArrowLeft size={16} />
              {checkoutRequested ? 'Change plan' : 'Back to dashboard'}
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-[#5c4a3d]">
              <span className="rounded-full bg-[#153551] px-2.5 py-1 text-white">2</span>
              <span>Checkout</span>
              <span className="text-[#d4c4b0]">/</span>
              <span className="text-[#a89888]">Activate</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#c1621a]">
                <Zap size={13} strokeWidth={2.5} />
                Secure checkout
              </p>
              <h1 className="pricing-hero-title mt-4 text-[2rem] font-bold leading-[1.12] tracking-[-0.03em] text-[#0a1520] sm:text-4xl lg:text-[2.75rem]">
                Activate{' '}
                <span className="bg-gradient-to-r from-[#153551] to-[#c1621a] bg-clip-text text-transparent">
                  Growth Pro
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#5c4a3d] sm:text-base">
                {isAnnual
                  ? 'Unlock lead phone numbers, verified badge, and priority placement. Pay once for 12 months — no recurring mandate required.'
                  : 'Unlock lead contacts and premium visibility. You will authorize a secure RBI-compliant e-mandate so Growth Pro renews automatically each month until you cancel.'}
              </p>
            </div>

            <div className="rounded-2xl border border-[#e8dfd4]/90 bg-white/90 p-5 shadow-[0_20px_60px_-30px_rgba(21,53,81,0.2)] backdrop-blur-sm sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#153551]/10">
                  <Image src="/businesslogo.png" alt="" width={28} height={28} className="h-7 w-auto" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#a89888]">
                    Your business
                  </p>
                  <p className="truncate text-base font-bold text-[#0a1520]">{business.businessName}</p>
                  {business.registrationNumber && (
                    <p className="text-xs text-[#a89888]">ID {business.registrationNumber}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#fff9ed] px-3 py-2.5 text-xs font-semibold text-[#153551]">
                <TrendingUp size={14} className="shrink-0 text-[#c1621a]" />
                {EARLY_BIRD_BADGE_LABEL}
              </div>
            </div>
          </div>
        </MerchantAuthMain>
      </section>

      {/* Checkout */}
      <section className="relative py-10 sm:py-14">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#f5f2ed] via-[#faf8f5] to-white" aria-hidden />
        <MerchantAuthMain className="relative z-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px] lg:gap-10 xl:gap-14">
            {/* Plan selection + features */}
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-[#0a1520] sm:text-2xl">
                  Confirm your plan
                </h2>
                <p className="mt-1 text-sm text-[#5c4a3d]">
                  Choose monthly flexibility or annual savings — switch anytime before paying.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <BillingOption
                  active={!isAnnual}
                  title={PRICING_PLANS.monthly.name}
                  subtitle={PRICING_PLANS.monthly.tagline}
                  price={formatInr(GROWTH_PRO_OFFER_MONTHLY)}
                  retail={`${formatInr(GROWTH_PRO_RETAIL_MONTHLY)}/mo`}
                  period="/mo"
                  discount={`${GROWTH_PRO_MONTHLY_DISCOUNT_PERCENT}% off`}
                  onSelect={() => onBillingChange('monthly')}
                />
                <BillingOption
                  active={isAnnual}
                  title={PRICING_PLANS.annual.name}
                  subtitle={PRICING_PLANS.annual.tagline}
                  price={formatInr(GROWTH_PRO_EFFECTIVE_MONTHLY_ANNUAL)}
                  retail={`${formatInr(GROWTH_PRO_RETAIL_ANNUAL)}/yr`}
                  period="/mo · billed annually"
                  badge="Best value"
                  discount={`${GROWTH_PRO_ANNUAL_DISCOUNT_PERCENT}% off`}
                  onSelect={() => onBillingChange('annual')}
                />
              </div>

              {isAnnual && (
                <p className="rounded-xl border border-[#e8dfd4] bg-white px-4 py-3 text-sm text-[#5c4a3d]">
                  Annual total:{' '}
                  <span className="font-semibold text-[#a89888] line-through tabular-nums">
                    {formatInr(GROWTH_PRO_RETAIL_ANNUAL)}
                  </span>{' '}
                  <span className="font-bold tabular-nums text-[#153551]">
                    {formatInr(GROWTH_PRO_OFFER_ANNUAL)}
                  </span>{' '}
                  per year
                </p>
              )}

              <div className="rounded-2xl border border-[#e8dfd4]/80 bg-white p-6 sm:p-7">
                <h3 className="text-sm font-bold uppercase tracking-wide text-[#153551]">
                  Everything included
                </h3>
                <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {GROWTH_PRO_FEATURES.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-[#3d342c]">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#c1621a]" strokeWidth={2.25} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Order summary */}
            <div className="lg:sticky lg:top-28 lg:self-start">
              <div className="relative overflow-hidden rounded-3xl border border-[#153551]/15 bg-gradient-to-br from-[#0f273b] via-[#153551] to-[#1a4367] p-6 text-white shadow-[0_28px_70px_-30px_rgba(15,39,59,0.55)] sm:p-7">
                {paying && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#153551]/90 backdrop-blur-sm">
                    <Loader2 className="h-9 w-9 animate-spin text-[#f9b864]" />
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                      Opening Razorpay…
                    </p>
                  </div>
                )}

                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#f9b864]/20 blur-3xl" aria-hidden />

                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                  Order summary
                </p>
                <h3 className="mt-2 text-2xl font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-white/70">{plan.description}</p>

                <div className="mt-6 border-t border-white/10 pt-6">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs text-white/50 line-through tabular-nums">
                        {isAnnual
                          ? `${formatInr(GROWTH_PRO_RETAIL_ANNUAL)}/yr`
                          : `${formatInr(GROWTH_PRO_RETAIL_MONTHLY)}/mo`}
                      </p>
                      <p className="mt-1 text-4xl font-extrabold tabular-nums text-[#f9b864]">
                        {isAnnual ? formatInr(GROWTH_PRO_OFFER_ANNUAL) : formatInr(GROWTH_PRO_OFFER_MONTHLY)}
                      </p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/55">
                        {isAnnual ? 'per year · GST applicable' : 'per month · GST applicable'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/10 px-3 py-2 text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#f9b864]">You save</p>
                      <p className="text-lg font-bold tabular-nums">
                        {isAnnual ? `${GROWTH_PRO_ANNUAL_DISCOUNT_PERCENT}%` : `${GROWTH_PRO_MONTHLY_DISCOUNT_PERCENT}%`}
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-300/30 bg-red-500/15 px-3.5 py-3 text-sm text-red-100">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <div>
                      <p>{error}</p>
                      {!isAuthorized && (
                        <Link
                          href="/business/login"
                          className="mt-1 inline-block font-semibold text-[#f9b864] underline-offset-2 hover:underline"
                        >
                          Sign in to merchant portal
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                {!razorpayConfigured && (
                  <div className="mt-5 rounded-xl border border-amber-300/30 bg-amber-500/15 px-3.5 py-3 text-xs text-amber-100">
                    Payment gateway is not configured. Contact support if this persists.
                  </div>
                )}

                <button
                  type="button"
                  onClick={onPay}
                  disabled={paying || !isAuthorized || !razorpayConfigured}
                  className="register-hero-cta-btn mt-6 flex w-full items-center justify-center gap-2 py-4 text-sm font-bold text-[#153551] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CreditCard size={18} />
                  {isAnnual ? 'Pay once with Razorpay' : 'Set up mandate & pay'}
                  <ArrowRight size={16} strokeWidth={2.5} />
                </button>

                {!isAnnual && (
                  <p className="mt-3 text-center text-[11px] leading-relaxed text-white/60">
                    By continuing you authorize FinderB to auto-debit ₹499/month via Razorpay until you
                    cancel from your subscription settings. RBI-compliant e-mandate / UPI Autopay.
                  </p>
                )}

                <div className="mt-5 space-y-2.5 border-t border-white/10 pt-5">
                  {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2 text-xs text-white/65">
                      <Icon size={14} className="shrink-0 text-[#f9b864]" />
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-4 text-center text-xs text-[#a89888]">
                Need help?{' '}
                <Link href="/contact" className="font-semibold text-[#153551] hover:underline">
                  Contact support
                </Link>
              </p>
            </div>
          </div>
        </MerchantAuthMain>
      </section>
    </div>
  );
}
