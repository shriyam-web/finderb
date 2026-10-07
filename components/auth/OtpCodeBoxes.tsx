'use client';

import { useEffect, useRef } from 'react';

type OtpCodeBoxesProps = {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  tone?: 'whatsapp' | 'neutral';
};

const FOCUS_TONE = {
  whatsapp: 'focus:border-[#128C7E] focus:ring-[#128C7E]/20',
  neutral: 'focus:border-zinc-900 focus:ring-zinc-900/10',
};

/** One box per digit. Typing moves forward, Backspace moves back, and a pasted code fills every box. */
export default function OtpCodeBoxes({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled,
  autoFocus,
  tone = 'whatsapp',
}: OtpCodeBoxesProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.replace(/\D/g, '').slice(0, length);

  useEffect(() => {
    if (autoFocus && !disabled) refs.current[0]?.focus();
  }, [autoFocus, disabled]);

  const setDigits = (next: string, focusIndex: number) => {
    const clean = next.replace(/\D/g, '').slice(0, length);
    onChange(clean);
    refs.current[Math.min(focusIndex, length - 1)]?.focus();
    if (clean.length === length) onComplete?.(clean);
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-2.5" role="group" aria-label={`${length}-digit code`}>
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${index + 1}`}
          disabled={disabled}
          value={digits[index] ?? ''}
          onFocus={(event) => event.target.select()}
          onChange={(event) => {
            const typed = event.target.value.replace(/\D/g, '');
            if (!typed) return;
            if (typed.length > 1) {
              setDigits(digits.slice(0, index) + typed, index + typed.length);
              return;
            }
            const next = digits.slice(0, index) + typed + digits.slice(index + 1);
            setDigits(next, index + 1);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Backspace') {
              event.preventDefault();
              if (digits[index]) {
                setDigits(digits.slice(0, index) + digits.slice(index + 1), index);
              } else if (index > 0) {
                setDigits(digits.slice(0, index - 1) + digits.slice(index), index - 1);
              }
            } else if (event.key === 'ArrowLeft' && index > 0) {
              refs.current[index - 1]?.focus();
            } else if (event.key === 'ArrowRight' && index < length - 1) {
              refs.current[index + 1]?.focus();
            }
          }}
          onPaste={(event) => {
            event.preventDefault();
            setDigits(event.clipboardData.getData('text'), length - 1);
          }}
          className={`h-12 w-10 rounded-xl border border-slate-300 bg-white text-center text-lg font-bold text-slate-900 outline-none transition focus:ring-2 disabled:opacity-50 sm:h-14 sm:w-12 sm:text-xl ${FOCUS_TONE[tone]}`}
        />
      ))}
    </div>
  );
}
