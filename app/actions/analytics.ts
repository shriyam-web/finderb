'use server';

import { assertBusinessSession } from '@/lib/security/session';
import { createServiceClient } from '@/lib/supabase/service';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

const VIEW_DEDUP_HOURS = 24;

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === '42P01' || /profile_views/i.test(error.message || '');
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
      if (isMissingTableError(error)) return { success: false as const };
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
    return { success: false as const, error: 'Unauthorized', viewsLast30Days: 0, viewsAllTime: 0 };
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return { success: true as const, viewsLast30Days: 0, viewsAllTime: 0, configured: false };
  }

  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [last30Result, allTimeResult] = await Promise.all([
      supabase
        .from('profile_views')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .gte('viewed_at', since),
      supabase
        .from('profile_views')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', businessId),
    ]);

    if (isMissingTableError(last30Result.error) || isMissingTableError(allTimeResult.error)) {
      return { success: true as const, viewsLast30Days: 0, viewsAllTime: 0, configured: false };
    }

    if (last30Result.error) throw last30Result.error;
    if (allTimeResult.error) throw allTimeResult.error;

    return {
      success: true as const,
      viewsLast30Days: last30Result.count ?? 0,
      viewsAllTime: allTimeResult.count ?? 0,
      configured: true,
    };
  } catch {
    return { success: true as const, viewsLast30Days: 0, viewsAllTime: 0, configured: false };
  }
}
