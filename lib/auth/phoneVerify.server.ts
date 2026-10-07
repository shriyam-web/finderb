import 'server-only';

import { createHmac, timingSafeEqual } from 'crypto';
import {
  consumeOtpChallenge,
  discardOtpChallenge,
  issueOtpChallenge,
  otpSecret,
} from '@/lib/auth/otpChallenge.server';
import {
  buildTruecallerDeepLink,
  isTruecallerEnabled,
  isValidTruecallerRequestId,
} from '@/lib/auth/truecallerConfig';
import {
  createTruecallerAuthRequest,
  getTruecallerAuthRequest,
} from '@/lib/auth/truecallerPendingStore.server';
import { extractIndianMobileDigits, isValidIndianMobileDigits } from '@/lib/indianPhone';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { createServiceClient } from '@/lib/supabase/service';
import { sendWhatsAppOtp } from '@/lib/whatsapp/sendWhatsAppOtp';

/**
 * A new profile mobile number is saved only with a proof that the user owns it,
 * from either a WhatsApp code or Truecaller.
 */

const PROOF_TTL_MS = 30 * 60 * 1000;
const TRUECALLER_PATH_PREFIX = 'phone-verify:';

type Failure = { success: false; error: string };
export type PhoneVerified = {
  success: true;
  phone: string;
  phoneVerificationToken: string;
  message: string;
};

function purposeFor(userId: string) {
  return `phone-verify:${userId}`;
}

function sign(payload: string) {
  return createHmac('sha256', otpSecret()).update(`phone-proof:${payload}`).digest('hex');
}

export function issuePhoneProof(userId: string, phone: string): string {
  const payload = `${userId}:${phone}:${Date.now() + PROOF_TTL_MS}`;
  return Buffer.from(`${payload}.${sign(payload)}`).toString('base64url');
}

export function assertPhoneProof(
  userId: string,
  phone: string,
  token: string | null | undefined,
): { ok: true } | { ok: false; error: string } {
  const raw = String(token || '').trim();
  if (!raw) {
    return {
      ok: false,
      error: 'Verify this mobile number with WhatsApp or Truecaller before saving it.',
    };
  }
  try {
    const decoded = Buffer.from(raw, 'base64url').toString('utf8');
    const dot = decoded.lastIndexOf('.');
    const payload = dot > 0 ? decoded.slice(0, dot) : '';
    const sig = Buffer.from(dot > 0 ? decoded.slice(dot + 1) : '');
    const expected = Buffer.from(sign(payload));
    if (!payload || sig.length !== expected.length || !timingSafeEqual(sig, expected)) {
      return { ok: false, error: 'Mobile verification is invalid. Please verify the number again.' };
    }
    const [tokenUser, tokenPhone, expRaw] = payload.split(':');
    const exp = Number(expRaw);
    if (tokenUser !== userId || tokenPhone !== phone) {
      return { ok: false, error: 'Verify this mobile number with WhatsApp or Truecaller before saving it.' };
    }
    if (!Number.isFinite(exp) || Date.now() > exp) {
      return { ok: false, error: 'Mobile verification expired. Please verify the number again.' };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Mobile verification is invalid. Please verify the number again.' };
  }
}

async function usedByAnotherUser(userId: string, phone: string): Promise<boolean> {
  const client = createServiceClient();
  if (!client) return false;
  const { data } = await client
    .from('User')
    .select('id')
    .eq('phone', phone)
    .neq('id', userId)
    .limit(1);
  return Boolean(data?.length);
}

const TAKEN_ERROR = 'This mobile number is already linked to another FinderB account.';

function parsePhone(raw: unknown): string | null {
  const phone = extractIndianMobileDigits(raw);
  return isValidIndianMobileDigits(phone) ? phone : null;
}

export async function requestPhoneVerifyCode(
  userId: string,
  rawPhone: unknown,
): Promise<{ success: true; message: string } | Failure> {
  const phone = parsePhone(rawPhone);
  if (!phone) return { success: false, error: 'Enter a 10-digit Indian mobile number.' };

  const ipLimit = await enforceRateLimit('auth', 'phone-verify-send');
  if (!ipLimit.ok) return { success: false, error: ipLimit.error };
  const phoneLimit = await enforceRateLimit('authEmail', `phone-verify:${phone}`);
  if (!phoneLimit.ok) return { success: false, error: phoneLimit.error };

  if (await usedByAnotherUser(userId, phone)) return { success: false, error: TAKEN_ERROR };

  let code = '';
  try {
    code = await issueOtpChallenge(purposeFor(userId), phone);
  } catch {
    return { success: false, error: 'Could not prepare the verification code. Please try again shortly.' };
  }
  const sent = await sendWhatsAppOtp(`91${phone}`, code);
  if (!sent.ok) {
    await discardOtpChallenge(purposeFor(userId), phone);
    return { success: false, error: sent.error };
  }
  return { success: true, message: 'We sent a 6-digit code on WhatsApp to this number.' };
}

export async function verifyPhoneCode(
  userId: string,
  rawPhone: unknown,
  code: string,
): Promise<PhoneVerified | Failure> {
  const phone = parsePhone(rawPhone);
  if (!phone) return { success: false, error: 'Enter a 10-digit Indian mobile number.' };

  const limit = await enforceRateLimit('authEmail', `phone-verify-check:${phone}`);
  if (!limit.ok) return { success: false, error: limit.error };

  if (!(await consumeOtpChallenge(purposeFor(userId), phone, code))) {
    return { success: false, error: 'Invalid or expired code. Check WhatsApp and try again.' };
  }
  return {
    success: true,
    phone,
    phoneVerificationToken: issuePhoneProof(userId, phone),
    message: 'Mobile number verified. Tap Save to keep it.',
  };
}

/** Truecaller rows for this flow carry `phone-verify:<userId>` and, once done, `:<phone>`. */
export function parseTruecallerPhoneVerifyPath(path: string | null | undefined) {
  const value = String(path || '');
  if (!value.startsWith(TRUECALLER_PATH_PREFIX)) return null;
  const [userId, phone] = value.slice(TRUECALLER_PATH_PREFIX.length).split(':');
  if (!userId) return null;
  return { userId, phone: phone && isValidIndianMobileDigits(phone) ? phone : null };
}

export function truecallerPhoneVerifiedPath(userId: string, phone: string) {
  return `${TRUECALLER_PATH_PREFIX}${userId}:${phone}`;
}

export async function startTruecallerPhoneVerify(
  userId: string,
  requestId: string,
): Promise<{ success: true; deepLink: string } | Failure> {
  if (!isValidTruecallerRequestId(requestId)) {
    return { success: false, error: 'Invalid verification request.' };
  }
  if (!isTruecallerEnabled()) {
    return { success: false, error: 'Truecaller is not available right now. Use WhatsApp instead.' };
  }
  const limit = await enforceRateLimit('auth', 'phone-verify-truecaller');
  if (!limit.ok) return { success: false, error: limit.error };

  const deepLink = buildTruecallerDeepLink(requestId);
  if (!deepLink) {
    return { success: false, error: 'Truecaller is not available right now. Use WhatsApp instead.' };
  }
  await createTruecallerAuthRequest(requestId, `${TRUECALLER_PATH_PREFIX}${userId}`);
  return { success: true, deepLink };
}

export async function truecallerPhoneVerifyStatus(
  userId: string,
  requestId: string,
): Promise<
  | { status: 'pending' }
  | ({ status: 'completed' } & Omit<PhoneVerified, 'success'>)
  | { status: 'error'; error: string }
> {
  if (!isValidTruecallerRequestId(requestId)) {
    return { status: 'error', error: 'Invalid verification request.' };
  }
  const record = await getTruecallerAuthRequest(requestId);
  if (!record) return { status: 'pending' };
  const target = parseTruecallerPhoneVerifyPath(record.redirectPath);
  if (!target || target.userId !== userId) {
    return { status: 'error', error: 'Invalid verification request.' };
  }
  if (record.status === 'user_rejected' || record.status === 'error') {
    return {
      status: 'error',
      error: record.errorMessage || 'Truecaller verification did not finish.',
    };
  }
  if (record.status !== 'completed' || !target.phone) return { status: 'pending' };
  if (await usedByAnotherUser(userId, target.phone)) {
    return { status: 'error', error: TAKEN_ERROR };
  }
  return {
    status: 'completed',
    phone: target.phone,
    phoneVerificationToken: issuePhoneProof(userId, target.phone),
    message: 'Mobile number verified with Truecaller. Tap Save to keep it.',
  };
}
