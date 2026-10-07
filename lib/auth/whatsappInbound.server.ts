import 'server-only';

import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'crypto';
import { otpSecret } from '@/lib/auth/otpChallenge.server';
import {
  completeWhatsAppLogin,
  sendWhatsAppLoginCode,
  type WhatsAppAudience,
  type WhatsAppClient,
} from '@/lib/auth/whatsappOtp.server';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  getWhatsAppCloudConfig,
  isWhatsAppInboundLoginEnabled,
} from '@/lib/whatsapp/cloudConfig';

/**
 * "Message FinderB first" login: the user sends a prefilled WhatsApp message
 * carrying a reference, WhatsApp tells us which number sent it, and we send the
 * login code to that number. Requests live in otp_challenges:
 *   subject = wa-inbound:<REF>, code_hash = HMAC of the poll secret,
 *   purpose = whatsapp-inbound:<audience>[:sent:<phone> | :error:<message>]
 */

const REQUEST_TTL_MS = 10 * 60 * 1000;
const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const REF_LENGTH = 8;
const PURPOSE_PREFIX = 'whatsapp-inbound';
const REF_PATTERN = new RegExp(`\\bFB-([${REF_ALPHABET}]{${REF_LENGTH}})\\b`, 'i');

type Failure = { success: false; error: string };

type InboundRow = {
  id: string;
  purpose: string;
  code_hash: string;
  expires_at: string;
};

type InboundState =
  | { phase: 'pending'; audience: WhatsAppAudience }
  | { phase: 'sent'; audience: WhatsAppAudience; phone: string }
  | { phase: 'error'; audience: WhatsAppAudience; error: string };

function db() {
  return createServiceClient();
}

function subjectFor(ref: string) {
  return `wa-inbound:${ref}`;
}

function pendingPurpose(audience: WhatsAppAudience) {
  return `${PURPOSE_PREFIX}:${audience}`;
}

function secretHash(ref: string, requestId: string) {
  return createHmac('sha256', otpSecret())
    .update(`whatsapp-inbound:${ref}:${requestId}`)
    .digest('hex');
}

function sameHash(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function parseState(purpose: string): InboundState | null {
  const [prefix, audience, phase, ...rest] = purpose.split(':');
  if (prefix !== PURPOSE_PREFIX || (audience !== 'user' && audience !== 'business')) return null;
  if (!phase) return { phase: 'pending', audience };
  if (phase === 'sent' && /^[6-9]\d{9}$/.test(rest[0] || '')) {
    return { phase: 'sent', audience, phone: rest[0] };
  }
  if (phase === 'error') {
    return { phase: 'error', audience, error: rest.join(':') || 'Could not send the WhatsApp code.' };
  }
  return null;
}

function normalizeRef(value: unknown) {
  const ref = String(value || '').trim().toUpperCase().replace(/^FB-/, '');
  return new RegExp(`^[${REF_ALPHABET}]{${REF_LENGTH}}$`).test(ref) ? ref : '';
}

function newRef() {
  let ref = '';
  for (let i = 0; i < REF_LENGTH; i += 1) {
    ref += REF_ALPHABET[randomInt(0, REF_ALPHABET.length)];
  }
  return ref;
}

function maskPhone(phone: string) {
  return `+91 ${phone.slice(0, 2)}••••••${phone.slice(-2)}`;
}

function messageText(ref: string, audience: WhatsAppAudience) {
  const what = audience === 'business' ? 'FinderB business login code' : 'FinderB login code';
  return `Send my ${what}. Ref: FB-${ref}`;
}

async function findRow(ref: string): Promise<InboundRow | null> {
  const client = db();
  if (!client) return null;
  const { data, error } = await client
    .from('otp_challenges')
    .select('id, purpose, code_hash, expires_at')
    .eq('subject', subjectFor(ref))
    .like('purpose', `${PURPOSE_PREFIX}:%`)
    .limit(1);
  if (error) {
    console.error('[whatsapp-inbound] lookup failed', error);
    return null;
  }
  return (data?.[0] as InboundRow | undefined) ?? null;
}

function isExpired(row: InboundRow) {
  const expiresAt = Date.parse(row.expires_at);
  return !Number.isFinite(expiresAt) || Date.now() > expiresAt;
}

async function rowForPoller(ref: string, requestId: string): Promise<InboundRow | null> {
  if (!ref || !/^[a-f0-9]{32}$/.test(requestId)) return null;
  const row = await findRow(ref);
  if (!row || !sameHash(row.code_hash, secretHash(ref, requestId))) return null;
  return row;
}

export async function startWhatsAppInboundLogin(audienceValue: unknown): Promise<
  | { success: true; enabled: false }
  | {
      success: true;
      enabled: true;
      ref: string;
      requestId: string;
      waNumber: string;
      text: string;
      expiresInSec: number;
    }
  | Failure
> {
  const audience =
    audienceValue === 'user' || audienceValue === 'business' ? audienceValue : null;
  if (!audience) return { success: false, error: 'Choose user or business login.' };
  if (!isWhatsAppInboundLoginEnabled()) return { success: true, enabled: false };

  const client = db();
  if (!client) return { success: true, enabled: false };

  const limit = await enforceRateLimit('auth', 'whatsapp-inbound-start');
  if (!limit.ok) return { success: false, error: limit.error };

  await client.from('otp_challenges').delete().lt('expires_at', new Date().toISOString());

  const ref = newRef();
  const requestId = randomBytes(16).toString('hex');
  const { error } = await client.from('otp_challenges').insert({
    purpose: pendingPurpose(audience),
    subject: subjectFor(ref),
    code_hash: secretHash(ref, requestId),
    expires_at: new Date(Date.now() + REQUEST_TTL_MS).toISOString(),
  });
  if (error) {
    console.error('[whatsapp-inbound] could not store request', error);
    return { success: false, error: 'Could not start WhatsApp login. Please try again.' };
  }

  return {
    success: true,
    enabled: true,
    ref,
    requestId,
    waNumber: getWhatsAppCloudConfig().businessNumber,
    text: messageText(ref, audience),
    expiresInSec: REQUEST_TTL_MS / 1000,
  };
}

/** Called for every text message Meta delivers to the webhook. Unknown or stale references are ignored. */
export async function handleWhatsAppInboundMessage(from: string, text: string): Promise<void> {
  const match = REF_PATTERN.exec(text || '');
  const ref = match ? normalizeRef(match[1]) : '';
  if (!ref) return;

  const client = db();
  const row = await findRow(ref);
  if (!client || !row || isExpired(row)) return;
  const state = parseState(row.purpose);
  if (!state || state.phase !== 'pending') return;

  const sender = String(from || '').replace(/\D/g, '');
  let nextPurpose: string;
  if (!/^91[6-9]\d{9}$/.test(sender)) {
    nextPurpose = `${pendingPurpose(state.audience)}:error:FinderB login works with Indian (+91) WhatsApp numbers only.`;
  } else {
    const phone = sender.slice(2);
    const sent = await sendWhatsAppLoginCode(phone, state.audience);
    nextPurpose = sent.success
      ? `${pendingPurpose(state.audience)}:sent:${phone}`
      : `${pendingPurpose(state.audience)}:error:${sent.error}`;
  }

  const { error } = await client
    .from('otp_challenges')
    .update({ purpose: nextPurpose })
    .eq('id', row.id)
    .eq('purpose', row.purpose);
  if (error) console.error('[whatsapp-inbound] could not update request', error);
}

export async function getWhatsAppInboundStatus(
  refValue: unknown,
  requestIdValue: unknown,
): Promise<
  | { status: 'pending' }
  | { status: 'sent'; phoneHint: string; message: string }
  | { status: 'error'; error: string }
> {
  const ref = normalizeRef(refValue);
  const row = await rowForPoller(ref, String(requestIdValue || ''));
  if (!row) return { status: 'error', error: 'This WhatsApp login request was not found. Please start again.' };
  if (isExpired(row)) {
    return { status: 'error', error: 'This WhatsApp login request expired. Please start again.' };
  }
  const state = parseState(row.purpose);
  if (!state) return { status: 'error', error: 'Could not read this WhatsApp login request.' };
  if (state.phase === 'pending') return { status: 'pending' };
  if (state.phase === 'error') return { status: 'error', error: state.error };
  return {
    status: 'sent',
    phoneHint: maskPhone(state.phone),
    message: `We sent a 6-digit code on WhatsApp to ${maskPhone(state.phone)}.`,
  };
}

export async function completeWhatsAppInboundLogin(input: {
  ref: unknown;
  requestId: unknown;
  code: string;
  client?: WhatsAppClient;
  redirectPath?: string;
}) {
  const ref = normalizeRef(input.ref);
  const row = await rowForPoller(ref, String(input.requestId || ''));
  const state = row && !isExpired(row) ? parseState(row.purpose) : null;
  if (!row || !state || state.phase !== 'sent') {
    return {
      success: false as const,
      error: 'This WhatsApp login request expired. Please start again.',
    };
  }

  const result = await completeWhatsAppLogin({
    phone: state.phone,
    code: input.code,
    audience: state.audience,
    client: input.client,
    redirectPath: input.redirectPath,
  });
  if (result.success) {
    await db()?.from('otp_challenges').delete().eq('id', row.id);
  }
  return result;
}
