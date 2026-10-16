'use server';

import { createServiceClient } from '@/lib/supabase/service';
import { ownershipPromptsById } from '@/lib/ownershipRequest.server';
import { assertBusinessSession } from '@/lib/security/session';

export type MerchantNotification = {
  id: string;
  business_id: string;
  type: string;
  title: string | null;
  body: string;
  metadata: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
  ownership?: {
    requestId: string;
    deadline: string | null;
    decision: string | null;
    canDecide: boolean;
  } | null;
};

export async function getMerchantNotifications(businessId: string) {
  try {
    if (!businessId) {
      return { success: false as const, error: 'Business ID is required' };
    }

    const auth = await assertBusinessSession(businessId);
    if (!auth.ok) {
      return { success: false as const, error: auth.error };
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return { success: true as const, notifications: [] as MerchantNotification[], unreadCount: 0 };
    }

    const { data, error } = await supabase
      .from('merchant_notifications')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const notifications = (data ?? []) as MerchantNotification[];
    const prompts = await ownershipPromptsById(
      notifications
        .filter((item) => item.type === 'ownership_request')
        .map((item) => String(item.metadata?.requestId || '')),
    );
    for (const item of notifications) {
      if (item.type !== 'ownership_request') continue;
      item.ownership = prompts.get(String(item.metadata?.requestId || '')) || null;
    }
    const unreadCount = notifications.filter((item) => !item.read_at).length;

    return { success: true as const, notifications, unreadCount };
  } catch (error) {
    console.error('Get Merchant Notifications Error:', error);
    return { success: false as const, error: 'Failed to load notifications' };
  }
}

export async function markMerchantNotificationsRead(
  businessId: string,
  notificationIds?: string[]
) {
  try {
    if (!businessId) {
      return { success: false as const, error: 'Business ID is required' };
    }

    const auth = await assertBusinessSession(businessId);
    if (!auth.ok) {
      return { success: false as const, error: auth.error };
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return { success: true as const };
    }

    const readAt = new Date().toISOString();
    let query = supabase
      .from('merchant_notifications')
      .update({ read_at: readAt })
      .eq('business_id', businessId)
      .is('read_at', null);

    if (notificationIds?.length) {
      query = query.in('id', notificationIds);
    }

    const { error } = await query;
    if (error) throw error;

    return { success: true as const };
  } catch (error) {
    console.error('Mark Merchant Notifications Read Error:', error);
    return { success: false as const, error: 'Failed to update notifications' };
  }
}
