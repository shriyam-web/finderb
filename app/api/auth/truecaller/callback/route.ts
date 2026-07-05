import { NextResponse } from 'next/server';
import {
  fetchTruecallerProfile,
  parseTruecallerProfile,
} from '@/lib/auth/truecallerProfile';
import {
  getTruecallerAuthRequest,
  updateTruecallerAuthRequest,
} from '@/lib/auth/truecallerPendingStore.server';
import { syncTruecallerUserToAppSession } from '@/lib/auth/syncTruecallerUser.server';
import { isValidTruecallerRequestId } from '@/lib/auth/truecallerConfig';

export const dynamic = 'force-dynamic';

type CallbackBody = {
  requestId?: string;
  accessToken?: string;
  endpoint?: string;
  status?: string;
};

export async function POST(request: Request) {
  let body: CallbackBody;

  try {
    body = (await request.json()) as CallbackBody;
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const requestId = body.requestId?.trim() ?? '';
  if (!isValidTruecallerRequestId(requestId)) {
    return NextResponse.json({ error: 'Invalid requestId' }, { status: 400 });
  }

  try {
    const existing = await getTruecallerAuthRequest(requestId);
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
      return NextResponse.json({ error: 'Missing access token or endpoint' }, { status: 400 });
    }

    if (!endpoint.startsWith('https://')) {
      return NextResponse.json({ error: 'Invalid profile endpoint' }, { status: 400 });
    }

    const profile = await fetchTruecallerProfile(accessToken, endpoint);
    const identity = parseTruecallerProfile(profile);

    if (!identity) {
      await updateTruecallerAuthRequest(requestId, {
        status: 'error',
        errorMessage: 'Truecaller did not share a valid phone number.',
      });
      return NextResponse.json({ ok: true });
    }

    const syncResult = await syncTruecallerUserToAppSession(identity);

    if (!syncResult.success) {
      await updateTruecallerAuthRequest(requestId, {
        status: 'error',
        errorMessage: syncResult.error,
        suggestedLoginPath: syncResult.suggestedLoginPath ?? null,
      });
      return NextResponse.json({ ok: true });
    }

    await updateTruecallerAuthRequest(requestId, {
      status: 'completed',
      userId: syncResult.userId,
      isNewUser: syncResult.isNewUser,
      errorMessage: null,
      suggestedLoginPath: null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[truecaller callback]', error);

    try {
      await updateTruecallerAuthRequest(requestId, {
        status: 'error',
        errorMessage: 'Truecaller verification failed. Please try again.',
      });
    } catch {
      // ignore secondary failure
    }

    return NextResponse.json({ ok: true });
  }
}
