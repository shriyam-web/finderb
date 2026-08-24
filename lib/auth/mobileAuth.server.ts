import 'server-only';

import { createClient } from '@/utils/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { cookies } from 'next/headers';
import {
  formatRegistrationConflictMessage,
  formatWrongPortalLoginMessage,
  getRegistrationConflict,
  getAlternateAccountType,
  LOGIN_PATHS,
  lookupEmailAccountTypes,
} from '@/lib/emailAccountLookup';
import {
  hashPassword,
  PASSWORD_MIN_LENGTH_USER,
  validatePasswordLength,
  verifyPassword,
} from '@/lib/security/password';
import { createMobileSessionToken } from '@/lib/auth/mobileToken';
import { syncOAuthUserToAppSession } from '@/lib/auth/syncOAuthUser.server';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';

export const MOBILE_USER_FIELDS =
  'id, fullName, email, favorites, searchHistory, createdAt, updatedAt, avatarUrl, authProvider';

export type MobileAuthUser = {
  id: string;
  fullName: string;
  email: string;
  favorites?: unknown;
  searchHistory?: unknown;
  createdAt?: string;
  updatedAt?: string;
  avatarUrl?: string | null;
  authProvider?: string | null;
};

export type MobileAuthSuccess = {
  success: true;
  token: string;
  user: MobileAuthUser;
  isNewUser?: boolean;
};

export type MobileAuthFailure = {
  success: false;
  error: string;
  suggestedLoginPath?: string;
  registeredAs?: string;
};

function dbClient() {
  return createServiceClient();
}

async function loadPublicUser(userId: string): Promise<MobileAuthUser | null> {
  const service = dbClient();
  const supabase = service ?? createClient(await cookies());
  const { data } = await supabase
    .from('User')
    .select(MOBILE_USER_FIELDS)
    .eq('id', userId)
    .maybeSingle();
  return (data as MobileAuthUser | null) ?? null;
}

export async function mobileLoginWithPassword(
  email: string,
  password: string
): Promise<MobileAuthSuccess | MobileAuthFailure> {
  if (!email || !password) {
    return { success: false, error: 'Email and password are required' };
  }

  const passwordCheck = validatePasswordLength(password, 1);
  if (!passwordCheck.ok) {
    return { success: false, error: passwordCheck.error || 'Invalid password' };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const supabase = dbClient() ?? createClient(await cookies());

  const { data: user, error } = await supabase
    .from('User')
    .select('id, password, authProvider')
    .eq('email', normalizedEmail)
    .single();

  if (error || !user) {
    if (error?.code === 'PGRST116' || !user) {
      const accountTypes = await lookupEmailAccountTypes(
        createClient(await cookies()),
        normalizedEmail
      );
      const alternateType = getAlternateAccountType(accountTypes, 'user');
      if (alternateType) {
        return {
          success: false,
          error: formatWrongPortalLoginMessage(alternateType, 'user'),
          suggestedLoginPath: LOGIN_PATHS[alternateType],
          registeredAs: alternateType,
        };
      }
      return { success: false, error: 'No User account found with this email.' };
    }
    return { success: false, error: 'Login failed. Please try again.' };
  }

  const verification = await verifyPassword(password, user.password);
  if (!verification.valid) {
    if (user.authProvider) {
      const providerLabel =
        user.authProvider === 'google'
          ? 'Google'
          : user.authProvider === 'truecaller'
            ? 'Truecaller'
            : user.authProvider.charAt(0).toUpperCase() + user.authProvider.slice(1);
      return {
        success: false,
        error: `This account uses ${providerLabel} sign-in. Please continue with ${providerLabel}.`,
      };
    }
    return { success: false, error: 'Incorrect password.' };
  }

  if (verification.needsRehash) {
    const hashedPassword = await hashPassword(password);
    await supabase
      .from('User')
      .update({ password: hashedPassword, updatedAt: new Date().toISOString() })
      .eq('id', user.id);
  }

  const publicUser = await loadPublicUser(user.id);
  if (!publicUser) {
    return { success: false, error: 'Could not load your account.' };
  }

  return {
    success: true,
    token: createMobileSessionToken(user.id),
    user: publicUser,
  };
}

export async function mobileRegisterWithPassword(formData: {
  fullName?: string;
  email?: string;
  password?: string;
}): Promise<MobileAuthSuccess | MobileAuthFailure> {
  if (!formData.fullName || !formData.email || !formData.password) {
    return { success: false, error: 'All fields are required' };
  }

  const passwordCheck = validatePasswordLength(
    formData.password,
    PASSWORD_MIN_LENGTH_USER
  );
  if (!passwordCheck.ok) {
    return { success: false, error: passwordCheck.error || 'Invalid password' };
  }

  const normalizedEmail = formData.email.toLowerCase().trim();
  const cookieClient = createClient(await cookies());
  const supabase = dbClient() ?? cookieClient;

  const existingAccount = await getRegistrationConflict(
    cookieClient,
    normalizedEmail,
    'user'
  );
  if (existingAccount) {
    return {
      success: false,
      error: formatRegistrationConflictMessage(existingAccount, 'user'),
      suggestedLoginPath: LOGIN_PATHS[existingAccount],
      registeredAs: existingAccount,
    };
  }

  const hashedPassword = await hashPassword(formData.password);
  const now = new Date().toISOString();
  const { data: user, error } = await supabase
    .from('User')
    .insert({
      id: crypto.randomUUID(),
      fullName: formData.fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      favorites: [],
      searchHistory: [],
      createdAt: now,
      updatedAt: now,
    })
    .select(MOBILE_USER_FIELDS)
    .single();

  if (error || !user) {
    if (error?.code === '23505') {
      return { success: false, error: 'This email already exists.' };
    }
    console.error('[mobile register]', error);
    return { success: false, error: 'Could not create your account. Please try again.' };
  }

  return {
    success: true,
    token: createMobileSessionToken(user.id),
    user: user as MobileAuthUser,
    isNewUser: true,
  };
}

export async function mobileLoginWithSupabaseAccessToken(
  accessToken: string
): Promise<MobileAuthSuccess | MobileAuthFailure> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return { success: false, error: 'Auth is not configured.' };
  }

  const supabaseAuth = createSupabaseJsClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabaseAuth.auth.getUser(accessToken);
  if (error || !data.user) {
    return { success: false, error: 'Google sign-in expired. Please try again.' };
  }

  const sync = await syncOAuthUserToAppSession(data.user, { setSession: false });
  if (!sync.success) {
    return {
      success: false,
      error: sync.error,
      suggestedLoginPath: sync.suggestedLoginPath,
    };
  }

  const publicUser = await loadPublicUser(sync.userId);
  if (!publicUser) {
    return { success: false, error: 'Could not load your account.' };
  }

  return {
    success: true,
    token: createMobileSessionToken(sync.userId),
    user: publicUser,
    isNewUser: sync.isNewUser,
  };
}

export async function mobileGetUserFromToken(
  token: string
): Promise<MobileAuthUser | null> {
  const { verifyMobileSessionToken } = await import('@/lib/auth/mobileToken');
  const userId = verifyMobileSessionToken(token);
  if (!userId) return null;
  return loadPublicUser(userId);
}

export async function mobileAuthSuccessForUserId(
  userId: string,
  isNewUser = false
): Promise<MobileAuthSuccess | MobileAuthFailure> {
  const publicUser = await loadPublicUser(userId);
  if (!publicUser) {
    return { success: false, error: 'Could not load your account.' };
  }
  return {
    success: true,
    token: createMobileSessionToken(userId),
    user: publicUser,
    isNewUser,
  };
}
