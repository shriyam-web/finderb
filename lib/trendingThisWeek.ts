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

/** `Restaurants › Cafe` → `Restaurants` (famous/top-level category only). */
export function topLevelCategoryName(category: string): string {
  const trimmed = category.trim();
  if (!trimmed) return '';
  const parts = trimmed.split('›').map((part) => part.trim()).filter(Boolean);
  return parts[0] || trimmed;
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
  /** Extra parent/subcategory labels used only to pad the list to `limit`. */
  fallbackCategoryLabels?: string[];
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

    // Prefer parent-category buckets when the search is already a top-level name.
    const parentFromSearch = topLevelCategoryName(row.normalized_query);
    const parentKey = normalizeQuery(parentFromSearch);
    if (parentKey && !parentFromSearch.includes('›') && parentKey === normalized) {
      upsertAccumulator(
        map,
        `category:${parentKey}`,
        formatCategoryTrendLabel(parentFromSearch),
        parentFromSearch,
        bucket
      );
      continue;
    }

    upsertAccumulator(map, `search:${normalized}`, formatSearchTrendLabel(normalized), normalized, bucket);
  }

  for (const row of input.profileViews) {
    const category = input.categoriesByBusinessId.get(row.business_id)?.trim();
    if (!category) continue;

    const bucket = bucketTimestamp(row.viewed_at, weekAgoMs, twoWeeksAgoMs, nowMs);
    if (!bucket) continue;

    // Roll subcategories up to the parent so "Restaurants › Cafe" and
    // "Restaurants › Fine Dining" count as one famous category.
    const parentCategory = topLevelCategoryName(category);
    if (!parentCategory) continue;

    const normalizedCategory = normalizeQuery(parentCategory);
    const key = `category:${normalizedCategory}`;
    upsertAccumulator(
      map,
      key,
      formatCategoryTrendLabel(parentCategory),
      parentCategory,
      bucket
    );
  }

  const ranked = [...map.values()]
    .filter((item) => item.thisWeek > 0)
    .map((item) => ({
      key: item.key,
      label: item.label,
      query: item.query,
      thisWeek: item.thisWeek,
      trend: Math.max(1, computeTrendPercent(item.thisWeek, item.lastWeek)),
      isCategory: item.key.startsWith('category:'),
    }))
    // Famous categories first, then searches; prefer volume, then trend.
    .sort((a, b) => {
      if (a.isCategory !== b.isCategory) return a.isCategory ? -1 : 1;
      if (b.thisWeek !== a.thisWeek) return b.thisWeek - a.thisWeek;
      if (b.trend !== a.trend) return b.trend - a.trend;
      return a.label.localeCompare(b.label, undefined, { sensitivity: 'base' });
    });

  const seen = new Set<string>();
  const items: TrendingWeekItem[] = [];

  for (const item of ranked) {
    if (items.length >= limit) break;
    const dedupe = normalizeQuery(item.query);
    if (!dedupe || seen.has(dedupe)) continue;
    seen.add(dedupe);
    items.push({ label: item.label, query: item.query, trend: item.trend });
  }

  // Pad to 4 famous parent categories when live trend rows are thin.
  if (items.length < limit) {
    const parentCounts = new Map<string, { name: string; count: number }>();
    const addLabel = (category: string) => {
      const parent = topLevelCategoryName(category);
      const key = normalizeQuery(parent);
      if (!key) return;
      const existing = parentCounts.get(key);
      if (existing) existing.count += 1;
      else parentCounts.set(key, { name: parent, count: 1 });
    };

    for (const category of input.categoriesByBusinessId.values()) addLabel(category);
    for (const category of input.fallbackCategoryLabels ?? []) addLabel(category);

    const fillers = [...parentCounts.values()].sort((a, b) => b.count - a.count);
    for (const filler of fillers) {
      if (items.length >= limit) break;
      const key = normalizeQuery(filler.name);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      items.push({
        label: formatCategoryTrendLabel(filler.name),
        query: filler.name,
        trend: Math.max(5, Math.min(40, filler.count * 6)),
      });
    }
  }

  return items.slice(0, limit);
}
