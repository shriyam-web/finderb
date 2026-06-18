'use client';

import { useMemo, type ReactNode } from 'react';
import { Briefcase, Compass, MapPin, Star, Store, TrendingUp } from 'lucide-react';

type SplashVariant = 'consumer' | 'business';

/* ── Aurora mesh background ── */
export function SplashAuroraMesh({ variant }: { variant: SplashVariant }) {
  const isBusiness = variant === 'business';

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {isBusiness ? (
        <>
          <div className="splash-aurora-blob absolute -left-[20%] top-[10%] h-[55vh] w-[55vh] rounded-full bg-[#f9b864]/20 blur-[100px] animate-splash-aurora-a" />
          <div className="splash-aurora-blob absolute -right-[15%] bottom-[5%] h-[45vh] w-[45vh] rounded-full bg-[#4f8dc3]/15 blur-[90px] animate-splash-aurora-b" />
          <div className="splash-aurora-blob absolute left-[30%] top-[55%] h-[35vh] w-[35vh] rounded-full bg-[#215481]/40 blur-[80px] animate-splash-aurora-c" />
        </>
      ) : (
        <>
          <div className="splash-aurora-blob absolute -left-[10%] top-[5%] h-[50vh] w-[50vh] rounded-full bg-[#4f8dc3]/35 blur-[90px] animate-splash-aurora-a" />
          <div className="splash-aurora-blob absolute -right-[5%] top-[20%] h-[40vh] w-[40vh] rounded-full bg-[#f9b864]/30 blur-[80px] animate-splash-aurora-b" />
          <div className="splash-aurora-blob absolute bottom-[10%] left-[25%] h-[38vh] w-[38vh] rounded-full bg-[#215481]/20 blur-[70px] animate-splash-aurora-c" />
        </>
      )}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: isBusiness
            ? 'radial-gradient(circle at 50% 50%, transparent 0%, #0a1926 72%)'
            : 'radial-gradient(circle at 50% 40%, transparent 0%, rgba(255,255,255,0.85) 70%)',
        }}
      />
    </div>
  );
}

/* ── Floating particles ── */
export function SplashParticleField({ variant, count = 28 }: { variant: SplashVariant; count?: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${(i * 37 + 11) % 100}%`,
        top: `${(i * 53 + 7) % 100}%`,
        size: 2 + (i % 3),
        delay: `${(i % 12) * 0.35}s`,
        duration: `${4 + (i % 5)}s`,
      })),
    [count]
  );

  const color = variant === 'business' ? 'rgba(249,184,100,' : 'rgba(33,84,129,';
  const alpha = variant === 'business' ? '0.55)' : '0.35)';

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full animate-splash-particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            backgroundColor: `${color}${alpha}`,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}

/* ── Perspective grid (business) ── */
export function SplashPerspectiveGrid() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30" aria-hidden>
      <div className="splash-perspective-grid absolute left-1/2 top-[42%] h-[80vh] w-[200vw] -translate-x-1/2 animate-splash-grid-drift">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute left-0 right-0 border-t border-[#f9b864]/25"
            style={{ top: `${(i / 23) * 100}%` }}
          />
        ))}
        {Array.from({ length: 32 }).map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute bottom-0 top-0 border-l border-[#f9b864]/20"
            style={{ left: `${(i / 31) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Sonar ripples (consumer) — scoped behind logo only */
export function SplashSonarRings({ size = 200 }: { size?: number }) {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      aria-hidden
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#215481]/12 animate-splash-sonar"
          style={{
            width: size * 0.5 + i * 36,
            height: size * 0.5 + i * 36,
            animationDelay: `${i * 1.1}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Perimeter icons (consumer) — sit near screen edges, never over the logo/text */
const PERIMETER_ICONS = [
  { Icon: MapPin, pos: 'left-[7%] top-[16%]', delay: '0s' },
  { Icon: Compass, pos: 'right-[7%] top-[20%]', delay: '0.8s' },
  { Icon: Star, pos: 'left-[9%] bottom-[26%]', delay: '1.6s' },
  { Icon: Store, pos: 'right-[8%] bottom-[28%]', delay: '2.4s' },
] as const;

export function SplashPerimeterIcons() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {PERIMETER_ICONS.map(({ Icon, pos, delay }) => (
        <div
          key={pos}
          className={`absolute ${pos} animate-splash-perimeter-drift`}
          style={{ animationDelay: delay }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/75 shadow-[0_4px_20px_rgba(33,84,129,0.12)] ring-1 ring-[#215481]/10 backdrop-blur-md sm:h-10 sm:w-10">
            <Icon size={15} className="text-[#215481]/65" strokeWidth={2} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** @deprecated Use SplashPerimeterIcons — kept for compatibility */
export function SplashOrbitingIcons() {
  return <SplashPerimeterIcons />;
}

/* ── Data stream columns (business) ── */
const STREAM_CHARS = '01LEAD★REV★KYC★GROW★★★';

export function SplashDataStreams() {
  const columns = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        left: `${8 + i * 12}%`,
        delay: `${i * 0.4}s`,
        chars: STREAM_CHARS.repeat(3).slice(i * 2, i * 2 + 18),
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.12]" aria-hidden>
      {columns.map((col) => (
        <div
          key={col.id}
          className="absolute top-0 w-4 animate-splash-data-stream font-mono text-[10px] leading-4 tracking-widest text-[#f9b864]"
          style={{ left: col.left, animationDelay: col.delay }}
        >
          {col.chars.split('').map((c, j) => (
            <div key={j}>{c}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Scan line (business) ── */
export function SplashScanLine() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-px animate-splash-scan bg-gradient-to-r from-transparent via-[#f9b864]/60 to-transparent shadow-[0_0_24px_rgba(249,184,100,0.4)]"
      aria-hidden
    />
  );
}

/* ── Orbital hub around logo ── */
export function SplashOrbitHub({
  variant,
  progress,
  children,
}: {
  variant: SplashVariant;
  progress?: number;
  children: ReactNode;
}) {
  const isBusiness = variant === 'business';
  const size = isBusiness ? 200 : 188;
  const ringR = isBusiness ? 88 : 82;
  const circumference = 2 * Math.PI * ringR;
  const dashOffset =
    progress !== undefined ? circumference - (progress / 100) * circumference : undefined;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Glow */}
      <div
        className={`pointer-events-none absolute inset-4 rounded-full blur-2xl animate-splash-glow-breathe ${
          isBusiness ? 'bg-[#f9b864]/30' : 'bg-[#4f8dc3]/25'
        }`}
        aria-hidden
      />

      {/* Sonar for business */}
      {isBusiness &&
        [0, 1, 2].map((i) => (
          <span
            key={i}
            className="pointer-events-none absolute rounded-full border border-[#f9b864]/30 animate-splash-sonar-gold"
            style={{
              width: size * 0.55 + i * 36,
              height: size * 0.55 + i * 36,
              animationDelay: `${i * 1.1}s`,
            }}
            aria-hidden
          />
        ))}

      {/* Progress ring */}
      <svg
        className="absolute inset-0 -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={ringR}
          fill="none"
          stroke={isBusiness ? 'rgba(255,255,255,0.08)' : 'rgba(33,84,129,0.12)'}
          strokeWidth="3"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={ringR}
          fill="none"
          stroke={isBusiness ? '#f9b864' : 'url(#splashConsumerRing)'}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={
            progress !== undefined ? dashOffset : circumference * 0.72
          }
          className={
            progress !== undefined
              ? 'transition-[stroke-dashoffset] duration-300 ease-out'
              : 'animate-splash-ring-spin'
          }
        />
        {!isBusiness && (
          <defs>
            <linearGradient id="splashConsumerRing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#215481" />
              <stop offset="50%" stopColor="#4f8dc3" />
              <stop offset="100%" stopColor="#f9b864" />
            </linearGradient>
          </defs>
        )}
      </svg>

      {/* Orbiting dashed rings — business only; consumer stays minimal */}
      {isBusiness && (
        <>
          <div
            className="absolute inset-[10px] animate-app-splash-orbit rounded-full border border-dashed border-[#f9b864]/40"
            aria-hidden
          />
          <div
            className="absolute inset-[18px] animate-app-splash-orbit-rev rounded-full border border-white/12"
            aria-hidden
          />
          <div
            className="absolute inset-[26px] animate-splash-hex-spin rounded-full border-2 border-[#f9b864]/20"
            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
            aria-hidden
          />
        </>
      )}
      {!isBusiness && (
        <div
          className="absolute inset-[14px] rounded-full border border-[#4f8dc3]/15"
          aria-hidden
        />
      )}

      {/* Logo card */}
      <div
        className={`relative z-10 flex items-center justify-center overflow-hidden shadow-2xl animate-float ${
          isBusiness
            ? 'h-[118px] w-[118px] rounded-2xl bg-white px-4 ring-2 ring-[#f9b864]/35'
            : 'h-[108px] w-[108px] rounded-2xl border border-white/90 bg-white p-3.5 shadow-[0_20px_50px_rgba(33,84,129,0.18)] ring-1 ring-[#215481]/10 backdrop-blur-sm'
        }`}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute inset-y-0 w-1/2 animate-app-splash-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Progress bar ── */
export function SplashProgressBar({
  variant,
  progress,
}: {
  variant: SplashVariant;
  progress?: number;
}) {
  const isBusiness = variant === 'business';
  const track = isBusiness ? 'bg-white/12' : 'bg-[#215481]/10';
  const bar = isBusiness
    ? 'bg-gradient-to-r from-[#e8a84a] via-[#f9b864] to-[#ffcc70]'
    : 'bg-gradient-to-r from-[#215481] via-[#4f8dc3] to-[#f9b864]';

  return (
    <div className={`relative mx-auto h-1.5 w-full max-w-xs overflow-hidden rounded-full ${track}`}>
      {progress !== undefined ? (
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${bar}`}
          style={{ width: `${progress}%` }}
        />
      ) : (
        <div className={`absolute inset-y-0 animate-app-splash-progress-slide rounded-full ${bar}`} />
      )}
    </div>
  );
}

/* ── Status dots ── */
export function SplashDots({ variant }: { variant: SplashVariant }) {
  const color = variant === 'business' ? '#f9b864' : '#4f8dc3';
  return (
    <div className="mt-4 flex items-center justify-center gap-2" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full animate-app-splash-dot"
          style={{ backgroundColor: color, animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </div>
  );
}

/* ── Business metric chips ── */
export function SplashMetricChips() {
  const chips = [
    { label: 'Leads', Icon: TrendingUp },
    { label: 'Reviews', Icon: Star },
    { label: 'Growth', Icon: Briefcase },
  ];

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2" aria-hidden>
      {chips.map(({ label, Icon }, i) => (
        <span
          key={label}
          className="flex items-center gap-1.5 rounded-full border border-[#f9b864]/25 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#f9b864]/90 backdrop-blur-sm animate-splash-chip-in"
          style={{ animationDelay: `${0.3 + i * 0.15}s` }}
        >
          <Icon size={11} strokeWidth={2.5} />
          {label}
        </span>
      ))}
    </div>
  );
}

/* ── Consumer floating tags — corners only, clear center safe zone */
const FLOAT_TAGS = [
  { label: 'Restaurants', left: '5%', top: '8%' },
  { label: 'Cafés', left: '4%', top: '38%' },
  { label: 'Salons', right: '5%', top: '10%' },
  { label: 'Shops', right: '6%', top: '36%' },
  { label: 'Hotels', left: '6%', bottom: '22%' },
] as const;

export function SplashFloatingTags() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {FLOAT_TAGS.map((tag, i) => (
        <span
          key={tag.label}
          className="absolute rounded-full border border-[#215481]/8 bg-white/60 px-2.5 py-1 text-[9px] font-semibold text-[#215481]/55 shadow-sm backdrop-blur-sm animate-splash-tag-float sm:px-3 sm:text-[10px]"
          style={{
            left: 'left' in tag ? tag.left : undefined,
            top: 'top' in tag ? tag.top : undefined,
            right: 'right' in tag ? tag.right : undefined,
            bottom: 'bottom' in tag ? tag.bottom : undefined,
            animationDelay: `${i * 0.7}s`,
          }}
        >
          {tag.label}
        </span>
      ))}
    </div>
  );
}
