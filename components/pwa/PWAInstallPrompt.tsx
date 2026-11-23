'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { initInstallPromptCapture, isMobileDevice, isStandaloneMode } from '@/lib/pwa';

const DISMISS_KEY = 'finderb-app-soon-dismissed-until';
const DISMISS_DAYS = 7;

function dismissedForNow() {
  try {
    const until = localStorage.getItem(DISMISS_KEY);
    return Boolean(until && Date.now() < Number(until));
  } catch {
    return false;
  }
}

export default function PWAInstallPrompt({ appReady = true }: { appReady?: boolean }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const isDashboard = pathname?.includes('/dashboard') ?? false;

  useEffect(() => {
    initInstallPromptCapture();
  }, []);

  useEffect(() => {
    if (!appReady || isDashboard || isStandaloneMode() || !isMobileDevice() || dismissedForNow()) {
      setVisible(false);
      return;
    }
    setVisible(true);
  }, [appReady, isDashboard, pathname]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] z-[10000] px-3 md:hidden">
      <div className="relative mx-auto max-w-lg overflow-hidden rounded-[1.4rem] bg-[#07080c] p-px shadow-[0_18px_50px_rgba(0,0,0,0.5)]">
        <div
          className="pointer-events-none absolute -inset-8 animate-app-orbit bg-[conic-gradient(from_120deg,transparent_0deg,#f9b864_40deg,transparent_80deg,transparent_360deg)] opacity-80"
          aria-hidden
        />
        <div className="relative overflow-hidden rounded-[1.32rem] bg-[#07080c]">
          <div className="pointer-events-none absolute -left-6 -top-10 h-24 w-24 rounded-full bg-[#f9b864]/35 blur-2xl" aria-hidden />
          <div
            className="pointer-events-none absolute inset-0 animate-coming-soon-shimmer bg-[linear-gradient(110deg,transparent_30%,rgba(249,184,100,0.18)_48%,transparent_66%)] bg-[length:220%_100%]"
            aria-hidden
          />
          <div className="relative flex items-center gap-3 px-3.5 py-3.5">
            <div className="relative shrink-0">
              <span className="absolute inset-0 animate-pulse rounded-2xl bg-[#f9b864]/35 blur-md" aria-hidden />
              <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] ring-1 ring-[#f9b864]/70">
                <Image
                  src="/brands/finderb-logo.png"
                  alt=""
                  width={34}
                  height={34}
                  unoptimized
                  className="h-[34px] w-[34px] object-contain"
                />
              </span>
            </div>
            <div className="min-w-0 flex-1" style={{ fontFamily: 'var(--font-outfit), Outfit, sans-serif' }}>
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f9b864]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f9b864] opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#f9b864]" />
                </span>
                Coming soon
              </p>
              <p className="mt-0.5 truncate text-[17px] font-semibold leading-none tracking-[-0.03em] !text-white">
                The FinderB app
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#f9b864] px-2.5 py-1.5 text-[11px] font-semibold text-[#1a1208]">
                <svg width="9" height="10" viewBox="0 0 9 10" aria-hidden>
                  <path d="M1.2 0.6L8.2 5L1.2 9.4Z" fill="currentColor" />
                </svg>
                Play
              </span>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000));
                  } catch {
                    /* ignore */
                  }
                  setVisible(false);
                }}
                aria-label="Dismiss"
                className="rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
