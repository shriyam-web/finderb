'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import IndianPhoneInput from '@/components/IndianPhoneInput';
import {
  extractIndianMobileDigits,
  isValidIndianMobileDigits,
} from '@/lib/indianPhone';

export { formatIndianMobileDisplay as formatIndianMobile } from '@/lib/indianPhone';
export { IndiaPhonePrefix } from '@/components/IndiaPhonePrefix';

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
  const digits = extractIndianMobileDigits(value);
  const isComplete = isValidIndianMobileDigits(digits);

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
        <IndianPhoneInput
          id={id}
          value={value}
          onChange={onChange}
          variant="merchant"
        />
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
