'use server';

import { assertBusinessSession } from '@/lib/security/session';
import { createServiceClient } from '@/lib/supabase/service';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { buildTrendingWeekItems, type TrendingWeekItem } from '@/lib/trendingThisWeek';

const VIEW_DEDUP_HOURS = 24;
const SEARCH_DEDUP_MINUTES = 30;
const TRENDING_LOOKBACK_DAYS = 14;

function isMissingTableError(error: { code?: string; message?: string } | null, table: string) {
  if (!error) return false;
  return error.code === '42P01' || new RegExp(table, 'i').test(error.message || '');
}

function normalizeSearchQuery(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function recordProfileView(businessId: string, sessionHash?: string) {
  if (!businessId) return { success: false as const };

  try {
    const limited = await enforceRateLimit('write', businessId);
    if (!limited.ok) return { success: false as const };
  } catch {
    return { success: false as const };
  }

  const supabase = createServiceClient();
  if (!supabase) return { success: false as const };

  try {
    if (sessionHash) {
      const since = new Date(Date.now() - VIEW_DEDUP_HOURS * 60 * 60 * 1000).toISOString();
      const { data: recent } = await supabase
        .from('profile_views')
        .select('id')
        .eq('business_id', businessId)
        .eq('session_hash', sessionHash)
        .gte('viewed_at', since)
        .limit(1);

      if (recent && recent.length > 0) {
        return { success: true as const, skipped: true as const };
      }
    }

    const { error } = await supabase.from('profile_views').insert({
      business_id: businessId,
      session_hash: sessionHash || null,
    });

    if (error) {
      if (isMissingTableError(error, 'profile_views')) return { success: false as const };
      throw error;
    }

    return { success: true as const };
  } catch {
    return { success: false as const };
  }
}

export async function getBusinessProfileViewStats(businessId: string) {
  const session = await assertBusinessSession(businessId);
  if (!session.ok) {
    return { success: false as const, error: 'Unauthorized', viewsToday: 0, viewsLast7Days: 0, viewsLast30Days: 0, viewsLast90Days: 0, viewsAllTime: 0 };
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return { success: true as const, viewsToday: 0, viewsLast7Days: 0, viewsLast30Days: 0, viewsLast90Days: 0, viewsAllTime: 0, configured: false };
  }

  try {
    const now = Date.now();
    const istNow = now + 330 * 60 * 1000;
    const todayStart = new Date(istNow - (istNow % (24 * 60 * 60 * 1000)) - 330 * 60 * 1000).toISOString();
    const since7 = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const since30 = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    const since90 = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString();

    const countSince = (since?: string) => {
      let query = supabase.from('profile_views').select('id', { count: 'exact', head: true }).eq('business_id', businessId);
      if (since) query = query.gte('viewed_at', since);
      return query;
    };

    const [todayResult, last7Result, last30Result, last90Result, allTimeResult] = await Promise.all([
      countSince(todayStart),
      countSince(since7),
      countSince(since30),
      countSince(since90),
      countSince(),
    ]);

    if (
      isMissingTableError(todayResult.error, 'profile_views') ||
      isMissingTableError(last30Result.error, 'profile_views') ||
      isMissingTableError(allTimeResult.error, 'profile_views')
    ) {
      return { success: true as const, viewsToday: 0, viewsLast7Days: 0, viewsLast30Days: 0, viewsLast90Days: 0, viewsAllTime: 0, configured: false };
    }

    if (todayResult.error) throw todayResult.error;
    if (last7Result.error) throw last7Result.error;
    if (last30Result.error) throw last30Result.error;
    if (last90Result.error) throw last90Result.error;
    if (allTimeResult.error) throw allTimeResult.error;

    return {
      success: true as const,
      viewsToday: todayResult.count ?? 0,
      viewsLast7Days: last7Result.count ?? 0,
      viewsLast30Days: last30Result.count ?? 0,
      viewsLast90Days: last90Result.count ?? 0,
      viewsAllTime: allTimeResult.count ?? 0,
      configured: true,
    };
  } catch {
    return { success: true as const, viewsToday: 0, viewsLast7Days: 0, viewsLast30Days: 0, viewsLast90Days: 0, viewsAllTime: 0, configured: false };
  }
}

export async function recordSearchEvent(query: string, sessionHash?: string) {
  const trimmed = query.trim();
  const normalized = normalizeSearchQuery(trimmed);
  if (!normalized || normalized.length < 2) {
    return { success: false as const };
  }

  try {
    const limited = await enforceRateLimit('search', sessionHash || normalized);
    if (!limited.ok) return { success: false as const };
  } catch {
    return { success: false as const };
  }

  const supabase = createServiceClient();
  if (!supabase) return { success: false as const };

  try {
    if (sessionHash) {
      const since = new Date(Date.now() - SEARCH_DEDUP_MINUTES * 60 * 1000).toISOString();
      const { data: recent } = await supabase
        .from('search_events')
        .select('id')
        .eq('normalized_query', normalized)
        .eq('session_hash', sessionHash)
        .gte('searched_at', since)
        .limit(1);

      if (recent && recent.length > 0) {
        return { success: true as const, skipped: true as const };
      }
    }

    const { error } = await supabase.from('search_events').insert({
      query: trimmed.slice(0, 160),
      normalized_query: normalized.slice(0, 160),
      session_hash: sessionHash || null,
    });

    if (error) {
      if (isMissingTableError(error, 'search_events')) return { success: false as const };
      throw error;
    }

    return { success: true as const };
  } catch {
    return { success: false as const };
  }
}

export async function getTrendingThisWeek(limit = 4): Promise<TrendingWeekItem[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const since = new Date(Date.now() - TRENDING_LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();

  try {
    const [searchesResult, viewsResult] = await Promise.all([
      supabase
        .from('search_events')
        .select('normalized_query, searched_at')
        .gte('searched_at', since)
        .order('searched_at', { ascending: false })
        .limit(5000),
      supabase
        .from('profile_views')
        .select('business_id, viewed_at')
        .gte('viewed_at', since)
        .order('viewed_at', { ascending: false })
        .limit(5000),
    ]);

    if (isMissingTableError(searchesResult.error, 'search_events') && isMissingTableError(viewsResult.error, 'profile_views')) {
      return [];
    }

    const searches = searchesResult.error ? [] : (searchesResult.data ?? []);
    const profileViews = viewsResult.error ? [] : (viewsResult.data ?? []);

    const businessIds = [...new Set(profileViews.map((row) => row.business_id).filter(Boolean))];
    const categoriesByBusinessId = new Map<string, string>();
    let fallbackCategoryLabels: string[] = [];

    const [businessesResult, fallbackCatsResult, parentCatsResult] = await Promise.all([
      businessIds.length > 0
        ? supabase
            .from('Business')
            .select('id, category')
            .in('id', businessIds.slice(0, 500))
        : Promise.resolve({ data: [] as { id: string; category: string | null }[] }),
      supabase.from('Business').select('category').eq('status', 'Active').limit(500),
      supabase
        .from('categories')
        .select('name, items_count')
        .is('parent_id', null)
        .eq('status', 'Active')
        .order('items_count', { ascending: false })
        .limit(12),
    ]);

    for (const business of businessesResult.data ?? []) {
      if (business.id && business.category) {
        categoriesByBusinessId.set(String(business.id), String(business.category));
      }
    }

    fallbackCategoryLabels = [
      ...(fallbackCatsResult.data ?? [])
        .map((row) => row.category?.trim())
        .filter((label): label is string => Boolean(label)),
      ...(parentCatsResult.data ?? [])
        .map((row) => row.name?.trim())
        .filter((label): label is string => Boolean(label)),
    ];

    return buildTrendingWeekItems({
      searches,
      profileViews,
      categoriesByBusinessId,
      fallbackCategoryLabels,
      limit,
    });
  } catch {
    return [];
  }
}
