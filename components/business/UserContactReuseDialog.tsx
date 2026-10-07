'use client';

import { useEffect } from 'react';
import { HiOutlineExclamationTriangle } from 'react-icons/hi2';

export type ReusableContact = { kind: 'email' | 'mobile'; value: string };

export default function UserContactReuseDialog({
  contact,
  onUseSame,
  onUseDifferent,
}: {
  contact: ReusableContact;
  onUseSame: () => void;
  onUseDifferent: () => void;
}) {
  const label = contact.kind === 'email' ? 'email' : 'mobile number';
  const shown = contact.kind === 'email' ? contact.value : `+91 ${contact.value.slice(0, 5)} ${contact.value.slice(5)}`;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onUseDifferent();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onUseDifferent]);

  return (
    <div
      className="fixed inset-0 z-[10100] flex items-center justify-center bg-[#0f172a]/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-reuse-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <HiOutlineExclamationTriangle size={22} />
          </span>
          <div className="min-w-0">
            <h2 id="contact-reuse-title" className="text-base font-bold text-[#0f172a]">
              This {label} is already in use
            </h2>
            <p className="mt-1 break-words text-sm leading-relaxed text-[#475569]">
              <span className="font-semibold text-[#0f172a]">{shown}</span> is already used by a FinderB user
              account. Do you want to use the same {label} for your business?
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[#64748b]">
              One {label} can only have one FinderB account. Your user account will be converted into this business
              account, and its saved items will be removed. You will verify this {label} with an OTP first.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onUseDifferent}
            className="rounded-xl border border-[#e2e8f0] px-4 py-2.5 text-sm font-semibold text-[#334155] hover:bg-[#f8fafc]"
          >
            Use a different {label}
          </button>
          <button
            type="button"
            onClick={onUseSame}
            autoFocus
            className="rounded-xl bg-[#153551] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#215481]"
          >
            Yes, use the same
          </button>
        </div>
      </div>
    </div>
  );
}
