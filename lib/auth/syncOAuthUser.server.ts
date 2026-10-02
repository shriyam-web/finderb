import 'server-only';

import { createClient } from '@/utils/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { cookies } from 'next/headers';
import { hashPassword } from '@/lib/security/password';
import { escapeIlikePattern } from '@/lib/searchMatch';
import { setUserSessionCookie } from '@/lib/security/session';

const USER_PUBLIC_FIELDS =
  'id, fullName, email, favorites, searchHistory, createdAt, updatedAt, authProvider, avatarUrl';

export type OAuthSyncResult =
  | { success: true; userId: string; isNewUser: boolean }
  | { success: false; error: string; suggestedLoginPath?: string };

type SupabaseAuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
};

function resolveDisplayName(user: SupabaseAuthUser, email: string): string {
  const meta = user.user_metadata ?? {};
  const candidates = [
    meta.full_name,
    meta.name,
    meta.user_name,
    meta.preferred_username,
  ];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim().length >= 2) {
      return value.trim();
    }
  }
  const local = email.split('@')[0]?.replace(/[._-]+/g, ' ').trim();
  return local ? local.charAt(0).toUpperCase() + local.slice(1) : 'FinderB User';
}

function resolveAvatarUrl(user: SupabaseAuthUser): string | null {
  const meta = user.user_metadata ?? {};
  const url = meta.avatar_url ?? meta.picture;
  return typeof url === 'string' && url.startsWith('http') ? url : null;
}

function resolveProvider(user: SupabaseAuthUser): string {
  const provider = user.app_metadata?.provider;
  return typeof provider === 'string' ? provider : 'oauth';
}

export async function syncOAuthUserToAppSession(
  authUser: SupabaseAuthUser,
  options?: { setSession?: boolean }
): Promise<OAuthSyncResult> {
  const setSession = options?.setSession !== false;
  const email = authUser.email?.toLowerCase().trim();
  if (!email) {
    return { success: false, error: 'Your sign-in provider did not share an email address.' };
  }

  // Merchants and FinderB admins may use the customer side with the same verified email;
  // a User row grants no merchant or admin rights by itself.
  const service = createServiceClient();
  const db = service ?? createClient(await cookies());

  const now = new Date().toISOString();
  const fullName = resolveDisplayName(authUser, email);
  const avatarUrl = resolveAvatarUrl(authUser);
  const authProvider = resolveProvider(authUser);

  const { data: byAuthIdRows } = await db
    .from('User')
    .select('id')
    .eq('supabaseAuthId', authUser.id)
    .order('createdAt', { ascending: true })
    .limit(1);
  const existingByAuthId = byAuthIdRows?.[0];

  if (existingByAuthId?.id) {
    await db
      .from('User')
      .update({
        fullName,
        avatarUrl,
        authProvider,
        updatedAt: now,
      })
      .eq('id', existingByAuthId.id);

    if (setSession) await setUserSessionCookie(existingByAuthId.id);
    return { success: true, userId: existingByAuthId.id, isNewUser: false };
  }

  const { data: byEmailRows } = await db
    .from('User')
    .select('id, supabaseAuthId')
    .ilike('email', escapeIlikePattern(email))
    .order('createdAt', { ascending: true })
    .limit(1);
  const existingByEmail = byEmailRows?.[0];

  if (existingByEmail?.id) {
    await db
      .from('User')
      .update({
        fullName,
        avatarUrl,
        authProvider,
        supabaseAuthId: authUser.id,
        updatedAt: now,
      })
      .eq('id', existingByEmail.id);

    if (setSession) await setUserSessionCookie(existingByEmail.id);
    return { success: true, userId: existingByEmail.id, isNewUser: false };
  }

  const placeholderPassword = await hashPassword(crypto.randomUUID());

  const { data: created, error } = await db
    .from('User')
    .insert({
      id: crypto.randomUUID(),
      fullName,
      email,
      password: placeholderPassword,
      authProvider,
      avatarUrl,
      supabaseAuthId: authUser.id,
      favorites: [],
      searchHistory: [],
      createdAt: now,
      updatedAt: now,
    })
    .select(USER_PUBLIC_FIELDS)
    .single();

  if (error || !created) {
    console.error('[oauth] user create failed:', error);
    return { success: false, error: 'Could not create your FinderB account. Please try again.' };
  }

  if (setSession) await setUserSessionCookie(created.id);
  return { success: true, userId: created.id, isNewUser: true };
}
