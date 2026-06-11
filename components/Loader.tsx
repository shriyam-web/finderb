'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

const STATUS_MESSAGES = [
  'Curating local excellence for you...',
  'Finding verified businesses nearby...',
  'Loading top destinations...',
  'Almost ready...',
];

const Loader = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-white via-primary-50/40 to-secondary-50/30">
      {/* Ambient background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-1/4 h-72 w-72 animate-[pulse_6s_ease-in-out_infinite] rounded-full bg-primary-200/30 blur-3xl" />
        <div className="absolute -right-16 bottom-1/4 h-80 w-80 animate-[pulse_8s_ease-in-out_infinite_1s] rounded-full bg-secondary-200/35 blur-3xl" />
        <div className="absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 animate-[pulse_7s_ease-in-out_infinite_0.5s] rounded-full bg-primary-100/40 blur-3xl" />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(33,84,129,1) 1px, transparent 1px), linear-gradient(90deg, rgba(33,84,129,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative flex flex-col items-center px-6">
        {/* Orbital rings */}
        <div className="relative mb-10 flex h-44 w-44 items-center justify-center">
          <div className="absolute inset-0 animate-spin-slow rounded-full border border-dashed border-primary-200/60" />
          <div className="absolute inset-3 animate-[spin_12s_linear_infinite_reverse] rounded-full border border-primary-300/30" />
          <div className="absolute inset-6 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full bg-primary-100/20" />

          {/* Logo card */}
          <div className="relative flex h-28 w-28 items-center justify-center rounded-2xl border border-white/80 bg-white/90 p-4 shadow-premium backdrop-blur-sm animate-float ring-1 ring-primary-100/80">
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            </div>
            <Image
              src="/icon.png"
              alt="FinderB Logo"
              width={96}
              height={96}
              className="relative h-auto w-full object-contain drop-shadow-sm"
              priority
            />
          </div>
        </div>

        {/* Brand & progress */}
        <div className="text-center">
          <h2 className="mb-1 text-3xl font-bold tracking-tight text-primary-800">
            Finder<span className="bg-gradient-to-r from-secondary-500 to-secondary-400 bg-clip-text text-transparent">B</span>
          </h2>
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-primary-400">
            Discover Local
          </p>

          {/* Progress bar */}
          <div className="relative mx-auto h-1.5 w-56 overflow-hidden rounded-full bg-primary-100/80">
            <div className="absolute inset-y-0 left-0 w-1/3 animate-[loader-progress_2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-primary-500 via-secondary-400 to-primary-600" />
          </div>

          {/* Bouncing dots */}
          <div className="mt-5 flex items-center justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-primary-400"
                style={{
                  animation: 'loader-dot 1.4s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>

          {/* Cycling status message */}
          <p
            key={messageIndex}
            className="mt-5 min-h-[1.25rem] text-sm font-medium text-primary-600/80 animate-[fade-in_0.4s_ease-out]"
          >
            {STATUS_MESSAGES[messageIndex]}
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes loader-progress {
          0% { left: -33%; width: 33%; }
          50% { left: 33%; width: 50%; }
          100% { left: 100%; width: 33%; }
        }
        @keyframes loader-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Loader;
