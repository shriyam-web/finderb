'use client';

import { HiOutlineQrCode, HiOutlineStar } from 'react-icons/hi2';

export default function ReviewsVisibilityBanner({
  reviewCount,
  onOpenStudio,
}: {
  reviewCount: number;
  onOpenStudio: () => void;
}) {
  const remaining = Math.max(0, 10 - reviewCount);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#215481]/15 bg-gradient-to-r from-[#0f2a44] via-[#18486f] to-[#215481] p-4 text-white shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#f9d48a]">
            <HiOutlineStar size={12} />
            Higher visibility
          </p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-white [color:#ffffff]">
            {remaining > 0
              ? `${remaining} more review${remaining === 1 ? '' : 's'} to unlock a stronger rank`
              : 'You crossed 10 reviews — keep the momentum'}
          </h3>
          <p className="mt-1 max-w-xl text-sm text-white/75">
            Listings with at least 10 genuine reviews show up more often. Generate your FinderB QR card and
            send a one-tap review link to customers.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenStudio}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#f9d48a] px-4 py-2.5 text-sm font-semibold text-[#153551] hover:bg-[#ffe7b0]"
        >
          <HiOutlineQrCode size={18} />
          Create QR card
        </button>
      </div>
    </div>
  );
}
