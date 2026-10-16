'use client';

import { HiOutlineQrCode } from 'react-icons/hi2';

export default function ReviewsVisibilityBanner({
  reviewCount,
  onOpenStudio,
}: {
  reviewCount: number;
  onOpenStudio: () => void;
}) {
  const remaining = Math.max(0, 10 - reviewCount);

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#FFE8CC] via-[#FFC078] to-[#F59E0B] px-3 py-2.5 text-orange-950">
      <RankVectors />
      <div className="relative flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-orange-900/80">Higher visibility</p>
          <h3 className="text-[13px] font-medium leading-snug text-orange-950">
            {remaining > 0
              ? `${remaining} more review${remaining === 1 ? '' : 's'} to unlock a stronger rank`
              : 'You crossed 10 reviews — keep the momentum'}
          </h3>
        </div>
        <button
          type="button"
          onClick={onOpenStudio}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-700"
        >
          <HiOutlineQrCode size={14} />
          QR card
        </button>
      </div>
    </div>
  );
}

function RankVectors() {
  return (
    <svg
      className="pointer-events-none absolute right-1 top-1/2 h-11 w-28 -translate-y-1/2"
      viewBox="10 8 220 140"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden
    >
      <rect x="150" y="86" width="18" height="46" rx="5" fill="#fff" fillOpacity="0.38" />
      <rect x="174" y="62" width="18" height="70" rx="5" fill="#fff" fillOpacity="0.55" />
      <rect x="198" y="36" width="18" height="96" rx="5" fill="#fff" fillOpacity="0.78" />
      <path
        d="M48 22l5.2 15.6H70l-13.4 9.6 5.1 15.6L48 53.2 34.3 62.8l5.1-15.6L26 37.6h16.8L48 22z"
        fill="#FDE68A"
      />
      <path
        d="M92 14l3.6 10.8H107l-9.2 6.6 3.5 10.8-9.3-6.8-9.3 6.8 3.5-10.8-9.2-6.6h11.4L92 14z"
        fill="#fff"
        fillOpacity="0.88"
      />
      <path
        d="M78 118c16 0 29-9 29-20s-13-20-29-20-29 9-29 20c0 4.6 2.3 8.8 6.2 12.2-.4 6.6-4.6 11.6-4.6 11.6s8.8-1.2 14.2-5c4 .9 8.4 1.2 13.2 1.2z"
        fill="#fff"
        fillOpacity="0.45"
      />
    </svg>
  );
}
