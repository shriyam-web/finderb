'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

const DEFAULT_STATUS_MESSAGES = [
  'Finding places near you',
  'Checking what’s open',
  'Looking at reviews',
];

export const MERCHANT_PROFILE_LOADER_MESSAGES = [
  'Opening business profile',
  'Fetching photos and details',
  'Loading reviews and location',
];

type LoaderProps = {
  messages?: string[];
  tagline?: string;
  subtitle?: string;
  /** Shown immediately, for example while a route is still suspending. */
  active?: boolean;
};

function BrandLockup() {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/brands/finderb-logo.png"
        alt=""
        width={48}
        height={48}
        priority
        unoptimized
        className="h-12 w-12 shrink-0 object-contain"
      />
      <span className="text-[30px] font-semibold leading-none tracking-tight text-[#153551]">
        FinderB
      </span>
    </div>
  );
}

const Loader = ({
  messages = DEFAULT_STATUS_MESSAGES,
  tagline,
  subtitle,
  active = false,
}: LoaderProps) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const status = messages[messageIndex] || tagline || subtitle || '';

  useEffect(() => {
    setMessageIndex(0);
  }, [messages]);

  useEffect(() => {
    if (messages.length < 2) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [messages]);

  return (
    <div
      className={`finderb-splash${active ? ' finderb-splash--show' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Loading FinderB"
    >
      <BrandLockup />
      <div className="absolute inset-x-0 bottom-[max(2.75rem,env(safe-area-inset-bottom))] flex flex-col items-center">
        <span
          className="h-5 w-5 animate-spin rounded-full border-2 border-[#d5e2ee] border-t-[#215481]"
          aria-hidden
        />
        {status ? (
          <p className="mt-3 text-[13px] font-medium text-[#8b97a3]">{status}</p>
        ) : null}
      </div>
    </div>
  );
};

export default Loader;
