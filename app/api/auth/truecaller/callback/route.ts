import { after } from 'next/server';
import { NextResponse } from 'next/server';
import { parseTruecallerCallbackBody } from '@/lib/auth/parseTruecallerCallback';
import {
  createTruecallerAuthRequest,
  getTruecallerAuthRequest,
  updateTruecallerAuthRequest,
} from '@/lib/auth/truecallerPendingStore.server';
import { processTruecallerAccessTokenSafe } from '@/lib/auth/processTruecallerCallback.server';
import { isValidTruecallerRequestId } from '@/lib/auth/truecallerConfig';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await parseTruecallerCallbackBody(request);
  if (!body) {
    console.error('[truecaller callback] unparseable body', {
      contentType: request.headers.get('content-type'),
    });
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const requestId = body.requestId.trim();
  if (!isValidTruecallerRequestId(requestId)) {
    console.error('[truecaller callback] invalid requestId:', requestId);
    return NextResponse.json({ error: 'Invalid requestId' }, { status: 400 });
  }

  try {
    let existing = await getTruecallerAuthRequest(requestId);
    if (!existing) {
      await createTruecallerAuthRequest(requestId, '/dashboard');
      existing = await getTruecallerAuthRequest(requestId);
    }

    if (!existing) {
      return NextResponse.json({ error: 'Unknown request' }, { status: 404 });
    }

    if (body.status === 'flow_invoked') {
      await updateTruecallerAuthRequest(requestId, { status: 'flow_invoked' });
      return NextResponse.json({ ok: true });
    }

    if (body.status === 'user_rejected') {
      await updateTruecallerAuthRequest(requestId, {
        status: 'user_rejected',
        errorMessage: 'You declined Truecaller verification.',
      });
      return NextResponse.json({ ok: true });
    }

    const accessToken = body.accessToken?.trim();
    const endpoint = body.endpoint?.trim();
    if (!accessToken || !endpoint) {
      console.error('[truecaller callback] missing token/endpoint', {
        requestId,
        status: body.status,
        hasToken: Boolean(accessToken),
        hasEndpoint: Boolean(endpoint),
        keys: Object.keys(body),
      });
      return NextResponse.json({ error: 'Missing access token or endpoint' }, { status: 400 });
    }

    // Truecaller requires a 2xx response within ~3 seconds — process profile fetch async.
    await updateTruecallerAuthRequest(requestId, { status: 'flow_invoked' });

    after(async () => {
      await processTruecallerAccessTokenSafe(requestId, accessToken, endpoint);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[truecaller callback] handler error', requestId, error);

    try {
      await updateTruecallerAuthRequest(requestId, {
        status: 'error',
        errorMessage:
          error instanceof Error
            ? `Truecaller verification failed: ${error.message.slice(0, 160)}`
            : 'Truecaller verification failed. Please try again.',
      });
    } catch (updateError) {
      console.error('[truecaller callback] could not persist handler error', updateError);
    }

    return NextResponse.json({ ok: true });
  }
}
