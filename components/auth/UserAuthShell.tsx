'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { MapPin, ShieldCheck, Sparkles } from 'lucide-react';

const STATS = [
  { value: '300+', label: 'Cities' },
  { value: '2M+', label: 'Listings' },
  { value: '4.8', label: 'Avg rating' },
];

type UserAuthShellProps = {
  mode: 'login' | 'signup';
  children: ReactNode;
  footer: ReactNode;
};

export function UserAuthDivider({ label = 'or continue with email' }: { label?: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-slate-200/90" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          {label}
        </span>
      </div>
    </div>
  );
}

export function UserAuthTrustRow() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-slate-400">
      <span className="inline-flex items-center gap-1">
        <ShieldCheck size={12} />
        Secure sign-in
      </span>
      <span className="inline-flex items-center gap-1">
        <MapPin size={12} />
        India-wide listings
      </span>
      <span className="inline-flex items-center gap-1">
        <Sparkles size={12} />
        Free to use
      </span>
    </div>
  );
}

export default function UserAuthShell({ mode, children, footer }: UserAuthShellProps) {
  const isLogin = mode === 'login';

  return (
    <div className="relative min-h-[calc(100dvh-5rem)] overflow-hidden bg-[#eef3f9] px-4 pb-10 pt-24 sm:px-6 sm:pt-28 md:pt-32 lg:min-h-[calc(100dvh-4rem)] lg:pt-36 lg:pb-14 xl:pt-40">
      <div
        className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#f9b864]/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 top-0 h-80 w-80 rounded-full bg-[#215481]/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(33,84,129,0.09) 0%, transparent 42%), radial-gradient(circle at 85% 10%, rgba(249,184,100,0.14) 0%, transparent 38%)',
        }}
      />

      <div className="relative mx-auto flex min-h-[calc(100dvh-8rem)] max-w-5xl flex-col overflow-hidden rounded-[1.35rem] border border-white/70 bg-white/90 shadow-[0_28px_80px_-36px_rgba(15,39,59,0.45)] backdrop-blur-sm lg:min-h-[600px] lg:flex-row">
        <aside className="relative hidden overflow-hidden bg-[#153551] lg:flex lg:w-[44%] lg:flex-col lg:justify-between">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            aria-hidden
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.65) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.65) 1px, transparent 1px)',
              backgroundSize: '34px 34px',
            }}
          />
          <div className="pointer-events-none absolute -right-16 top-1/3 h-56 w-56 rounded-full bg-[#f9b864]/25 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[48%] max-h-[320px]">
            <div className="absolute bottom-0 right-0 h-full w-[92%] translate-x-6">
              <Image
                src="/hero-new.png"
                alt=""
                fill
                className="object-contain object-right-bottom"
                sizes="440px"
                priority
              />
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-[#153551] via-[#153551]/60 to-[#153551]/88" />

          <div className="relative z-10 p-10 xl:p-12">
            <Link href="/" className="inline-block">
              <Image
                src="/logo1.png"
                alt="FinderB"
                width={132}
                height={44}
                className="h-9 w-auto brightness-0 invert"
                priority
              />
            </Link>
            <div className="mt-14 max-w-sm">
              <h1 className="text-[1.85rem] font-bold leading-snug tracking-tight !text-white xl:text-[2.1rem]">
                {isLogin ? 'Your city, saved and ready' : 'Discover what\u2019s around you'}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-white/72">
                {isLogin
                  ? 'Pick up saved places, reviews, and favourites across 300+ cities — sign in once and keep exploring.'
                  : 'Save favourites, write reviews, and find trusted local businesses. One account for everything FinderB.'}
              </p>
            </div>
          </div>

          <div className="relative z-10 border-t border-white/10 px-10 py-8 xl:px-12">
            <div className="grid grid-cols-3 gap-4">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <p className="text-lg font-bold text-white">{stat.value}</p>
                  <p className="text-[11px] text-white/55">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex flex-1 flex-col justify-start px-6 pb-8 pt-10 sm:px-10 lg:justify-center lg:px-12 lg:py-10 xl:px-14">
          <div className="mx-auto w-full max-w-[22rem]">{children}</div>
          <div className="mx-auto mt-8 w-full max-w-[22rem]">{footer}</div>
        </div>
      </div>
    </div>
  );
}
