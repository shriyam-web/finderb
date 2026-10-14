import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';

export async function recordMerchantNotification(input: {
  businessId: string;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}): Promise<string | null> {
  const supabase = createServiceClient();
  if (!supabase || !input.businessId.trim() || !input.body.trim()) return null;
  const { data, error } = await supabase
    .from('merchant_notifications')
    .insert({
      business_id: input.businessId.trim(),
      type: input.type.trim() || 'alert',
      title: input.title.trim() || 'FinderB',
      body: input.body.trim(),
      metadata: input.metadata ?? {},
    })
    .select('id')
    .single();
  if (error) {
    console.error('[merchant alert]', error);
    return null;
  }
  return typeof data?.id === 'string' ? data.id : null;
}
