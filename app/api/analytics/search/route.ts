import { NextResponse } from 'next/server';
import { recordSearchEvent } from '@/app/actions/analytics';

export async function POST(request: Request) {
  let query = '';
  let sessionHash: string | undefined;

  try {
    const body = (await request.json()) as { query?: string; sessionHash?: string };
    query = body.query?.trim() ?? '';
    sessionHash = body.sessionHash?.slice(0, 64);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!query) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await recordSearchEvent(query, sessionHash);
  return NextResponse.json({ ok: true });
}
