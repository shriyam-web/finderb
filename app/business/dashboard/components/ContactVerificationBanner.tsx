'use client';

import { HiOutlineShieldExclamation } from 'react-icons/hi2';

type ContactVerificationBannerProps = {
  emailVerified: boolean;
  mobileVerified: boolean;
  onVerify: () => void;
};

export default function ContactVerificationBanner({
  emailVerified,
  mobileVerified,
  onVerify,
}: ContactVerificationBannerProps) {
  const pending = [!emailVerified && 'email', !mobileVerified && 'mobile number'].filter(Boolean) as string[];
  if (pending.length === 0) return null;

  const title = `Verify your ${pending.join(' and ')} — your visibility will drop until you do`;

  return (
    <div className="relative h-full overflow-hidden rounded-2xl border border-amber-300/80 bg-gradient-to-br from-[#FFF3C4] via-[#FFD56A] to-[#F59E0B] px-4 py-3 text-amber-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
      <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/30" />
      <div className="pointer-events-none absolute -bottom-8 right-24 h-24 w-24 rotate-12 rounded-3xl bg-[#fff7d1]/70" />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <HiOutlineShieldExclamation size={20} className="mt-0.5 shrink-0 text-amber-800" />
          <div className="min-w-0">
            <p className="text-sm font-bold">{title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-amber-950/80">
              Unverified listings rank lower in search and get fewer calls and leads. Confirm{' '}
              {pending.length > 1 ? 'them' : 'it'} with a one-time code today — it takes under a minute, and you can
              correct a wrong {pending.length > 1 ? 'value' : pending[0]} while verifying.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onVerify}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
        >
          Verify now
        </button>
      </div>
    </div>
  );
}
