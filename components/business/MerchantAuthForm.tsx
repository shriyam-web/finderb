'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';

function IndiaFlag({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 overflow-hidden rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.08] ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 21 14" className="h-[15px] w-[22px]" role="img" aria-label="India">
        <rect width="21" height="4.67" fill="#FF9933" />
        <rect y="4.67" width="21" height="4.66" fill="#FFFFFF" />
        <rect y="9.33" width="21" height="4.67" fill="#138808" />
        <circle cx="10.5" cy="7" r="1.75" fill="none" stroke="#000080" strokeWidth="0.45" />
        <circle cx="10.5" cy="7" r="0.35" fill="#000080" />
      </svg>
    </span>
  );
}

export function IndiaPhonePrefix() {
  return (
    <span className="merchant-auth-phone-prefix flex shrink-0 items-center gap-2.5 border-r-2 border-[#dfe6ee] bg-gradient-to-b from-white to-[#f3f6f9] px-3.5 py-3.5 sm:px-4 sm:py-4">
      <IndiaFlag />
      <span className="text-[15px] font-bold tracking-tight text-[#153551]">+91</span>
    </span>
  );
}

/** Flat form shell — no card, border, or shadow */
export function MerchantAuthFormCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`merchant-auth-form-flat w-full ${className}`}>{children}</div>;
}

export function MerchantAuthFormHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="merchant-auth-form-head mb-6">
      <h2 className="merchant-auth-form-title text-[1.35rem] font-bold leading-snug tracking-tight sm:text-[1.5rem]">
        {title}
      </h2>
      <p className="merchant-auth-form-subtitle mt-2 text-[15px] leading-relaxed">{subtitle}</p>
    </div>
  );
}

export function MerchantAuthFormBody({ children }: { children: ReactNode }) {
  return <div className="merchant-auth-form-body">{children}</div>;
}

export function MerchantAuthFormLegal() {
  return (
    <p className="mt-5 text-[12px] leading-relaxed text-[#5c6b7a]">
      By continuing, you agree to our{' '}
      <Link href="/terms" className="font-medium text-[#153551] hover:underline">
        Terms
      </Link>
      ,{' '}
      <Link href="/privacy" className="font-medium text-[#153551] hover:underline">
        Privacy Policy
      </Link>{' '}
      and{' '}
      <Link href="/policy" className="font-medium text-[#153551] hover:underline">
        Infringement Policy
      </Link>
      .
    </p>
  );
}

export function MerchantAuthFormAltLink({
  prompt,
  href,
  linkText,
}: {
  prompt: string;
  href: string;
  linkText: string;
}) {
  return (
    <p className="merchant-auth-form-alt mt-6 text-center text-[14px] text-[#3d4f63]">
      {prompt}{' '}
      <Link
        href={href}
        className="font-semibold text-[#153551] underline-offset-2 hover:text-[#215481] hover:underline"
      >
        {linkText}
      </Link>
    </p>
  );
}

export function MerchantAuthSubmitButton({
  children,
  disabled,
  loading,
  type = 'button',
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className="merchant-auth-submit group inline-flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[15px] font-semibold text-white transition-colors active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? 'Please wait…' : children}
      {!loading && (
        <ArrowRight
          size={17}
          strokeWidth={2.25}
          className="transition-transform group-enabled:group-hover:translate-x-0.5"
        />
      )}
    </button>
  );
}

function formatIndianMobile(digits: string) {
  const d = digits.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)} ${d.slice(5)}`;
}

export { formatIndianMobile };

export function MerchantAuthPhoneField({
  id = 'mobile-input',
  value,
  onChange,
  onSubmit,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  const isComplete = digits.length === 10;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isComplete) onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor={id} className="merchant-auth-label">
          Mobile number
        </label>
        <div
          className={`merchant-auth-phone-field merchant-auth-input-wrap relative flex items-stretch overflow-hidden rounded-[14px] border-2 bg-white transition-[border-color,box-shadow] ${
            isComplete
              ? 'border-emerald-500/80 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]'
              : 'border-[#d4dde8] focus-within:border-[#153551] focus-within:shadow-[0_0_0_3px_rgba(21,53,81,0.1)]'
          }`}
        >
          <IndiaPhonePrefix />
          <input
            id={id}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={formatIndianMobile(digits)}
            onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="98765 43210"
            className="min-w-0 flex-1 bg-white px-3.5 py-3.5 text-[16px] font-semibold tabular-nums tracking-wide text-[#0f273b] outline-none placeholder:font-normal placeholder:text-[#94a3b8] sm:px-4 sm:py-4"
          />
        </div>
      </div>

      <MerchantAuthSubmitButton type="submit" disabled={!isComplete}>
        Continue
      </MerchantAuthSubmitButton>
    </form>
  );
}

export const merchantAuthFieldClass =
  'merchant-auth-field w-full py-3.5 pl-11 pr-4 text-[15px] font-semibold text-[#0f273b] placeholder:font-normal placeholder:text-[#94a3b8]';

export function MerchantAuthField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon: Icon,
  trailing,
  autoComplete,
  hideLabel,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  trailing?: ReactNode;
  autoComplete?: string;
  hideLabel?: boolean;
}) {
  return (
    <div>
      {!hideLabel && (
        <label htmlFor={id} className="merchant-auth-label">
          {label}
        </label>
      )}
      <div className="group relative merchant-auth-input-wrap">
        <Icon
          size={17}
          strokeWidth={2}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] transition-colors group-focus-within:text-[#153551]"
        />
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`${merchantAuthFieldClass} ${trailing ? 'pr-11' : ''}`}
        />
        {trailing}
      </div>
    </div>
  );
}
