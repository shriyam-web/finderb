'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { BadgeCheck } from 'lucide-react';

export const VERIFIED_BADGE_LABEL = 'Verified on FinderB';
export const VERIFIED_BADGE_DESCRIPTION =
  'FinderB has confirmed this business\'s identity and listing details.';

export function VerifiedNameTick({
  className = '',
  size = 16,
}: {
  className?: string;
  size?: number;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  return (
    <span ref={rootRef} className={`group/verified relative inline-flex shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((visible) => !visible)}
        className="inline-flex cursor-help rounded-full text-emerald-600 transition-colors hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-1"
        aria-label={VERIFIED_BADGE_LABEL}
        aria-describedby={tooltipId}
        aria-expanded={open}
        title={`${VERIFIED_BADGE_LABEL}. ${VERIFIED_BADGE_DESCRIPTION}`}
      >
        <BadgeCheck size={size} strokeWidth={2} className="shrink-0" />
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className={`pointer-events-none absolute bottom-[calc(100%+0.45rem)] left-1/2 z-30 w-max max-w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2 rounded-md border border-neutral-200 bg-neutral-900 px-2.5 py-2 text-left shadow-md transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0 group-hover/verified:opacity-100 group-focus-within/verified:opacity-100'
        }`}
      >
        <span className="block text-[10px] font-semibold leading-snug text-white">{VERIFIED_BADGE_LABEL}</span>
        <span className="mt-0.5 block text-[10px] font-normal leading-snug text-neutral-200">
          {VERIFIED_BADGE_DESCRIPTION}
        </span>
        <span
          className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-neutral-900"
          aria-hidden
        />
      </span>
    </span>
  );
}
