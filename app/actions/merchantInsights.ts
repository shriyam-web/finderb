'use server';

import { createServiceClient } from '@/lib/supabase/service';
import { assertBusinessTab } from '@/lib/businessTeam/teamActor.server';
import { loadCompetitorAverageFromClient } from '@/lib/dashboard/competitorInsights';
import { averageLeadResponseLabel, averageLeadResponseMs } from '@/lib/leadRead';

export async function getMerchantPerformanceInsights(businessId: string, category?: string) {
  const tab = await assertBusinessTab(businessId, 'overview', 'view');
  if (!tab.ok) return { success: false as const, error: tab.error };

  const supabase = createServiceClient();
  if (!supabase) {
    return {
      success: true as const,
      competitorAverage: null as number | null,
      averageResponse: null as string | null,
      averageResponseMs: null as number | null,
    };
  }

  const cat = String(category || '').trim();
  const competitorAverage = await loadCompetitorAverageFromClient(supabase, businessId, cat);

  const { data: leads } = await supabase
    .from('leads')
    .select('created_at, merchant_read_at')
    .eq('business_id', businessId)
    .limit(500);

  return {
    success: true as const,
    competitorAverage,
    averageResponse: averageLeadResponseLabel(leads || []),
    averageResponseMs: averageLeadResponseMs(leads || []),
  };
}
