'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

const DEFAULT_STATUS_MESSAGES = [
  'Curating local excellence for you…',
  'Finding verified businesses nearby…',
  'Loading top destinations…',
  'Almost ready…',
];

export const MERCHANT_PROFILE_LOADER_MESSAGES = [
  'Opening business profile…',
  'Fetching photos and details…',
  'Loading reviews and location…',
  'Almost ready…',
];

type LoaderProps = {
  messages?: string[];
  tagline?: string;
  subtitle?: string;
};

const Loader = ({
  messages = DEFAULT_STATUS_MESSAGES,
  tagline,
  subtitle = 'Find trusted businesses and services in your city.',
}: LoaderProps) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    setMessageIndex(0);
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [messages]);

  return (
    <div
      className="finderb-splash-v2 fixed inset-0 z-[9999] flex flex-col overflow-hidden"
      role="status"
      aria-live="polite"
      aria-label="Loading FinderB"
    >
      {/* Ambient layers */}
      <div className="finderb-splash-v2-bg pointer-events-none absolute inset-0" aria-hidden />
      <div className="finderb-splash-v2-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="finderb-splash-v2-orb pointer-events-none absolute" aria-hidden />
      <div className="finderb-splash-v2-sweep pointer-events-none absolute inset-0" aria-hidden />

      {/* Discovery rings — centered on logo */}
      <div
        className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2"
        aria-hidden
      >
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="finderb-splash-v2-ring absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ animationDelay: `${i * 0.9}s` }}
          />
        ))}
      </div>

      {/* Hero */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 pb-28">
        <div className="finderb-splash-v2-logo-stage relative flex flex-col items-center">
          <div className="finderb-splash-v2-logo-glow pointer-events-none absolute inset-0" aria-hidden />

          <div className="finderb-splash-v2-logo-wrap relative">
            <Image
              src="/brands/fb-mark-240.png"
              alt="FinderB"
              width={112}
              height={112}
              className="relative z-10 h-28 w-28 object-contain drop-shadow-[0_4px_24px_rgba(21,53,81,0.12)]"
              priority
            />
          </div>

          <div className="finderb-splash-v2-accent-line" aria-hidden />

          {tagline ? (
            <p className="finderb-splash-v2-eyebrow mt-8 text-[11px] font-bold uppercase tracking-[0.38em] text-zinc-500">
              {tagline}
            </p>
          ) : null}
          <p
            className={`finderb-splash-v2-sub text-center text-[15px] font-medium leading-relaxed tracking-wide text-zinc-500 ${
              tagline ? 'mt-3' : 'mt-8'
            }`}
          >
            {subtitle}
          </p>
        </div>
      </div>

      {/* Bottom status */}
      <div className="finderb-splash-v2-footer relative z-10 px-8 pb-10 sm:pb-12">
        <p
          key={messageIndex}
          className="finderb-splash-v2-message mb-5 text-center text-sm font-medium text-zinc-600"
        >
          {messages[messageIndex]}
        </p>
        <div className="finderb-splash-v2-progress-track mx-auto h-[3px] max-w-xs overflow-hidden rounded-full bg-zinc-200/90">
          <div className="finderb-splash-v2-progress-bar h-full rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default Loader;
