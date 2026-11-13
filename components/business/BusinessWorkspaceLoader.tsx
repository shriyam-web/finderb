'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  SplashAuroraMesh,
  SplashDataStreams,
  SplashDots,
  SplashMetricChips,
  SplashOrbitHub,
  SplashParticleField,
  SplashPerspectiveGrid,
  SplashProgressBar,
  SplashScanLine,
} from '@/components/splash/SplashEffects';

const WORKSPACE_MESSAGES = [
  'Initializing your command center…',
  'Syncing merchant profile & listings…',
  'Loading leads, jobs & insights…',
  'Powering up growth tools…',
  'Almost ready…',
];

export default function BusinessWorkspaceLoader() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(6);

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMessageIndex((i) => (i + 1) % WORKSPACE_MESSAGES.length);
    }, 2000);

    const started = Date.now();
    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - started;
      setProgress(Math.min(96, 6 + Math.round((elapsed / 3000) * 90)));
    }, 40);

    return () => {
      clearInterval(msgTimer);
      clearInterval(progressTimer);
    };
  }, []);

  return (
    <div
      className="business-workspace-loader fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      role="status"
      aria-live="polite"
      aria-label="Loading business workspace"
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(160deg, #060e18 0%, #0f273b 35%, #153551 65%, #1a3f5c 100%)',
        }}
        aria-hidden
      />

      <SplashAuroraMesh variant="business" />
      <SplashPerspectiveGrid />
      <SplashParticleField variant="business" count={32} />
      <SplashDataStreams />
      <SplashScanLine />

      <div className="relative flex w-full max-w-md flex-col items-center px-8">
        <div className="mb-8">
          <SplashOrbitHub variant="business" progress={progress}>
            <Image
              src="/brands/fb-mark-240.png"
              alt="FinderB"
              width={72}
              height={72}
              className="relative h-16 w-16 object-contain"
              priority
            />
          </SplashOrbitHub>
        </div>

        <div className="w-full text-center">
          <p
            className="animate-splash-title-in text-[11px] font-bold uppercase tracking-[0.3em] text-[#f9b864]"
            style={{ animationDelay: '0.1s' }}
          >
            Business
          </p>

          <p
            className="animate-splash-title-in mt-3 text-[1.85rem] font-bold leading-tight tracking-tight text-white md:text-[2.15rem]"
            style={{ animationDelay: '0.2s', opacity: 0 }}
          >
            Your Business Workspace
          </p>

          <p
            className="animate-splash-title-in mt-2 text-sm leading-relaxed text-white/70"
            style={{ animationDelay: '0.3s', opacity: 0 }}
          >
            Leads · Listings · Growth — all in one cockpit
          </p>

          <SplashMetricChips />

          <div
            className="animate-splash-title-in mx-auto mt-8 flex w-full max-w-xs items-center gap-3"
            style={{ animationDelay: '0.55s', opacity: 0 }}
          >
            <SplashProgressBar variant="business" progress={progress} />
            <span className="min-w-[2.5rem] text-right text-xs font-bold tabular-nums text-[#f9b864]">
              {progress}%
            </span>
          </div>

          <SplashDots variant="business" />

          <p
            key={messageIndex}
            className="mt-4 min-h-[1.5rem] text-sm font-medium text-white/85 animate-app-splash-fade-up"
          >
            {WORKSPACE_MESSAGES[messageIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}
