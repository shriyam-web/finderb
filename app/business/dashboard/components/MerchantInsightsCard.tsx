'use client';

export default function MerchantInsightsCard({
  ownPercent,
  competitorAverage,
  averageResponse,
}: {
  ownPercent: number;
  competitorAverage: number | null;
  averageResponse: string | null;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Category competitors</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700">
          {competitorAverage != null ? (
            <>
              Your competitors have an average profile completion score of{' '}
              <span className="font-semibold text-zinc-900">{competitorAverage}%</span>. You are at{' '}
              <span className="font-semibold">{ownPercent}%</span>
              {ownPercent < competitorAverage
                ? ' — fill the missing details so you stay ahead in your category.'
                : '. Keep this up to stay ahead in your category.'}
            </>
          ) : (
            <>
              We are still gathering competitor profile scores in your category. You are at{' '}
              <span className="font-semibold text-zinc-900">{ownPercent}%</span> complete — finish the missing details
              so you stay ready.
            </>
          )}
        </p>
      </div>
      <div className="rounded-xl border border-orange-200/80 bg-gradient-to-br from-[#fff8ef] to-white p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#c1621a]">Lead response</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700">
          {averageResponse ? (
            <>
              Your average response time on leads so far is{' '}
              <span className="font-semibold text-zinc-900">{averageResponse}</span>.
            </>
          ) : (
            'Open new leads promptly — we will show your average response time after the first few replies.'
          )}
        </p>
      </div>
    </div>
  );
}
