import { NextResponse } from 'next/server';
import {
  fetchTruecallerProfile,
  parseTruecallerProfile,
} from '@/lib/auth/truecallerProfile';
import { parseTruecallerCallbackBody } from '@/lib/auth/parseTruecallerCallback';
import {
  createTruecallerAuthRequest,
  getTruecallerAuthRequest,
  updateTruecallerAuthRequest,
} from '@/lib/auth/truecallerPendingStore.server';
import { syncTruecallerUserToAppSession } from '@/lib/auth/syncTruecallerUser.server';
import { isValidTruecallerRequestId } from '@/lib/auth/truecallerConfig';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function callbackErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
    return 'Server misconfigured: add SUPABASE_SERVICE_ROLE_KEY in Vercel env vars.';
  }
  if (message.includes('profile fetch failed')) {
    return 'Could not read your Truecaller profile. Please try again.';
  }
  if (message.includes('truecaller_auth_requests') || message.includes('schema cache')) {
    return 'Database not ready: run supabase/truecaller_auth.sql in Supabase SQL Editor.';
  }

  return 'Truecaller verification failed. Please try again.';
}

export async function POST(request: Request) {
  const body = await parseTruecallerCallbackBody(request);
  if (!body) {
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
      // Truecaller may callback before the browser init request lands (mobile networks).
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
      });
      return NextResponse.json({ error: 'Missing access token or endpoint' }, { status: 400 });
    }

    if (!endpoint.startsWith('https://')) {
      return NextResponse.json({ error: 'Invalid profile endpoint' }, { status: 400 });
    }

    const profile = await fetchTruecallerProfile(accessToken, endpoint);
    const identity = parseTruecallerProfile(profile);

    if (!identity) {
      console.error('[truecaller callback] invalid phone in profile', {
        requestId,
        phoneNumbers: profile.phoneNumbers,
      });
      await updateTruecallerAuthRequest(requestId, {
        status: 'error',
        errorMessage: 'Truecaller did not share a valid Indian mobile number.',
      });
      return NextResponse.json({ ok: true });
    }

    const syncResult = await syncTruecallerUserToAppSession(identity, { useServiceRole: true });

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
    console.error('[truecaller callback]', requestId, error);

    const errorMessage = callbackErrorMessage(error);

    try {
      await updateTruecallerAuthRequest(requestId, {
        status: 'error',
        errorMessage,
      });
    } catch (updateError) {
      console.error('[truecaller callback] could not persist error', updateError);
    }

    return NextResponse.json({ ok: true });
  }
}
