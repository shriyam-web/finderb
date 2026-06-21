import { NextResponse } from 'next/server';
import { recordProfileView } from '@/app/actions/analytics';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  let sessionHash: string | undefined;
  try {
    const body = (await request.json()) as { sessionHash?: string };
    sessionHash = body.sessionHash?.slice(0, 64);
  } catch {
    sessionHash = undefined;
  }

  await recordProfileView(id, sessionHash);
  return NextResponse.json({ ok: true });
}
