'use client';

import { useEffect, useState } from 'react';
import { competitorScoreIsGood, leadResponseIsGood } from '@/lib/dashboard/insightTones';

function VoteMark({ good }: { good: boolean | null }) {
  if (good == null) {
    return (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M5 12h14" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="currentColor"
      aria-hidden
      className={good ? undefined : 'rotate-180'}
    >
      <path d="M7.5 11V5.8a2.2 2.2 0 0 1 4.1-1.1L14 9h4.2a2 2 0 0 1 2 2.3l-.9 5.2A2 2 0 0 1 17.3 18H9.2a2 2 0 0 1-1.7-.9L7.5 11z" />
      <path d="M4 10.5h2.2V18H4a1 1 0 0 1-1-1v-5.5a1 1 0 0 1 1-1z" />
    </svg>
  );
}

export default function MerchantInsightsCard({
  ownPercent,
  competitorAverage,
  averageResponse,
  averageResponseMs,
}: {
  ownPercent: number;
  competitorAverage: number | null;
  averageResponse: string | null;
  averageResponseMs?: number | null;
}) {
  const responseGood = leadResponseIsGood(averageResponse, averageResponseMs);
  const scoreGood = competitorScoreIsGood(ownPercent, competitorAverage);
  const slides = [
    {
      key: 'response',
      eyebrow: 'Average response',
      value: averageResponse || '—',
      body: averageResponse
        ? 'How quickly you open new leads. Faster replies stay ahead of nearby businesses.'
        : 'Open new leads promptly. This appears after the first few replies.',
      good: responseGood,
      fill: responseGood === false ? 'bg-rose-600' : responseGood === true ? 'bg-emerald-600' : 'bg-teal-700',
    },
    {
      key: 'score',
      eyebrow: 'Competitor score',
      value: competitorAverage != null ? `${competitorAverage}%` : '—',
      body:
        competitorAverage != null
          ? `Nearby businesses average ${competitorAverage}% complete. You are at ${ownPercent}%.`
          : `Scores in your category are still coming in. You are at ${ownPercent}% complete.`,
      good: scoreGood,
      fill: scoreGood === false ? 'bg-rose-600' : scoreGood === true ? 'bg-emerald-600' : 'bg-violet-700',
    },
  ];
  const [page, setPage] = useState(0);
  const slide = slides[page] || slides[0];

  useEffect(() => {
    const timer = setInterval(() => setPage((current) => (current + 1) % slides.length), 3800);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className={`overflow-hidden rounded-2xl px-4 py-3 text-white ${slide.fill}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/85">{slide.eyebrow}</p>
        <span className="flex gap-1.5">
          {slides.map((item, index) => (
            <button
              key={item.key}
              type="button"
              aria-label={item.eyebrow}
              onClick={() => setPage(index)}
              className={`h-1.5 rounded-full ${page === index ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`}
            />
          ))}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-2xl font-semibold tracking-tight">{slide.value}</p>
          <p className="mt-0.5 text-xs leading-snug text-white/90">{slide.body}</p>
        </div>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
          <VoteMark good={slide.good} />
        </span>
      </div>
    </div>
  );
}
