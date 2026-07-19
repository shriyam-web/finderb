'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BadgeCheck } from 'lucide-react';

export const VERIFIED_BADGE_LABEL = 'Verified on FinderB';
export const VERIFIED_BADGE_DESCRIPTION =
  'FinderB has confirmed this business\'s identity and listing details.';

export const VERIFIED_USER_LABEL = 'Verified user';
export const VERIFIED_USER_DESCRIPTION =
  'This reviewer signed in to FinderB before posting their review.';

export function VerifiedUserTick({
  className = '',
  size = 14,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={`inline-flex shrink-0 text-sky-600 ${className}`}
      title={`${VERIFIED_USER_LABEL}. ${VERIFIED_USER_DESCRIPTION}`}
      aria-label={`${VERIFIED_USER_LABEL}. ${VERIFIED_USER_DESCRIPTION}`}
    >
      <BadgeCheck size={size} strokeWidth={2} className="shrink-0" />
    </span>
  );
}

export function VerifiedNameTick({
  className = '',
  size = 16,
}: {
  className?: string;
  size?: number;
}) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();
  const visible = open || hovered;

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!visible || !rootRef.current) {
      setCoords(null);
      return;
    }

    const updatePosition = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCoords({
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [visible]);

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

  const tooltip =
    mounted && visible && coords
      ? createPortal(
          <span
            id={tooltipId}
            role="tooltip"
            className="pointer-events-none fixed z-[10050] w-max max-w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-full rounded-md border border-neutral-200 bg-neutral-900 px-2.5 py-2 text-left shadow-md"
            style={{ top: coords.top, left: coords.left }}
          >
            <span className="block text-[10px] font-semibold leading-snug text-white">
              {VERIFIED_BADGE_LABEL}
            </span>
            <span className="mt-0.5 block text-[10px] font-normal leading-snug text-neutral-200">
              {VERIFIED_BADGE_DESCRIPTION}
            </span>
            <span
              className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-neutral-900"
              aria-hidden
            />
          </span>,
          document.body
        )
      : null;

  return (
    <span
      ref={rootRef}
      className={`relative inline-flex shrink-0 ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className="inline-flex cursor-help rounded-full text-emerald-600 transition-colors hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-1"
        aria-label={VERIFIED_BADGE_LABEL}
        aria-describedby={tooltipId}
        aria-expanded={open}
        title={`${VERIFIED_BADGE_LABEL}. ${VERIFIED_BADGE_DESCRIPTION}`}
      >
        <BadgeCheck size={size} strokeWidth={2} className="shrink-0" />
      </button>
      {tooltip}
    </span>
  );
}

/**
 * Renders a wrapping business name with the verified tick glued to the last word,
 * so the icon never orphans onto its own line when there is leftover space.
 */
export function VerifiedBusinessName({
  name,
  verified,
  tickSize = 14,
  className = '',
  tickClassName = 'ml-1 inline-flex translate-y-[1px] align-text-bottom',
}: {
  name: string;
  verified: boolean;
  tickSize?: number;
  className?: string;
  tickClassName?: string;
}) {
  const trimmed = name.trim();
  if (!verified || !trimmed) {
    return <span className={className}>{name}</span>;
  }

  const parts = trimmed.split(/\s+/);
  const lastWord = parts.pop() ?? trimmed;
  const head = parts.join(' ');

  return (
    <span className={className}>
      {head ? `${head} ` : null}
      <span className="whitespace-nowrap">
        {lastWord}
        <VerifiedNameTick size={tickSize} className={tickClassName} />
      </span>
    </span>
  );
}
