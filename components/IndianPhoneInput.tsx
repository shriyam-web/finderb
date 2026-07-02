'use client';

import { IndiaPhonePrefix } from '@/components/IndiaPhonePrefix';
import {
  extractIndianMobileDigits,
  formatIndianMobileDisplay,
  isValidIndianMobileDigits,
} from '@/lib/indianPhone';

type IndianPhoneInputProps = {
  id: string;
  value: string;
  onChange: (digits: string) => void;
  autoFocus?: boolean;
  variant?: 'merchant' | 'dashboard';
  placeholder?: string;
  className?: string;
};

export default function IndianPhoneInput({
  id,
  value,
  onChange,
  autoFocus = false,
  variant = 'dashboard',
  placeholder = '98765 43210',
  className = '',
}: IndianPhoneInputProps) {
  const digits = extractIndianMobileDigits(value);
  const isComplete = isValidIndianMobileDigits(digits);

  const handleChange = (raw: string) => {
    onChange(extractIndianMobileDigits(raw));
  };

  if (variant === 'merchant') {
    return (
      <div
        className={`merchant-auth-phone-field merchant-auth-input-wrap relative flex items-stretch overflow-hidden rounded-[14px] border-2 bg-white transition-[border-color,box-shadow] ${
          isComplete
            ? 'border-emerald-500/80 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]'
            : 'border-[#d4dde8] focus-within:border-[#153551] focus-within:shadow-[0_0_0_3px_rgba(21,53,81,0.1)]'
        } ${className}`}
      >
        <IndiaPhonePrefix variant="merchant" />
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={formatIndianMobileDisplay(digits)}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="min-w-0 flex-1 bg-white px-3.5 py-3.5 text-[16px] font-semibold tabular-nums tracking-wide text-[#0f273b] outline-none placeholder:font-normal placeholder:text-[#94a3b8] sm:px-4 sm:py-4"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-stretch overflow-hidden rounded-lg border bg-white transition-colors focus-within:border-[#215481] focus-within:ring-2 focus-within:ring-[#215481]/10 ${
        isComplete ? 'border-emerald-300' : 'border-zinc-200'
      } ${className}`}
    >
      <IndiaPhonePrefix variant="dashboard" />
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={formatIndianMobileDisplay(digits)}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="min-w-0 flex-1 px-3 py-2.5 text-sm font-medium tabular-nums tracking-wide text-zinc-900 outline-none placeholder:font-normal placeholder:text-zinc-400"
      />
    </div>
  );
}

export const INDIAN_PHONE_FIELD_HINT =
  'Enter only the 10-digit mobile number. Do not add 0, +91, or country code — +91 is added automatically.';
