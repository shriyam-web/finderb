'use client';

import { useState } from 'react';
import { CheckCircle2, LogOut, Mail, ShieldCheck, Smartphone } from 'lucide-react';
import OtpCodeBoxes from '@/components/auth/OtpCodeBoxes';
import IndianPhoneInput from '@/components/IndianPhoneInput';
import { MerchantAuthField, MerchantAuthSubmitButton } from '@/components/business/MerchantAuthForm';
import { MerchantAuthMain, MerchantAuthPage } from '@/components/business/MerchantAuthShell';
import { MerchantFieldError } from '@/components/business/MerchantFieldError';
import { otpSendLabel, useOtpCooldown } from '@/hooks/useOtpCooldown';
import { formatIndianMobileDisplay } from '@/lib/indianPhone';
import {
  confirmMerchantEmailVerifyOtp,
  confirmMerchantMobileVerifyOtp,
  sendMerchantEmailVerifyOtp,
  sendMerchantMobileVerifyOtp,
} from '@/app/actions/merchantContact';

type ContactKind = 'email' | 'mobile';
type ActionResult = { success: true; message?: string; value?: string } | { success: false; error: string };

export type VerifiedContact = { kind: ContactKind; value: string };

const COPY: Record<ContactKind, { title: string; missing: string; channel: string; accent: string }> = {
  email: {
    title: 'Login email',
    missing: 'No email on your account yet. Add one to receive login codes, invoices and alerts.',
    channel: 'email',
    accent: 'bg-[#153551] hover:bg-[#0f2840]',
  },
  mobile: {
    title: 'Mobile number',
    missing: 'Add the owner mobile number you use on WhatsApp.',
    channel: 'WhatsApp',
    accent: 'bg-[#128C7E] hover:bg-[#0f7a6e]',
  },
};

function normalize(kind: ContactKind, value: string) {
  return kind === 'email' ? value.trim().toLowerCase() : value.replace(/\D/g, '').slice(-10);
}

export function ContactVerifyCard({
  kind,
  initialValue,
  verified,
  onVerified,
  allowChange = false,
}: {
  kind: ContactKind;
  initialValue: string;
  verified: boolean;
  onVerified: (contact: VerifiedContact) => void;
  allowChange?: boolean;
}) {
  const copy = COPY[kind];
  const [value, setValue] = useState(initialValue);
  const [savedValue, setSavedValue] = useState(initialValue);
  const [editing, setEditing] = useState(false);
  const showForm = !verified || editing;
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const cooldown = useOtpCooldown();
  const target = normalize(kind, value);
  const sent = cooldown.isSentTo(target);
  const wait = cooldown.isWaiting(target) ? cooldown.secondsLeft : 0;

  const send = async () => {
    if (!target || sending || wait > 0) return;
    setSending(true);
    setError('');
    setHint('');
    try {
      const result: ActionResult =
        kind === 'email' ? await sendMerchantEmailVerifyOtp(target) : await sendMerchantMobileVerifyOtp(target);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setCode('');
      setHint(result.message || '');
      cooldown.markSent(target);
    } catch {
      setError('Could not send the code. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const verify = async (entered = code) => {
    if (entered.length !== 6 || verifying) return;
    setVerifying(true);
    setError('');
    try {
      const result: ActionResult =
        kind === 'email'
          ? await confirmMerchantEmailVerifyOtp(target, entered)
          : await confirmMerchantMobileVerifyOtp(target, entered);
      if (!result.success) {
        setCode('');
        setError(result.error);
        return;
      }
      const saved = result.value || target;
      cooldown.clearSent();
      setHint('');
      setValue(saved);
      setSavedValue(saved);
      setEditing(false);
      onVerified({ kind, value: saved });
    } catch {
      setError('Could not verify the code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const Icon = kind === 'email' ? Mail : Smartphone;

  return (
    <section
      className={`rounded-2xl border-2 bg-white p-5 sm:p-6 ${
        verified ? 'border-emerald-200' : 'border-[#dfe6ee]'
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              verified ? 'bg-emerald-50 text-emerald-600' : 'bg-[#eef3f9] text-[#153551]'
            }`}
          >
            <Icon size={19} strokeWidth={2.2} />
          </span>
          <div>
            <h2 className="text-[15px] font-bold text-[#0f273b]">{copy.title}</h2>
            <p className="text-xs text-[#64748b]">Confirmed with a 6-digit code on {copy.channel}</p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
            verified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }`}
        >
          {verified ? 'Verified' : 'Not verified'}
        </span>
      </div>

      {!showForm ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex min-w-0 items-center gap-2 break-all text-[15px] font-semibold text-[#0f273b]">
            <CheckCircle2 size={17} className="shrink-0 text-emerald-500" strokeWidth={2.5} />
            {kind === 'email' ? savedValue : `+91 ${formatIndianMobileDisplay(savedValue)}`}
          </p>
          {allowChange ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-sm font-semibold text-[#215481] hover:underline"
            >
              Change
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          {!savedValue ? <p className="text-[13px] leading-relaxed text-[#475569]">{copy.missing}</p> : null}
          {editing ? (
            <p className="text-[13px] leading-relaxed text-[#475569]">
              Enter the new {kind === 'email' ? 'email' : 'number'} and verify it. The current one stays until
              the code is confirmed.
            </p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1">
              {kind === 'email' ? (
                <MerchantAuthField
                  id="verify-email"
                  label="Email"
                  hideLabel
                  type="email"
                  value={value}
                  onChange={(next) => {
                    setValue(next);
                    setError('');
                  }}
                  placeholder="you@business.com"
                  icon={Mail}
                  autoComplete="email"
                />
              ) : (
                <IndianPhoneInput
                  id="verify-mobile"
                  value={value}
                  onChange={(next) => {
                    setValue(next);
                    setError('');
                  }}
                  variant="merchant"
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => void send()}
              disabled={sending || wait > 0 || !target}
              className={`h-[3.25rem] shrink-0 rounded-xl px-5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[7.5rem] ${copy.accent}`}
            >
              {sending ? 'Sending…' : otpSendLabel(sent, wait > 0, wait)}
            </button>
          </div>

          {sent ? (
            <div className="space-y-3 rounded-2xl border border-[#d7e2ee] bg-[#f7fafc] p-4">
              <p className="text-center text-[13px] leading-relaxed text-[#475569]">
                {hint ||
                  (kind === 'email'
                    ? 'We sent a 6-digit code to this email.'
                    : 'We sent a 6-digit code on WhatsApp to this number.')}
              </p>
              <OtpCodeBoxes
                value={code}
                onChange={(next) => {
                  setCode(next);
                  setError('');
                }}
                onComplete={(next) => void verify(next)}
                disabled={verifying}
                autoFocus
              />
              <button
                type="button"
                onClick={() => void verify()}
                disabled={verifying || code.length !== 6}
                className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${copy.accent}`}
              >
                {verifying ? 'Verifying…' : kind === 'email' ? 'Verify email' : 'Verify mobile'}
              </button>
            </div>
          ) : null}
          <MerchantFieldError message={error} />
          {editing ? (
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setValue(savedValue);
                setCode('');
                setError('');
                setHint('');
                cooldown.clearSent();
              }}
              className="text-sm font-semibold text-[#64748b] hover:text-[#153551]"
            >
              Cancel
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}

export default function MerchantContactVerifyGate({
  businessName,
  email,
  emailVerified,
  mobile,
  mobileVerified,
  onVerified,
  onContinue,
  onLogout,
}: {
  businessName: string;
  email: string;
  emailVerified: boolean;
  mobile: string;
  mobileVerified: boolean;
  onVerified: (contact: VerifiedContact) => void;
  onContinue: () => void;
  onLogout: () => void;
}) {
  const done = emailVerified && mobileVerified;

  return (
    <MerchantAuthPage compactTop>
      <MerchantAuthMain className="pb-16">
        <div className="mx-auto max-w-xl py-6 sm:py-10">
          <div className="mb-6 flex items-center justify-between gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#153551] text-white">
              <ShieldCheck size={24} strokeWidth={2.2} />
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#64748b] transition-colors hover:bg-white/80 hover:text-[#153551]"
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
          <h1 className="text-[1.6rem] font-bold leading-tight tracking-tight text-[#0f273b] sm:text-[1.85rem]">
            Verify your contact details
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[#475569]">
            To keep <span className="font-semibold text-[#153551]">{businessName}</span> secure, confirm the email
            and mobile number on your FinderB Business account. If either is missing or wrong, enter the
            correct one and verify it with the code we send.
          </p>

          <div className="mt-8 space-y-4">
            <ContactVerifyCard kind="email" initialValue={email} verified={emailVerified} onVerified={onVerified} />
            <ContactVerifyCard kind="mobile" initialValue={mobile} verified={mobileVerified} onVerified={onVerified} />
          </div>

          <div className="mt-8">
            <MerchantAuthSubmitButton type="button" onClick={onContinue} disabled={!done}>
              {done ? 'Continue to dashboard' : 'Verify both to continue'}
            </MerchantAuthSubmitButton>
          </div>
        </div>
      </MerchantAuthMain>
    </MerchantAuthPage>
  );
}
