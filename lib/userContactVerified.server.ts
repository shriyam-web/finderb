import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';

export async function loadReviewAuthorVerified(userId: string): Promise<boolean> {
  const supabase = createServiceClient();
  if (!supabase || !userId) return false;
  const { data } = await supabase
    .from('User')
    .select('emailVerified, phoneVerified')
    .eq('id', userId)
    .maybeSingle();
  return Boolean(data?.emailVerified) && Boolean(data?.phoneVerified);
}
