'use client';

import { useEffect, useRef, useState } from 'react';
import { otpSendLabel, useOtpCooldown } from '@/hooks/useOtpCooldown';
import TruecallerButton from '@/components/auth/TruecallerButton';
import OAuthButtonGroup from '@/components/auth/OAuthButtonGroup';
import { isMerchantPortalPath } from '@/lib/authRedirect';

type SocialAuthButtonsProps = {
  mode: 'login' | 'signup';
  redirectPath?: string;
  onError?: (message: string) => void;
};

type InboundRequest = {
  ref: string;
  requestId: string;
  waNumber: string;
  text: string;
};

function WhatsAppMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
      <path
        fill="#FFFFFF"
        d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.39-1.41a10.1 10.1 0 0 0 4.65 1.12h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2Zm5.76 13.9c-.24.68-1.4 1.3-1.94 1.38-.5.07-1.12.1-1.81-.11-.42-.13-.95-.3-1.64-.59-2.88-1.24-4.76-4.14-4.9-4.33-.14-.19-1.16-1.54-1.16-2.94 0-1.4.73-2.09 1-2.37.26-.28.57-.35.76-.35h.55c.17 0 .4-.07.63.48.24.57.82 1.97.89 2.11.07.15.12.32.02.51-.1.19-.14.32-.28.49-.14.17-.3.38-.42.51-.14.14-.28.29-.12.56.16.27.7 1.15 1.5 1.86 1.03.92 1.9 1.2 2.17 1.34.27.13.43.11.59-.07.16-.17.68-.79.86-1.06.18-.27.36-.22.6-.13.24.09 1.54.73 1.8.86.27.13.44.2.51.31.06.11.06.64-.18 1.32Z"
      />
    </svg>
  );
}

function WhatsAppAuthButton({
  mode,
  redirectPath,
  onError,
}: {
  mode: 'login' | 'signup';
  redirectPath: string;
  onError?: (message: string) => void;
}) {
  const audience = isMerchantPortalPath(redirectPath) ? 'business' : 'user';
  const label = mode === 'signup' ? 'Sign up with WhatsApp' : 'Continue with WhatsApp';
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [hint, setHint] = useState('');
  const otp = useOtpCooldown();
  const [busy, setBusy] = useState(false);
  const [flow, setFlow] = useState<'starting' | 'inbound' | 'manual'>('starting');
  const [inbound, setInbound] = useState<InboundRequest | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [inboundSent, setInboundSent] = useState(false);

  const digits = phone.replace(/\D/g, '').slice(0, 10);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const fail = (message: string) => {
    setHint('');
    onError?.(message);
  };

  const startInbound = async () => {
    setFlow('starting');
    setInbound(null);
    setWaiting(false);
    setInboundSent(false);
    setCode('');
    setHint('');
    try {
      const res = await fetch('/api/auth/whatsapp/inbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ action: 'start', audience }),
      });
      const data = (await res.json()) as Partial<InboundRequest> & {
        success?: boolean;
        enabled?: boolean;
      };
      if (data.success && data.enabled && data.ref && data.requestId && data.waNumber && data.text) {
        setInbound({
          ref: data.ref,
          requestId: data.requestId,
          waNumber: data.waNumber,
          text: data.text,
        });
        setFlow('inbound');
        return;
      }
    } catch {
      // Typing the number still works.
    }
    setFlow('manual');
  };

  useEffect(() => {
    if (!inbound || !waiting || inboundSent) return;
    let cancelled = false;
    const timer = window.setInterval(async () => {
      try {
        const res = await fetch(
          `/api/auth/whatsapp/inbound?ref=${encodeURIComponent(inbound.ref)}&requestId=${encodeURIComponent(inbound.requestId)}`,
          { headers: { Accept: 'application/json' }, cache: 'no-store' },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { status?: string; message?: string; error?: string };
        if (cancelled) return;
        if (data.status === 'sent') {
          setInboundSent(true);
          setHint(data.message || 'We sent a 6-digit code on WhatsApp.');
        } else if (data.status === 'error') {
          setWaiting(false);
          setHint('');
          onErrorRef.current?.(data.error || 'Could not send the WhatsApp code.');
        }
      } catch {
        // Keep waiting through brief network drops.
      }
    }, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [inbound, waiting, inboundSent]);

  const verifyInbound = async () => {
    if (!inbound || code.replace(/\D/g, '').length !== 6) {
      fail('Enter the 6-digit code from WhatsApp.');
      return;
    }
    setBusy(true);
    onError?.('');
    try {
      const res = await fetch('/api/auth/whatsapp/inbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          ref: inbound.ref,
          requestId: inbound.requestId,
          code,
          client: 'web',
          redirectPath,
        }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string; redirectUrl?: string };
      if (!data.success || !data.redirectUrl) {
        fail(data.error || 'Could not verify that code.');
        return;
      }
      window.location.assign(data.redirectUrl);
    } catch {
      fail('Could not verify that code. Check your connection.');
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    if (!/^[6-9]\d{9}$/.test(digits)) {
      fail('Enter a 10-digit Indian mobile number.');
      return;
    }
    if (otp.isWaiting(digits)) return;
    setCode('');
    setBusy(true);
    onError?.('');
    try {
      const res = await fetch('/api/auth/whatsapp/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ phone: digits, audience, client: 'web', redirectPath }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string; message?: string };
      if (!data.success) {
        fail(data.error || 'Could not send the WhatsApp code.');
        return;
      }
      otp.markSent(digits);
      setHint(data.message || 'We sent a 6-digit code on WhatsApp.');
    } catch {
      fail('Could not send the WhatsApp code. Check your connection.');
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (code.replace(/\D/g, '').length !== 6) {
      fail('Enter the 6-digit code from WhatsApp.');
      return;
    }
    setBusy(true);
    onError?.('');
    try {
      const res = await fetch('/api/auth/whatsapp/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          phone: digits,
          code,
          audience,
          client: 'web',
          redirectPath,
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        redirectUrl?: string;
      };
      if (!data.success || !data.redirectUrl) {
        fail(data.error || 'Could not verify that code.');
        return;
      }
      window.location.assign(data.redirectUrl);
    } catch {
      fail('Could not verify that code. Check your connection.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          onError?.('');
          setOpen(true);
          void startInbound();
        }}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#25D366] bg-[#25D366] px-4 py-3 text-sm font-semibold text-white"
      >
        <WhatsAppMark />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-[#25D366]/40 bg-[#f3fbf6] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[#128C7E]">{label}</p>
        <button
          type="button"
          className="text-xs font-semibold text-slate-500"
          onClick={() => setOpen(false)}
        >
          Close
        </button>
      </div>
      {flow === 'starting' ? (
        <p className="text-[13px] text-slate-500">Getting WhatsApp ready…</p>
      ) : flow === 'inbound' && inbound ? (
        <div className="space-y-3">
          <p className="text-[13px] leading-5 text-slate-600">
            {inboundSent
              ? 'Enter the code we sent to the WhatsApp number that messaged us.'
              : 'Open WhatsApp and press Send on the message we fill in. Your code comes back on that same WhatsApp number, so you do not need to type it.'}
          </p>
          {!inboundSent ? (
            <a
              href={`https://wa.me/${inbound.waNumber}?text=${encodeURIComponent(inbound.text)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                onError?.('');
                setWaiting(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#128C7E] px-3 py-2.5 text-sm font-bold text-white"
            >
              <WhatsAppMark />
              <span>{waiting ? 'Open WhatsApp again' : 'Open WhatsApp'}</span>
            </a>
          ) : null}
          {waiting && !inboundSent ? (
            <p className="text-[13px] text-slate-500">Waiting for your WhatsApp message…</p>
          ) : null}
          {inboundSent ? (
            <div className="flex items-center gap-2">
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit code"
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm tracking-[0.3em] text-slate-900 outline-none focus:border-[#128C7E]"
              />
              <button
                type="button"
                disabled={busy || code.length !== 6}
                onClick={() => void verifyInbound()}
                className="h-10 shrink-0 rounded-lg bg-[#128C7E] px-3 text-xs font-bold text-white disabled:opacity-45"
              >
                {busy ? '…' : 'Verify'}
              </button>
            </div>
          ) : null}
          {hint ? <p className="text-[13px] font-medium text-emerald-700">{hint}</p> : null}
          <button
            type="button"
            className="text-xs font-semibold text-[#128C7E] underline-offset-2 hover:underline"
            onClick={() => {
              onError?.('');
              setHint('');
              setCode('');
              setFlow('manual');
            }}
          >
            Enter number instead
          </button>
        </div>
      ) : (
        <>
          <p className="text-[13px] leading-5 text-slate-600">
            {audience === 'business'
              ? 'Use the mobile number on your FinderB business. We send the code on WhatsApp.'
              : 'Enter your WhatsApp number. We send a 6-digit code to sign you in.'}
          </p>
          <div className="flex items-center gap-2">
            <input
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              value={digits}
              onChange={(event) => {
                const next = event.target.value.replace(/\D/g, '').slice(0, 10);
                if (next !== digits) setCode('');
                setPhone(next);
                setHint('');
              }}
              placeholder="10-digit WhatsApp number"
              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#128C7E]"
            />
            <button
              type="button"
              disabled={busy || otp.isWaiting(digits) || !/^[6-9]\d{9}$/.test(digits)}
              onClick={() => void send()}
              className="h-10 shrink-0 rounded-lg bg-[#128C7E] px-3 text-xs font-bold text-white disabled:opacity-45"
            >
              {busy && code.length < 6
                ? 'Sending…'
                : otpSendLabel(otp.isSentTo(digits), otp.isWaiting(digits), otp.secondsLeft)}
            </button>
          </div>
          {otp.isSentTo(digits) ? (
            <div className="flex items-center gap-2">
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit code"
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm tracking-[0.3em] text-slate-900 outline-none focus:border-[#128C7E]"
              />
              <button
                type="button"
                disabled={busy || code.length !== 6}
                onClick={() => void verify()}
                className="h-10 shrink-0 rounded-lg bg-[#128C7E] px-3 text-xs font-bold text-white disabled:opacity-45"
              >
                {busy ? '…' : 'Verify'}
              </button>
            </div>
          ) : null}
          {hint ? <p className="text-[13px] font-medium text-emerald-700">{hint}</p> : null}
        </>
      )}
    </div>
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
      <WhatsAppAuthButton mode={mode} redirectPath={redirectPath} onError={onError} />
    </div>
  );
}
