'use client';

import { useEffect, useRef, useState } from 'react';
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
};

function BrandLockup() {
  const wordRef = useRef<HTMLSpanElement>(null);
  const [wordWidth, setWordWidth] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const word = wordRef.current;
    if (!word) return;
    const width = Math.ceil(word.getBoundingClientRect().width);
    if (!width) return;
    setWordWidth(width);
    const frame = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const gap = 10;
  const shift = wordWidth ? (open ? 0 : (wordWidth + gap) / 2) : 0;

  return (
    <div
      className="relative flex items-center"
      style={{
        gap,
        fontFamily: 'var(--font-outfit), Outfit, sans-serif',
        transform: wordWidth ? `translateX(${shift}px)` : undefined,
        opacity: wordWidth ? 1 : 0,
        transition: 'transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <Image
        src="/brands/finderb-logo.png"
        alt=""
        width={52}
        height={52}
        priority
        unoptimized
        className="h-[52px] w-[52px] shrink-0 object-contain"
      />
      <span
        ref={wordRef}
        className="pointer-events-none absolute whitespace-nowrap pr-1 text-[34px] font-extrabold leading-none tracking-[-0.03em] opacity-0"
        aria-hidden
      >
        FinderB
      </span>
      <span
        className="inline-block overflow-hidden"
        style={{
          width: open ? wordWidth : 0,
          transition: 'width 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <span className="inline-block whitespace-nowrap pr-1 text-[34px] font-extrabold leading-none tracking-[-0.03em] text-[#0f273b]">
          FinderB
        </span>
      </span>
    </div>
  );
}

const Loader = ({
  messages = DEFAULT_STATUS_MESSAGES,
  tagline,
  subtitle,
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
      role="status"
      aria-live="polite"
      aria-label="Loading FinderB"
    >
      <div className="flex flex-col items-center">
        <BrandLockup />
        <span
          className="mt-8 h-5 w-5 animate-spin rounded-full border-2 border-[#d5e2ee] border-t-[#215481]"
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
