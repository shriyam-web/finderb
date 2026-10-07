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

  const title = `Verify your ${pending.join(' and ')}`;

  return (
    <div className="h-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <HiOutlineShieldExclamation size={20} className="mt-0.5 shrink-0 text-amber-700" />
          <div className="min-w-0">
            <p className="text-sm font-bold">{title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-amber-900/90">
              Confirm {pending.length > 1 ? 'them' : 'it'} with a one-time code so login codes, invoices and lead
              alerts reach you. If it is missing or wrong, you can update it while verifying.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onVerify}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#153551] px-4 py-2 text-sm font-semibold text-white hover:bg-[#215481]"
        >
          Verify now
        </button>
      </div>
    </div>
  );
}
