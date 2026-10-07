import 'server-only';

import {
  fetchTruecallerProfile,
  parseTruecallerProfile,
} from '@/lib/auth/truecallerProfile';
import {
  getTruecallerAuthRequest,
  updateTruecallerAuthRequest,
} from '@/lib/auth/truecallerPendingStore.server';
import { syncTruecallerUserToAppSession } from '@/lib/auth/syncTruecallerUser.server';
import {
  parseTruecallerPhoneVerifyPath,
  truecallerPhoneVerifiedPath,
} from '@/lib/auth/phoneVerify.server';

function toPublicError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
    return 'Server misconfigured: add SUPABASE_SERVICE_ROLE_KEY in Vercel env vars.';
  }
  if (message.includes('profile fetch failed') || message.includes('Unauthorized')) {
    return 'Could not read your Truecaller profile. Please try again.';
  }
  if (message.includes('truecaller_auth_requests') || message.includes('schema cache')) {
    return 'Database not ready: run supabase/truecaller_auth.sql in Supabase SQL Editor.';
  }
  if (message.includes('JSON') || message.includes('Unexpected token')) {
    return 'Truecaller returned an invalid profile response. Please try again.';
  }

  return `Truecaller verification failed: ${message.slice(0, 160)}`;
}

export async function processTruecallerAccessToken(
  requestId: string,
  accessToken: string,
  endpoint: string
): Promise<void> {
  if (!endpoint.startsWith('https://')) {
    throw new Error('Invalid Truecaller profile endpoint');
  }

  const profile = await fetchTruecallerProfile(accessToken, endpoint);
  const identity = parseTruecallerProfile(profile);

  if (!identity) {
    console.error('[truecaller] invalid phone in profile', {
      requestId,
      phoneNumbers: profile.phoneNumbers,
    });
    await updateTruecallerAuthRequest(requestId, {
      status: 'error',
      errorMessage: 'Truecaller did not share a valid Indian mobile number.',
    });
    return;
  }

  const record = await getTruecallerAuthRequest(requestId);
  const phoneVerify = parseTruecallerPhoneVerifyPath(record?.redirectPath);
  if (phoneVerify) {
    await updateTruecallerAuthRequest(requestId, {
      status: 'completed',
      redirectPath: truecallerPhoneVerifiedPath(phoneVerify.userId, identity.phone),
      errorMessage: null,
    });
    return;
  }

  const syncResult = await syncTruecallerUserToAppSession(identity, { useServiceRole: true });

  if (!syncResult.success) {
    await updateTruecallerAuthRequest(requestId, {
      status: 'error',
      errorMessage: syncResult.error,
      suggestedLoginPath: syncResult.suggestedLoginPath ?? null,
    });
    return;
  }

  await updateTruecallerAuthRequest(requestId, {
    status: 'completed',
    userId: syncResult.userId,
    isNewUser: syncResult.isNewUser,
    errorMessage: null,
    suggestedLoginPath: null,
  });
}

export async function processTruecallerAccessTokenSafe(
  requestId: string,
  accessToken: string,
  endpoint: string
): Promise<void> {
  try {
    await processTruecallerAccessToken(requestId, accessToken, endpoint);
  } catch (error) {
    console.error('[truecaller] async process failed', requestId, error);
    const errorMessage = toPublicError(error);

    try {
      await updateTruecallerAuthRequest(requestId, {
        status: 'error',
        errorMessage,
      });
    } catch (updateError) {
      console.error('[truecaller] could not persist async error', updateError);
    }
  }
}
