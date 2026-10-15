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
      {competitorAverage != null ? (
        <div className="rounded-xl border border-[#215481]/15 bg-gradient-to-br from-[#f7fbff] to-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#215481]">Category competitors</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-700">
            Your competitors have an average profile completion score of{' '}
            <span className="font-semibold text-[#153551]">{competitorAverage}%</span>. You are at{' '}
            <span className="font-semibold">{ownPercent}%</span>
            {ownPercent < competitorAverage
              ? ' — try improving your score to perform well.'
              : '. Keep this up to stay ahead.'}
          </p>
        </div>
      ) : null}
      <div className="rounded-xl border border-orange-200/80 bg-gradient-to-br from-[#fff8ef] to-white p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#c1621a]">Lead response</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700">
          {averageResponse
            ? <>Your average response time on leads so far is <span className="font-semibold text-[#153551]">{averageResponse}</span>.</>
            : 'Respond to leads from the Leads tab to start measuring your average response time.'}
        </p>
      </div>
    </div>
  );
}
