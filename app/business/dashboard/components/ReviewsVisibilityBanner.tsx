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
    <div className="relative overflow-hidden rounded-2xl border border-orange-300/70 bg-gradient-to-br from-[#FFE8CC] via-[#FFC078] to-[#F59E0B] p-4 text-orange-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] sm:p-5">
      <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/25" />
      <div className="pointer-events-none absolute bottom-[-24px] right-24 h-20 w-20 rotate-12 rounded-2xl bg-[#fff4d6]/70" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/45 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-orange-800">
            <HiOutlineStar size={12} />
            Higher visibility
          </p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-orange-950">
            {remaining > 0
              ? `${remaining} more review${remaining === 1 ? '' : 's'} to unlock a stronger rank`
              : 'You crossed 10 reviews — keep the momentum'}
          </h3>
          <p className="mt-1 max-w-xl text-sm text-orange-950/80">
            Listings with at least 10 genuine reviews show up more often. Generate your FinderB QR card and
            send a one-tap review link to customers.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenStudio}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700"
        >
          <HiOutlineQrCode size={18} />
          Create QR card
        </button>
      </div>
    </div>
  );
}
