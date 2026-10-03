import 'server-only';

import { consumeOtpChallenge, discardOtpChallenge, issueOtpChallenge } from '@/lib/auth/otpChallenge.server';
import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import {
  hashPassword,
  PASSWORD_MIN_LENGTH_USER,
  validatePasswordLength,
} from '@/lib/security/password';
import { sendPasswordResetEmail } from '@/lib/email/sendPasswordResetEmail';
import { SITE_ORIGIN } from '@/lib/siteSeo';

const PASSWORD_RESET_PURPOSE = 'password-reset';
const GENERIC_OK =
  'If an account exists for this email, we sent a reset code.';

type ResetNext = 'code' | 'oauth' | 'none';

export type PasswordResetRequestResult = {
  success: true;
  message: string;
  next: ResetNext;
  provider?: string;
};

export type PasswordResetFailure = {
  success: false;
  error: string;
};

function dbClient() {
  return createServiceClient();
}

function providerLabel(provider: string): string {
  if (provider === 'google') return 'Google';
  if (provider === 'truecaller') return 'Truecaller';
  if (provider === 'apple') return 'Apple';
  if (provider === 'github') return 'GitHub';
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

export async function requestPasswordReset(
  email: string
): Promise<PasswordResetRequestResult | PasswordResetFailure> {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const supabase = dbClient() ?? createClient(await cookies());
  const { data: user } = await supabase
    .from('User')
    .select('id, email, authProvider')
    .eq('email', normalized)
    .maybeSingle();

  if (!user) {
    return { success: true, message: GENERIC_OK, next: 'none' };
  }

  const provider = String(user.authProvider || '').trim().toLowerCase();
  if (provider && provider !== 'email' && provider !== 'password') {
    return {
      success: true,
      message: `This account uses ${providerLabel(provider)}. Sign in with ${providerLabel(provider)} instead of a password.`,
      next: 'oauth',
      provider,
    };
  }

  let code = '';
  try {
    code = await issueOtpChallenge(PASSWORD_RESET_PURPOSE, normalized);
  } catch (error) {
    console.error('[password-reset] could not store code', error);
    return { success: false, error: 'Could not send a reset code. Please try again.' };
  }
  const resetUrl = `${SITE_ORIGIN}/reset-password?email=${encodeURIComponent(normalized)}`;
  const sent = await sendPasswordResetEmail(normalized, code, resetUrl);

  if (!sent) {
    await discardOtpChallenge(PASSWORD_RESET_PURPOSE, normalized);
    console.warn('[password-reset] Email was not sent');
  }

  return {
    success: true,
    message:
      'We sent a 6-digit code to your email. It expires in 15 minutes.',
    next: 'code',
  };
}

export async function completePasswordReset(input: {
  email: string;
  code: string;
  password: string;
}): Promise<{ success: true } | PasswordResetFailure> {
  const email = String(input.email || '').trim().toLowerCase();
  const password = String(input.password || '');
  const code = String(input.code || '').trim();

  if (!email || !email.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const passwordCheck = validatePasswordLength(password, PASSWORD_MIN_LENGTH_USER);
  if (!passwordCheck.ok) {
    return { success: false, error: passwordCheck.error || 'Invalid password' };
  }

  if (!(await consumeOtpChallenge(PASSWORD_RESET_PURPOSE, email, code))) {
    return {
      success: false,
      error: 'That code is invalid or expired. Request a new one.',
    };
  }

  const supabase = dbClient() ?? createClient(await cookies());
  const { data: user } = await supabase
    .from('User')
    .select('id, authProvider')
    .eq('email', email)
    .maybeSingle();

  if (!user) {
    return { success: false, error: 'That code is invalid or expired. Request a new one.' };
  }

  const provider = String(user.authProvider || '').trim().toLowerCase();
  if (provider && provider !== 'email' && provider !== 'password') {
    return {
      success: false,
      error: `This account uses ${providerLabel(provider)}. Sign in with ${providerLabel(provider)} instead.`,
    };
  }

  const hashed = await hashPassword(password);
  const { error } = await supabase
    .from('User')
    .update({ password: hashed, updatedAt: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    console.error('[password-reset] update failed', error);
    return { success: false, error: 'Could not update your password. Please try again.' };
  }

  return { success: true };
}
