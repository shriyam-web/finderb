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
  'id, fullName, email, favorites, searchHistory, createdAt, updatedAt, avatarUrl, authProvider, phone';

export type MobileAuthUser = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  favorites?: unknown;
  searchHistory?: unknown;
  createdAt?: string;
  updatedAt?: string;
  avatarUrl?: string | null;
  authProvider?: string | null;
  /** True when this login is linked to a Business row (merchant credentials / email). */
  isBusinessAccount?: boolean;
  businessId?: string | null;
  businessName?: string | null;
  businessSlug?: string | null;
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
  if (!data) return null;
  return enrichWithBusinessLink(data as MobileAuthUser);
}

async function enrichWithBusinessLink(user: MobileAuthUser): Promise<MobileAuthUser> {
  const email = user.email?.toLowerCase().trim();
  if (!email) return { ...user, isBusinessAccount: false };

  const service = dbClient();
  const supabase = service ?? createClient(await cookies());
  const { data: rows } = await supabase
    .from('Business')
    .select('id, businessName, slug, workEmail, email')
    .or(`workEmail.eq.${email},email.eq.${email}`)
    .limit(1);

  const business = rows?.[0] as
    | {
        id: string;
        businessName?: string | null;
        slug?: string | null;
      }
    | undefined;

  if (!business?.id) {
    return { ...user, isBusinessAccount: false, businessId: null, businessName: null, businessSlug: null };
  }

  return {
    ...user,
    isBusinessAccount: true,
    businessId: business.id,
    businessName: business.businessName || null,
    businessSlug: business.slug || null,
  };
}

/** Create or reuse a consumer User row for a merchant so they can use the app. */
async function ensureUserFromMerchantEmail(
  email: string,
  password: string,
  extras?: { fullName?: string | null; phone?: string | null; avatarUrl?: string | null }
): Promise<MobileAuthUser | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const service = dbClient();
  const supabase = service ?? createClient(await cookies());

  const { data: businesses } = await supabase
    .from('Business')
    .select('id, password, businessName, mobile, profilePictureUrl, workEmail, email')
    .or(`workEmail.eq.${normalizedEmail},email.eq.${normalizedEmail}`)
    .limit(8);

  const rows = (businesses || []) as Array<{
    id: string;
    password: string;
    businessName?: string | null;
    mobile?: string | null;
    profilePictureUrl?: string | null;
  }>;

  let matched: (typeof rows)[number] | null = null;
  for (const row of rows) {
    const verification = await verifyPassword(password, row.password);
    if (verification.valid) {
      matched = row;
      break;
    }
  }
  if (!matched) return null;

  const hashedPassword = await hashPassword(password);
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from('User')
    .select(MOBILE_USER_FIELDS)
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('User')
      .update({
        password: hashedPassword,
        phone: extras?.phone || matched.mobile || (existing as MobileAuthUser).phone || null,
        avatarUrl:
          extras?.avatarUrl ||
          matched.profilePictureUrl ||
          (existing as MobileAuthUser).avatarUrl ||
          null,
        updatedAt: now,
      })
      .eq('id', (existing as MobileAuthUser).id);
    const refreshed = await loadPublicUser((existing as MobileAuthUser).id);
    return refreshed;
  }

  const fullName =
    (extras?.fullName || matched.businessName || normalizedEmail.split('@')[0] || 'FinderB User').trim();

  const { data: created, error } = await supabase
    .from('User')
    .insert({
      id: crypto.randomUUID(),
      fullName,
      email: normalizedEmail,
      password: hashedPassword,
      phone: extras?.phone || matched.mobile || null,
      avatarUrl: extras?.avatarUrl || matched.profilePictureUrl || null,
      authProvider: 'password',
      favorites: [],
      searchHistory: [],
      createdAt: now,
      updatedAt: now,
    })
    .select(MOBILE_USER_FIELDS)
    .single();

  if (error || !created) {
    console.error('[mobile] ensureUserFromMerchantEmail', error);
    return null;
  }

  return enrichWithBusinessLink(created as MobileAuthUser);
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
  const service = dbClient();
  const supabase = service ?? createClient(await cookies());

  const { data: user, error } = await supabase
    .from('User')
    .select('id, password, authProvider')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (user && !error) {
    const verification = await verifyPassword(password, user.password);
    if (verification.valid) {
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

    // Consumer password failed — accept Business password and sync the User row.
    const linked = await ensureUserFromMerchantEmail(normalizedEmail, password);
    if (linked) {
      return {
        success: true,
        token: createMobileSessionToken(linked.id),
        user: linked,
        isNewUser: false,
      };
    }

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

  // No User row — try merchant bridge, then classify remaining failures.
  const linked = await ensureUserFromMerchantEmail(normalizedEmail, password);
  if (linked) {
    return {
      success: true,
      token: createMobileSessionToken(linked.id),
      user: linked,
      isNewUser: false,
    };
  }

  const accountTypes = await lookupEmailAccountTypes(supabase, normalizedEmail);
  const alternateType = getAlternateAccountType(accountTypes, 'user');
  if (alternateType === 'merchant') {
    return { success: false, error: 'Incorrect password.' };
  }
  if (alternateType === 'admin') {
    return {
      success: false,
      error: formatWrongPortalLoginMessage(alternateType, 'user'),
      suggestedLoginPath: LOGIN_PATHS[alternateType],
      registeredAs: alternateType,
    };
  }
  return { success: false, error: 'No account found with this email.' };
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

export async function mobileUpdateProfile(
  userId: string,
  patch: {
    fullName?: string;
    email?: string;
    phone?: string;
    avatarUrl?: string | null;
  }
): Promise<MobileAuthSuccess | MobileAuthFailure> {
  const service = dbClient();
  const supabase = service ?? createClient(await cookies());

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (typeof patch.fullName === 'string') {
    const name = patch.fullName.trim();
    if (name.length < 2) {
      return { success: false, error: 'Name must be at least 2 characters.' };
    }
    updates.fullName = name;
  }

  if (typeof patch.email === 'string') {
    const email = patch.email.toLowerCase().trim();
    if (!email.includes('@')) {
      return { success: false, error: 'Enter a valid email address.' };
    }
    const { data: clash } = await supabase
      .from('User')
      .select('id')
      .eq('email', email)
      .neq('id', userId)
      .maybeSingle();
    if (clash?.id) {
      return { success: false, error: 'That email is already used by another account.' };
    }
    updates.email = email;
  }

  if (typeof patch.phone === 'string') {
    const phone = patch.phone.replace(/[^\d+]/g, '').trim();
    if (phone && phone.length < 8) {
      return { success: false, error: 'Enter a valid phone number.' };
    }
    updates.phone = phone || null;
  }

  if (patch.avatarUrl !== undefined) {
    updates.avatarUrl = patch.avatarUrl;
  }

  const { error } = await supabase.from('User').update(updates).eq('id', userId);
  if (error) {
    console.error('[mobile profile]', error);
    return { success: false, error: 'Could not update your profile.' };
  }

  return mobileAuthSuccessForUserId(userId, false);
}
