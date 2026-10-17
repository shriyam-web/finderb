import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicBadgeChip, PublicBadgeRow } from '@/components/business/PublicBadgeRow';
import { LivingFire } from '@/components/business/LivingFire';
import { BADGE_COPY, BADGE_HINT, BADGE_IDS, BADGE_LABEL } from '@/lib/businessBadges';

export const metadata: Metadata = {
  title: 'Badge preview',
  robots: { index: false, follow: false },
};

export default function BadgePreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <main className="min-h-screen bg-[#f4f1ec] px-4 pb-16 pt-28 text-[#153551]">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Local preview</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Public badges</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
          These chips appear on a business profile when the rules are met. An admin can force any of them on or off.
        </p>

        <section className="mt-8 overflow-hidden rounded-[28px] border border-white/80 bg-[#fafaf9] shadow-[0_20px_50px_rgba(21,53,81,0.08)]">
          <div className="h-28 bg-gradient-to-br from-[#215481] via-[#3d6f99] to-[#e7b56a]" />
          <div className="px-5 pb-6">
            <div className="-mt-8 flex items-end gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-[18px] border-2 border-[#fafaf9] bg-[#215481] text-2xl font-bold text-white shadow-md">
                A
              </div>
              <div>
                <h2 className="text-[22px] font-extrabold leading-7">
                  Aanya Cafe
                  <span className="ml-1 inline-flex h-[18px] w-[18px] translate-y-[1px] items-center justify-center rounded-full bg-[#16A34A] align-text-bottom text-white">
                    <svg viewBox="0 0 20 20" className="h-3 w-3" aria-hidden>
                      <path d="M5 10.5 8.2 14 15 6.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </h2>
                <p className="text-[13px] font-medium text-stone-500">Cafe · 6 yrs</p>
              </div>
            </div>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500">
              <LivingFire />
              Best in Category
            </p>
            <div className="mt-3">
              <PublicBadgeRow badges={BADGE_IDS.map((id) => ({ id, label: BADGE_LABEL[id] }))} />
            </div>
            <p className="mt-3 text-xs font-medium text-stone-500">Usually replies in 38 min</p>
          </div>
        </section>

        <div className="mt-6 grid gap-3">
          {BADGE_IDS.map((id) => (
            <article key={id} className="rounded-2xl border border-stone-200 bg-white p-4">
              <PublicBadgeChip id={id} large />
              <h3 className="mt-3 text-base font-semibold">{BADGE_LABEL[id]}</h3>
              <p className="mt-1 text-sm leading-6 text-stone-600">{BADGE_HINT[id]}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-stone-400">How to earn it</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-sm leading-6 text-stone-600">
                {BADGE_COPY[id].eligibility.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
