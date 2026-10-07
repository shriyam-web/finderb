import { createHmac, timingSafeEqual } from 'crypto';
import { handleWhatsAppInboundMessage } from '@/lib/auth/whatsappInbound.server';
import { getWhatsAppCloudConfig } from '@/lib/whatsapp/cloudConfig';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type WebhookPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          from?: string;
          type?: string;
          text?: { body?: string };
        }>;
      };
    }>;
  }>;
};

/** Meta Cloud API webhook handshake. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  const expected = getWhatsAppCloudConfig().webhookVerifyToken;
  if (mode === 'subscribe' && token && token === expected && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  return new Response('Forbidden', { status: 403 });
}

function signatureValid(raw: string, header: string | null, secret: string) {
  if (!secret) return true;
  const given = (header || '').replace(/^sha256=/, '');
  const expected = createHmac('sha256', secret).update(raw).digest('hex');
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Incoming messages. Meta retries anything that is not a 200, so failures are logged, not returned. */
export async function POST(request: Request) {
  const raw = await request.text();
  const { appSecret } = getWhatsAppCloudConfig();
  if (!signatureValid(raw, request.headers.get('x-hub-signature-256'), appSecret)) {
    return new Response('Invalid signature', { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(raw) as WebhookPayload;
  } catch {
    return new Response(null, { status: 200 });
  }

  const messages = (payload.entry || [])
    .flatMap((entry) => entry.changes || [])
    .flatMap((change) => change.value?.messages || [])
    .filter((message) => message.type === 'text' && message.from && message.text?.body);

  for (const message of messages) {
    try {
      await handleWhatsAppInboundMessage(message.from as string, message.text?.body as string);
    } catch (error) {
      console.error('[whatsapp webhook] message failed', error);
    }
  }

  return new Response(null, { status: 200 });
}
