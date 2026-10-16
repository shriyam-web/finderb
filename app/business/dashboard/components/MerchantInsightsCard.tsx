'use client';

import { useEffect, useState } from 'react';
import { competitorScoreIsGood, insightCardClass, leadResponseIsGood } from '@/lib/dashboard/insightTones';

function MetricCarousel({
  eyebrow,
  value,
  body,
  good,
}: {
  eyebrow: string;
  value: string;
  body: string;
  good: boolean | null;
}) {
  const [page, setPage] = useState(0);
  const slides = [value, body];

  useEffect(() => {
    const timer = setInterval(() => setPage((current) => (current === 0 ? 1 : 0)), 3800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{eyebrow}</p>
      <div className={`${insightCardClass(good)} min-h-[120px]`}>
        <p className={page === 0 ? 'text-3xl font-semibold tracking-tight' : 'text-sm leading-relaxed'}>{slides[page]}</p>
      </div>
      <div className="mt-2 flex gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.slice(0, 12)}
            type="button"
            aria-label={`${eyebrow} ${index + 1}`}
            onClick={() => setPage(index)}
            className={`h-1.5 rounded-full ${page === index ? 'w-5 bg-zinc-800' : 'w-1.5 bg-zinc-300'}`}
          />
        ))}
      </div>
    </div>
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
  const competitorGood = competitorScoreIsGood(ownPercent, competitorAverage);
  const responseGood = leadResponseIsGood(averageResponse, averageResponseMs);

  return (
    <div className="grid gap-3">
      <MetricCarousel
        eyebrow="Average response"
        good={responseGood}
        value={averageResponse || '—'}
        body={
          averageResponse
            ? 'This is how quickly you open new leads. Faster replies keep you ahead of nearby businesses.'
            : 'Open new leads promptly. Your average response time appears after the first few replies.'
        }
      />
      <MetricCarousel
        eyebrow="Competitor score"
        good={competitorGood}
        value={competitorAverage != null ? `${competitorAverage}%` : '—'}
        body={
          competitorAverage != null
            ? `Nearby competitors average ${competitorAverage}% profile completion. You are at ${ownPercent}%.`
            : `Competitor scores in your category are still coming in. You are at ${ownPercent}% complete.`
        }
      />
    </div>
  );
}
