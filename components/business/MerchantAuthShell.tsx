'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

const TRUST_POINTS = [
  'Free listing — upgrade when you are ready',
  'Leads, reviews, and insights in one dashboard',
  'Trusted by local businesses across India',
];

type MerchantAuthMarketingProps = {
  eyebrow?: string;
  title: string;
  description: string;
  compact?: boolean;
};

export function MerchantAuthMarketing({
  eyebrow = 'FinderB for Business',
  title,
  description,
  compact = false,
}: MerchantAuthMarketingProps) {
  return (
    <aside className="merchant-auth-panel-dark relative flex flex-col justify-between overflow-hidden p-8 sm:p-10 lg:p-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        aria-hidden
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />
      <div
        className="pointer-events-none absolute -right-20 top-1/4 h-64 w-64 rounded-full bg-[#f9b864]/20 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-lg ring-1 ring-white/20">
          <Image
            src="/brands/fb-mark-240.png"
            alt="FinderB"
            width={36}
            height={36}
            className="h-9 w-9"
            priority
          />
        </Link>

        <div className={`${compact ? 'mt-8' : 'mt-12 lg:mt-16'} max-w-sm`}>
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#f9b864]">
            <Sparkles size={13} strokeWidth={2.5} />
            {eyebrow}
          </p>
          <h1
            className={`mt-4 font-bold leading-[1.15] tracking-tight !text-white ${
              compact ? 'text-2xl' : 'text-[1.85rem] sm:text-[2.15rem] lg:text-[2.35rem]'
            }`}
          >
            {title}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/72 sm:text-[15px]">{description}</p>

          {!compact && (
            <ul className="mt-8 space-y-3">
              {TRUST_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm text-white/80">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f9b864]" />
                  {point}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="relative z-10 mt-10 border-t border-white/10 pt-6 lg:mt-0">
        <div className="flex items-start gap-2.5 text-xs leading-relaxed text-white/65">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#f9b864]" strokeWidth={2.25} />
          Secure partner access. Your business data stays protected.
        </div>
      </div>
    </aside>
  );
}

export function MerchantAuthCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_32px_80px_-40px_rgba(15,39,59,0.35)] sm:rounded-3xl ${className}`}
    >
      {children}
    </div>
  );
}

export function MerchantAuthPage({
  children,
  compactTop = false,
}: {
  children: ReactNode;
  compactTop?: boolean;
}) {
  return (
    <div
      className={`merchant-auth-page min-h-screen ${compactTop ? 'merchant-auth-page--compact-top' : ''}`}
    >
      {children}
    </div>
  );
}

/** Clears fixed site navbar — use on all /business/login and /business/register content */
export function MerchantAuthMain({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`merchant-auth-main mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

export function MerchantAuthMainNarrow({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`merchant-auth-main px-4 pb-16 sm:px-6 sm:pb-20 lg:pb-24 ${className}`}>
      <div className="mx-auto w-full max-w-5xl">{children}</div>
    </div>
  );
}

export const merchantAuthInputClass =
  'w-full rounded-xl border border-zinc-200 bg-white py-3 pl-10 pr-4 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-[#153551]/35 focus:ring-4 focus:ring-[#153551]/8';

export const merchantAuthBtnPrimary =
  'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#153551] py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#215481] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60';

export const merchantAuthBtnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-[#153551] transition-colors hover:border-[#153551]/25 hover:bg-zinc-50';
