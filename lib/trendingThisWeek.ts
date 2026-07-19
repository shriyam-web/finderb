export type TrendingWeekItem = {
  label: string;
  trend: number;
  query: string;
};

type TrendAccumulator = {
  key: string;
  label: string;
  query: string;
  thisWeek: number;
  lastWeek: number;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatSearchTrendLabel(query: string): string {
  const normalized = normalizeQuery(query);
  if (!normalized) return '';

  if (/near me$/i.test(normalized)) {
    return titleCase(normalized);
  }

  if (normalized.length <= 28) {
    return titleCase(normalized);
  }

  return `${titleCase(normalized.slice(0, 28)).trim()}…`;
}

export function formatCategoryTrendLabel(category: string): string {
  const trimmed = category.trim();
  if (!trimmed) return '';
  return `${titleCase(trimmed)} Near You`;
}

export function computeTrendPercent(thisWeek: number, lastWeek: number): number {
  if (thisWeek <= 0 && lastWeek <= 0) return 0;
  if (lastWeek <= 0) return Math.min(99, Math.max(5, thisWeek * 8));
  const raw = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  return Math.max(-99, Math.min(999, raw));
}

function bucketTimestamp(
  timestamp: string,
  weekAgoMs: number,
  twoWeeksAgoMs: number,
  nowMs: number
): 'thisWeek' | 'lastWeek' | null {
  const at = new Date(timestamp).getTime();
  if (Number.isNaN(at) || at > nowMs) return null;
  if (at >= weekAgoMs) return 'thisWeek';
  if (at >= twoWeeksAgoMs) return 'lastWeek';
  return null;
}

function upsertAccumulator(
  map: Map<string, TrendAccumulator>,
  key: string,
  label: string,
  query: string,
  bucket: 'thisWeek' | 'lastWeek'
) {
  const existing = map.get(key);
  if (existing) {
    existing[bucket] += 1;
    return;
  }

  map.set(key, {
    key,
    label,
    query,
    thisWeek: bucket === 'thisWeek' ? 1 : 0,
    lastWeek: bucket === 'lastWeek' ? 1 : 0,
  });
}

export function buildTrendingWeekItems(input: {
  searches: Array<{ normalized_query: string; searched_at: string }>;
  profileViews: Array<{ business_id: string; viewed_at: string }>;
  categoriesByBusinessId: Map<string, string>;
  limit?: number;
}): TrendingWeekItem[] {
  const limit = Math.min(4, Math.max(1, input.limit ?? 4));
  const nowMs = Date.now();
  const weekAgoMs = nowMs - 7 * MS_PER_DAY;
  const twoWeeksAgoMs = nowMs - 14 * MS_PER_DAY;
  const map = new Map<string, TrendAccumulator>();

  for (const row of input.searches) {
    const normalized = normalizeQuery(row.normalized_query);
    if (normalized.length < 2) continue;

    const bucket = bucketTimestamp(row.searched_at, weekAgoMs, twoWeeksAgoMs, nowMs);
    if (!bucket) continue;

    upsertAccumulator(map, `search:${normalized}`, formatSearchTrendLabel(normalized), normalized, bucket);
  }

  for (const row of input.profileViews) {
    const category = input.categoriesByBusinessId.get(row.business_id)?.trim();
    if (!category) continue;

    const bucket = bucketTimestamp(row.viewed_at, weekAgoMs, twoWeeksAgoMs, nowMs);
    if (!bucket) continue;

    const normalizedCategory = normalizeQuery(category);
    const key = `category:${normalizedCategory}`;
    upsertAccumulator(
      map,
      key,
      formatCategoryTrendLabel(category),
      category,
      bucket
    );
  }

  return [...map.values()]
    .filter((item) => item.thisWeek > 0)
    .map((item) => ({
      label: item.label,
      query: item.query,
      thisWeek: item.thisWeek,
      trend: computeTrendPercent(item.thisWeek, item.lastWeek),
    }))
    .filter((item) => item.trend > 0)
    .sort((a, b) => {
      if (b.trend !== a.trend) return b.trend - a.trend;
      return b.thisWeek - a.thisWeek;
    })
    .slice(0, limit)
    .map(({ label, query, trend }) => ({ label, query, trend }));
}
