import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { after } from 'next/server';
import { broadcastTargetsMerchants, broadcastTargetsUsers } from '@/lib/broadcastAudience';
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

type ServiceDb = NonNullable<ReturnType<typeof createServiceClient>>;

type PushTokenRow = {
  token?: string | null;
  user_id?: string | null;
  platform?: string | null;
  business_id?: string | null;
};

/** Broadcasts older than this are never pushed, so a backlog cannot fire all at once. */
const PUSH_FRESH_MS = 48 * 60 * 60 * 1000;

const GENERIC_AUDIENCES = new Set(['users', 'all', 'merchants', 'service providers']);

function hasCategoryAudience(raw: unknown): boolean {
  if (!Array.isArray(raw)) return false;
  return raw.some((item) => {
    const value = String(item).trim().toLowerCase();
    return Boolean(value) && !GENERIC_AUDIENCES.has(value);
  });
}

/**
 * Devices signed in as a merchant carry `business_id`; they get business pushes only,
 * and customer broadcasts go to the rest.
 */
async function loadPushTokens(
  supabase: ServiceDb,
  scope: 'users' | 'merchants' | { businessId: string },
): Promise<{ rows: PushTokenRow[]; error?: string; missingTable?: boolean }> {
  let query = supabase.from('user_push_tokens').select('user_id, token, platform, business_id');
  if (scope === 'users') query = query.is('business_id', null);
  else if (scope === 'merchants') query = query.not('business_id', 'is', null);
  else query = query.eq('business_id', scope.businessId);

  let { data, error } = await query;
  if (error && isMissingBusinessColumn(error)) {
    if (scope !== 'users') return { rows: [] };
    ({ data, error } = await supabase.from('user_push_tokens').select('user_id, token, platform'));
  }
  if (error) {
    if (/does not exist|schema cache/i.test(error.message || '')) {
      return { rows: [], missingTable: true };
    }
    return { rows: [], error: error.message };
  }
  return { rows: (data ?? []) as PushTokenRow[] };
}

async function merchantRowsForAudience(
  supabase: ServiceDb,
  rows: PushTokenRow[],
  audience: unknown,
): Promise<PushTokenRow[]> {
  if (!rows.length || broadcastTargetsMerchants(audience)) return rows;

  const ids = [...new Set(rows.map((row) => String(row.business_id || '').trim()).filter(Boolean))];
  const { data } = await supabase.from('Business').select('id, category').in('id', ids);
  const allowed = new Set(
    ((data ?? []) as Array<{ id: string; category?: string | null }>)
      .filter((business) => broadcastTargetsMerchants(audience, business.category))
      .map((business) => business.id),
  );
  return rows.filter((row) => allowed.has(String(row.business_id || '').trim()));
}

async function sendPush(
  rows: PushTokenRow[],
  message: { title: string; body: string; collapseId: string; data: Record<string, string> },
): Promise<{ sent: number; error?: string }> {
  const { expoTokens, fcmTokens } = splitPushTokens(rows);
  if (!expoTokens.length && !fcmTokens.length) return { sent: 0 };

  const [expoResult, fcmResult] = await Promise.all([
    sendExpoPushMessages(
      expoTokens.map((token) => ({
        to: token,
        title: message.title,
        body: message.body,
        sound: 'default',
        channelId: 'finderb_heads_up',
        priority: 'high',
        interruptionLevel: 'time-sensitive',
        badge: 1,
        ttl: 86400,
        collapseId: message.collapseId,
        data: message.data,
      })),
    ),
    sendFcmPushMessages(
      fcmTokens.map((token) => ({
        token,
        title: message.title,
        body: message.body,
        channelId: 'finderb_heads_up',
        collapseTag: message.collapseId,
        data: message.data,
      })),
    ),
  ]);

  const error = [expoResult.error, fcmResult.error].filter(Boolean).join('; ');
  return { sent: expoResult.sent + fcmResult.sent, error: error || undefined };
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

function isMissingBusinessColumn(error: { message?: string } | null | undefined) {
  return /business_id/i.test(error?.message || '');
}

export async function upsertUserPushToken(input: {
  userId: string;
  token: string;
  platform?: string;
  businessId?: string | null;
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
  const row = {
    user_id: input.userId,
    token,
    platform,
    updated_at: new Date().toISOString(),
  };
  let { error } = await supabase
    .from('user_push_tokens')
    .upsert({ ...row, business_id: input.businessId?.trim() || null }, { onConflict: 'token' });
  if (error && isMissingBusinessColumn(error)) {
    ({ error } = await supabase.from('user_push_tokens').upsert(row, { onConflict: 'token' }));
  }

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
  if (row.push_sent_at) {
    return { success: true, sent: 0, skipped: 'already-sent' };
  }

  const markSent = () =>
    supabase.from('broadcasts').update({ push_sent_at: new Date().toISOString() }).eq('id', id);

  const forUsers = broadcastTargetsUsers(row.target_audience);
  const forMerchants = broadcastTargetsMerchants(row.target_audience) || hasCategoryAudience(row.target_audience);
  if (!forUsers && !forMerchants) {
    return { success: true, sent: 0, skipped: 'no-audience' };
  }

  const createdAt = Date.parse(row.created_at || '');
  if (Number.isFinite(createdAt) && Date.now() - createdAt > PUSH_FRESH_MS) {
    await markSent();
    return { success: true, sent: 0, skipped: 'stale' };
  }

  const title = (row.title || 'FinderB update').trim() || 'FinderB update';
  const body = (row.message || '').trim();
  if (!body) {
    return { success: true, sent: 0, skipped: 'empty' };
  }

  const cta = resolveBroadcastCta({
    cta_url: row.cta_url,
    cta_label: row.cta_label,
  });
  const baseData: Record<string, string> = {
    type: 'broadcast',
    broadcastId: row.id,
  };
  if (cta) {
    baseData.ctaUrl = cta.url;
    baseData.ctaLabel = cta.label;
  }

  let sent = 0;
  const errors: string[] = [];
  let missingTable = false;

  if (forUsers) {
    const loaded = await loadPushTokens(supabase, 'users');
    if (loaded.error) errors.push(loaded.error);
    missingTable ||= Boolean(loaded.missingTable);
    const result = await sendPush(loaded.rows, {
      title,
      body,
      collapseId: row.id,
      data: { ...baseData, audience: 'user' },
    });
    sent += result.sent;
    if (result.error) errors.push(result.error);
  }

  if (forMerchants) {
    const loaded = await loadPushTokens(supabase, 'merchants');
    if (loaded.error) errors.push(loaded.error);
    missingTable ||= Boolean(loaded.missingTable);
    const rows = await merchantRowsForAudience(supabase, loaded.rows, row.target_audience);
    const result = await sendPush(rows, {
      title,
      body,
      collapseId: row.id,
      data: { ...baseData, audience: 'business' },
    });
    sent += result.sent;
    if (result.error) errors.push(result.error);
  }

  if (missingTable && sent === 0 && !errors.length) {
    return { success: true, sent: 0, skipped: 'no-token-table' };
  }
  if (errors.length && sent === 0) {
    return { success: false, error: errors.join('; ') };
  }

  await markSent();
  return { success: true, sent };
}

/** Lead / review alerts for one merchant, delivered only to devices signed in to that business. */
export async function sendBusinessPush(input: {
  businessId: string;
  type: 'lead' | 'review';
  title: string;
  body: string;
  url: string;
}): Promise<{ sent: number; error?: string }> {
  const businessId = input.businessId.trim();
  const supabase = db();
  if (!supabase || !businessId) return { sent: 0 };

  const loaded = await loadPushTokens(supabase, { businessId });
  if (loaded.error) return { sent: 0, error: loaded.error };
  return sendPush(loaded.rows, {
    title: input.title,
    body: input.body,
    collapseId: `${input.type}-${businessId}`,
    data: { type: input.type, audience: 'business', businessId, url: input.url },
  });
}

/** Sends after the response so a slow push service never delays the customer's request. */
export function queueBusinessPush(input: Parameters<typeof sendBusinessPush>[0]): void {
  const run = () =>
    sendBusinessPush(input)
      .then((result) => {
        if (result.error) console.error('[business push]', result.error);
      })
      .catch((error) => console.error('[business push]', error));
  try {
    after(run);
  } catch {
    void run();
  }
}

export async function dispatchPendingBroadcastPushes(): Promise<void> {
  const supabase = db();
  if (!supabase) return;

  const { data, error } = await supabase
    .from('broadcasts')
    .select('id')
    .is('push_sent_at', null)
    .gte('created_at', new Date(Date.now() - PUSH_FRESH_MS).toISOString())
    .order('created_at', { ascending: false })
    .limit(8);

  if (error || !data?.length) return;

  for (const row of data) {
    const id = String((row as { id?: string }).id || '').trim();
    if (!id) continue;
    await dispatchBroadcastPush(id).catch(() => undefined);
  }
}
