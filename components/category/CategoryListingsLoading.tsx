'use client';

import { useEffect, useState } from 'react';

const LOADING_MESSAGES = [
  'Finding nearby businesses…',
  'Sorting open businesses first…',
  'Checking the best matches…',
  'Almost ready…',
];

function MerchantCardSkeleton({ delayMs = 0 }: { delayMs?: number }) {
  return (
    <div
      className="flex animate-app-stagger-in items-start gap-2.5 rounded-xl bg-white p-2 opacity-0 ring-1 ring-slate-200/70"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-[104px] sm:w-[104px]">
        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
        <div className="h-3.5 w-[72%] overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-1/2 animate-shimmer bg-gradient-to-r from-transparent via-white/80 to-transparent" />
        </div>
        <div className="h-2.5 w-[42%] overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-1/2 animate-shimmer bg-gradient-to-r from-transparent via-white/80 to-transparent" />
        </div>
        <div className="mt-1 h-2 w-[88%] overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-1/2 animate-shimmer bg-gradient-to-r from-transparent via-white/80 to-transparent" />
        </div>
        <div className="h-2 w-[64%] overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-1/2 animate-shimmer bg-gradient-to-r from-transparent via-white/80 to-transparent" />
        </div>
        <div className="mt-auto flex justify-end gap-1.5 pt-1">
          <div className="h-4 w-14 overflow-hidden rounded bg-slate-100">
            <div className="h-full w-1/2 animate-shimmer bg-gradient-to-r from-transparent via-white/80 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CategoryListingsLoading({
  columns = 1,
}: {
  columns?: 1 | 2;
}) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1600);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="space-y-2.5" aria-busy="true" aria-live="polite">
      <div className="relative overflow-hidden rounded-xl bg-white px-3 py-3.5 ring-1 ring-slate-200/70">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-slate-100">
          <div className="h-full w-1/3 animate-shimmer bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/15 [animation-duration:1.4s]" />
            <span className="absolute inset-1 rounded-full bg-primary/10" />
            <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-primary shadow-sm shadow-primary/30">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p
              key={messageIndex}
              className="animate-app-reveal-up font-categories text-[13px] font-medium tracking-tight text-slate-700"
            >
              {LOADING_MESSAGES[messageIndex]}
            </p>
            <div className="mt-1.5 flex items-center gap-1">
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="h-1.5 w-1.5 rounded-full bg-primary/70"
                  style={{
                    animation: 'app-splash-dot 1.05s ease-in-out infinite',
                    animationDelay: `${dot * 0.16}s`,
                  }}
                />
              ))}
              <span className="ml-1.5 font-categories text-[10px] font-normal text-slate-400">
                Please wait a moment
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 gap-2 ${columns === 2 ? 'lg:grid-cols-2' : ''}`}
      >
        {[0, 1, 2, 3].map((i) => (
          <MerchantCardSkeleton key={i} delayMs={i * 70} />
        ))}
      </div>
    </div>
  );
}
