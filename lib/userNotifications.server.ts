import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { broadcastTargetsUsers } from '@/lib/broadcastAudience';
import {
  broadcastShowsDatetime,
  resolveBroadcastCta,
} from '@/lib/broadcastFields';
import { sendExpoPushMessages } from '@/lib/expoPush.server';
import { sendFcmPushMessages } from '@/lib/fcmPush.server';

export type UserNotification = {
  id: string;
  title: string;
  message: string;
  created_at: string;
  cta_url: string | null;
  cta_label: string | null;
  show_datetime: boolean;
};

const LIST_SELECT =
  'id, title, message, target_audience, created_at, cta_url, cta_label, show_datetime';
const LIST_SELECT_FALLBACK = 'id, title, message, target_audience, created_at';
const PUSH_SELECT =
  'id, title, message, target_audience, created_at, push_sent_at, cta_url, cta_label';
const PUSH_SELECT_FALLBACK = 'id, title, message, target_audience, created_at, push_sent_at';
const PUSH_SELECT_MIN = 'id, title, message, target_audience, created_at';

type BroadcastRow = {
  id: string;
  title?: string | null;
  message?: string | null;
  target_audience?: unknown;
  created_at?: string | null;
  push_sent_at?: string | null;
  cta_url?: string | null;
  cta_label?: string | null;
  show_datetime?: boolean | null;
};

function toUserNotification(row: BroadcastRow): UserNotification | null {
  const message = (row.message || '').trim();
  if (!message) return null;
  const cta = resolveBroadcastCta({
    cta_url: row.cta_url,
    cta_label: row.cta_label,
  });
  return {
    id: row.id,
    title: (row.title || 'FinderB update').trim() || 'FinderB update',
    message,
    created_at: row.created_at || new Date().toISOString(),
    cta_url: cta?.url ?? null,
    cta_label: cta?.label ?? null,
    show_datetime: broadcastShowsDatetime(row.show_datetime),
  };
}

function isExpoToken(token: string) {
  return (
    token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')
  );
}

function isIosPlatform(platform?: string | null) {
  return /^ios$/i.test(String(platform || '').trim());
}

/** One delivery path per user: native FCM wins on Android so Expo+FCM do not double-alert. */
function splitPushTokens(
  rows: Array<{ token?: string | null; user_id?: string | null; platform?: string | null }>,
): { expoTokens: string[]; fcmTokens: string[] } {
  const byUser = new Map<
    string,
    { expo: string[]; expoIos: string[]; fcm: string[] }
  >();

  for (const row of rows) {
    const token = String(row.token || '').trim();
    if (!token) continue;
    const userId = String(row.user_id || 'guest').trim() || 'guest';
    let bucket = byUser.get(userId);
    if (!bucket) {
      bucket = { expo: [], expoIos: [], fcm: [] };
      byUser.set(userId, bucket);
    }
    if (isExpoToken(token)) {
      if (isIosPlatform(row.platform)) bucket.expoIos.push(token);
      else bucket.expo.push(token);
    } else {
      bucket.fcm.push(token);
    }
  }

  const expoTokens: string[] = [];
  const fcmTokens: string[] = [];
  for (const bucket of byUser.values()) {
    const uniqueFcm = [...new Set(bucket.fcm)];
    const uniqueExpo = [...new Set(bucket.expo)];
    const uniqueIos = [...new Set(bucket.expoIos)];
    if (uniqueFcm.length) {
      fcmTokens.push(...uniqueFcm);
      expoTokens.push(...uniqueIos);
    } else {
      expoTokens.push(...uniqueExpo, ...uniqueIos);
    }
  }

  return {
    expoTokens: [...new Set(expoTokens)],
    fcmTokens: [...new Set(fcmTokens)],
  };
}

function db() {
  return createServiceClient();
}

export async function listUserNotifications(limit = 50): Promise<UserNotification[]> {
  const supabase = db() ?? createClient(await cookies());
  const take = Math.min(100, Math.max(1, limit));
  const full = await supabase
    .from('broadcasts')
    .select(LIST_SELECT)
    .order('created_at', { ascending: false })
    .limit(take);

  const used =
    full.error && /cta_url|cta_label|show_datetime|schema cache/i.test(full.error.message || '')
      ? await supabase
          .from('broadcasts')
          .select(LIST_SELECT_FALLBACK)
          .order('created_at', { ascending: false })
          .limit(take)
      : full;

  if (used.error) {
    console.error('[notifications list]', used.error);
    return [];
  }

  return ((used.data || []) as BroadcastRow[])
    .filter((row) => broadcastTargetsUsers(row.target_audience))
    .map(toUserNotification)
    .filter((row): row is UserNotification => Boolean(row));
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

  if (
    input.userId &&
    input.userId !== 'guest' &&
    !isExpoToken(token)
  ) {
    await supabase
      .from('user_push_tokens')
      .delete()
      .eq('user_id', input.userId)
      .eq('platform', 'android')
      .like('token', 'ExponentPushToken[%');
    await supabase
      .from('user_push_tokens')
      .delete()
      .eq('user_id', input.userId)
      .eq('platform', 'android')
      .like('token', 'ExpoPushToken[%');
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

  const full = await supabase
    .from('broadcasts')
    .select(PUSH_SELECT)
    .eq('id', id)
    .maybeSingle();

  const withoutCta =
    full.error && /cta_url|cta_label|schema cache/i.test(full.error.message || '')
      ? await supabase
          .from('broadcasts')
          .select(PUSH_SELECT_FALLBACK)
          .eq('id', id)
          .maybeSingle()
      : full;

  const used =
    withoutCta.error && /push_sent_at|schema cache/i.test(withoutCta.error.message || '')
      ? await supabase
          .from('broadcasts')
          .select(PUSH_SELECT_MIN)
          .eq('id', id)
          .maybeSingle()
      : withoutCta;

  const row = used.data as BroadcastRow | null;
  if (used.error || !row) {
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
    .select('user_id, token, platform');

  if (tokenError) {
    if (/does not exist|schema cache/i.test(tokenError.message || '')) {
      return { success: true, sent: 0, skipped: 'no-token-table' };
    }
    return { success: false, error: tokenError.message };
  }

  const { expoTokens, fcmTokens } = splitPushTokens(
    (tokens || []) as Array<{
      token?: string | null;
      user_id?: string | null;
      platform?: string | null;
    }>,
  );

  const cta = resolveBroadcastCta({
    cta_url: row.cta_url,
    cta_label: row.cta_label,
  });
  const pushData: Record<string, string> = {
    type: 'broadcast',
    broadcastId: row.id,
  };
  if (cta) {
    pushData.ctaUrl = cta.url;
    pushData.ctaLabel = cta.label;
  }

  const [expoResult, fcmResult] = await Promise.all([
    sendExpoPushMessages(
      expoTokens.map((token) => ({
        to: token,
        title,
        body,
        sound: 'default',
        channelId: 'finderb_heads_up',
        priority: 'high',
        interruptionLevel: 'time-sensitive',
        badge: 1,
        ttl: 86400,
        collapseId: row.id,
        data: pushData,
      })),
    ),
    sendFcmPushMessages(
      fcmTokens.map((token) => ({
        token,
        title,
        body,
        channelId: 'finderb_heads_up',
        collapseTag: row.id,
        data: pushData,
      })),
    ),
  ]);

  const sent = expoResult.sent + fcmResult.sent;
  const error = [expoResult.error, fcmResult.error].filter(Boolean).join('; ');
  if (error && sent === 0) {
    return { success: false, error };
  }

  await supabase
    .from('broadcasts')
    .update({ push_sent_at: new Date().toISOString() })
    .eq('id', id);

  return { success: true, sent };
}

export async function dispatchPendingBroadcastPushes(): Promise<void> {
  const supabase = db();
  if (!supabase) return;

  const { data, error } = await supabase
    .from('broadcasts')
    .select('id')
    .is('push_sent_at', null)
    .order('created_at', { ascending: false })
    .limit(8);

  if (error || !data?.length) return;

  for (const row of data) {
    const id = String((row as { id?: string }).id || '').trim();
    if (!id) continue;
    await dispatchBroadcastPush(id).catch(() => undefined);
  }
}
