'use client';

import { useState } from 'react';
import { Check, Eye, EyeOff, Lock, X } from 'lucide-react';
import {
  analyzePasswordStrength,
  getPasswordStrengthBarClass,
  getPasswordStrengthLabel,
} from '@/lib/security/passwordStrength';
import { PASSWORD_MIN_LENGTH_MERCHANT } from '@/lib/security/passwordPolicy';
import { MerchantFieldError } from '@/components/business/MerchantFieldError';
import { merchantAuthFieldClass } from '@/components/business/MerchantAuthForm';

type MerchantPasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  showStrength?: boolean;
  autoComplete?: string;
};

export default function MerchantPasswordField({
  id,
  label,
  value,
  onChange,
  error,
  showStrength = true,
  autoComplete = 'new-password',
}: MerchantPasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const { level, score, requirements } = analyzePasswordStrength(
    value,
    PASSWORD_MIN_LENGTH_MERCHANT,
  );
  const strengthLabel = getPasswordStrengthLabel(level);
  const showMeter = showStrength && value.length > 0;

  return (
    <div id={`field-${id}`}>
      <label htmlFor={id} className="merchant-auth-label">
        {label}
      </label>
      <div className={`group relative merchant-auth-input-wrap ${error ? 'merchant-auth-input-wrap-invalid' : ''}`}>
        <Lock
          size={17}
          strokeWidth={2}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] transition-colors group-focus-within:text-[#153551]"
        />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={
            [error ? `${id}-error` : null, showMeter ? `${id}-strength` : null]
              .filter(Boolean)
              .join(' ') || undefined
          }
          className={`${merchantAuthFieldClass} pr-11 ${error ? 'merchant-auth-field-invalid' : ''}`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#94a3b8] transition-colors hover:text-[#153551]"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>

      {showMeter ? (
        <div id={`${id}-strength`} className="mt-2.5 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e8edf2]">
              <div
                className={`h-full rounded-full transition-all duration-300 ${getPasswordStrengthBarClass(level)}`}
                style={{ width: `${Math.max(score, 8)}%` }}
              />
            </div>
            {strengthLabel ? (
              <span
                className={`shrink-0 text-[11px] font-bold uppercase tracking-wide ${
                  level === 'weak'
                    ? 'text-rose-600'
                    : level === 'fair'
                      ? 'text-amber-600'
                      : level === 'good'
                        ? 'text-sky-700'
                        : 'text-emerald-600'
                }`}
              >
                {strengthLabel}
              </span>
            ) : null}
          </div>
          <ul className="grid gap-1 sm:grid-cols-2">
            {requirements.map((req) => (
              <li
                key={req.id}
                className={`flex items-center gap-1.5 text-[12px] leading-snug ${
                  req.met ? 'font-medium text-emerald-700' : 'text-[#64748b]'
                }`}
              >
                {req.met ? (
                  <Check size={13} className="shrink-0 text-emerald-600" strokeWidth={2.5} />
                ) : (
                  <X size={13} className="shrink-0 text-[#cbd5e1]" strokeWidth={2.5} />
                )}
                <span>{req.label}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <MerchantFieldError id={error ? `${id}-error` : undefined} message={error} />
    </div>
  );
}
