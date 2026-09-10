import 'server-only';

export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: 'default';
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
  /** Expo Push API uses hyphenated iOS values, not the client `timeSensitive` spelling. */
  interruptionLevel?: 'passive' | 'active' | 'time-sensitive' | 'critical';
  badge?: number;
  ttl?: number;
};

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

function isExpoPushToken(token: string): boolean {
  return (
    token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')
  );
}

export async function sendExpoPushMessages(
  messages: ExpoPushMessage[]
): Promise<{ sent: number; error?: string }> {
  const valid = messages.filter((item) => isExpoPushToken(item.to));
  if (!valid.length) return { sent: 0 };

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  const accessToken = process.env.EXPO_ACCESS_TOKEN?.trim();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let sent = 0;
  const errors: string[] = [];
  try {
    for (let i = 0; i < valid.length; i += 100) {
      const chunk = valid.slice(i, i + 100);
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(chunk.length === 1 ? chunk[0] : chunk),
      });
      const payload = (await res.json().catch(() => null)) as {
        data?: { status?: string; message?: string } | Array<{ status?: string; message?: string }>;
        errors?: Array<{ message?: string }>;
      } | null;
      if (!res.ok) {
        const text = JSON.stringify(payload || {}).slice(0, 200);
        return {
          sent,
          error: `Expo push failed (${res.status}): ${text}`,
        };
      }
      const rawTickets = payload?.data;
      const tickets = Array.isArray(rawTickets)
        ? rawTickets
        : rawTickets
          ? [rawTickets]
          : [];
      for (const ticket of tickets) {
        if (ticket.status === 'ok') sent += 1;
        else if (ticket.message) errors.push(ticket.message);
      }
      if (!tickets.length) sent += chunk.length;
    }
    return {
      sent,
      error: errors.length ? errors.slice(0, 3).join('; ') : undefined,
    };
  } catch (error) {
    return {
      sent,
      error: error instanceof Error ? error.message : 'Expo push failed',
    };
  }
}
