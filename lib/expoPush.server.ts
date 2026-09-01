import 'server-only';

export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: 'default';
  channelId?: string;
};

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

function isExpoPushToken(token: string): boolean {
  return (
    token.startsWith('ExponentPushToken[') ||
    token.startsWith('ExpoPushToken[') ||
    /^[a-zA-Z0-9_-]{20,}$/.test(token)
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
  try {
    for (let i = 0; i < valid.length; i += 100) {
      const chunk = valid.slice(i, i + 100);
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(chunk),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        return {
          sent,
          error: `Expo push failed (${res.status}): ${text.slice(0, 200)}`,
        };
      }
      sent += chunk.length;
    }
    return { sent };
  } catch (error) {
    return {
      sent,
      error: error instanceof Error ? error.message : 'Expo push failed',
    };
  }
}
