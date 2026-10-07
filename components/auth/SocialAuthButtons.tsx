'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useOtpCooldown } from '@/hooks/useOtpCooldown';
import TruecallerButton from '@/components/auth/TruecallerButton';
import OAuthButtonGroup from '@/components/auth/OAuthButtonGroup';
import OtpCodeBoxes from '@/components/auth/OtpCodeBoxes';
import { isMerchantPortalPath } from '@/lib/authRedirect';

const OTP_LENGTH = 6;

type SocialAuthButtonsProps = {
  mode: 'login' | 'signup';
  redirectPath?: string;
  onError?: (message: string) => void;
};

function WhatsAppMark({ className = 'h-[18px] w-[18px]', color = '#FFFFFF' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill={color}
        d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.39-1.41a10.1 10.1 0 0 0 4.65 1.12h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2Zm5.76 13.9c-.24.68-1.4 1.3-1.94 1.38-.5.07-1.12.1-1.81-.11-.42-.13-.95-.3-1.64-.59-2.88-1.24-4.76-4.14-4.9-4.33-.14-.19-1.16-1.54-1.16-2.94 0-1.4.73-2.09 1-2.37.26-.28.57-.35.76-.35h.55c.17 0 .4-.07.63.48.24.57.82 1.97.89 2.11.07.15.12.32.02.51-.1.19-.14.32-.28.49-.14.17-.3.38-.42.51-.14.14-.28.29-.12.56.16.27.7 1.15 1.5 1.86 1.03.92 1.9 1.2 2.17 1.34.27.13.43.11.59-.07.16-.17.68-.79.86-1.06.18-.27.36-.22.6-.13.24.09 1.54.73 1.8.86.27.13.44.2.51.31.06.11.06.64-.18 1.32Z"
      />
    </svg>
  );
}

function formatPhone(digits: string) {
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

function WhatsAppAuthButton({
  mode,
  redirectPath,
}: {
  mode: 'login' | 'signup';
  redirectPath: string;
}) {
  const audience = isMerchantPortalPath(redirectPath) ? 'business' : 'user';
  const label = mode === 'signup' ? 'Sign up with WhatsApp' : 'Continue with WhatsApp';
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const otp = useOtpCooldown();

  const digits = phone.replace(/\D/g, '').slice(0, 10);
  const phoneOk = /^[6-9]\d{9}$/.test(digits);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !verifying) setOpen(false);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, verifying]);

  const openModal = () => {
    setStep('phone');
    setCode('');
    setError('');
    setOpen(true);
  };

  const send = async () => {
    if (!phoneOk) {
      setError('Enter a 10-digit Indian mobile number.');
      return;
    }
    if (otp.isWaiting(digits)) {
      setStep('code');
      return;
    }
    setError('');
    setSending(true);
    try {
      const res = await fetch('/api/auth/whatsapp/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ phone: digits, audience, client: 'web', redirectPath }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!data.success) {
        setError(data.error || 'Could not send the WhatsApp code.');
        return;
      }
      otp.markSent(digits);
      setCode('');
      setStep('code');
    } catch {
      setError('Could not send the WhatsApp code. Check your connection.');
    } finally {
      setSending(false);
    }
  };

  const verify = async (value = code) => {
    if (value.length !== OTP_LENGTH || verifying) return;
    setError('');
    setVerifying(true);
    try {
      const res = await fetch('/api/auth/whatsapp/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ phone: digits, code: value, audience, client: 'web', redirectPath }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string; redirectUrl?: string };
      if (!data.success || !data.redirectUrl) {
        setError(data.error || 'Could not verify that code.');
        setCode('');
        setVerifying(false);
        return;
      }
      window.location.assign(data.redirectUrl);
    } catch {
      setError('Could not verify that code. Check your connection.');
      setVerifying(false);
    }
  };

  const modal = open ? (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 cursor-default"
        onClick={() => !verifying && setOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="whatsapp-login-title"
        className="relative w-full max-w-md rounded-t-3xl bg-white px-6 pb-7 pt-5 shadow-2xl sm:rounded-3xl"
      >
        <div className="mb-5 flex items-center gap-3">
          {step === 'code' ? (
            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setCode('');
                setError('');
              }}
              disabled={verifying}
              className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              aria-label="Change number"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366]">
              <WhatsAppMark />
            </span>
          )}
          <h2 id="whatsapp-login-title" className="flex-1 text-lg font-bold text-slate-900">
            {step === 'phone'
              ? audience === 'business'
                ? 'Business login with WhatsApp'
                : label
              : 'Enter OTP'}
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={verifying}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {step === 'phone' ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
            className="space-y-4"
          >
            <p className="text-sm leading-6 text-slate-600">
              {audience === 'business'
                ? 'Enter the mobile number on your FinderB business. We will send an OTP to its WhatsApp.'
                : 'Enter your WhatsApp mobile number. We will send you an OTP on WhatsApp.'}
            </p>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">Mobile number</span>
              <div className="flex items-center rounded-xl border border-slate-300 bg-white focus-within:border-[#128C7E] focus-within:ring-2 focus-within:ring-[#128C7E]/20">
                <span className="border-r border-slate-200 px-3 text-sm font-semibold text-slate-700">+91</span>
                <input
                  autoFocus
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  value={digits}
                  onChange={(event) => {
                    setPhone(event.target.value.replace(/\D/g, '').slice(0, 10));
                    setError('');
                  }}
                  placeholder="10-digit mobile number"
                  className="min-w-0 flex-1 rounded-r-xl bg-transparent px-3 py-3 text-base tracking-wide text-slate-900 outline-none"
                />
              </div>
            </label>
            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={!phoneOk || sending}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#128C7E] text-sm font-bold text-white transition disabled:opacity-50"
            >
              {sending ? 'Sending OTP…' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            <p className="text-center text-sm leading-6 text-slate-600">
              OTP has been sent to the WhatsApp account linked to{' '}
              <span className="whitespace-nowrap font-semibold text-slate-900">{formatPhone(digits)}</span>
            </p>
            <OtpCodeBoxes
              value={code}
              length={OTP_LENGTH}
              autoFocus
              disabled={verifying}
              onChange={(value) => {
                setCode(value);
                setError('');
              }}
              onComplete={(value) => void verify(value)}
            />
            {error ? <p className="text-center text-sm font-medium text-red-600">{error}</p> : null}
            <button
              type="button"
              onClick={() => void verify()}
              disabled={code.length !== OTP_LENGTH || verifying}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#128C7E] text-sm font-bold text-white transition disabled:opacity-50"
            >
              {verifying ? 'Verifying…' : 'Verify and continue'}
            </button>
            <p className="text-center text-sm text-slate-500">
              {otp.isWaiting(digits) ? (
                <>Resend OTP in {otp.secondsLeft}s</>
              ) : (
                <>
                  Didn&apos;t get it?{' '}
                  <button
                    type="button"
                    onClick={() => void send()}
                    disabled={sending || verifying}
                    className="font-semibold text-[#128C7E] hover:underline disabled:opacity-50"
                  >
                    {sending ? 'Sending…' : 'Resend OTP'}
                  </button>
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#25D366] bg-[#25D366] px-4 py-3 text-sm font-semibold text-white"
      >
        <WhatsAppMark />
        <span>{label}</span>
      </button>
      {modal && typeof document !== 'undefined' ? createPortal(modal, document.body) : null}
    </>
  );
}

export default function SocialAuthButtons({
  mode,
  redirectPath = '/dashboard',
  onError,
}: SocialAuthButtonsProps) {
  return (
    <div className="space-y-3">
      <OAuthButtonGroup
        mode={mode}
        redirectPath={redirectPath}
        onError={onError}
        only={['google']}
      />
      <TruecallerButton mode={mode} redirectPath={redirectPath} onError={onError} />
      <WhatsAppAuthButton mode={mode} redirectPath={redirectPath} />
    </div>
  );
}
