import 'server-only';

import { createClient } from '@/utils/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { cookies } from 'next/headers';
import { lookupEmailAccountTypes } from '@/lib/emailAccountLookup';
import { hashPassword } from '@/lib/security/password';
import { setUserSessionCookie } from '@/lib/security/session';
import { TRUECALLER_PHONE_EMAIL_DOMAIN } from '@/lib/auth/truecallerConfig';
import type { ParsedTruecallerIdentity } from '@/lib/auth/truecallerProfile';

const USER_PUBLIC_FIELDS =
  'id, fullName, email, favorites, searchHistory, createdAt, updatedAt, authProvider, avatarUrl, phone';

export type TruecallerSyncResult =
  | { success: true; userId: string; isNewUser: boolean }
  | { success: false; error: string; suggestedLoginPath?: string };

type SupabaseDb = ReturnType<typeof createClient>;

function syntheticEmail(phone: string) {
  return `${phone}@${TRUECALLER_PHONE_EMAIL_DOMAIN}`;
}

function isSyntheticEmail(email: string | null | undefined) {
  return Boolean(email?.toLowerCase().endsWith(`@${TRUECALLER_PHONE_EMAIL_DOMAIN}`));
}

/**
 * Truecaller does not verify the email on a profile, so it never identifies an account.
 * It is kept only when no FinderB user, business or admin already uses it.
 */
async function usableProfileEmail(
  db: SupabaseDb,
  identity: ParsedTruecallerIdentity,
): Promise<string | null> {
  const email = identity.email.toLowerCase().trim();
  if (!email || isSyntheticEmail(email)) return null;
  const types = await lookupEmailAccountTypes(db, email);
  return types.length ? null : email;
}

async function findUserId(
  db: SupabaseDb,
  column: 'truecallerUserId' | 'phone',
  value: string,
): Promise<{ id: string; email: string | null } | null> {
  const digits = value.replace(/\D/g, '').slice(-10);
  if (column === 'phone' && digits.length !== 10) return null;
  let query = db.from('User').select('id, email');
  query = column === 'phone' ? query.ilike('phone', `%${digits}`) : query.eq(column, value);
  const { data, error } = await query.order('createdAt', { ascending: true }).limit(1);
  if (error) throw error;
  const row = data?.[0] as { id?: string; email?: string | null } | undefined;
  return row?.id ? { id: row.id, email: row.email ?? null } : null;
}

export async function syncTruecallerUserToAppSession(
  identity: ParsedTruecallerIdentity,
  options: { setSession?: boolean; useServiceRole?: boolean } = {}
): Promise<TruecallerSyncResult> {
  const { setSession = false, useServiceRole = false } = options;
  const service = createServiceClient();

  if (useServiceRole && !service) {
    return {
      success: false,
      error:
        'Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it in Vercel environment variables.',
    };
  }

  const db = (service ?? createClient(await cookies())) as SupabaseDb;
  const phone = identity.phone;
  const now = new Date().toISOString();
  const authProvider = 'truecaller';

  // Same verified number (or Truecaller account) means the same person; merchants and admins
  // use the customer side like anyone else.
  const existing =
    (identity.truecallerUserId
      ? await findUserId(db, 'truecallerUserId', identity.truecallerUserId)
      : null) ?? (await findUserId(db, 'phone', phone));

  if (existing) {
    const updates: Record<string, unknown> = {
      fullName: identity.fullName,
      avatarUrl: identity.avatarUrl,
      authProvider,
      phone,
      truecallerUserId: identity.truecallerUserId,
      phoneVerified: true,
      updatedAt: now,
    };
    if (!existing.email || isSyntheticEmail(existing.email)) {
      updates.email = (await usableProfileEmail(db, identity)) ?? syntheticEmail(phone);
    }

    const { error } = await db.from('User').update(updates).eq('id', existing.id);
    if (error) {
      console.error('[truecaller] user update failed:', error);
      return { success: false, error: 'Could not link your Truecaller account. Please try again.' };
    }

    if (setSession) await setUserSessionCookie(existing.id);
    return { success: true, userId: existing.id, isNewUser: false };
  }

  const placeholderPassword = await hashPassword(crypto.randomUUID());
  const email = (await usableProfileEmail(db, identity)) ?? syntheticEmail(phone);

  const { data: created, error } = await db
    .from('User')
    .insert({
      id: crypto.randomUUID(),
      fullName: identity.fullName,
      email,
      password: placeholderPassword,
      authProvider,
      avatarUrl: identity.avatarUrl,
      phone,
      truecallerUserId: identity.truecallerUserId,
      phoneVerified: true,
      favorites: [],
      searchHistory: [],
      createdAt: now,
      updatedAt: now,
    })
    .select(USER_PUBLIC_FIELDS)
    .single();

  if (error || !created) {
    console.error('[truecaller] user create failed:', error);
    return { success: false, error: 'Could not create your FinderB account. Please try again.' };
  }

  if (setSession) await setUserSessionCookie(created.id);
  return { success: true, userId: created.id, isNewUser: true };
}
