import { NextResponse } from 'next/server';
import { sendAdminBroadcastEmail } from '@/lib/email/sendAdminBroadcastEmail';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function authorized(request: Request): boolean {
  const configured = process.env.FINDERB_DISPATCH_SECRET?.trim();
  if (!configured) return true;
  const header =
    request.headers.get('x-finderb-dispatch') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    '';
  return header.trim() === configured;
}

function emails(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[,;\n]/) : [];
  return raw.map((item) => String(item || '').trim()).filter(Boolean);
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    to?: unknown;
    cc?: unknown;
    bcc?: unknown;
    subject?: string;
    body?: string;
  } | null;

  const result = await sendAdminBroadcastEmail({
    to: emails(body?.to),
    cc: emails(body?.cc),
    bcc: emails(body?.bcc),
    subject: String(body?.subject || ''),
    body: String(body?.body || ''),
  });

  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
