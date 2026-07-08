'use server';

import { createServiceClient } from '@/lib/supabase/service';
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

export async function createMerchantReviewNotification(input: {
  businessId: string;
  reviewId: string;
  author: string;
  rating: number;
}) {
  const supabase = createServiceClient();
  if (!supabase) return;

  const author = input.author.trim() || 'A customer';
  const rating = Number.isFinite(input.rating) ? input.rating : 5;

  const { error } = await supabase.from('merchant_notifications').insert({
    business_id: input.businessId,
    type: 'new_review',
    title: 'New customer review',
    body: `${author} left a ${rating}-star review on your listing.`,
    metadata: {
      reviewId: input.reviewId,
      author,
      rating,
    },
  });

  if (error) {
    console.error('Create Merchant Review Notification Error:', error);
  }
}
