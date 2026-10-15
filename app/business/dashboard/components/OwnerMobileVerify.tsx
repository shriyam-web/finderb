'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import OtpCodeBoxes from '@/components/auth/OtpCodeBoxes';
import { otpSendLabel, useOtpCooldown } from '@/hooks/useOtpCooldown';
import { confirmMerchantOwnerMobileOtp, sendMerchantOwnerMobileOtp } from '@/app/actions/merchantContact';

/** Shown under the owner mobile field once it differs from a number already on the account. */
export default function OwnerMobileVerify({
  mobile,
  verified,
  onVerified,
}: {
  mobile: string;
  verified: boolean;
  onVerified: (mobile: string, token: string) => void;
}) {
  const cooldown = useOtpCooldown();
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const sent = cooldown.isSentTo(mobile);
  const wait = cooldown.isWaiting(mobile) ? cooldown.secondsLeft : 0;

  if (verified) {
    return (
      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2 size={14} strokeWidth={2.5} />
        Verified on WhatsApp. Save to keep it.
      </p>
    );
  }

  const send = async () => {
    if (sending || wait > 0) return;
    setSending(true);
    setError('');
    try {
      const result = await sendMerchantOwnerMobileOtp(mobile);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setCode('');
      setHint(result.message);
      cooldown.markSent(mobile);
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
      const result = await confirmMerchantOwnerMobileOtp(mobile, entered);
      if (!result.success) {
        setCode('');
        setError(result.error);
        return;
      }
      cooldown.clearSent();
      onVerified(result.value, result.ownerMobileVerificationToken);
    } catch {
      setError('Could not verify the code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs leading-relaxed text-zinc-600">
          This is a new number. Confirm it with a code on WhatsApp before saving.
        </p>
        <button
          type="button"
          onClick={() => void send()}
          disabled={sending || wait > 0}
          className="shrink-0 rounded-lg bg-[#128C7E] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#0f7a6e] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? 'Sending…' : otpSendLabel(sent, wait > 0, wait)}
        </button>
      </div>
      {sent ? (
        <div className="space-y-3">
          {hint ? <p className="text-center text-xs text-zinc-600">{hint}</p> : null}
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
            className="w-full rounded-lg bg-[#27272A] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#18181B] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {verifying ? 'Verifying…' : 'Verify mobile'}
          </button>
        </div>
      ) : null}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
