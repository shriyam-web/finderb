import 'server-only';

import { createClient } from '@/utils/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { cookies } from 'next/headers';
import {
  formatWrongPortalLoginMessage,
  LOGIN_PATHS,
  lookupEmailAccountTypes,
} from '@/lib/emailAccountLookup';
import { hashPassword } from '@/lib/security/password';
import { setUserSessionCookie } from '@/lib/security/session';
import type { ParsedTruecallerIdentity } from '@/lib/auth/truecallerProfile';

const USER_PUBLIC_FIELDS =
  'id, fullName, email, favorites, searchHistory, createdAt, updatedAt, authProvider, avatarUrl, phone';

export type TruecallerSyncResult =
  | { success: true; userId: string; isNewUser: boolean }
  | { success: false; error: string; suggestedLoginPath?: string };

type SupabaseDb = ReturnType<typeof createClient>;

async function lookupMerchantByPhone(db: SupabaseDb, phone: string): Promise<boolean> {
  const { data } = await db.from('Business').select('id').eq('mobile', phone).maybeSingle();
  return Boolean(data);
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

  const cookieClient = useServiceRole ? null : createClient(await cookies());
  const db = useServiceRole ? service! : service ?? cookieClient!;
  const lookupClient = useServiceRole ? service! : cookieClient!;

  const email = identity.email.toLowerCase().trim();
  const phone = identity.phone;

  const merchantExists = await lookupMerchantByPhone(db, phone);
  if (merchantExists) {
    const accountTypes = await lookupEmailAccountTypes(lookupClient, email);
    const hasUserAccount = accountTypes.includes('user');
    if (!hasUserAccount) {
      return {
        success: false,
        error: formatWrongPortalLoginMessage('merchant', 'user'),
        suggestedLoginPath: LOGIN_PATHS.merchant,
      };
    }
  }

  const accountTypes = await lookupEmailAccountTypes(lookupClient, email);
  const hasUserAccount = accountTypes.includes('user');
  const alternateType = accountTypes.find((type) => type !== 'user');

  if (alternateType && !hasUserAccount) {
    return {
      success: false,
      error: formatWrongPortalLoginMessage(alternateType, 'user'),
      suggestedLoginPath: LOGIN_PATHS[alternateType],
    };
  }

  const now = new Date().toISOString();
  const authProvider = 'truecaller';

  if (identity.truecallerUserId) {
    const { data: existingByTcId } = await db
      .from('User')
      .select('id')
      .eq('truecallerUserId', identity.truecallerUserId)
      .maybeSingle();

    if (existingByTcId?.id) {
      const { error } = await db
        .from('User')
        .update({
          fullName: identity.fullName,
          avatarUrl: identity.avatarUrl,
          authProvider,
          phone,
          email,
          updatedAt: now,
        })
        .eq('id', existingByTcId.id);

      if (error) {
        console.error('[truecaller] user update by tc id failed:', error);
        return { success: false, error: 'Could not link your Truecaller account. Please try again.' };
      }

      if (setSession) await setUserSessionCookie(existingByTcId.id);
      return { success: true, userId: existingByTcId.id, isNewUser: false };
    }
  }

  const { data: existingByPhone } = await db
    .from('User')
    .select('id')
    .eq('phone', phone)
    .maybeSingle();

  if (existingByPhone?.id) {
    const { error } = await db
      .from('User')
      .update({
        fullName: identity.fullName,
        avatarUrl: identity.avatarUrl,
        authProvider,
        truecallerUserId: identity.truecallerUserId,
        email,
        updatedAt: now,
      })
      .eq('id', existingByPhone.id);

    if (error) {
      console.error('[truecaller] user update by phone failed:', error);
      return { success: false, error: 'Could not link your Truecaller account. Please try again.' };
    }

    if (setSession) await setUserSessionCookie(existingByPhone.id);
    return { success: true, userId: existingByPhone.id, isNewUser: false };
  }

  const { data: existingByEmail } = await db
    .from('User')
    .select('id, authProvider')
    .eq('email', email)
    .maybeSingle();

  if (existingByEmail?.id) {
    const { error } = await db
      .from('User')
      .update({
        fullName: identity.fullName,
        avatarUrl: identity.avatarUrl,
        authProvider,
        phone,
        truecallerUserId: identity.truecallerUserId,
        updatedAt: now,
      })
      .eq('id', existingByEmail.id);

    if (error) {
      console.error('[truecaller] user update by email failed:', error);
      return { success: false, error: 'Could not link your Truecaller account. Please try again.' };
    }

    if (setSession) await setUserSessionCookie(existingByEmail.id);
    return { success: true, userId: existingByEmail.id, isNewUser: false };
  }

  const placeholderPassword = await hashPassword(crypto.randomUUID());

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
