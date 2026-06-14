'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Bell,
  MapPin,
  Sparkles,
  Zap,
  Heart,
  Briefcase,
  TrendingUp,
  MessageSquare,
  BarChart3,
  Search,
  Star,
  Home,
  Compass,
  Bookmark,
  User,
  Phone,
  ChevronRight,
  Mic,
  Navigation,
  ShieldCheck,
  Inbox,
  Timer,
  Flame,
  ArrowLeft,
  Wallet,
  Eye,
  Grid3X3,
  ArrowUpRight,
  Clock,
} from 'lucide-react';

function GooglePlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#EA4335" d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12 3.84 21.85C3.34 21.6 3 21.09 3 20.5Z" />
      <path fill="#FBBC04" d="M16.81 15.12 6.05 21.34 14.54 12.85 16.81 15.12Z" />
      <path
        fill="#4285F4"
        d="M20.16 10.81c.34.27.59.69.59 1.19s-.22.92-.57 1.19l-2.29 1.32-2.5-2.5 2.5-2.5 2.29 1.32Z"
      />
      <path fill="#34A853" d="M6.05 2.66 16.81 8.88 14.54 11.15 6.05 2.66Z" />
    </svg>
  );
}

function AppStoreIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function StorePlatformsRow() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-white/10">
        <AppStoreIcon className="h-4 w-4 text-[#0a1628]" />
        <span className="text-[10px] font-semibold text-[#0a1628]">App Store</span>
      </div>
      <div className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-white/10">
        <GooglePlayIcon className="h-4 w-4" />
        <span className="text-[10px] font-semibold text-[#0a1628]">Google Play</span>
      </div>
    </div>
  );
}

function FinderBAppCard({
  variant,
  title,
  tagline,
  features,
}: {
  variant: 'finderb' | 'business';
  title: string;
  tagline: string;
  features: readonly { icon: typeof Zap; label: string; color: string }[];
}) {
  const isBusiness = variant === 'business';

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border text-left backdrop-blur-sm transition-all duration-300 hover:border-white/20 ${
        isBusiness
          ? 'border-secondary/20 bg-gradient-to-br from-secondary/[0.12] via-white/[0.03] to-transparent'
          : 'border-[#4f8dc3]/20 bg-gradient-to-br from-[#215481]/20 via-white/[0.03] to-transparent'
      }`}
    >
      <div
        className={`absolute left-0 top-0 h-full w-1 ${
          isBusiness
            ? 'bg-gradient-to-b from-secondary via-[#f69e32] to-secondary/40'
            : 'bg-gradient-to-b from-[#4f8dc3] via-[#215481] to-[#215481]/40'
        }`}
        aria-hidden
      />

      <div className="relative p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold tracking-tight !text-white sm:text-xl">
              {title}
            </h3>
            <p className="mt-1 text-[12px] leading-snug text-white/55 sm:text-[13px]">{tagline}</p>
          </div>
          <span
            className={`shrink-0 rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${
              isBusiness ? 'bg-secondary/15 text-secondary' : 'bg-[#4f8dc3]/15 text-sky-300'
            }`}
          >
            {isBusiness ? 'For merchants' : 'For everyone'}
          </span>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-x-3 gap-y-2.5">
          {features.map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.06] ${color}`}
              >
                <Icon size={11} strokeWidth={2.25} />
              </span>
              <span className="text-[11px] font-medium leading-tight text-white/80">{label}</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-black/20 p-2.5">
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/35">
            Coming soon on
          </p>
          <StorePlatformsRow />
        </div>
      </div>
    </div>
  );
}

function PhoneStatusBar({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-1.5 text-[7px] font-semibold ${
        dark ? 'bg-transparent text-white/60' : 'bg-white text-slate-400'
      }`}
    >
      <span>9:41</span>
      <div className="h-3.5 w-[46px] rounded-full bg-black/85 ring-1 ring-white/10" />
      <span>5G</span>
    </div>
  );
}

const FINDERB_SPLASH_MESSAGES = [
  'Curating local excellence…',
  'Finding verified businesses…',
  'Mapping deals near you…',
  'Almost ready…',
] as const;

const BUSINESS_SPLASH_MESSAGES = [
  'Opening your dashboard…',
  'Syncing leads & reviews…',
  'Loading analytics…',
  'Ready to grow…',
] as const;

function SplashDots({ variant }: { variant: 'finderb' | 'business' }) {
  const dotClass =
    variant === 'business' ? 'bg-[#f9b864]' : 'bg-[#4f8dc3]';

  return (
    <div className="mt-2.5 flex items-center justify-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`h-1 w-1 rounded-full animate-app-splash-dot ${dotClass}`}
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </div>
  );
}

function SplashProgressTrack({ variant }: { variant: 'finderb' | 'business' }) {
  const trackClass =
    variant === 'business' ? 'bg-white/10' : 'bg-[#215481]/12';
  const barClass =
    variant === 'business'
      ? 'bg-gradient-to-r from-[#f9b864] via-[#ffcc70] to-[#f69e32]'
      : 'bg-gradient-to-r from-[#215481] via-[#4f8dc3] to-[#f9b864]';

  return (
    <div className={`relative mt-3 h-[3px] w-full overflow-hidden rounded-full ${trackClass}`}>
      <div className={`absolute inset-y-0 animate-app-splash-progress-slide rounded-full ${barClass}`} />
    </div>
  );
}

function SplashOrbitLogo({
  variant,
  progress,
}: {
  variant: 'finderb' | 'business';
  progress: number;
}) {
  const isBusiness = variant === 'business';
  const ringOuter = isBusiness ? 'border-[#f9b864]/35' : 'border-[#4f8dc3]/40';
  const ringInner = isBusiness ? 'border-white/10' : 'border-[#215481]/25';
  const glowClass = isBusiness ? 'bg-[#f9b864]/25' : 'bg-[#4f8dc3]/30';
  const circumference = 2 * Math.PI * 38;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative mx-auto mb-3 flex h-[88px] w-[88px] items-center justify-center">
      <div
        className={`pointer-events-none absolute inset-0 rounded-full blur-xl animate-app-splash-glow ${glowClass}`}
        aria-hidden
      />

      <svg
        className="absolute inset-0 -rotate-90"
        viewBox="0 0 88 88"
        aria-hidden
      >
        <circle
          cx="44"
          cy="44"
          r="38"
          fill="none"
          stroke={isBusiness ? 'rgba(255,255,255,0.07)' : 'rgba(33,84,129,0.12)'}
          strokeWidth="2.5"
        />
        <circle
          cx="44"
          cy="44"
          r="38"
          fill="none"
          stroke={isBusiness ? '#f9b864' : 'url(#splashRingFinderb)'}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-150 ease-out"
        />
        {!isBusiness && (
          <defs>
            <linearGradient id="splashRingFinderb" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#215481" />
              <stop offset="50%" stopColor="#4f8dc3" />
              <stop offset="100%" stopColor="#f9b864" />
            </linearGradient>
          </defs>
        )}
      </svg>

      <div
        className={`absolute inset-[6px] animate-app-splash-orbit rounded-full border border-dashed ${ringOuter}`}
        aria-hidden
      />
      <div
        className={`absolute inset-[12px] animate-app-splash-orbit-rev rounded-full border ${ringInner}`}
        aria-hidden
      />

      <div
        className={`relative flex h-[46px] w-[46px] items-center justify-center overflow-hidden rounded-[14px] shadow-lg ring-2 ${
          isBusiness
            ? 'bg-gradient-to-br from-[#1a2236] to-[#0c1220] ring-[#f9b864]/30'
            : 'bg-white/95 ring-white'
        }`}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[14px]">
          <div className="absolute inset-y-0 w-1/2 animate-app-splash-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>
        {isBusiness ? (
          <div className="relative flex flex-col items-center">
            <Briefcase size={16} className="text-[#f9b864]" strokeWidth={2.25} />
            <span className="mt-0.5 text-[5px] font-black tracking-wider text-[#f9b864]">PRO</span>
          </div>
        ) : (
          <Image
            src="/icon.png"
            alt=""
            width={34}
            height={34}
            className="relative h-[34px] w-[34px] object-contain drop-shadow-sm"
          />
        )}
      </div>

      <span
        className={`absolute -bottom-0.5 rounded-full px-1.5 py-px text-[6px] font-bold tabular-nums shadow-sm ${
          isBusiness
            ? 'bg-[#f9b864] text-[#0a0f1a]'
            : 'bg-white text-[#215481] ring-1 ring-[#215481]/15'
        }`}
      >
        {progress}%
      </span>
    </div>
  );
}

function FinderBSplashScreen() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgTimer = setInterval(
      () => setMsgIdx((i) => (i + 1) % FINDERB_SPLASH_MESSAGES.length),
      580,
    );
    const started = Date.now();
    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - started;
      const next = Math.min(100, Math.round((elapsed / 2400) * 100));
      setProgress(next);
    }, 40);

    return () => {
      clearInterval(msgTimer);
      clearInterval(progressTimer);
    };
  }, []);

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-br from-white via-[#eef5fc] to-[#fef8ef]">
      <PhoneStatusBar />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-8 top-6 h-24 w-24 animate-app-splash-glow rounded-full bg-[#4f8dc3]/25 blur-2xl" />
        <div
          className="absolute -right-6 bottom-10 h-20 w-20 animate-app-splash-glow rounded-full bg-[#f9b864]/20 blur-2xl"
          style={{ animationDelay: '0.8s' }}
        />
        <div
          className="absolute left-1/2 top-1/4 h-16 w-16 -translate-x-1/2 animate-app-splash-glow rounded-full bg-[#215481]/15 blur-xl"
          style={{ animationDelay: '1.4s' }}
        />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(#215481 1px, transparent 1px), linear-gradient(90deg, #215481 1px, transparent 1px)',
            backgroundSize: '12px 12px',
          }}
        />
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/80 to-transparent" />
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-4 pb-5 pt-2">
        <SplashOrbitLogo variant="finderb" progress={progress} />

        <h3 className="text-[11px] font-extrabold tracking-tight text-[#0f172a]">
          Finder
          <span className="bg-gradient-to-r from-[#f69e32] to-[#f9b864] bg-clip-text text-transparent">
            B
          </span>
        </h3>
        <p className="mt-0.5 text-[6px] font-bold uppercase tracking-[0.22em] text-[#215481]/65">
          Discover Local
        </p>

        <div className="mt-3 w-full max-w-[120px]">
          <SplashProgressTrack variant="finderb" />
          <SplashDots variant="finderb" />
        </div>

        <p
          key={msgIdx}
          className="mt-2.5 min-h-[10px] max-w-[130px] text-center text-[6px] font-medium leading-snug text-[#215481]/75 animate-app-splash-fade-up"
        >
          {FINDERB_SPLASH_MESSAGES[msgIdx]}
        </p>

        <div className="mt-3 flex items-center gap-1">
          {['Search', 'Deals', 'Near you'].map((chip, i) => (
            <span
              key={chip}
              className="rounded-full bg-white/80 px-1.5 py-0.5 text-[5px] font-semibold text-[#215481]/70 shadow-sm ring-1 ring-[#215481]/10 animate-app-splash-fade-up"
              style={{ animationDelay: `${0.15 + i * 0.1}s`, animationFillMode: 'both' }}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function BusinessSplashScreen() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgTimer = setInterval(
      () => setMsgIdx((i) => (i + 1) % BUSINESS_SPLASH_MESSAGES.length),
      580,
    );
    const started = Date.now();
    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - started;
      const next = Math.min(100, Math.round((elapsed / 2400) * 100));
      setProgress(next);
    }, 40);

    return () => {
      clearInterval(msgTimer);
      clearInterval(progressTimer);
    };
  }, []);

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#070b14]">
      <PhoneStatusBar dark />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-6 top-4 h-28 w-28 animate-app-splash-glow rounded-full bg-[#f9b864]/12 blur-2xl" />
        <div
          className="absolute -right-8 bottom-6 h-24 w-24 animate-app-splash-glow rounded-full bg-[#4f8dc3]/15 blur-2xl"
          style={{ animationDelay: '1s' }}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(249,184,100,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(249,184,100,0.9) 1px, transparent 1px)',
            backgroundSize: '11px 11px',
          }}
        />
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#f9b864]/8 to-transparent" />
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-4 pb-5 pt-2">
        <SplashOrbitLogo variant="business" progress={progress} />

        <h3 className="text-[10px] font-extrabold tracking-tight !text-white">
          <span className="text-white">FinderB</span>{' '}
          <span className="bg-gradient-to-r from-[#f9b864] to-[#ffcc70] bg-clip-text text-transparent">
            Business
          </span>
        </h3>
        <p className="mt-0.5 text-[6px] font-bold uppercase tracking-[0.22em] text-[#f9b864]/75">
          Grow Your Brand
        </p>

        <div className="mt-3 grid w-full max-w-[130px] grid-cols-3 gap-1">
          {[
            { label: 'Leads', val: '24' },
            { label: 'Views', val: '1.2k' },
            { label: 'Rating', val: '4.8' },
          ].map(({ label, val }, i) => (
            <div
              key={label}
              className="rounded-lg border border-white/[0.07] bg-white/[0.04] px-1 py-1 text-center animate-app-splash-fade-up"
              style={{ animationDelay: `${0.1 + i * 0.08}s`, animationFillMode: 'both' }}
            >
              <p className="text-[4px] uppercase tracking-wide text-white/35">{label}</p>
              <p className="text-[7px] font-bold text-white">{val}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 w-full max-w-[120px]">
          <SplashProgressTrack variant="business" />
          <SplashDots variant="business" />
        </div>

        <p
          key={msgIdx}
          className="mt-2.5 min-h-[10px] max-w-[130px] text-center text-[6px] font-medium leading-snug text-white/45 animate-app-splash-fade-up"
        >
          {BUSINESS_SPLASH_MESSAGES[msgIdx]}
        </p>
      </div>
    </div>
  );
}

function usePhoneDemo(startDelay = 0) {
  const [phase, setPhase] = useState<'splash' | 'app'>('splash');
  const [appKey, setAppKey] = useState(0);
  const [splashKey, setSplashKey] = useState(0);

  useEffect(() => {
    let showAppTimer: ReturnType<typeof setTimeout>;
    let loopTimer: ReturnType<typeof setInterval>;

    const showApp = () => {
      showAppTimer = setTimeout(() => {
        setPhase('app');
        setAppKey((k) => k + 1);
      }, 2600);
    };

    const startLoop = () => {
      loopTimer = setInterval(() => {
        setPhase('splash');
        setSplashKey((k) => k + 1);
        showApp();
      }, 20000);
    };

    const initial = setTimeout(() => {
      showApp();
      startLoop();
    }, startDelay);

    return () => {
      clearTimeout(initial);
      clearTimeout(showAppTimer);
      clearInterval(loopTimer);
    };
  }, [startDelay]);

  return { phase, appKey, splashKey };
}

function AnimatedPhoneScreen({ app }: { app: 'finderb' | 'business' }) {
  const { phase, appKey, splashKey } = usePhoneDemo(app === 'business' ? 400 : 0);
  const isApp = phase === 'app';

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        className={`absolute inset-0 transition-all duration-500 ${
          isApp ? 'pointer-events-none scale-105 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {app === 'finderb' ? (
          <FinderBSplashScreen key={splashKey} />
        ) : (
          <BusinessSplashScreen key={splashKey} />
        )}
      </div>
      <div
        className={`absolute inset-0 transition-all duration-700 ease-out ${
          isApp ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
        }`}
      >
        {app === 'finderb' ? (
          <FinderBAppFlow key={appKey} resetKey={appKey} />
        ) : (
          <BusinessAppFlow key={appKey} resetKey={appKey} />
        )}
      </div>
    </div>
  );
}

function slideStyle(delay: number) {
  return { animationDelay: `${delay}s`, animationFillMode: 'both' as const };
}

const MOCK_CAFE_PHOTOS = {
  hero: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=600&q=80',
  featuredCafe: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80',
  coffeeHouse: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80',
  bistro: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=400&q=80',
  repair: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
  salon: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
} as const;

function DemoTypewriter({ text, active }: { text: string; active: boolean }) {
  const [len, setLen] = useState(0);

  useEffect(() => {
    if (!active) {
      setLen(0);
      return;
    }
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setLen(i);
      if (i >= text.length) clearInterval(timer);
    }, 48);
    return () => clearInterval(timer);
  }, [text, active]);

  if (!active) {
    return <span className="text-slate-400">Search cafes, shops…</span>;
  }

  return (
    <>
      <span className="text-[#1a1a1a]">{text.slice(0, len)}</span>
      {len < text.length && (
        <span className="ml-px inline-block h-[6px] w-px animate-app-cursor-blink bg-[#215481] align-middle" />
      )}
    </>
  );
}

function DemoTapFinger({ show, className }: { show: boolean; className?: string }) {
  if (!show) return null;
  return (
    <div className={`pointer-events-none absolute z-30 ${className ?? ''}`} aria-hidden>
      <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 animate-app-tap-ring rounded-full bg-[#215481]/30" />
      <span className="relative block h-2.5 w-2.5 rounded-full bg-[#215481] ring-2 ring-white shadow-md" />
    </div>
  );
}

function MockPhoto({ src, className }: { src: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-stone-200 ${className ?? ''}`}>
      <Image
        src={src}
        alt=""
        fill
        unoptimized
        className="object-cover"
        sizes="180px"
      />
    </div>
  );
}

function FinderBBottomNav({ active = 'home' }: { active?: 'home' | 'explore' | 'saved' | 'you' }) {
  const tabs = [
    { label: 'Home', icon: Home, key: 'home' as const },
    { label: 'Explore', icon: Compass, key: 'explore' as const },
    { label: 'Saved', icon: Bookmark, key: 'saved' as const },
    { label: 'You', icon: User, key: 'you' as const },
  ];

  return (
    <div className="border-t border-stone-200/90 bg-[#fafaf8] px-3 pb-2 pt-1.5">
      <div className="flex items-center justify-between">
        {tabs.map(({ label, icon: Icon, key }) => {
          const isActive = active === key;
          return (
            <div key={key} className="flex flex-col items-center gap-0.5">
              <Icon
                size={11}
                strokeWidth={isActive ? 2.5 : 2}
                className={isActive ? 'text-[#215481]' : 'text-stone-400'}
              />
              <span className={`text-[5px] font-semibold ${isActive ? 'text-[#215481]' : 'text-stone-400'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type FinderBFlowPhase = 'home' | 'category-loading' | 'category' | 'profile';

function useFinderBAppFlow(resetKey: number) {
  const [phase, setPhase] = useState<FinderBFlowPhase>('home');
  const [highlightFood, setHighlightFood] = useState(false);
  const [highlightBusiness, setHighlightBusiness] = useState(false);
  const [profileReveal, setProfileReveal] = useState(0);
  const [resultCount, setResultCount] = useState(0);

  useEffect(() => {
    setPhase('home');
    setHighlightFood(false);
    setHighlightBusiness(false);
    setProfileReveal(0);
    setResultCount(0);

    const foodHighlight = setTimeout(() => setHighlightFood(true), 2400);
    const toLoading = setTimeout(() => {
      setPhase('category-loading');
      setHighlightFood(false);
    }, 3600);
    const toCategory = setTimeout(() => setPhase('category'), 4800);
    let countInterval: ReturnType<typeof setInterval> | null = null;
    const countTick = setTimeout(() => {
      let n = 0;
      countInterval = setInterval(() => {
        n += 4;
        setResultCount(Math.min(n, 24));
        if (n >= 24 && countInterval) clearInterval(countInterval);
      }, 70);
    }, 4900);
    const bizHighlight = setTimeout(() => setHighlightBusiness(true), 6400);
    const toProfile = setTimeout(() => {
      setPhase('profile');
      setHighlightBusiness(false);
    }, 7200);
    const revealTimer = setTimeout(() => {
      let step = 0;
      const tick = setInterval(() => {
        step += 1;
        setProfileReveal(step);
        if (step >= 5) clearInterval(tick);
      }, 380);
    }, 7400);

    return () => {
      clearTimeout(foodHighlight);
      clearTimeout(toLoading);
      clearTimeout(toCategory);
      clearTimeout(countTick);
      if (countInterval) clearInterval(countInterval);
      clearTimeout(bizHighlight);
      clearTimeout(toProfile);
      clearTimeout(revealTimer);
    };
  }, [resetKey]);

  return { phase, highlightFood, highlightBusiness, profileReveal, resultCount };
}

function FinderBAppFlow({ resetKey }: { resetKey: number }) {
  const { phase, highlightFood, highlightBusiness, profileReveal, resultCount } = useFinderBAppFlow(resetKey);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#fafaf8]">
      <div
        className={`absolute inset-0 transition-transform duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
          phase === 'home' ? 'translate-x-0' : '-translate-x-[30%] opacity-0 pointer-events-none'
        }`}
      >
        <FinderBHomeScreen highlightFood={highlightFood} showTyping={phase === 'home'} />
      </div>
      <div
        className={`absolute inset-0 transition-transform duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
          phase === 'category-loading' || phase === 'category'
            ? 'translate-x-0'
            : phase === 'home'
              ? 'translate-x-full'
              : '-translate-x-[30%] opacity-0 pointer-events-none'
        }`}
      >
        <FinderBCategoryScreen
          loading={phase === 'category-loading'}
          highlightBusiness={highlightBusiness}
          resultCount={resultCount}
          showResults={phase === 'category' || phase === 'profile'}
        />
      </div>
      <div
        className={`absolute inset-0 transition-transform duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
          phase === 'profile' ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        <FinderBBusinessProfileScreen revealStep={profileReveal} />
      </div>
    </div>
  );
}

function FinderBHomeScreen({
  highlightFood,
  showTyping,
}: {
  highlightFood: boolean;
  showTyping: boolean;
}) {
  const categories = [
    { label: 'Food', key: 'food' },
    { label: 'Repair', key: 'repair' },
    { label: 'Health', key: 'health' },
    { label: 'Shops', key: 'shops' },
    { label: 'Beauty', key: 'beauty' },
  ];

  return (
    <div className="flex h-full flex-col bg-[#fafaf8]">
      <PhoneStatusBar />
      <div className="px-2.5 pb-2 pt-0.5">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <p className="text-[9px] font-bold tracking-tight text-[#1a1a1a]">Good afternoon</p>
            <p className="mt-0.5 flex items-center gap-0.5 text-[5px] text-stone-500">
              <MapPin size={6} className="text-[#215481]" strokeWidth={2.5} />
              Near you · Your location
            </p>
          </div>
          <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white ring-1 ring-stone-200">
            <Bell size={9} className="text-stone-600" />
            <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-[#e85d04]" />
          </div>
        </div>

        <div className="flex h-8 items-center gap-1.5 rounded-xl bg-white px-2 ring-1 ring-stone-200/90 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
          <Search size={9} className="shrink-0 text-stone-400" strokeWidth={2.5} />
          <span className="min-w-0 flex-1 truncate text-[6px]">
            <DemoTypewriter text="Brunch cafes near me" active={showTyping} />
          </span>
          <Mic size={8} className="shrink-0 text-[#215481]" />
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-2.5">
        <p className="mb-1 text-[5px] font-semibold uppercase tracking-wider text-stone-400">Browse</p>
        <div className="mb-2.5 flex gap-1 overflow-hidden">
          {categories.map(({ label, key }) => (
            <div
              key={key}
              className={`relative shrink-0 rounded-full px-2 py-1 text-[5px] font-semibold transition-all duration-200 ${
                key === 'food' && highlightFood
                  ? 'animate-app-tap-pulse bg-[#215481] text-white shadow-sm'
                  : key === 'food'
                    ? 'bg-[#215481] text-white'
                    : 'bg-white text-stone-600 ring-1 ring-stone-200'
              }`}
            >
              {label}
              {key === 'food' && <DemoTapFinger show={highlightFood} className="right-0 top-full mt-0.5" />}
            </div>
          ))}
        </div>

        <div className="mb-1 flex items-baseline justify-between">
          <p className="text-[6px] font-bold text-[#1a1a1a]">Picked for you</p>
          <span className="text-[4px] font-medium text-[#215481]">See all</span>
        </div>

        <div className="relative mb-2 overflow-hidden rounded-xl bg-white ring-1 ring-stone-200/80">
          <MockPhoto src={MOCK_CAFE_PHOTOS.featuredCafe} className="h-[46px] w-full" />
          <div className="absolute left-1.5 top-1.5 rounded-md bg-white/95 px-1 py-px text-[4px] font-bold text-[#1a1a1a] shadow-sm">
            Trending
          </div>
          <div className="p-1.5">
            <p className="text-[6px] font-bold text-[#1a1a1a]">Corner Cup Cafe</p>
            <div className="mt-0.5 flex items-center gap-1.5 text-[4px] text-stone-500">
              <span className="flex items-center gap-px font-semibold text-[#b45309]">
                <Star size={5} className="fill-[#b45309] text-[#b45309]" /> 4.8
              </span>
              <span>0.8 km</span>
              <span className="text-[#15803d]">Open now</span>
            </div>
          </div>
        </div>

        <div className="mb-2 flex gap-1.5">
          {[
            { name: 'QuickFix Repairs', sub: 'AC · Plumbing', photo: MOCK_CAFE_PHOTOS.repair },
            { name: 'Glow Studio', sub: 'Salon · Spa', photo: MOCK_CAFE_PHOTOS.salon },
          ].map(({ name, sub, photo }) => (
            <div key={name} className="w-1/2 overflow-hidden rounded-xl bg-white ring-1 ring-stone-200/80">
              <MockPhoto src={photo} className="h-7 w-full" />
              <div className="p-1">
                <p className="truncate text-[5px] font-bold text-[#1a1a1a]">{name}</p>
                <p className="text-[4px] text-stone-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-white p-1.5 ring-1 ring-stone-200/80">
          <p className="text-[4px] font-medium text-stone-400">Live near you</p>
          <p className="mt-0.5 text-[5px] font-semibold text-[#1a1a1a]">
            <span className="text-[#215481]">128 people</span> saved places today
          </p>
          <div className="mt-1 flex -space-x-1">
            {['#215481', '#4f8dc3', '#c17f4a', '#78716c'].map((c) => (
              <span key={c} className="h-3.5 w-3.5 rounded-full ring-2 ring-white" style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      </div>
      <FinderBBottomNav active="home" />
    </div>
  );
}

function FinderBCategoryScreen({
  loading,
  highlightBusiness,
  resultCount,
  showResults,
}: {
  loading: boolean;
  highlightBusiness: boolean;
  resultCount: number;
  showResults: boolean;
}) {
  const businesses = [
    {
      name: 'Corner Cup Cafe',
      cat: 'Specialty cafe',
      dist: '0.8 km',
      rating: '4.8',
      open: 'Open till 10 PM',
      photo: MOCK_CAFE_PHOTOS.featuredCafe,
      deal: '20% off brunch',
    },
    {
      name: 'The Coffee House',
      cat: 'Cafe & workspace',
      dist: '1.2 km',
      rating: '4.6',
      open: 'Open now',
      photo: MOCK_CAFE_PHOTOS.coffeeHouse,
      deal: null,
    },
    {
      name: 'Sunrise Bistro',
      cat: 'Restaurant',
      dist: '1.5 km',
      rating: '4.7',
      open: 'Closes 11 PM',
      photo: MOCK_CAFE_PHOTOS.bistro,
      deal: null,
    },
  ];

  return (
    <div className="flex h-full flex-col bg-[#fafaf8]">
      <PhoneStatusBar />
      <div className="flex items-center gap-1.5 border-b border-stone-200/80 px-2.5 py-2">
        <ArrowLeft size={10} className="text-[#215481]" strokeWidth={2.5} />
        <div className="min-w-0 flex-1">
          <p className="text-[7px] font-bold text-[#1a1a1a]">Food & Cafes</p>
          <p className="text-[4px] text-stone-500">
            {loading ? 'Finding the best spots…' : `${resultCount || 24} places near you`}
          </p>
        </div>
      </div>

      {loading && (
        <div className="px-2.5 py-2">
          <div className="relative h-1 overflow-hidden rounded-full bg-stone-200">
            <div className="absolute inset-y-0 w-1/3 animate-app-scan-bar rounded-full bg-[#215481]/70" />
          </div>
          <p className="mt-1.5 text-[4px] font-medium text-stone-400">Scanning verified listings…</p>
        </div>
      )}

      {!loading && (
        <div className="flex gap-1 px-2.5 py-1.5">
          {['Nearest', 'Top rated', 'Open now'].map((f, i) => (
            <span
              key={f}
              className={`rounded-full px-1.5 py-0.5 text-[4px] font-semibold ${
                i === 0 ? 'bg-[#1a1a1a] text-white' : 'bg-white text-stone-500 ring-1 ring-stone-200'
              }`}
            >
              {f}
            </span>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-hidden px-2.5 pb-0">
        {loading ? (
          <div className="space-y-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="overflow-hidden rounded-xl bg-white ring-1 ring-stone-200/80">
                <div className="h-9 animate-app-skeleton bg-stone-200" />
                <div className="space-y-1 p-1.5">
                  <div className="h-1.5 w-2/3 animate-app-skeleton rounded bg-stone-200" />
                  <div className="h-1 w-1/2 animate-app-skeleton rounded bg-stone-100" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {businesses.map((biz, i) => (
              <div
                key={biz.name}
                className={`relative overflow-hidden rounded-xl bg-white ring-1 ring-stone-200/80 ${
                  showResults ? 'animate-app-stagger-in opacity-0' : 'opacity-0'
                } ${i === 0 && highlightBusiness ? 'animate-app-tap-pulse ring-2 ring-[#215481]/40' : ''}`}
                style={showResults ? slideStyle(i * 0.12) : undefined}
              >
                <div className="flex gap-1.5 p-1">
                  <MockPhoto src={biz.photo} className="h-10 w-10 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1 py-0.5">
                    <div className="flex items-center gap-0.5">
                      <p className="truncate text-[6px] font-bold text-[#1a1a1a]">{biz.name}</p>
                      {i === 0 && <ShieldCheck size={6} className="shrink-0 text-[#15803d]" />}
                    </div>
                    <p className="text-[4px] text-stone-400">{biz.cat}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1">
                      <span className="flex items-center gap-px text-[4px] font-semibold text-[#b45309]">
                        <Star size={4} className="fill-[#b45309] text-[#b45309]" /> {biz.rating}
                      </span>
                      <span className="text-[4px] text-stone-400">{biz.dist}</span>
                      <span className="text-[4px] text-[#15803d]">{biz.open}</span>
                    </div>
                  </div>
                  {biz.deal && (
                    <span className="self-start rounded-md bg-[#fef3c7] px-1 py-px text-[3px] font-bold text-[#92400e]">
                      {biz.deal}
                    </span>
                  )}
                </div>
                {i === 0 && <DemoTapFinger show={highlightBusiness} className="bottom-1 right-3" />}
              </div>
            ))}
          </div>
        )}
      </div>
      <FinderBBottomNav active="explore" />
    </div>
  );
}

function FinderBBusinessProfileScreen({ revealStep }: { revealStep: number }) {
  const reveal = (step: number) =>
    revealStep >= step ? 'animate-app-reveal-up opacity-0' : 'opacity-0 pointer-events-none';

  return (
    <div className="flex h-full flex-col bg-[#fafaf8]">
      <PhoneStatusBar />
      <div className="relative h-[72px] shrink-0">
        <MockPhoto src={MOCK_CAFE_PHOTOS.hero} className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
        <div className="absolute left-2 top-6 flex h-5 w-5 items-center justify-center rounded-full bg-black/35 backdrop-blur-sm">
          <ArrowLeft size={8} className="text-white" />
        </div>
        <button type="button" className="absolute right-2 top-6 flex h-5 w-5 items-center justify-center rounded-full bg-black/35 backdrop-blur-sm">
          <Heart size={8} className="text-white" />
        </button>
      </div>

      <div className="relative -mt-2 flex flex-1 flex-col overflow-hidden rounded-t-2xl bg-[#fafaf8] pt-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className={`px-2.5 ${reveal(1)}`} style={revealStep >= 1 ? slideStyle(0) : undefined}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[9px] font-bold tracking-tight text-[#1a1a1a]">Corner Cup Cafe</p>
              <p className="text-[4px] text-stone-500">Cafe · Coffee & Brunch</p>
            </div>
            <div className="flex items-center gap-0.5 rounded-lg bg-white px-1 py-0.5 ring-1 ring-stone-200">
              <Star size={6} className="fill-[#b45309] text-[#b45309]" />
              <span className="text-[5px] font-bold">4.8</span>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[4px] text-stone-500">
            <ShieldCheck size={6} className="text-[#15803d]" />
            <span className="font-medium text-[#15803d]">Verified on FinderB</span>
          </div>
        </div>

        <div className={`mt-2 px-2.5 ${reveal(2)}`} style={revealStep >= 2 ? slideStyle(0.05) : undefined}>
          <div className="flex items-center gap-1.5 rounded-xl bg-white p-1.5 ring-1 ring-stone-200/80">
            <Navigation size={8} className="text-[#215481]" />
            <div>
              <p className="text-[5px] font-bold text-[#1a1a1a]">0.8 km · 4 min away</p>
              <p className="text-[4px] text-stone-400">Near your location</p>
            </div>
            <span className="ml-auto flex items-center gap-px rounded-full bg-[#dcfce7] px-1 py-px text-[3px] font-bold text-[#15803d]">
              <Clock size={4} /> Open
            </span>
          </div>
        </div>

        <div className={`mt-2 flex gap-1 px-2.5 ${reveal(3)}`} style={revealStep >= 3 ? slideStyle(0.1) : undefined}>
          <button type="button" className="flex flex-1 items-center justify-center gap-0.5 rounded-xl bg-[#215481] py-1.5 text-[4px] font-bold text-white">
            <Phone size={8} /> Call
          </button>
          <button type="button" className="flex flex-1 items-center justify-center gap-0.5 rounded-xl bg-white py-1.5 text-[4px] font-bold text-[#215481] ring-1 ring-stone-200">
            <Navigation size={8} /> Directions
          </button>
        </div>

        {revealStep >= 4 && (
          <div className="mx-2.5 mt-2 animate-app-deal-pop rounded-xl border border-[#fcd34d] bg-[#fffbeb] p-1.5 opacity-0" style={slideStyle(0.15)}>
            <p className="text-[5px] font-bold text-[#92400e]">20% off brunch — ends tonight</p>
            <p className="text-[4px] text-[#b45309]">Tap to reveal code at checkout</p>
          </div>
        )}

        <div className={`mt-2 flex-1 overflow-hidden px-2.5 ${reveal(5)}`} style={revealStep >= 5 ? slideStyle(0.2) : undefined}>
          <p className="mb-0.5 text-[5px] font-bold text-[#1a1a1a]">What people say</p>
          <div className="rounded-xl bg-white p-1.5 ring-1 ring-stone-200/80">
            <div className="mb-0.5 flex items-center justify-between">
              <span className="text-[4px] font-bold text-[#1a1a1a]">Priya S.</span>
              <span className="text-[3px] tracking-wider text-[#b45309]">★★★★★</span>
            </div>
            <p className="text-[4px] leading-relaxed text-stone-500">
              &ldquo;Best cold brew in town — worth the short drive.&rdquo;
            </p>
          </div>
          <div className="mt-1.5 flex gap-1">
            {[MOCK_CAFE_PHOTOS.featuredCafe, MOCK_CAFE_PHOTOS.coffeeHouse, MOCK_CAFE_PHOTOS.bistro].map((src, i) => (
              <MockPhoto key={i} src={src} className="h-8 flex-1 rounded-lg" />
            ))}
          </div>
        </div>

        {revealStep >= 3 && (
          <div className="border-t border-stone-200/80 bg-[#fafaf8] px-2.5 py-1.5">
            <button type="button" className="w-full rounded-xl bg-[#1a1a1a] py-1.5 text-[5px] font-bold text-white">
              Get directions
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

type BusinessFlowPhase = 'leads' | 'earnings' | 'growth' | 'profile';

function useBusinessAppFlow(resetKey: number) {
  const [phase, setPhase] = useState<BusinessFlowPhase>('leads');
  const [highlightTab, setHighlightTab] = useState<BusinessFlowPhase | null>(null);

  useEffect(() => {
    setPhase('leads');
    setHighlightTab(null);

    const h1 = setTimeout(() => setHighlightTab('earnings'), 3200);
    const p1 = setTimeout(() => {
      setPhase('earnings');
      setHighlightTab(null);
    }, 3500);
    const h2 = setTimeout(() => setHighlightTab('growth'), 6700);
    const p2 = setTimeout(() => {
      setPhase('growth');
      setHighlightTab(null);
    }, 7000);
    const h3 = setTimeout(() => setHighlightTab('profile'), 10200);
    const p3 = setTimeout(() => {
      setPhase('profile');
      setHighlightTab(null);
    }, 10500);

    return () => {
      clearTimeout(h1);
      clearTimeout(p1);
      clearTimeout(h2);
      clearTimeout(p2);
      clearTimeout(h3);
      clearTimeout(p3);
    };
  }, [resetKey]);

  return { phase, highlightTab };
}

function BusinessMerchantHeader({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <div className="relative overflow-hidden border-b border-white/[0.05] bg-gradient-to-r from-[#0c1220] to-[#101a2e] px-2.5 py-2">
      <div className="pointer-events-none absolute -right-4 top-0 h-12 w-12 rounded-full bg-[#f9b864]/10 blur-xl" aria-hidden />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-[#f9b864] to-[#f69e32] text-[7px] font-black text-[#0a0f1a]">
            SC
          </div>
          <div>
            <p className="text-[6px] font-medium text-white/45">Sunrise Cafe</p>
            <div className="flex items-center gap-1">
              <p className="text-[8px] font-bold text-white">{title}</p>
              {badge && (
                <span className="rounded-full bg-[#ef4444] px-1 py-px text-[4px] font-bold text-white">{badge}</span>
              )}
            </div>
            {subtitle && <p className="text-[4px] text-white/35">{subtitle}</p>}
          </div>
        </div>
        <div className="relative flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.06] ring-1 ring-white/10">
          <Bell size={9} className="text-white/60" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#f9b864]" />
        </div>
      </div>
    </div>
  );
}

function BusinessMerchantBottomNav({
  active,
  highlight,
}: {
  active: BusinessFlowPhase;
  highlight: BusinessFlowPhase | null;
}) {
  const tabs = [
    { id: 'leads' as const, label: 'Leads', icon: Inbox, badge: 5 },
    { id: 'earnings' as const, label: 'Earnings', icon: Wallet, badge: 0 },
    { id: 'growth' as const, label: 'Growth', icon: TrendingUp, badge: 0 },
    { id: 'profile' as const, label: 'Profile', icon: Briefcase, badge: 0 },
  ];

  return (
    <div className="relative border-t border-white/[0.06] bg-[#0a0f1a]/98 px-1.5 py-1.5 backdrop-blur-md">
      <div className="flex">
        {tabs.map(({ id, label, icon: Icon, badge }) => {
          const isActive = active === id;
          const isHighlight = highlight === id;
          return (
            <div key={id} className="relative flex flex-1 flex-col items-center gap-0.5 py-0.5">
              {isActive && <span className="absolute -top-1 h-0.5 w-5 rounded-full bg-[#f9b864]" />}
              <span
                className={`relative flex h-5 w-5 items-center justify-center rounded-lg ${
                  isHighlight ? 'animate-app-tap-pulse ring-2 ring-[#f9b864]' : ''
                }`}
              >
                <Icon
                  size={10}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? 'text-[#f9b864]' : 'text-white/28'}
                />
                {badge > 0 && (
                  <span className="absolute -right-1 -top-0.5 flex h-3 min-w-[10px] items-center justify-center rounded-full bg-[#ef4444] px-0.5 text-[4px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </span>
              <span className={`text-[5px] font-semibold ${isActive ? 'text-[#f9b864]' : 'text-white/28'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BusinessAppFlow({ resetKey }: { resetKey: number }) {
  const { phase, highlightTab } = useBusinessAppFlow(resetKey);
  const phases: BusinessFlowPhase[] = ['leads', 'earnings', 'growth', 'profile'];
  const phaseIndex = phases.indexOf(phase);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#070b14]">
      {phases.map((p, i) => (
        <div
          key={p}
          className={`absolute inset-0 transition-all duration-500 ease-out ${
            phase === p
              ? 'translate-x-0 opacity-100'
              : i < phaseIndex
                ? '-translate-x-[18%] opacity-0 pointer-events-none'
                : 'translate-x-full opacity-0 pointer-events-none'
          }`}
        >
          {p === 'leads' && <BusinessLeadsScreen highlight={highlightTab} />}
          {p === 'earnings' && <BusinessEarningsScreen highlight={highlightTab} />}
          {p === 'growth' && <BusinessGrowthScreen highlight={highlightTab} />}
          {p === 'profile' && <BusinessProfileScreen highlight={highlightTab} />}
        </div>
      ))}
    </div>
  );
}

function BusinessLeadsScreen({ highlight }: { highlight: BusinessFlowPhase | null }) {
  const leads = [
    {
      initials: 'RK',
      name: 'Rahul Kapoor',
      time: '2m ago',
      hot: true,
      request: 'Wedding catering for 200 guests — need quote today',
      budget: '₹45k',
      source: 'FinderB search',
    },
    {
      initials: 'PS',
      name: 'Priya Sharma',
      time: '14m ago',
      hot: false,
      request: 'Corporate brunch for 30 people this Saturday',
      budget: '₹18k',
      source: 'Profile view',
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <PhoneStatusBar dark />
      <BusinessMerchantHeader title="Lead Inbox" badge="5 new" subtitle="Reply fast to convert more" />

      <div className="flex-1 overflow-hidden px-2 pt-1.5">
        <div className="mb-1 flex items-center gap-1 rounded-xl border border-[#f9b864]/30 bg-[#f9b864]/10 px-1.5 py-1">
          <Timer size={8} className="shrink-0 text-[#f9b864]" />
          <p className="text-[4px] font-semibold text-[#f9b864]">
            3 leads need reply within <span className="font-black">1 hour</span>
          </p>
        </div>

        <div className="mb-1 grid grid-cols-3 gap-0.5">
          {[
            { label: 'New today', val: '5', color: 'text-[#f9b864]' },
            { label: 'Awaiting', val: '3', color: 'text-[#ef4444]' },
            { label: 'Pipeline', val: '₹78k', color: 'text-[#34d399]' },
          ].map(({ label, val, color }) => (
            <div key={label} className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-1">
              <p className="text-[3px] uppercase text-white/35">{label}</p>
              <p className={`text-[8px] font-black ${color}`}>{val}</p>
            </div>
          ))}
        </div>

        <div className="space-y-1">
          {leads.map((lead) => (
            <div
              key={lead.name}
              className={`overflow-hidden rounded-xl border p-1.5 ${
                lead.hot
                  ? 'border-[#f9b864]/40 bg-gradient-to-br from-[#f9b864]/12 to-transparent'
                  : 'border-white/[0.06] bg-white/[0.03]'
              }`}
            >
              {lead.hot && (
                <p className="mb-0.5 flex items-center gap-0.5 text-[4px] font-black text-[#f9b864]">
                  <Flame size={6} /> Hot lead
                </p>
              )}
              <div className="mb-0.5 flex items-start justify-between">
                <div className="flex items-center gap-1">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#215481] to-[#4f8dc3] text-[4px] font-bold text-white">
                    {lead.initials}
                  </div>
                  <div>
                    <p className="text-[5px] font-bold text-white">{lead.name}</p>
                    <p className="text-[3px] text-white/35">{lead.time} · {lead.source}</p>
                  </div>
                </div>
                <span className="text-[5px] font-black text-[#f9b864]">{lead.budget}</span>
              </div>
              <p className="mb-1 line-clamp-2 text-[4px] leading-snug text-white/75">&ldquo;{lead.request}&rdquo;</p>
              <div className="flex gap-0.5">
                <div className="flex flex-1 items-center justify-center gap-0.5 rounded-md bg-[#215481] py-0.5 text-[4px] font-bold text-white">
                  <Phone size={6} /> Call
                </div>
                <div className={`flex flex-1 items-center justify-center gap-0.5 rounded-md py-0.5 text-[4px] font-bold ${lead.hot ? 'bg-[#f9b864] text-[#0a0f1a]' : 'border border-white/15 text-white/75'}`}>
                  <MessageSquare size={6} /> Reply
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BusinessMerchantBottomNav active="leads" highlight={highlight} />
    </div>
  );
}

function BusinessEarningsScreen({ highlight }: { highlight: BusinessFlowPhase | null }) {
  const sparkline = 'M0,16 L10,12 L20,14 L30,8 L40,10 L48,4';
  const bars = [42, 58, 48, 72, 65, 80, 68];

  return (
    <div className="flex h-full flex-col">
      <PhoneStatusBar dark />
      <BusinessMerchantHeader title="Earnings" subtitle="Track revenue from FinderB leads" />

      <div className="flex-1 overflow-hidden px-2 pt-1.5">
        <div className="relative mb-1.5 overflow-hidden rounded-xl border border-[#f9b864]/20 bg-gradient-to-br from-[#f9b864]/12 to-transparent p-2">
          <p className="text-[4px] font-semibold uppercase tracking-wide text-white/40">Today&apos;s earnings</p>
          <p className="text-[14px] font-black leading-none text-white">₹12,480</p>
          <span className="mt-0.5 inline-flex items-center gap-0.5 rounded bg-[#22c55e]/15 px-1 py-px text-[4px] font-bold text-[#34d399]">
            <ArrowUpRight size={5} /> +18% vs yesterday
          </span>
          <svg viewBox="0 0 48 20" className="absolute right-2 top-2 h-7 w-12" aria-hidden>
            <path d={`${sparkline} L48,20 L0,20 Z`} fill="rgba(249,184,100,0.2)" />
            <path d={sparkline} fill="none" stroke="#f9b864" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        <div className="mb-1.5 grid grid-cols-3 gap-0.5">
          {[
            { label: 'This week', val: '₹78k', sub: '+12%' },
            { label: 'Converted', val: '12', sub: 'leads' },
            { label: 'Avg order', val: '₹6.5k', sub: 'value' },
          ].map(({ label, val, sub }) => (
            <div key={label} className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-1">
              <p className="text-[3px] uppercase text-white/35">{label}</p>
              <p className="text-[7px] font-bold text-white">{val}</p>
              <p className="text-[3px] text-[#34d399]">{sub}</p>
            </div>
          ))}
        </div>

        <div className="mb-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1.5">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[5px] font-semibold text-white/50">Weekly revenue</p>
            <BarChart3 size={8} className="text-[#f9b864]" />
          </div>
          <div className="flex h-8 items-end gap-0.5">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 origin-bottom rounded-sm bg-gradient-to-t from-[#215481] to-[#f9b864] animate-app-bar-rise"
                style={{ height: `${h}%`, animationDelay: `${i * 0.05}s`, animationFillMode: 'both' }}
              />
            ))}
          </div>
        </div>

        <p className="mb-0.5 text-[5px] font-bold text-white/50">Recent conversions</p>
        {[
          { name: 'Rahul K.', amt: '₹45,000', tag: 'Catering' },
          { name: 'Priya S.', amt: '₹18,000', tag: 'Brunch' },
        ].map(({ name, amt, tag }) => (
          <div key={name} className="mb-0.5 flex items-center justify-between rounded-lg bg-white/[0.03] px-1.5 py-1 ring-1 ring-white/[0.05]">
            <div>
              <p className="text-[5px] font-bold text-white">{name}</p>
              <p className="text-[3px] text-white/35">{tag}</p>
            </div>
            <span className="text-[5px] font-bold text-[#34d399]">{amt}</span>
          </div>
        ))}
      </div>

      <BusinessMerchantBottomNav active="earnings" highlight={highlight} />
    </div>
  );
}

function BusinessGrowthScreen({ highlight }: { highlight: BusinessFlowPhase | null }) {
  const options = [
    { title: 'Boost listing', desc: '2× visibility for 7 days', icon: TrendingUp, hot: true },
    { title: 'Publish an offer', desc: 'Attract deal seekers nearby', icon: Zap, hot: false },
    { title: 'Add photos', desc: 'Listings with 5+ photos get 40% more views', icon: Grid3X3, hot: false },
    { title: 'Reply faster', desc: 'Under 5 min = 3× more bookings', icon: MessageSquare, hot: false },
  ];

  return (
    <div className="flex h-full flex-col">
      <PhoneStatusBar dark />
      <BusinessMerchantHeader title="Growth" subtitle="Get more leads & visibility" />

      <div className="flex-1 overflow-hidden px-2 pt-1.5">
        <div className="mb-1.5 rounded-xl border border-[#4f8dc3]/25 bg-gradient-to-r from-[#215481]/25 to-transparent p-1.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[5px] font-bold text-white">Visibility score</p>
              <p className="text-[12px] font-black text-[#f9b864]">78<span className="text-[6px] text-white/40">/100</span></p>
            </div>
            <div className="h-8 w-8 rounded-full border-2 border-[#f9b864]/40 p-0.5">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#f9b864]/15 text-[5px] font-bold text-[#f9b864]">
                78%
              </div>
            </div>
          </div>
          <p className="mt-0.5 text-[4px] text-white/45">Add 2 photos & publish an offer to reach 90+</p>
        </div>

        <p className="mb-0.5 text-[5px] font-bold text-white/50">Growth actions</p>
        <div className="space-y-0.5">
          {options.map(({ title, desc, icon: Icon, hot }) => (
            <div
              key={title}
              className={`flex items-center gap-1.5 rounded-xl p-1.5 ${
                hot
                  ? 'border border-[#f9b864]/35 bg-[#f9b864]/10'
                  : 'border border-white/[0.06] bg-white/[0.03]'
              }`}
            >
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${hot ? 'bg-[#f9b864]/20' : 'bg-white/[0.06]'}`}>
                <Icon size={9} className={hot ? 'text-[#f9b864]' : 'text-white/50'} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[5px] font-bold text-white">{title}</p>
                <p className="text-[3px] text-white/40">{desc}</p>
              </div>
              {hot && (
                <span className="shrink-0 rounded bg-[#f9b864] px-1 py-px text-[3px] font-bold text-[#0a0f1a]">Boost</span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-1 rounded-lg bg-[#22c55e]/10 px-1.5 py-1 ring-1 ring-[#22c55e]/20">
          <p className="text-[4px] font-medium text-[#34d399]">
            Merchants using Boost get <span className="font-bold">2× more leads</span> on average
          </p>
        </div>
      </div>

      <BusinessMerchantBottomNav active="growth" highlight={highlight} />
    </div>
  );
}

function BusinessProfileScreen({ highlight }: { highlight: BusinessFlowPhase | null }) {
  return (
    <div className="flex h-full flex-col">
      <PhoneStatusBar dark />
      <BusinessMerchantHeader title="Your listing" subtitle="Manage how customers see you" />

      <div className="flex-1 overflow-hidden px-2 pt-1.5">
        <div className={`relative mb-1.5 h-12 overflow-hidden rounded-xl bg-gradient-to-br from-[#2c1810] via-[#6b4423] to-[#c9956c]`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <span className="absolute right-1 top-1 rounded bg-black/40 px-1 py-px text-[3px] font-bold text-white backdrop-blur-sm">
            Edit cover
          </span>
          <div className="absolute bottom-1 left-1.5">
            <p className="text-[7px] font-bold text-white">Sunrise Cafe</p>
            <p className="text-[4px] text-white/75">Cafe · Coffee & Brunch</p>
          </div>
        </div>

        <div className="mb-1 flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.04] p-1">
          <div>
            <p className="text-[4px] text-white/40">Listing completion</p>
            <p className="text-[7px] font-bold text-white">85%</p>
          </div>
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-[#215481] to-[#f9b864]" />
          </div>
        </div>

        <div className="mb-1 grid grid-cols-3 gap-0.5">
          {[
            { label: 'Rating', val: '4.8 ★', icon: Star },
            { label: 'Views', val: '1.2k', icon: Eye },
            { label: 'Reviews', val: '128', icon: MessageSquare },
          ].map(({ label, val, icon: Icon }) => (
            <div key={label} className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-1 text-center">
              <Icon size={8} className="mx-auto mb-0.5 text-[#f9b864]" />
              <p className="text-[6px] font-bold text-white">{val}</p>
              <p className="text-[3px] text-white/35">{label}</p>
            </div>
          ))}
        </div>

        <p className="mb-0.5 text-[5px] font-bold text-white/50">Manage listing</p>
        <div className="grid grid-cols-2 gap-0.5">
          {['Business hours', 'Photos & menu', 'Location', 'Offers & deals'].map((item) => (
            <div key={item} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] px-1.5 py-1">
              <span className="text-[4px] font-medium text-white/75">{item}</span>
              <ChevronRight size={8} className="text-white/25" />
            </div>
          ))}
        </div>

        <div className="mt-1 flex items-center gap-1 rounded-lg border border-[#22c55e]/25 bg-[#22c55e]/10 px-1.5 py-1">
          <ShieldCheck size={8} className="text-[#34d399]" />
          <p className="text-[4px] font-medium text-[#34d399]">Verified business · visible on FinderB</p>
        </div>
      </div>

      <BusinessMerchantBottomNav active="profile" highlight={highlight} />
    </div>
  );
}

function PhoneMockup({
  app,
  tilt,
  className,
}: {
  app: 'finderb' | 'business';
  tilt: 'left' | 'right';
  className?: string;
}) {
  const isBusiness = app === 'business';
  const isLeft = tilt === 'left';

  return (
    <div className={className}>
      <div
        className={`relative mx-auto w-[158px] sm:w-[178px] ${
          isLeft ? 'animate-app-phone-left' : 'animate-app-phone-right'
        }`}
      >
        <div
          className={`absolute -inset-4 rounded-[2.75rem] blur-2xl ${
            isBusiness ? 'bg-[#f9b864]/20' : 'bg-[#4f8dc3]/25'
          }`}
          aria-hidden
        />
        <p
          className={`mb-2.5 text-center text-[10px] font-bold uppercase tracking-[0.2em] ${
            isBusiness ? 'text-[#f9b864]' : 'text-sky-300'
          }`}
        >
          {isBusiness ? 'FinderB Business' : 'FinderB'}
        </p>
        <div className="relative rounded-[2rem] bg-[#1a1a1c] p-[3px] shadow-[0_28px_70px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
          <div className="overflow-hidden rounded-[1.85rem] bg-black">
            <div className="aspect-[9/19] w-full">
              <AnimatedPhoneScreen app={isBusiness ? 'business' : 'finderb'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const FINDERB_FEATURES = [
  { icon: Zap, label: 'Instant local search', color: 'text-amber-300' },
  { icon: MapPin, label: 'GPS-powered discovery', color: 'text-sky-300' },
  { icon: Bell, label: 'Deal alerts near you', color: 'text-emerald-300' },
  { icon: Heart, label: 'Save favourites offline', color: 'text-rose-300' },
] as const;

const BUSINESS_FEATURES = [
  { icon: Briefcase, label: 'Manage your listing', color: 'text-secondary' },
  { icon: TrendingUp, label: 'Track leads & views', color: 'text-sky-300' },
  { icon: MessageSquare, label: 'Reply to customers', color: 'text-emerald-300' },
  { icon: BarChart3, label: 'Business analytics', color: 'text-violet-300' },
] as const;

export default function NativeAppsComingSoon() {
  return (
    <section className="relative overflow-hidden py-10 sm:px-6 lg:py-16">
      <div className="relative w-full sm:mx-auto sm:max-w-7xl">
        <div className="relative overflow-hidden rounded-none border-y border-white/10 bg-[#071222] shadow-[0_32px_80px_rgba(33,84,129,0.35)] sm:rounded-[2.5rem] sm:border">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <div className="absolute -left-1/4 -top-1/4 h-[70%] w-[70%] rounded-full bg-[#215481]/40 blur-[100px] animate-app-aurora" />
            <div
              className="absolute -bottom-1/4 -right-1/4 h-[65%] w-[65%] rounded-full bg-secondary/25 blur-[90px] animate-app-aurora"
              style={{ animationDelay: '2s' }}
            />
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />
          </div>

          <div
            className="pointer-events-none absolute right-[6%] top-[14%] hidden h-52 w-52 rounded-full border border-dashed border-white/8 lg:block animate-app-orbit"
            aria-hidden
          >
            <Sparkles size={12} className="absolute -top-1 left-1/2 -translate-x-1/2 text-secondary/80" />
          </div>

          <div className="relative grid items-center gap-12 px-4 py-6 sm:p-10 lg:grid-cols-[1fr_1.15fr] lg:gap-6 lg:p-12 xl:p-14">
            <div className="relative z-10 text-left">
              <h2 className="mb-4 text-3xl font-extrabold leading-[1.08] tracking-tight !text-white sm:text-4xl lg:text-[2.65rem]">
                Two FinderB apps hitting{' '}
                <span className="bg-gradient-to-r from-secondary via-amber-200 to-cyan-300 bg-[length:200%_auto] bg-clip-text text-transparent animate-coming-soon-shimmer">
                  App Store &amp; Google Play
                </span>
              </h2>

              <p className="mb-8 max-w-lg text-sm leading-relaxed text-white/60 sm:text-base">
                <strong className="text-white/90">FinderB</strong> helps you discover local
                services. <strong className="text-secondary">FinderB Business</strong> helps
                merchants grow — both launching natively on iOS and Android.
              </p>

              <div className="space-y-3">
                <FinderBAppCard
                  variant="finderb"
                  title="FinderB"
                  tagline="Discover verified businesses, deals & services near you"
                  features={FINDERB_FEATURES}
                />
                <FinderBAppCard
                  variant="business"
                  title="FinderB Business"
                  tagline="Manage listings, leads, reviews & analytics on the go"
                  features={BUSINESS_FEATURES}
                />
              </div>
            </div>

            <div className="relative flex min-h-[340px] items-end justify-center sm:min-h-[380px] lg:min-h-[420px]">
              <div
                className="pointer-events-none absolute left-1/2 top-[45%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#215481]/30 via-secondary/15 to-[#4f8dc3]/20 blur-3xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute left-1/2 top-[36%] z-0 hidden h-px w-28 -translate-x-1/2 bg-gradient-to-r from-transparent via-secondary/50 to-transparent sm:block"
                aria-hidden
              />
              <div className="pointer-events-none absolute left-1/2 top-[32%] z-0 hidden -translate-x-1/2 rounded-full border border-white/10 bg-[#071222]/90 px-3 py-1 text-[8px] font-bold uppercase tracking-[0.2em] text-white/50 sm:block">
                One ecosystem
              </div>

              <PhoneMockup app="finderb" tilt="left" className="relative z-10 -mr-6 mt-4 sm:-mr-10" />
              <PhoneMockup app="business" tilt="right" className="relative z-20" />

              <div className="absolute right-0 top-6 z-30 hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-md sm:block">
                <p className="text-[8px] font-bold uppercase tracking-wider text-secondary">
                  2 FinderB apps
                </p>
                <p className="text-[11px] font-semibold text-white">iOS &amp; Android</p>
              </div>

              <div className="absolute bottom-24 left-0 z-30 hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-md sm:block">
                <div className="mb-1 flex items-center gap-1.5">
                  <GooglePlayIcon className="h-3.5 w-3.5" />
                  <AppStoreIcon className="h-3 w-3 text-white" />
                </div>
                <p className="text-[10px] font-medium text-white/70">Both app stores</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden border-t border-white/5 bg-white/[0.02] px-6 py-3">
            <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            <p className="relative text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
              FinderB · FinderB Business · App Store · Google Play · Coming 2026
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
