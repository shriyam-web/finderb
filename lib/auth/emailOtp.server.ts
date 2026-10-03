import 'server-only';

import { createHmac, timingSafeEqual } from 'crypto';
import { sendEmailOtpEmail } from '@/lib/email/sendEmailOtp';
import { REGISTRATION_EMAIL_REGEX } from '@/lib/merchantRegistrationValidation';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import {
  formatRegistrationConflictMessage,
  getRegistrationConflict,
  LOGIN_PATHS,
} from '@/lib/emailAccountLookup';

const OTP_WINDOW_MS = 15 * 60 * 1000;
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

function windowIndex(at = Date.now()): number {
  return Math.floor(at / OTP_WINDOW_MS);
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

function otpFor(purpose: string, email: string, window: number): string {
  const hmac = createHmac('sha256', otpSecret())
    .update(`email-otp:${purpose}:${email}:${window}`)
    .digest('hex');
  const n = parseInt(hmac.slice(0, 8), 16) % 1_000_000;
  return String(n).padStart(6, '0');
}

export function verifyEmailOtpCode(
  purpose: string,
  email: string,
  code: string,
): boolean {
  const normalized = normalizeEmail(email);
  const digits = String(code || '').replace(/\D/g, '');
  if (digits.length !== 6) return false;
  const current = windowIndex();
  return (
    codesMatch(digits, otpFor(purpose, normalized, current)) ||
    codesMatch(digits, otpFor(purpose, normalized, current - 1))
  );
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

export function isMerchantEmailOtpConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function assertEmailVerificationProof(
  purpose: string,
  email: string,
  token: string | null | undefined,
): { ok: true } | { ok: false; error: string } {
  // Until Resend is configured, do not block merchant registration on email OTP.
  if (!isMerchantEmailOtpConfigured()) {
    return { ok: true };
  }

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
    const [payload, sig] = decoded.split('.');
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
  if (existingAccount) {
    return {
      success: false,
      error: formatRegistrationConflictMessage(existingAccount, 'merchant'),
      suggestedLoginPath: LOGIN_PATHS[existingAccount],
      registeredAs: existingAccount,
    };
  }

  if (!process.env.RESEND_API_KEY?.trim()) {
    return {
      success: false,
      error:
        'Email OTP is not configured yet. Add RESEND_API_KEY on the server and try again.',
    };
  }

  const code = otpFor(
    MERCHANT_REGISTER_EMAIL_PURPOSE,
    normalized,
    windowIndex(),
  );
  const sent = await sendEmailOtpEmail(normalized, code, 'registration');
  if (!sent) {
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

  if (!verifyEmailOtpCode(MERCHANT_REGISTER_EMAIL_PURPOSE, normalized, code)) {
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
  kind: 'registration' | 'account',
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
  if (existingAccount) {
    return {
      success: false,
      error: formatRegistrationConflictMessage(existingAccount, registeringAs),
      suggestedLoginPath: LOGIN_PATHS[existingAccount],
      registeredAs: existingAccount,
    };
  }

  if (!process.env.RESEND_API_KEY?.trim()) {
    return {
      success: false,
      error: 'Email OTP is not configured yet. Add RESEND_API_KEY on the server and try again.',
    };
  }

  const code = otpFor(purpose, normalized, windowIndex());
  const sent = await sendEmailOtpEmail(normalized, code, kind);
  if (!sent) {
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

  if (!verifyEmailOtpCode(purpose, normalized, code)) {
    return { success: false, error: 'Invalid or expired code. Check the email and try again.' };
  }

  return {
    success: true,
    emailVerificationToken: issueEmailVerificationProof(purpose, normalized),
    message: 'Email verified successfully.',
  };
}

export function requestUserEmailOtp(email: string) {
  return requestPurposeEmailOtp(USER_EMAIL_PURPOSE, email, 'user', 'account');
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
