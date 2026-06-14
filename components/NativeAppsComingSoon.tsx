'use client';

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
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-white/10">
        <AppStoreIcon className="h-4 w-4 text-[#0a1628]" />
        <span className="text-[10px] font-semibold text-[#0a1628]">App Store</span>
      </div>
      <div className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-white/10">
        <GooglePlayIcon className="h-4 w-4" />
        <span className="text-[10px] font-semibold text-[#0a1628]">Google Play</span>
      </div>
      <span className="ml-auto rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white/50">
        Soon
      </span>
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
      className={`group relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:border-white/20 ${
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
        dark ? 'bg-[#0f172a] text-white/50' : 'bg-white text-slate-400'
      }`}
    >
      <span>9:41</span>
      <div className="h-3.5 w-[46px] rounded-full bg-black/85 ring-1 ring-white/10" />
      <span>5G</span>
    </div>
  );
}

function FinderBAppScreen() {
  const categories = ['Food', 'Repair', 'Health', 'Shops'];
  const listings = [
    { name: 'Blue Tokai', cat: 'Cafe', dist: '0.8 km', rating: '4.8', hue: 'from-[#215481] to-[#4f8dc3]' },
    { name: 'QuickFix Plumbing', cat: 'Services', dist: '1.1 km', rating: '4.9', hue: 'from-violet-500 to-indigo-500' },
    { name: 'City Dental Care', cat: 'Healthcare', dist: '1.4 km', rating: '4.7', hue: 'from-emerald-500 to-teal-500' },
  ];

  return (
    <div className="flex h-full flex-col bg-[#f4f7fb]">
      <PhoneStatusBar />
      <div className="flex-1 overflow-hidden px-2.5 pb-2 pt-2">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <p className="text-[7px] font-medium text-slate-400">Good afternoon</p>
            <div className="mt-0.5 flex items-center gap-1">
              <MapPin size={8} className="text-[#2563eb]" strokeWidth={2.5} />
              <p className="text-[9px] font-bold text-[#0f172a]">Gomti Nagar, Lucknow</p>
            </div>
          </div>
          <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100">
            <Bell size={9} className="text-slate-500" />
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#ef4444] ring-2 ring-white" />
          </div>
        </div>
        <div className="mb-2 flex h-8 items-center gap-1.5 rounded-xl bg-white px-2.5 shadow-sm ring-1 ring-slate-100">
          <div className="flex h-4 w-4 items-center justify-center rounded-md bg-[#215481]/10">
            <svg viewBox="0 0 16 16" className="h-2.5 w-2.5 text-[#215481]" aria-hidden>
              <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <span className="flex-1 text-[7px] text-slate-400">cafes, plumbers, doctors…</span>
          <div className="rounded-md bg-[#215481] px-1.5 py-0.5 text-[6px] font-bold text-white">Go</div>
        </div>
        <div className="mb-2 flex gap-1 overflow-hidden">
          {categories.map((cat, i) => (
            <span
              key={cat}
              className={`shrink-0 rounded-full px-2 py-1 text-[6px] font-semibold ${
                i === 0 ? 'bg-[#215481] text-white' : 'bg-white text-slate-500 ring-1 ring-slate-100'
              }`}
            >
              {cat}
            </span>
          ))}
        </div>
        <div className="mb-2 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="relative h-14 bg-gradient-to-br from-[#215481] via-[#4f8dc3] to-[#f9b864] p-2">
            <span className="rounded bg-white/20 px-1.5 py-0.5 text-[5px] font-bold uppercase tracking-wide text-white">
              Featured
            </span>
            <p className="mt-1 text-[8px] font-bold leading-tight text-white">Top rated near you</p>
            <p className="text-[6px] text-white/75">12 verified businesses</p>
          </div>
        </div>
        <div className="space-y-1.5">
          {listings.map(({ name, cat, dist, rating, hue }) => (
            <div
              key={name}
              className="flex items-center gap-2 rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-slate-100"
            >
              <div className={`h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br ${hue}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="truncate text-[7px] font-bold text-[#0f172a]">{name}</p>
                  <span className="rounded bg-[#22c55e] px-1 py-px text-[4px] font-bold uppercase text-white">
                    ✓
                  </span>
                </div>
                <p className="text-[6px] text-slate-400">
                  {cat} · {dist}
                </p>
              </div>
              <p className="shrink-0 text-[7px] font-bold text-[#f59e0b]">★ {rating}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex border-t border-slate-200/80 bg-white px-1 py-1.5">
        {['Home', 'Explore', 'Saved', 'You'].map((tab, i) => (
          <div key={tab} className="flex flex-1 flex-col items-center gap-0.5">
            <div className={`h-1 w-1 rounded-full ${i === 0 ? 'bg-[#215481]' : 'bg-transparent'}`} />
            <span className={`text-[5px] font-semibold ${i === 0 ? 'text-[#215481]' : 'text-slate-400'}`}>
              {tab}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BusinessAppScreen() {
  const bars = [38, 52, 44, 68, 58, 72, 64];
  const activities = [
    { initials: 'RK', text: 'New lead — wedding catering', time: '2m', hot: true },
    { initials: 'PS', text: '5-star review received', time: '18m', hot: false },
    { initials: 'AM', text: 'Profile viewed 47 times today', time: '1h', hot: false },
  ];

  return (
    <div className="flex h-full flex-col bg-[#0c1220]">
      <PhoneStatusBar dark />
      <div className="flex-1 overflow-hidden px-2.5 pb-2 pt-2">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-[7px] font-medium text-white/40">Dashboard</p>
            <p className="text-[9px] font-bold text-white">Sunrise Cafe</p>
          </div>
          <span className="rounded-full bg-[#f9b864]/15 px-2 py-0.5 text-[6px] font-bold text-[#f9b864]">
            Pro
          </span>
        </div>
        <div className="mb-2 grid grid-cols-3 gap-1">
          {[
            { label: 'Leads', val: '24', up: '+12%' },
            { label: 'Views', val: '1.2k', up: '+8%' },
            { label: 'Rating', val: '4.8', up: '★' },
          ].map(({ label, val, up }) => (
            <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-1.5">
              <p className="text-[5px] uppercase tracking-wide text-white/35">{label}</p>
              <p className="text-[10px] font-bold text-white">{val}</p>
              <p className="text-[5px] font-semibold text-[#34d399]">{up}</p>
            </div>
          ))}
        </div>
        <div className="mb-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-2">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[6px] font-semibold text-white/50">Weekly visibility</p>
            <p className="text-[6px] font-bold text-[#4f8dc3]">+24%</p>
          </div>
          <div className="flex h-10 items-end gap-0.5">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-gradient-to-t from-[#215481] to-[#4f8dc3]"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
        <p className="mb-1 text-[6px] font-bold uppercase tracking-wider text-white/30">Recent activity</p>
        <div className="space-y-1">
          {activities.map(({ initials, text, time, hot }) => (
            <div
              key={text}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.05] bg-white/[0.03] p-1.5"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#215481] to-[#4f8dc3] text-[6px] font-bold text-white">
                {initials}
              </div>
              <p className="min-w-0 flex-1 truncate text-[6px] font-medium text-white/80">{text}</p>
              <div className="shrink-0 text-right">
                {hot && <span className="mb-0.5 block h-1 w-1 rounded-full bg-[#f9b864]" />}
                <p className="text-[5px] text-white/30">{time}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1">
          {['Reply', 'Boost', 'Edit'].map((action, i) => (
            <div
              key={action}
              className={`rounded-lg py-1 text-center text-[6px] font-bold ${
                i === 0 ? 'bg-[#215481] text-white' : 'border border-white/10 text-white/50'
              }`}
            >
              {action}
            </div>
          ))}
        </div>
      </div>
      <div className="flex border-t border-white/[0.06] bg-[#0a0f1a] px-1 py-1.5">
        {['Home', 'Leads', 'Insights', 'More'].map((tab, i) => (
          <div key={tab} className="flex flex-1 flex-col items-center gap-0.5">
            <div className={`h-1 w-1 rounded-full ${i === 0 ? 'bg-[#f9b864]' : 'bg-transparent'}`} />
            <span className={`text-[5px] font-semibold ${i === 0 ? 'text-[#f9b864]' : 'text-white/30'}`}>
              {tab}
            </span>
          </div>
        ))}
      </div>
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
              {isBusiness ? <BusinessAppScreen /> : <FinderBAppScreen />}
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
    <section className="relative overflow-hidden px-4 py-10 sm:px-6 lg:py-16">
      <div className="relative mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#071222] shadow-[0_32px_80px_rgba(33,84,129,0.35)] sm:rounded-[2.5rem]">
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

          <div className="relative grid items-center gap-12 p-6 sm:p-10 lg:grid-cols-[1fr_1.15fr] lg:gap-6 lg:p-12 xl:p-14">
            <div className="relative z-10 text-center lg:text-left">
              <h2 className="mb-4 text-3xl font-extrabold leading-[1.08] tracking-tight !text-white sm:text-4xl lg:text-[2.65rem]">
                Two FinderB apps hitting{' '}
                <span className="bg-gradient-to-r from-secondary via-amber-200 to-cyan-300 bg-[length:200%_auto] bg-clip-text text-transparent animate-coming-soon-shimmer">
                  App Store &amp; Google Play
                </span>
              </h2>

              <p className="mx-auto mb-8 max-w-lg text-sm leading-relaxed text-white/60 sm:text-base lg:mx-0">
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
