/** Two hours or faster counts as a healthy lead reply. */
const FAST_RESPONSE_MS = 2 * 60 * 60 * 1000;

export function leadResponseIsGood(label: string | null | undefined, ms?: number | null): boolean | null {
  if (typeof ms === 'number' && Number.isFinite(ms) && ms >= 0) {
    return ms <= FAST_RESPONSE_MS;
  }
  const text = String(label || '').trim().toLowerCase();
  if (!text) return null;
  if (text.includes('under a minute')) return true;
  if (/^\d+\s*days?$/.test(text)) return false;
  const hours = text.match(/^(\d+)\s*hrs?$/);
  if (hours) return Number(hours[1]) <= 2;
  const minutes = text.match(/^(\d+)\s*min$/);
  if (minutes) return Number(minutes[1]) <= 120;
  return null;
}

export function competitorScoreIsGood(ownPercent: number, competitorAverage: number | null | undefined): boolean | null {
  if (competitorAverage == null || !Number.isFinite(competitorAverage)) return null;
  return ownPercent >= competitorAverage;
}

export function insightCardClass(good: boolean | null): string {
  if (good === true) return 'rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950';
  if (good === false) return 'rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-950';
  return 'rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-zinc-800';
}
