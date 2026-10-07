import 'server-only';

import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import { createServiceClient } from '@/lib/supabase/service';

const OTP_TTL_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
/** Codes per subject until the latest one expires; the row (and its counter) lives for OTP_TTL_MS after the last send. */
const MAX_SENDS = 5;
/** Wrong guesses before the code stops working and a new one must be requested. */
const MAX_ATTEMPTS = 5;

/** Raised when a subject asks for codes too quickly; the message is safe to show to the user. */
export class OtpCooldownError extends Error {}

export function otpIssueErrorMessage(error: unknown, fallback: string): string {
  return error instanceof OtpCooldownError ? error.message : fallback;
}

export function otpSecret(): string {
  const secret =
    process.env.PASSWORD_RESET_SECRET?.trim() ||
    process.env.MOBILE_SESSION_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!secret) {
    throw new Error('Missing secret for OTP storage');
  }
  return secret;
}

function hashCode(purpose: string, subject: string, code: string): string {
  return createHmac('sha256', otpSecret())
    .update(`otp-challenge:${purpose}:${subject}:${code}`)
    .digest('hex');
}

function hashesMatch(stored: string, expected: string): boolean {
  const left = Buffer.from(stored);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function db() {
  return createServiceClient();
}

async function sweepExpired() {
  const client = db();
  if (!client) return;
  await client.from('otp_challenges').delete().lt('expires_at', new Date().toISOString());
}

/** Stores a hashed one-time code and returns the digits to send. Replaces any older code for this subject. */
export async function issueOtpChallenge(purpose: string, subject: string): Promise<string> {
  const client = db();
  if (!client) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const now = Date.now();
  const expiresAt = new Date(now + OTP_TTL_MS).toISOString();
  await sweepExpired();

  const { data: previous } = await client
    .from('otp_challenges')
    .select('created_at, send_count')
    .eq('purpose', purpose)
    .eq('subject', subject)
    .maybeSingle();
  let sendCount = 1;
  if (previous) {
    const lastSentAt = Date.parse(String(previous.created_at || ''));
    if (Number.isFinite(lastSentAt) && now - lastSentAt < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((RESEND_COOLDOWN_MS - (now - lastSentAt)) / 1000);
      throw new OtpCooldownError(`Please wait ${wait} seconds before requesting another code.`);
    }
    sendCount = Number(previous.send_count || 1) + 1;
    if (sendCount > MAX_SENDS) {
      throw new OtpCooldownError('Too many codes requested for this. Please try again in 15 minutes.');
    }
  }

  await client.from('otp_challenges').delete().eq('purpose', purpose).eq('subject', subject);
  const { error } = await client.from('otp_challenges').insert({
    purpose,
    subject,
    code_hash: hashCode(purpose, subject, code),
    expires_at: expiresAt,
    send_count: sendCount,
    attempts: 0,
  });
  if (error) {
    console.error('[otp] could not store challenge');
    throw new Error('Could not store the verification code.');
  }
  return code;
}

export async function discardOtpChallenge(purpose: string, subject: string): Promise<void> {
  const client = db();
  if (!client) return;
  await client.from('otp_challenges').delete().eq('purpose', purpose).eq('subject', subject);
}

/** Checks the code, then deletes it. Expired rows are deleted and rejected. */
export async function consumeOtpChallenge(
  purpose: string,
  subject: string,
  code: string,
): Promise<boolean> {
  const digits = String(code || '').replace(/\D/g, '');
  if (digits.length !== 6) return false;
  const client = db();
  if (!client) return false;

  await sweepExpired();
  const { data, error } = await client
    .from('otp_challenges')
    .select('id, code_hash, expires_at, attempts')
    .eq('purpose', purpose)
    .eq('subject', subject)
    .maybeSingle();
  if (error || !data?.id) return false;

  const expiresAt = Date.parse(String(data.expires_at || ''));
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    await client.from('otp_challenges').delete().eq('id', data.id);
    return false;
  }

  if (!hashesMatch(String(data.code_hash || ''), hashCode(purpose, subject, digits))) {
    const attempts = Number(data.attempts || 0) + 1;
    // Keep the row once locked so the resend counters still apply; a locked hash never matches.
    await client
      .from('otp_challenges')
      .update(attempts >= MAX_ATTEMPTS ? { attempts, code_hash: 'locked' } : { attempts })
      .eq('id', data.id);
    return false;
  }

  const { data: removed } = await client
    .from('otp_challenges')
    .delete()
    .eq('id', data.id)
    .eq('code_hash', data.code_hash)
    .select('id');
  return Boolean(removed?.length);
}
