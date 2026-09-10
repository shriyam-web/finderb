import 'server-only';
import { createSign } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

type ServiceAccount = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

export type FcmPushMessage = {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  channelId?: string;
  collapseTag?: string;
};

let cachedAccount: ServiceAccount | null | undefined;
let cachedAccess:
  | { token: string; expiresAt: number }
  | null
  | undefined;

function base64Url(value: Buffer | string): string {
  const buf = Buffer.isBuffer(value) ? value : Buffer.from(value);
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function loadServiceAccount(): ServiceAccount | null {
  if (cachedAccount !== undefined) return cachedAccount;

  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (inline) {
    try {
      cachedAccount = JSON.parse(inline) as ServiceAccount;
      return cachedAccount;
    } catch {
      try {
        cachedAccount = JSON.parse(
          Buffer.from(inline, 'base64').toString('utf8'),
        ) as ServiceAccount;
        return cachedAccount;
      } catch {
        cachedAccount = null;
        return null;
      }
    }
  }

  const candidates = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim(),
    path.join(
      process.cwd(),
      'mobile',
      'finderb-bcde1-firebase-adminsdk-fbsvc-0ae4b09486.json',
    ),
  ].filter(Boolean) as string[];

  for (const file of candidates) {
    if (!existsSync(file)) continue;
    try {
      cachedAccount = JSON.parse(readFileSync(file, 'utf8')) as ServiceAccount;
      return cachedAccount;
    } catch {
      continue;
    }
  }

  cachedAccount = null;
  return null;
}

function isLikelyFcmToken(token: string): boolean {
  const value = token.trim();
  if (value.length < 80) return false;
  if (value.startsWith('ExponentPushToken[') || value.startsWith('ExpoPushToken[')) {
    return false;
  }
  return value.includes(':') || /^[A-Za-z0-9_-]{80,}$/.test(value);
}

async function getAccessToken(account: ServiceAccount): Promise<string> {
  if (
    cachedAccess &&
    cachedAccess.expiresAt - 60_000 > Date.now()
  ) {
    return cachedAccess.token;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(
    JSON.stringify({
      iss: account.client_email,
      sub: account.client_email,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
    }),
  );
  const unsigned = `${header}.${payload}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  const jwt = `${unsigned}.${base64Url(signer.sign(account.private_key || ''))}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const json = (await res.json().catch(() => null)) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  } | null;

  if (!res.ok || !json?.access_token) {
    throw new Error(
      json?.error_description || json?.error || `FCM auth failed (${res.status})`,
    );
  }

  cachedAccess = {
    token: json.access_token,
    expiresAt: Date.now() + Math.max(60, Number(json.expires_in) || 3600) * 1000,
  };
  return cachedAccess.token;
}

export async function sendFcmPushMessages(
  messages: FcmPushMessage[],
): Promise<{ sent: number; error?: string }> {
  const valid = messages
    .map((item) => ({
      ...item,
      token: item.token.trim(),
    }))
    .filter((item) => isLikelyFcmToken(item.token));
  if (!valid.length) return { sent: 0 };

  const account = loadServiceAccount();
  const projectId = account?.project_id?.trim();
  if (!account?.client_email || !account.private_key || !projectId) {
    return { sent: 0, error: 'Firebase service account is not configured.' };
  }

  let accessToken: string;
  try {
    accessToken = await getAccessToken(account);
  } catch (error) {
    return {
      sent: 0,
      error: error instanceof Error ? error.message : 'FCM auth failed',
    };
  }

  let sent = 0;
  const errors: string[] = [];

  for (const item of valid) {
    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token: item.token,
            notification: {
              title: item.title,
              body: item.body,
            },
            data: item.data,
            android: {
              priority: 'HIGH',
              collapse_key: item.collapseTag || item.data?.broadcastId || undefined,
              notification: {
                channelId: item.channelId || 'finderb_heads_up',
                sound: 'default',
                defaultVibrateTimings: true,
                visibility: 'PUBLIC',
                tag: item.collapseTag || item.data?.broadcastId || undefined,
              },
            },
          },
        }),
      },
    );
    const payload = (await res.json().catch(() => null)) as {
      name?: string;
      error?: { status?: string; message?: string };
    } | null;

    if (res.ok && payload?.name) {
      sent += 1;
      continue;
    }

    const status = payload?.error?.status || '';
    if (status === 'NOT_FOUND' || status === 'UNREGISTERED') {
      continue;
    }
    errors.push(
      payload?.error?.message || `FCM send failed (${res.status})`,
    );
  }

  return {
    sent,
    error: errors.length ? errors.slice(0, 3).join('; ') : undefined,
  };
}

export async function verifyFcmCredentials(): Promise<{
  ok: boolean;
  detail: string;
}> {
  const account = loadServiceAccount();
  const projectId = account?.project_id?.trim();
  if (!account?.client_email || !account.private_key || !projectId) {
    return { ok: false, detail: 'Service account file missing.' };
  }

  try {
    const accessToken = await getAccessToken(account);
    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token: 'FinderBCredentialProbeToken',
            notification: { title: 'FinderB', body: 'credential probe' },
          },
        }),
      },
    );
    const payload = (await res.json().catch(() => null)) as {
      error?: { status?: string; message?: string };
    } | null;
    const status = payload?.error?.status || '';
    const message = payload?.error?.message || `HTTP ${res.status}`;

    if (status === 'NOT_FOUND' || status === 'INVALID_ARGUMENT' || status === 'UNREGISTERED') {
      return {
        ok: true,
        detail: `FCM V1 accepted credentials for ${projectId} (${status}).`,
      };
    }
    if (res.ok) {
      return { ok: true, detail: `FCM V1 reachable for ${projectId}.` };
    }
    return { ok: false, detail: message };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : 'FCM verify failed',
    };
  }
}
