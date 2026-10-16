'use server';

import { revalidatePath } from 'next/cache';
import { assertBusinessTab } from '@/lib/businessTeam/teamActor.server';
import { readAlsoServes, writeAlsoServes } from '@/lib/alsoServes.server';
import { getBusinessProfilePath } from '@/lib/businessSlug';
import { createServiceClient } from '@/lib/supabase/service';

export async function getAlsoServesState(businessId: string) {
  const auth = await assertBusinessTab(businessId, 'settings', 'view');
  if (!auth.ok) return { success: false as const, error: auth.error };
  return readAlsoServes(businessId);
}

export async function saveAlsoServes(businessId: string, leaves: string[]) {
  const auth = await assertBusinessTab(businessId, 'settings', 'edit');
  if (!auth.ok) return { success: false as const, error: auth.error };
  const saved = await writeAlsoServes(businessId, leaves);
  if (!saved.success) return saved;

  const supabase = createServiceClient();
  if (supabase) {
    const { data } = await supabase
      .from('Business')
      .select('id, slug, businessName, displayName, city')
      .eq('id', businessId)
      .maybeSingle();
    if (data) revalidatePath(getBusinessProfilePath(data));
  }
  return saved;
}
