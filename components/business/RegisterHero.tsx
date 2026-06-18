'use client';

import Image from 'next/image';
import { BadgeCheck, MessageSquare, Zap } from 'lucide-react';
import { MerchantAuthMain } from '@/components/business/MerchantAuthShell';
import {
  MerchantAuthFormAltLink,
  MerchantAuthFormBody,
  MerchantAuthFormCard,
  MerchantAuthFormHeader,
  MerchantAuthFormLegal,
  MerchantAuthPhoneField,
} from '@/components/business/MerchantAuthForm';

const TRUST_AVATARS = [
  '/testimonials/rahul-sharma.jpg',
  '/testimonials/priya-patel.jpg',
  '/testimonials/amit-kumar.jpg',
] as const;

type Stat = { label: string; value: string };

type RegisterHeroProps = {
  mobile: string;
  onMobileChange: (value: string) => void;
  onStart: () => void;
  stats: Stat[];
};

export default function RegisterHero({ mobile, onMobileChange, onStart, stats }: RegisterHeroProps) {
  return (
    <section className="register-hero relative overflow-hidden pb-14 sm:pb-20 lg:pb-24">
      <div className="register-hero-bg pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-[#f9b864]/20 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#215481]/15 blur-[90px]"
        aria-hidden
      />

      <MerchantAuthMain className="relative z-10">
        {/*
          Mobile: intro → form → stats (natural DOM order).
          Desktop: intro + stats in left column; form sticky in right column spanning both rows.
        */}
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[1fr_minmax(0,400px)] lg:grid-rows-[auto_auto] lg:items-start lg:gap-x-12 lg:gap-y-10 xl:grid-cols-[1.05fr_minmax(0,420px)] xl:gap-x-16">
          {/* Hero intro — first on mobile */}
          <div className="max-w-2xl lg:col-start-1 lg:row-start-1">
            <h1 className="text-[2.15rem] font-extrabold leading-[1.08] tracking-tight text-[#0a1520] sm:text-5xl lg:text-[3.25rem] xl:text-[3.5rem]">
              Turn local searches into{' '}
              <span className="register-hero-headline-accent">paying customers</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#3d4f63] sm:text-lg">
              List your business free on FinderB. Get discovered, collect leads, earn reviews, and
              upgrade when you&apos;re ready to scale.
            </p>

            <ul className="mt-6 flex flex-wrap gap-2.5 sm:mt-8 sm:gap-3">
              {[
                { icon: Zap, text: 'Free forever plan' },
                { icon: MessageSquare, text: 'Direct enquiries' },
                { icon: BadgeCheck, text: 'Verified growth tools' },
              ].map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#d8e2ec] bg-white px-3 py-2 text-sm font-semibold text-[#1e3348] shadow-sm"
                >
                  <Icon size={15} className="shrink-0 text-[#215481]" strokeWidth={2.25} />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* Form — second on mobile, right column on desktop */}
          <div className="mx-auto w-full max-w-md lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:mx-0 lg:max-w-none lg:sticky lg:top-28">
            <MerchantAuthFormCard>
              <MerchantAuthFormHeader
                title="List your business"
                subtitle="Enter your mobile number to set up your partner account. No payment required."
              />
              <MerchantAuthFormBody>
                <MerchantAuthPhoneField
                  value={mobile}
                  onChange={onMobileChange}
                  onSubmit={onStart}
                />

                <MerchantAuthFormLegal />

                <MerchantAuthFormAltLink
                  prompt="Already have a partner account?"
                  href="/business/login"
                  linkText="Sign in"
                />
              </MerchantAuthFormBody>
            </MerchantAuthFormCard>
          </div>

          {/* Stats + trust — third on mobile, below intro on desktop */}
          <div className="space-y-8 lg:col-start-1 lg:row-start-2">
            <ul className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-10 sm:gap-y-3">
              {stats.map((stat) => (
                <li key={stat.label}>
                  <p className="merchant-auth-stat-value text-xl font-bold tabular-nums sm:text-2xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-[#64748b]">{stat.label}</p>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-4">
              <div className="flex -space-x-2.5">
                {TRUST_AVATARS.map((src) => (
                  <div
                    key={src}
                    className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-white sm:h-10 sm:w-10"
                  >
                    <Image src={src} alt="" fill className="object-cover" sizes="40px" />
                  </div>
                ))}
              </div>
              <p className="text-sm font-medium text-[#3d4f63]">
                <span className="font-bold text-[#153551]">5.2 Crore+</span> businesses trust FinderB
              </p>
            </div>
          </div>
        </div>
      </MerchantAuthMain>
    </section>
  );
}
