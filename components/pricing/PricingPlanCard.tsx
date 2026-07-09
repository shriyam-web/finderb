import type { ReactNode } from 'react';
import Link from 'next/link';
import { Check, Lock, Minus, Zap } from 'lucide-react';
import { EARLY_BIRD_BADGE_LABEL } from '@/lib/pricing/growthPro';

export type PlanTone = 'free' | 'monthly' | 'annual';

export type PricingPlanCardProps = {
  tone: PlanTone;
  icon: ReactNode;
  name: string;
  tagline: string;
  price: ReactNode;
  priceNote?: ReactNode;
  badge?: ReactNode;
  discountPercent?: number;
  featuresHeading: string;
  includedFeatures: readonly string[];
  lockedFeatures?: readonly string[];
  cta?: ReactNode;
  highlighted?: boolean;
};

function LockedFeatureList({ features }: { features: readonly string[] }) {
  return (
    <div className="pricing-upgrade-block mt-6 overflow-hidden rounded-xl border border-[#e2e8f0] bg-[#f8fafc]/80">
      <div className="flex items-center gap-2.5 border-b border-[#e2e8f0] bg-[#f1f5f9] px-4 py-3">
        <Lock size={14} strokeWidth={2.25} className="shrink-0 text-[#153551]" />
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#153551]">Upgrade to unlock</p>
      </div>
      <ul className="divide-y divide-[#e8edf2] px-4 py-1">
        {features.map((feature) => (
          <li key={feature} className="flex items-center justify-between gap-3 py-2.5">
            <span className="text-sm font-medium text-[#64748b]">{feature}</span>
            <span className="pricing-pro-chip shrink-0">Pro</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeatureIcon({ tone }: { tone: PlanTone }) {
  const isDark = tone === 'annual';

  return (
    <span
      className={`pricing-feature-check mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md ${
        isDark ? 'pricing-feature-check-annual' : 'pricing-feature-check-light'
      }`}
    >
      <Check size={10} strokeWidth={3} className={isDark ? 'text-[#f9b864]' : 'text-[#153551]'} />
    </span>
  );
}

export function CurrentPlanBadge() {
  return (
    <span className="pricing-current-plan-badge inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#047857]">
      <span className="pricing-live-dot" aria-hidden />
      Current Plan
    </span>
  );
}

export function PricingPlanCard({
  tone,
  icon,
  name,
  tagline,
  price,
  priceNote,
  badge,
  discountPercent,
  featuresHeading,
  includedFeatures,
  lockedFeatures = [],
  cta,
  highlighted = false,
}: PricingPlanCardProps) {
  const isAnnual = tone === 'annual';
  const isFree = tone === 'free';

  return (
    <article
      className={`pricing-plan-card pricing-plan-card-${tone} group relative flex h-full flex-col overflow-hidden rounded-[1.35rem] p-6 sm:p-7 ${
        highlighted ? 'pricing-plan-card-featured' : ''
      }`}
    >
      <div className="pricing-card-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="pricing-card-shine pointer-events-none absolute inset-0" aria-hidden />
      {isAnnual ? <div className="pricing-card-aurora pointer-events-none absolute inset-0" aria-hidden /> : null}
      {highlighted ? (
        <span className="pricing-popular-ribbon pointer-events-none absolute left-0 top-0 z-[2]">
          <Zap size={8} strokeWidth={2.5} />
          Most picked
        </span>
      ) : null}

      <div className="relative z-[1] flex flex-1 flex-col">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          {badge ? <div className="ml-auto shrink-0">{badge}</div> : null}
        </div>

        <div className="flex items-start gap-4">
          <div
            className={`pricing-plan-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-14 sm:w-14 ${
              isAnnual
                ? 'pricing-plan-icon-annual'
                : isFree
                  ? 'pricing-plan-icon-free'
                  : 'pricing-plan-icon-monthly'
            }`}
          >
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className={`pricing-plan-title ${isAnnual ? 'pricing-plan-title-annual' : ''}`}>{name}</h2>
            <p className={`pricing-plan-tagline ${isAnnual ? 'pricing-plan-tagline-annual' : ''}`}>{tagline}</p>
          </div>
        </div>

        <div
          className={`pricing-price-panel pricing-price-panel-${tone} mt-6 ${
            discountPercent != null ? 'pricing-price-panel-has-discount' : ''
          }`}
        >
          {discountPercent != null ? (
            <div className="pricing-discount-badge-corner">
              <DiscountOffBadge percent={discountPercent} />
            </div>
          ) : null}
          <div className="pricing-price-row">
            <div className="min-w-0 flex-1">{price}</div>
          </div>
          {priceNote ? <div className="mt-2">{priceNote}</div> : null}
        </div>

        <div className="mt-7 flex-1">
          <p className={`pricing-features-heading ${isAnnual ? 'pricing-features-heading-annual' : ''}`}>
            {featuresHeading}
          </p>
          <ul className="mt-4 space-y-2.5">
            {includedFeatures.map((feature) => (
              <li
                key={feature}
                className={`pricing-feature-row flex items-start gap-2.5 text-sm ${
                  isAnnual ? 'pricing-plan-text-annual' : 'text-[#334155]'
                }`}
              >
                <FeatureIcon tone={tone} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          {lockedFeatures.length > 0 && <LockedFeatureList features={lockedFeatures} />}
        </div>

        {cta ? <div className="mt-8 pt-1">{cta}</div> : null}
      </div>
    </article>
  );
}

export function PricingCtaButton({
  href,
  onClick,
  variant = 'navy',
  disabled,
  children,
}: {
  href?: string;
  onClick?: () => void;
  variant?: 'gold' | 'navy' | 'outline' | 'ghost' | 'glow';
  disabled?: boolean;
  children: ReactNode;
}) {
  const className =
    variant === 'gold'
      ? 'pricing-cta-gold register-hero-cta-btn inline-flex w-full items-center justify-center rounded-xl px-4 py-3.5 text-sm font-bold text-[#153551] transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60'
      : variant === 'glow'
        ? 'pricing-cta-glow inline-flex w-full items-center justify-center rounded-xl px-4 py-3.5 text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-60'
        : variant === 'navy'
          ? 'pricing-cta-navy inline-flex w-full items-center justify-center rounded-xl px-4 py-3.5 text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-60'
          : variant === 'outline'
            ? 'inline-flex w-full items-center justify-center rounded-xl border border-[#153551]/20 bg-white/80 px-4 py-3.5 text-sm font-bold text-[#153551] backdrop-blur-sm transition-colors hover:border-[#153551]/35 hover:bg-white disabled:opacity-60'
            : 'inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-[#153551] underline-offset-2 hover:underline disabled:opacity-60';

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  );
}

export function DiscountChip({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <span
      className={`inline-block rounded-md px-2.5 py-1 text-xs font-extrabold tracking-wide ${
        dark ? 'bg-[#f9b864] text-[#153551]' : 'pricing-deal-chip'
      }`}
    >
      {children}
    </span>
  );
}

export function DiscountOffBadge({ percent }: { percent: number }) {
  const displayPercent = Number.isInteger(percent) ? String(percent) : percent.toFixed(2).replace(/\.?0+$/, '');
  const isDecimal = displayPercent.includes('.');

  return (
    <span
      className={`pricing-discount-badge ${isDecimal ? 'pricing-discount-badge-decimal' : ''}`}
      aria-label={`${displayPercent}% off`}
    >
      <span className="pricing-discount-badge-ring" aria-hidden />
      <span className="pricing-discount-value tabular-nums">{displayPercent}%</span>
      <span className="pricing-discount-off">OFF</span>
    </span>
  );
}

export function EarlyBirdAppliedBadge() {
  return (
    <span className="pricing-early-bird-badge inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.06em] text-[#153551]">
      <span className="pricing-live-dot pricing-live-dot-gold" aria-hidden />
      {EARLY_BIRD_BADGE_LABEL}
    </span>
  );
}

export function CompareCell({ value, highlight }: { value: boolean | string; highlight?: boolean }) {
  if (value === true) {
    return (
      <span
        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${
          highlight ? 'bg-[#f9b864]/25 ring-1 ring-[#f9b864]/40' : 'bg-[#f1f5f9] ring-1 ring-[#e2e8f0]'
        }`}
      >
        <Check size={14} strokeWidth={2.5} className={highlight ? 'text-[#c1621a]' : 'text-[#153551]'} />
      </span>
    );
  }
  if (value === false) {
    return <Minus size={16} className="text-[#cbd5e1]" strokeWidth={2.5} />;
  }
  return (
    <span className={`text-sm font-semibold ${highlight ? 'text-[#153551]' : 'text-[#475569]'}`}>
      {value}
    </span>
  );
}
