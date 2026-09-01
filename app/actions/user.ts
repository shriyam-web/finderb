'use server';

import { createClient } from '@/utils/supabase/server';
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
import {
  getSessionUserId,
  setUserSessionCookie,
} from '@/lib/security/session';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { deleteUserAccountById } from '@/lib/accountDeletion.server';

const USER_PUBLIC_FIELDS =
  'id, fullName, email, favorites, searchHistory, createdAt, updatedAt, avatarUrl';

function handleError(error: unknown, context: string): string {
  console.error(`${context} Error:`, error);

  const err = error as { message?: string; code?: string };
  const msg = err?.message || String(error) || 'An unexpected error occurred';

  if (err?.code === 'PGRST116') {
    return 'Record not found.';
  }

  if (err?.code === '23505') {
    if (msg.includes('email')) {
      return 'This email already exists.';
    }
    return 'Duplicate entry found.';
  }

  if (msg.includes('connect') || msg.includes('ECONNREFUSED') || msg.includes('timeout')) {
    return 'Database connection failed. Please check your configuration.';
  }

  return msg;
}

export async function registerUser(formData: { fullName?: string; email?: string; password?: string }) {
  const startTime = Date.now();

  try {
    if (!formData.fullName || !formData.email || !formData.password) {
      return { success: false, error: 'All fields are required' };
    }

    const passwordCheck = validatePasswordLength(formData.password, PASSWORD_MIN_LENGTH_USER);
    if (!passwordCheck.ok) {
      return { success: false, error: passwordCheck.error };
    }

    const normalizedEmail = formData.email.toLowerCase().trim();

    const ipLimit = await enforceRateLimit('register');
    if (!ipLimit.ok) return { success: false, error: ipLimit.error };

    const emailLimit = await enforceRateLimit('authEmail', `register:${normalizedEmail}`);
    if (!emailLimit.ok) return { success: false, error: emailLimit.error };

    const supabase = createClient(await cookies());

    const existingAccount = await getRegistrationConflict(supabase, normalizedEmail, 'user');
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
        fullName: formData.fullName,
        email: normalizedEmail,
        password: hashedPassword,
        favorites: [],
        searchHistory: [],
        createdAt: now,
        updatedAt: now,
      })
      .select(USER_PUBLIC_FIELDS)
      .single();

    if (error) {
      throw error;
    }

    await setUserSessionCookie(user.id);

    return { success: true, user };
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    console.error(`[USER REGISTER] Failed after ${duration}ms:`, error);
    return { success: false, error: handleError(error, 'User Registration') };
  }
}

export async function loginUser(email: string, password: string) {
  try {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    const passwordCheck = validatePasswordLength(password, 1);
    if (!passwordCheck.ok) {
      return { success: false, error: passwordCheck.error };
    }

    const normalizedEmail = email.toLowerCase().trim();

    const ipLimit = await enforceRateLimit('auth');
    if (!ipLimit.ok) return { success: false, error: ipLimit.error };

    const emailLimit = await enforceRateLimit('authEmail', `login:${normalizedEmail}`);
    if (!emailLimit.ok) return { success: false, error: emailLimit.error };

    const supabase = createClient(await cookies());

    const { data: user, error } = await supabase
      .from('User')
      .select('id, password, authProvider')
      .eq('email', normalizedEmail)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        const accountTypes = await lookupEmailAccountTypes(supabase, normalizedEmail);
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
      throw error;
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
          error: `This account uses ${providerLabel} sign-in. Please continue with ${providerLabel} above.`,
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

    await setUserSessionCookie(user.id);

    return { success: true, userId: user.id };
  } catch (error: unknown) {
    return { success: false, error: handleError(error, 'User Login') };
  }
}

export async function getUser(id: string) {
  try {
    if (!id) {
      return { success: false, error: 'User ID is required' };
    }

    const session = await getSessionUserId();
    if (!session || session !== id) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = createClient(await cookies());

    const { data: user, error } = await supabase
      .from('User')
      .select(USER_PUBLIC_FIELDS)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'User not found' };
      }
      throw error;
    }

    return { success: true, user };
  } catch (error: unknown) {
    return { success: false, error: handleError(error, 'Get User') };
  }
}

export async function logoutUser() {
  try {
    (await cookies()).delete('user_id');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to logout' };
  }
}

export async function getSession() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const result = await getUser(userId);
  if (!result.success || !result.user) return null;
  return { success: true, user: result.user };
}

export async function deleteOwnAccount() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false as const, error: 'Please sign in to delete your account.' };
    }

    const result = await deleteUserAccountById(userId);
    if (!result.success) return result;

    (await cookies()).delete('user_id');
    return { success: true as const };
  } catch (error: unknown) {
    return { success: false as const, error: handleError(error, 'Delete Account') };
  }
}
