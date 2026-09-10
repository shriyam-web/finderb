import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { broadcastTargetsUsers } from '@/lib/broadcastAudience';
import { sendExpoPushMessages } from '@/lib/expoPush.server';

export type UserNotification = {
  id: string;
  title: string;
  message: string;
  created_at: string;
};

type BroadcastRow = {
  id: string;
  title?: string | null;
  message?: string | null;
  target_audience?: unknown;
  created_at?: string | null;
  push_sent_at?: string | null;
};

function db() {
  return createServiceClient();
}

export async function listUserNotifications(limit = 50): Promise<UserNotification[]> {
  const supabase = db() ?? createClient(await cookies());
  const { data, error } = await supabase
    .from('broadcasts')
    .select('id, title, message, target_audience, created_at')
    .order('created_at', { ascending: false })
    .limit(Math.min(100, Math.max(1, limit)));

  if (error) {
    console.error('[notifications list]', error);
    return [];
  }

  return ((data || []) as BroadcastRow[])
    .filter((row) => broadcastTargetsUsers(row.target_audience))
    .map((row) => ({
      id: row.id,
      title: (row.title || 'FinderB update').trim() || 'FinderB update',
      message: (row.message || '').trim(),
      created_at: row.created_at || new Date().toISOString(),
    }))
    .filter((row) => row.message);
}

export async function upsertUserPushToken(input: {
  userId: string;
  token: string;
  platform?: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = db();
  if (!supabase) {
    return { success: false, error: 'Push notifications are not configured.' };
  }

  const token = input.token.trim();
  if (!token || token.length < 20) {
    return { success: false, error: 'Invalid push token.' };
  }

  const platform = (input.platform || '').trim().slice(0, 20) || null;
  const { error } = await supabase.from('user_push_tokens').upsert(
    {
      user_id: input.userId,
      token,
      platform,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'token' }
  );

  if (error) {
    console.error('[push-token]', error);
    return { success: false, error: 'Could not save notification token.' };
  }
  return { success: true };
}

export async function deleteUserPushTokens(userId: string): Promise<void> {
  const supabase = db();
  if (!supabase) return;
  await supabase.from('user_push_tokens').delete().eq('user_id', userId);
}

export async function dispatchBroadcastPush(broadcastId: string): Promise<{
  success: true;
  sent: number;
  skipped?: string;
} | { success: false; error: string }> {
  const id = broadcastId.trim();
  if (!id) {
    return { success: false, error: 'Missing broadcast id.' };
  }

  const supabase = db();
  if (!supabase) {
    return { success: false, error: 'Notifications are not configured.' };
  }

  const { data, error } = await supabase
    .from('broadcasts')
    .select('id, title, message, target_audience, created_at, push_sent_at')
    .eq('id', id)
    .maybeSingle();

  let row: BroadcastRow | null = data as BroadcastRow | null;
  if (error && /push_sent_at|schema cache/i.test(error.message || '')) {
    const fallback = await supabase
      .from('broadcasts')
      .select('id, title, message, target_audience, created_at')
      .eq('id', id)
      .maybeSingle();
    row = (fallback.data as BroadcastRow | null) ?? null;
  } else if (error || !data) {
    return { success: false, error: 'Broadcast not found.' };
  }

  if (!row) {
    return { success: false, error: 'Broadcast not found.' };
  }
  if (!broadcastTargetsUsers(row.target_audience)) {
    return { success: true, sent: 0, skipped: 'not-users' };
  }
  if (row.push_sent_at) {
    return { success: true, sent: 0, skipped: 'already-sent' };
  }

  const title = (row.title || 'FinderB update').trim() || 'FinderB update';
  const body = (row.message || '').trim();
  if (!body) {
    return { success: true, sent: 0, skipped: 'empty' };
  }

  const { data: tokens, error: tokenError } = await supabase
    .from('user_push_tokens')
    .select('token');

  if (tokenError) {
    if (/does not exist|schema cache/i.test(tokenError.message || '')) {
      return { success: true, sent: 0, skipped: 'no-token-table' };
    }
    return { success: false, error: tokenError.message };
  }

  const unique = [
    ...new Set(
      ((tokens || []) as { token?: string }[])
        .map((item) => String(item.token || '').trim())
        .filter(Boolean)
    ),
  ];

  const result = await sendExpoPushMessages(
    unique.map((token) => ({
      to: token,
      title,
      body,
      sound: 'default',
      channelId: 'finderb_heads_up',
      priority: 'high',
      interruptionLevel: 'timeSensitive',
      badge: 1,
      ttl: 86400,
      data: { type: 'broadcast', broadcastId: row.id },
    }))
  );

  await supabase
    .from('broadcasts')
    .update({ push_sent_at: new Date().toISOString() })
    .eq('id', id);

  if (result.error && result.sent === 0) {
    return { success: false, error: result.error };
  }

  return { success: true, sent: result.sent };
}
