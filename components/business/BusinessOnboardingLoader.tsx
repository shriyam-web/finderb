'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { BUSINESS_ONBOARDING_MESSAGES } from '@/lib/businessOnboarding';
import { SplashOrbitHub } from '@/components/splash/SplashEffects';

type BusinessOnboardingLoaderProps = {
  onComplete: () => void;
};

const MESSAGE_INTERVAL_MS = 2000;
const MIN_DURATION_MS = 11000;
const WELCOME_HOLD_MS = 1600;

export default function BusinessOnboardingLoader({ onComplete }: BusinessOnboardingLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(8);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const started = Date.now();
    let finished = false;
    let welcomeTimer: ReturnType<typeof setTimeout> | null = null;

    const finish = () => {
      if (finished) return;
      finished = true;
      onComplete();
    };

    const enterWelcome = () => {
      if (finished || welcomeTimer) return;
      setProgress(100);
      setMessageIndex(BUSINESS_ONBOARDING_MESSAGES.length - 1);
      setShowWelcome(true);
      welcomeTimer = setTimeout(finish, WELCOME_HOLD_MS);
    };

    const msgTimer = setInterval(() => {
      setMessageIndex((i) => Math.min(i + 1, BUSINESS_ONBOARDING_MESSAGES.length - 1));
    }, MESSAGE_INTERVAL_MS);

    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - started;
      setProgress(Math.min(100, 8 + Math.round((elapsed / MIN_DURATION_MS) * 92)));
      if (elapsed >= MIN_DURATION_MS) {
        clearInterval(msgTimer);
        clearInterval(progressTimer);
        enterWelcome();
      }
    }, 50);

    const hardStop = setTimeout(() => {
      clearInterval(msgTimer);
      clearInterval(progressTimer);
      enterWelcome();
    }, MIN_DURATION_MS + 400);

    return () => {
      clearInterval(msgTimer);
      clearInterval(progressTimer);
      clearTimeout(hardStop);
      if (welcomeTimer) clearTimeout(welcomeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col overflow-hidden"
      role="status"
      aria-live="polite"
      aria-label={
        showWelcome ? 'Welcome to FinderB Business' : 'Setting up your business dashboard'
      }
    >
      {/* Ink + porcelain field */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 50% 18%, #ffffff 0%, #eef3f8 38%, #d8e3ef 68%, #b8c9db 100%)',
        }}
        aria-hidden
      />

      {/* Deep corner ink washes */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 50% at -5% 105%, rgba(10,21,32,0.55) 0%, transparent 58%), radial-gradient(ellipse 50% 45% at 105% -5%, rgba(15,39,59,0.42) 0%, transparent 55%), radial-gradient(ellipse 40% 35% at 100% 100%, rgba(33,84,129,0.28) 0%, transparent 50%)',
        }}
        aria-hidden
      />

      {/* Slow luminous aurora — ice + steel */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-[20%] top-[8%] h-[55vh] w-[55vh] rounded-full bg-[#7dd3fc]/35 blur-[110px] animate-splash-aurora-a" />
        <div className="absolute -right-[15%] top-[28%] h-[48vh] w-[48vh] rounded-full bg-[#215481]/22 blur-[100px] animate-splash-aurora-b" />
        <div className="absolute bottom-[-12%] left-[25%] h-[40vh] w-[40vh] rounded-full bg-[#a5f3fc]/25 blur-[90px] animate-splash-aurora-c" />
        <div className="absolute left-1/2 top-[32%] h-[34vh] w-[34vh] -translate-x-1/2 rounded-full bg-white/70 blur-[80px] animate-splash-glow-breathe" />
      </div>

      {/* Architectural horizon line */}
      <div
        className="pointer-events-none absolute left-1/2 top-[42%] h-px w-[140%] -translate-x-1/2 -rotate-[8deg] bg-gradient-to-r from-transparent via-[#215481]/35 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-[44%] h-px w-[110%] -translate-x-1/2 -rotate-[8deg] bg-gradient-to-r from-transparent via-white/80 to-transparent"
        aria-hidden
      />

      {/* Fine geometric lattice */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(33,84,129,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(33,84,129,0.07) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, #000 18%, transparent 72%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 70% 60% at 50% 40%, #000 18%, transparent 72%)',
        }}
        aria-hidden
      />

      {/* Floating light motes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-[#215481]/40 animate-splash-particle"
            style={{
              left: `${(i * 17 + 9) % 100}%`,
              top: `${(i * 29 + 11) % 100}%`,
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              animationDelay: `${(i % 9) * 0.4}s`,
              animationDuration: `${4.5 + (i % 4)}s`,
            }}
          />
        ))}
      </div>

      {/* Diagonal light shard */}
      <div
        className="pointer-events-none absolute -left-1/4 top-[-10%] h-[140%] w-[28%] rotate-[18deg] bg-gradient-to-r from-transparent via-white/40 to-transparent blur-sm animate-splash-glow-breathe"
        aria-hidden
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-8">
        <div className="flex w-full max-w-md flex-col items-center text-center">
          <div className="mb-7 scale-[0.92] sm:mb-8 sm:scale-100">
            <SplashOrbitHub variant="consumer" progress={progress}>
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

          <h2
            key={showWelcome ? 'welcome' : 'building'}
            className="animate-splash-title-in text-[1.65rem] font-bold leading-tight tracking-tight text-[#0a1520] sm:text-[1.95rem] md:text-[2.2rem]"
            style={{ animationDelay: showWelcome ? '0s' : '0.1s', opacity: showWelcome ? undefined : 0 }}
          >
            {showWelcome ? 'Welcome to FinderB Business' : 'Building your workspace'}
          </h2>

          <p
            key={showWelcome ? 'welcome-sub' : 'building-sub'}
            className="animate-splash-title-in mt-2.5 max-w-[20rem] text-[13.5px] leading-relaxed text-[#4a5d72] sm:mt-3 sm:max-w-sm sm:text-[15px]"
            style={{
              animationDelay: showWelcome ? '0.08s' : '0.22s',
              opacity: showWelcome ? undefined : 0,
            }}
          >
            {showWelcome
              ? 'Your workspace is ready. Let’s grow.'
              : "We're preparing everything you need to grow on FinderB."}
          </p>

          <div
            className="animate-splash-title-in mt-6 flex items-center justify-center gap-1.5 sm:mt-7"
            style={{ animationDelay: '0.34s', opacity: 0 }}
            aria-hidden
          >
            {BUSINESS_ONBOARDING_MESSAGES.map((_, i) => {
              const active = !showWelcome && i === messageIndex;
              const done = showWelcome || i < messageIndex;
              return (
                <span
                  key={i}
                  className={`rounded-full transition-all duration-500 ease-out ${
                    active
                      ? 'h-1.5 w-5 bg-[#153551]'
                      : done
                        ? 'h-1.5 w-1.5 bg-[#4f8dc3]'
                        : 'h-1.5 w-1.5 bg-[#215481]/18'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Exciting percentage loader (kept from latest design) */}
      <div className="relative z-10 w-full px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8 sm:pb-9">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-3 flex items-end justify-between gap-3">
            <p
              key={showWelcome ? 'ready' : messageIndex}
              className="min-h-[1.25rem] text-[12.5px] font-semibold tracking-tight text-[#2f4054] animate-app-splash-fade-up sm:text-[13px]"
            >
              {showWelcome ? "You're all set!" : BUSINESS_ONBOARDING_MESSAGES[messageIndex]}
            </p>
            <span className="shrink-0 text-[11px] font-bold tabular-nums tracking-wide text-[#153551]">
              {progress}%
            </span>
          </div>

          <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-[#215481]/12">
            <div
              className="relative h-full rounded-full bg-gradient-to-r from-[#0a1520] via-[#215481] to-[#7dd3fc] shadow-[0_0_18px_rgba(125,211,252,0.45)] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-y-0 right-0 w-8 animate-app-splash-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
