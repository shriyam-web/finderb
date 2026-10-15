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

export function insightCardColors(good: boolean | null): { backgroundColor: string; borderColor: string; color: string } {
  if (good === true) return { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', color: '#065F46' };
  if (good === false) return { backgroundColor: '#FFF1F2', borderColor: '#FECDD3', color: '#9F1239' };
  return { backgroundColor: '#FAFAFA', borderColor: '#E4E4E7', color: '#3F3F46' };
}
