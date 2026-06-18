'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { BUSINESS_ONBOARDING_MESSAGES } from '@/lib/businessOnboarding';

type BusinessOnboardingLoaderProps = {
  onComplete: () => void;
};

const MESSAGE_INTERVAL_MS = 2000;
const MIN_DURATION_MS = 11000;

export default function BusinessOnboardingLoader({ onComplete }: BusinessOnboardingLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const started = Date.now();
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      onComplete();
    };

    const msgTimer = setInterval(() => {
      setMessageIndex((i) => {
        const next = (i + 1) % BUSINESS_ONBOARDING_MESSAGES.length;
        if (next === 0 && Date.now() - started >= MIN_DURATION_MS) {
          finish();
        }
        return next;
      });
    }, MESSAGE_INTERVAL_MS);

    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - started;
      setProgress(Math.min(100, 8 + Math.round((elapsed / MIN_DURATION_MS) * 92)));
      if (elapsed >= MIN_DURATION_MS) finish();
    }, 50);

    const hardStop = setTimeout(finish, MIN_DURATION_MS + 400);

    return () => {
      clearInterval(msgTimer);
      clearInterval(progressTimer);
      clearTimeout(hardStop);
    };
  }, [onComplete]);

  return (
    <div
      className="finderb-splash-v2 fixed inset-0 z-[9999] flex flex-col overflow-hidden"
      role="status"
      aria-live="polite"
      aria-label="Setting up your business dashboard"
    >
      <div className="finderb-splash-v2-bg pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute -left-24 top-16 h-80 w-80 rounded-full bg-[#f9b864]/20 blur-[90px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-[#215481]/12 blur-[80px]"
        aria-hidden
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 pb-24">
        <div className="finderb-splash-v2-logo-stage flex flex-col items-center">
          <Image
            src="/businesslogo.png"
            alt="FinderB Business"
            width={200}
            height={56}
            className="h-auto w-[min(200px,70vw)] object-contain"
            priority
          />
          <p className="finderb-splash-v2-eyebrow mt-8 text-[11px] font-bold uppercase tracking-[0.32em] text-[#215481]">
            Welcome aboard
          </p>
          <h2 className="merchant-auth-form-title mt-3 text-center text-2xl font-bold sm:text-[1.65rem]">
            Building your workspace
          </h2>
          <p className="finderb-splash-v2-sub mt-2 max-w-sm text-center text-[15px]">
            We&apos;re preparing everything you need to grow on FinderB.
          </p>
        </div>
      </div>

      <div className="finderb-splash-v2-footer relative z-10 px-8 pb-10 sm:pb-12">
        <p
          key={messageIndex}
          className="finderb-splash-v2-message mb-5 text-center text-sm font-semibold text-[#3d4f63]"
        >
          {BUSINESS_ONBOARDING_MESSAGES[messageIndex]}
        </p>
        <div className="mx-auto h-1.5 max-w-md overflow-hidden rounded-full bg-[#e8edf2]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#153551] via-[#215481] to-[#f9b864] transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
