import { getWhatsAppCloudConfig } from '@/lib/whatsapp/cloudConfig';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Meta Cloud API webhook handshake. Login OTP does not depend on incoming
 * events; this endpoint exists so production setup can subscribe the WABA.
 */
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

export async function POST() {
  return new Response(null, { status: 200 });
}
