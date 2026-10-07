'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Smartphone } from 'lucide-react';
import UserAuthShell, { UserAuthTrustRow } from '@/components/auth/UserAuthShell';
import OtpCodeBoxes from '@/components/auth/OtpCodeBoxes';
import IndianPhoneInput from '@/components/IndianPhoneInput';
import { getSession, logoutUser } from '@/app/actions/user';
import { confirmMyPhoneOtp, sendMyPhoneOtp, updateMyProfile } from '@/app/actions/userProfile';
import { otpSendLabel, useOtpCooldown } from '@/hooks/useOtpCooldown';
import { getSafeRedirectPath } from '@/lib/authRedirect';
import { isValidIndianMobileDigits } from '@/lib/indianPhone';
import { needsMobileNumber, VERIFY_MOBILE_PATH } from '@/lib/mobileGate';
import { isSyntheticLoginEmail } from '@/lib/syntheticLoginEmail';

function VerifyPhoneContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = getSafeRedirectPath(searchParams.get('next'), '/');
  const next = requested.startsWith(VERIFY_MOBILE_PATH) ? '/' : requested;
  const otp = useOtpCooldown();
  const [ready, setReady] = useState(false);
  const [account, setAccount] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    void getSession().then((session) => {
      if (!live) return;
      if (!session?.success) {
        router.replace(`/login?redirect=${encodeURIComponent(next)}`);
        return;
      }
      if (!needsMobileNumber(session.user)) {
        router.replace(next);
        return;
      }
      const email = session.user?.email;
      setAccount(email && !isSyntheticLoginEmail(email) ? email : session.user?.fullName || '');
      setReady(true);
    });
    return () => {
      live = false;
    };
  }, [next, router]);

  const valid = isValidIndianMobileDigits(phone);
  const sent = otp.isSentTo(phone);
  const waiting = otp.isWaiting(phone);

  const sendCode = async () => {
    if (!valid || waiting || sending) return;
    setSending(true);
    setError('');
    setCode('');
    const result = await sendMyPhoneOtp(phone);
    setSending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    otp.markSent(phone);
  };

  const verify = async (entered: string) => {
    if (entered.length !== 6 || verifying) return;
    setVerifying(true);
    setError('');
    const proof = await confirmMyPhoneOtp(phone, entered);
    if (!proof.success) {
      setVerifying(false);
      setCode('');
      setError(proof.error);
      return;
    }
    const saved = await updateMyProfile({
      phone: proof.phone,
      phoneVerificationToken: proof.phoneVerificationToken,
    });
    if (!saved.success) {
      setVerifying(false);
      setError(saved.error);
      return;
    }
    setDone(true);
    // A full load so every header and gate reads the updated session.
    window.location.replace(next);
  };

  const signOut = async () => {
    await logoutUser();
    window.location.replace('/');
  };

  if (!ready) {
    return (
      <div className="flex min-h-[calc(100dvh-5rem-6.75rem)] items-center justify-center bg-[#eef3f9] pt-24 lg:min-h-[calc(100dvh-5rem)]">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#215481] border-t-transparent" />
      </div>
    );
  }

  return (
    <UserAuthShell
      mode="verify"
      footer={
        <div className="space-y-4 border-t border-slate-100 pt-6">
          <p className="text-center text-sm text-slate-500">
            Not you?{' '}
            <button
              type="button"
              onClick={() => void signOut()}
              className="font-semibold text-[#215481] transition-colors hover:text-[#1a4367]"
            >
              Sign out
            </button>
          </p>
          <UserAuthTrustRow />
        </div>
      }
    >
      <div className="mb-7">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#215481]/10 text-[#215481]">
          <Smartphone size={22} />
        </span>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#0f273b]">Verify your mobile</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          {account ? (
            <>
              You&apos;re signed in as <span className="font-medium text-slate-700">{account}</span>. Add
              your mobile number to finish setting up your account.
            </>
          ) : (
            'Add your mobile number to finish setting up your account.'
          )}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <IndianPhoneInput
              id="verify-phone"
              value={phone}
              onChange={(digits) => {
                setPhone(digits);
                setCode('');
                setError('');
              }}
              autoFocus
              variant="account"
              disabled={verifying || done}
            />
          </div>
          <button
            type="button"
            onClick={() => void sendCode()}
            disabled={!valid || waiting || sending || verifying || done}
            className="h-12 shrink-0 rounded-xl bg-[#128C7E] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0f7a6e] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? 'Sending…' : otpSendLabel(sent, waiting, otp.secondsLeft)}
          </button>
        </div>
        <p className="text-xs text-slate-500">We send a 6-digit code on WhatsApp to confirm the number is yours.</p>

        {sent ? (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">
              Enter the code sent to WhatsApp on +91 {phone.slice(0, 5)} {phone.slice(5)}
            </p>
            <OtpCodeBoxes
              value={code}
              onChange={(value) => {
                setCode(value);
                setError('');
              }}
              onComplete={(value) => void verify(value)}
              disabled={verifying || done}
              autoFocus
              tone="whatsapp"
            />
            <button
              type="button"
              onClick={() => void verify(code)}
              disabled={code.length !== 6 || verifying || done}
              className="h-11 w-full rounded-xl bg-[#215481] text-sm font-semibold text-white transition-colors hover:bg-[#1a4367] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {verifying ? 'Verifying…' : 'Verify and continue'}
            </button>
          </div>
        ) : null}

        {error ? (
          <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
        {done ? (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <span>Mobile verified. Taking you back…</span>
          </div>
        ) : null}
      </div>
    </UserAuthShell>
  );
}

function VerifyPhoneFallback() {
  return (
    <div className="flex min-h-[calc(100dvh-5rem-6.75rem)] items-center justify-center bg-[#eef3f9] pt-24 lg:min-h-[calc(100dvh-5rem)]">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#215481] border-t-transparent" />
    </div>
  );
}

export default function VerifyPhonePage() {
  return (
    <Suspense fallback={<VerifyPhoneFallback />}>
      <VerifyPhoneContent />
    </Suspense>
  );
}
