'use server';

import { createServiceClient } from '@/lib/supabase/service';
import { assertBusinessTab } from '@/lib/businessTeam/teamActor.server';
import { averageCompletionPercent, COMPETITOR_COMPLETION_SELECT } from '@/lib/dashboard/competitorInsights';
import { averageLeadResponseLabel } from '@/lib/leadRead';

export async function getMerchantPerformanceInsights(businessId: string, category?: string) {
  const tab = await assertBusinessTab(businessId, 'overview', 'view');
  if (!tab.ok) return { success: false as const, error: tab.error };

  const supabase = createServiceClient();
  if (!supabase) {
    return { success: true as const, competitorAverage: null as number | null, averageResponse: null as string | null };
  }

  const cat = String(category || '').trim();
  let competitorAverage: number | null = null;
  if (cat) {
    const { data } = await supabase
      .from('Business')
      .select(COMPETITOR_COMPLETION_SELECT)
      .eq('category', cat)
      .neq('id', businessId)
      .eq('status', 'Active')
      .limit(200);
    competitorAverage = averageCompletionPercent((data || []) as Record<string, unknown>[]);
  }

  const { data: leads } = await supabase
    .from('leads')
    .select('created_at, merchant_read_at')
    .eq('business_id', businessId)
    .limit(500);

  return {
    success: true as const,
    competitorAverage,
    averageResponse: averageLeadResponseLabel(leads || []),
  };
}
