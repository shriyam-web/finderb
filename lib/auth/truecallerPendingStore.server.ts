import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';

export type TruecallerAuthStatus =
  | 'pending'
  | 'flow_invoked'
  | 'completed'
  | 'user_rejected'
  | 'error';

export type TruecallerAuthRecord = {
  requestId: string;
  status: TruecallerAuthStatus;
  userId: string | null;
  errorMessage: string | null;
  redirectPath: string;
  isNewUser: boolean | null;
  suggestedLoginPath: string | null;
  expiresAt: string;
};

const REQUEST_TTL_MS = 10 * 60 * 1000;

function getDb() {
  const db = createServiceClient();
  if (!db) {
    throw new Error('Truecaller auth requires SUPABASE_SERVICE_ROLE_KEY.');
  }
  return db;
}

export async function createTruecallerAuthRequest(
  requestId: string,
  redirectPath: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + REQUEST_TTL_MS).toISOString();
  const db = getDb();

  const { error } = await db.from('truecaller_auth_requests').upsert(
    {
      requestId,
      status: 'pending',
      userId: null,
      errorMessage: null,
      redirectPath,
      isNewUser: null,
      suggestedLoginPath: null,
      expiresAt,
      createdAt: new Date().toISOString(),
    },
    { onConflict: 'requestId' }
  );

  if (error) {
    throw error;
  }
}

export async function getTruecallerAuthRequest(
  requestId: string
): Promise<TruecallerAuthRecord | null> {
  const db = getDb();
  const { data, error } = await db
    .from('truecaller_auth_requests')
    .select(
      'requestId, status, userId, errorMessage, redirectPath, isNewUser, suggestedLoginPath, expiresAt'
    )
    .eq('requestId', requestId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) return null;

  if (new Date(data.expiresAt).getTime() < Date.now()) {
    return {
      ...data,
      status: 'error',
      errorMessage: 'Verification request expired. Please try again.',
    };
  }

  return data as TruecallerAuthRecord;
}

export async function updateTruecallerAuthRequest(
  requestId: string,
  patch: Partial<
    Pick<
      TruecallerAuthRecord,
      'status' | 'userId' | 'errorMessage' | 'isNewUser' | 'suggestedLoginPath' | 'redirectPath'
    >
  >
): Promise<void> {
  const db = getDb();
  const { error } = await db
    .from('truecaller_auth_requests')
    .update(patch)
    .eq('requestId', requestId);

  if (error) {
    throw error;
  }
}
