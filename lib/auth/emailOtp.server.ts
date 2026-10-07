import 'server-only';

import { createHmac, timingSafeEqual } from 'crypto';
import {
  consumeOtpChallenge,
  discardOtpChallenge,
  issueOtpChallenge,
  otpIssueErrorMessage,
} from '@/lib/auth/otpChallenge.server';
import { sendEmailOtpEmail } from '@/lib/email/sendEmailOtp';
import { REGISTRATION_EMAIL_REGEX } from '@/lib/merchantRegistrationValidation';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { getRegistrationConflict, registrationConflictFailure } from '@/lib/emailAccountLookup';

const PROOF_TTL_MS = 45 * 60 * 1000;
export const MERCHANT_REGISTER_EMAIL_PURPOSE = 'merchant-register';
export const USER_EMAIL_PURPOSE = 'user-email';
export const MERCHANT_EMAIL_UPDATE_PURPOSE = 'merchant-email-update';

function otpSecret(): string {
  const secret =
    process.env.PASSWORD_RESET_SECRET?.trim() ||
    process.env.MOBILE_SESSION_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!secret) {
    throw new Error('Missing secret for email OTP signing');
  }
  return secret;
}

function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

function codesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function issueEmailVerificationProof(
  purpose: string,
  email: string,
): string {
  const normalized = normalizeEmail(email);
  const exp = Date.now() + PROOF_TTL_MS;
  const payload = `${purpose}:${normalized}:${exp}`;
  const sig = createHmac('sha256', otpSecret())
    .update(`email-proof:${payload}`)
    .digest('hex');
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

export function assertEmailVerificationProof(
  purpose: string,
  email: string,
  token: string | null | undefined,
): { ok: true } | { ok: false; error: string } {
  const normalized = normalizeEmail(email);
  const raw = String(token || '').trim();
  if (!raw) {
    return {
      ok: false,
      error: 'Please verify your email with the OTP before registering.',
    };
  }

  try {
    const decoded = Buffer.from(raw, 'base64url').toString('utf8');
    const dot = decoded.lastIndexOf('.');
    const payload = dot > 0 ? decoded.slice(0, dot) : '';
    const sig = dot > 0 ? decoded.slice(dot + 1) : '';
    if (!payload || !sig) {
      return { ok: false, error: 'Email verification expired. Request a new code.' };
    }
    const expected = createHmac('sha256', otpSecret())
      .update(`email-proof:${payload}`)
      .digest('hex');
    if (!codesMatch(sig, expected)) {
      return { ok: false, error: 'Email verification invalid. Request a new code.' };
    }
    const [tokenPurpose, tokenEmail, expRaw] = payload.split(':');
    const exp = Number(expRaw);
    if (
      tokenPurpose !== purpose ||
      tokenEmail !== normalized ||
      !Number.isFinite(exp) ||
      Date.now() > exp
    ) {
      return {
        ok: false,
        error: 'Email verification expired. Please verify your email again.',
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Email verification invalid. Request a new code.' };
  }
}

export type RequestEmailOtpResult =
  | { success: true; message: string }
  | {
      success: false;
      error: string;
      suggestedLoginPath?: string;
      registeredAs?: string;
    };

export async function requestMerchantRegisterEmailOtp(
  email: string,
): Promise<RequestEmailOtpResult> {
  const normalized = normalizeEmail(email);
  if (!normalized || !REGISTRATION_EMAIL_REGEX.test(normalized)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const ipLimit = await enforceRateLimit('register', 'email-otp-send');
  if (!ipLimit.ok) return { success: false, error: ipLimit.error };

  const emailLimit = await enforceRateLimit('authEmail', `email-otp:${normalized}`);
  if (!emailLimit.ok) return { success: false, error: emailLimit.error };

  const supabase = createClient(await cookies());
  const existingAccount = await getRegistrationConflict(
    supabase,
    normalized,
    'merchant',
  );
  if (existingAccount) return registrationConflictFailure(existingAccount, 'merchant');

  if (!process.env.RESEND_API_KEY?.trim()) {
    return {
      success: false,
      error:
        'Email OTP is not configured yet. Add RESEND_API_KEY on the server and try again.',
    };
  }

  let code = '';
  try {
    code = await issueOtpChallenge(MERCHANT_REGISTER_EMAIL_PURPOSE, normalized);
  } catch (error) {
    return {
      success: false,
      error: otpIssueErrorMessage(error, 'Could not prepare the verification code. Please try again shortly.'),
    };
  }
  const sent = await sendEmailOtpEmail(normalized, code, 'registration');
  if (!sent) {
    await discardOtpChallenge(MERCHANT_REGISTER_EMAIL_PURPOSE, normalized);
    return {
      success: false,
      error: 'Could not send the verification email. Please try again shortly.',
    };
  }

  return {
    success: true,
    message: 'We sent a 6-digit code to your email. It expires in 15 minutes.',
  };
}

export type VerifyEmailOtpResult =
  | { success: true; emailVerificationToken: string; message: string }
  | { success: false; error: string };

export async function verifyMerchantRegisterEmailOtp(
  email: string,
  code: string,
): Promise<VerifyEmailOtpResult> {
  const normalized = normalizeEmail(email);
  if (!normalized || !REGISTRATION_EMAIL_REGEX.test(normalized)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const verifyLimit = await enforceRateLimit('authEmail', `email-otp-verify:${normalized}`);
  if (!verifyLimit.ok) return { success: false, error: verifyLimit.error };

  if (!(await consumeOtpChallenge(MERCHANT_REGISTER_EMAIL_PURPOSE, normalized, code))) {
    return {
      success: false,
      error: 'Invalid or expired code. Check the email and try again.',
    };
  }

  const emailVerificationToken = issueEmailVerificationProof(
    MERCHANT_REGISTER_EMAIL_PURPOSE,
    normalized,
  );

  return {
    success: true,
    emailVerificationToken,
    message: 'Email verified successfully.',
  };
}

async function requestPurposeEmailOtp(
  purpose: string,
  email: string,
  registeringAs: 'user' | 'merchant',
  kind: 'registration' | 'account' | 'user',
): Promise<RequestEmailOtpResult> {
  const normalized = normalizeEmail(email);
  if (!normalized || !REGISTRATION_EMAIL_REGEX.test(normalized)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const ipLimit = await enforceRateLimit('auth', `email-otp-send:${purpose}`);
  if (!ipLimit.ok) return { success: false, error: ipLimit.error };

  const emailLimit = await enforceRateLimit('authEmail', `email-otp:${purpose}:${normalized}`);
  if (!emailLimit.ok) return { success: false, error: emailLimit.error };

  const supabase = createClient(await cookies());
  const existingAccount = await getRegistrationConflict(supabase, normalized, registeringAs);
  if (existingAccount) return registrationConflictFailure(existingAccount, registeringAs);

  if (!process.env.RESEND_API_KEY?.trim()) {
    return {
      success: false,
      error: 'Email OTP is not configured yet. Add RESEND_API_KEY on the server and try again.',
    };
  }

  let code = '';
  try {
    code = await issueOtpChallenge(purpose, normalized);
  } catch (error) {
    return {
      success: false,
      error: otpIssueErrorMessage(error, 'Could not prepare the verification code. Please try again shortly.'),
    };
  }
  const sent = await sendEmailOtpEmail(normalized, code, kind);
  if (!sent) {
    await discardOtpChallenge(purpose, normalized);
    return { success: false, error: 'Could not send the verification email. Please try again shortly.' };
  }

  return {
    success: true,
    message: 'We sent a 6-digit code to your email. It expires in 15 minutes.',
  };
}

async function verifyPurposeEmailOtp(
  purpose: string,
  email: string,
  code: string,
): Promise<VerifyEmailOtpResult> {
  const normalized = normalizeEmail(email);
  if (!normalized || !REGISTRATION_EMAIL_REGEX.test(normalized)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const verifyLimit = await enforceRateLimit('authEmail', `email-otp-verify:${purpose}:${normalized}`);
  if (!verifyLimit.ok) return { success: false, error: verifyLimit.error };

  if (!(await consumeOtpChallenge(purpose, normalized, code))) {
    return { success: false, error: 'Invalid or expired code. Check the email and try again.' };
  }

  return {
    success: true,
    emailVerificationToken: issueEmailVerificationProof(purpose, normalized),
    message: 'Email verified successfully.',
  };
}

export function requestUserEmailOtp(email: string) {
  return requestPurposeEmailOtp(USER_EMAIL_PURPOSE, email, 'user', 'user');
}

export function verifyUserEmailOtp(email: string, code: string) {
  return verifyPurposeEmailOtp(USER_EMAIL_PURPOSE, email, code);
}

export function requestMerchantEmailUpdateOtp(email: string) {
  return requestPurposeEmailOtp(MERCHANT_EMAIL_UPDATE_PURPOSE, email, 'merchant', 'account');
}

export function verifyMerchantEmailUpdateOtp(email: string, code: string) {
  return verifyPurposeEmailOtp(MERCHANT_EMAIL_UPDATE_PURPOSE, email, code);
}
