import { loadBadgeReports } from '@/lib/businessBadgeState';
import { activePublicBadges, type PublicBadge } from '@/lib/businessBadges';
import { averageLeadResponseMs, formatResponseDuration } from '@/lib/leadRead';
import { getPublicSupabase } from '@/lib/supabase/public';

export type PublicBusinessSignals = {
  bestInCategory: boolean;
  averageResponse: string | null;
  badges: PublicBadge[];
};

function completionSource(business: Record<string, unknown>): Record<string, unknown> {
  return {
    ...business,
    ownerName: business.ownerName || business.owner_name,
    ownerMobile: business.ownerMobile || business.owner_mobile,
  };
}

export async function loadPublicBusinessSignals(
  business: Record<string, unknown>,
): Promise<PublicBusinessSignals> {
  const empty: PublicBusinessSignals = { bestInCategory: false, averageResponse: null, badges: [] };
  const businessId = String(business.id || '').trim();
  if (!businessId) return empty;

  let averageResponseMs: number | null = null;
  let leads: { created_at?: string | null; merchant_read_at?: string | null }[] = [];

  try {
    const supabase = getPublicSupabase();
    const { data, error } = await supabase
      .from('leads')
      .select('created_at, merchant_read_at')
      .eq('business_id', businessId);
    if (!error && data) {
      leads = data;
      averageResponseMs = averageLeadResponseMs(data);
    }
  } catch {
    averageResponseMs = null;
  }

  let badges: PublicBadge[] = [];
  let bestInCategory = false;
  try {
    const reports = await loadBadgeReports(completionSource(business), { leads });
    bestInCategory = reports.some((badge) => badge.id === 'bestInCategory' && badge.active);
    badges = activePublicBadges(reports).filter((badge) => badge.id !== 'bestInCategory');
  } catch {
    badges = [];
  }

  return {
    bestInCategory,
    averageResponse: averageResponseMs == null ? null : formatResponseDuration(averageResponseMs),
    badges,
  };
}
