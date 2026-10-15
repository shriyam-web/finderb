'use client';

import { competitorScoreIsGood, insightCardClass, leadResponseIsGood } from '@/lib/dashboard/insightTones';

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
    <div className="grid gap-3 sm:grid-cols-2">
      <div className={insightCardClass(competitorGood)}>
        <p className="text-sm font-medium opacity-80">Category competitors</p>
        <p className="mt-2 text-sm leading-relaxed">
          {competitorAverage != null ? (
            <>
              Your competitors have an average profile completion score of{' '}
              <span className="font-semibold">{competitorAverage}%</span>. You are at{' '}
              <span className="font-semibold">{ownPercent}%</span>
              {ownPercent < competitorAverage
                ? ' — fill the missing details so you stay ahead in your category.'
                : '. Keep this up to stay ahead in your category.'}
            </>
          ) : (
            <>
              We are still gathering competitor profile scores in your category. You are at{' '}
              <span className="font-semibold">{ownPercent}%</span> complete — finish the missing details
              so you stay ready.
            </>
          )}
        </p>
      </div>
      <div className={insightCardClass(responseGood)}>
        <p className="text-sm font-medium opacity-80">Lead response</p>
        <p className="mt-2 text-sm leading-relaxed">
          {averageResponse ? (
            <>
              Your average response time on leads so far is <span className="font-semibold">{averageResponse}</span>.
            </>
          ) : (
            'Open new leads promptly — we will show your average response time after the first few replies.'
          )}
        </p>
      </div>
    </div>
  );
}
