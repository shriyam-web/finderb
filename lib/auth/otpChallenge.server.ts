import 'server-only';

import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import { createServiceClient } from '@/lib/supabase/service';

const OTP_TTL_MS = 15 * 60 * 1000;

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
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
  await sweepExpired();
  await client.from('otp_challenges').delete().eq('purpose', purpose).eq('subject', subject);
  const { error } = await client.from('otp_challenges').insert({
    purpose,
    subject,
    code_hash: hashCode(purpose, subject, code),
    expires_at: expiresAt,
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
    .select('id, code_hash, expires_at')
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
