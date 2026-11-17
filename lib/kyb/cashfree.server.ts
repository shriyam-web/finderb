import 'server-only';

import { constants, publicEncrypt } from 'crypto';

type CashfreeErrorBody = {
  type?: string;
  code?: string;
  message?: string;
};

export class CashfreeKybError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = 'CashfreeKybError';
  }
}

function credentials() {
  const clientId = process.env.CASHFREE_SECURE_ID_CLIENT_ID?.trim() || '';
  const clientSecret = process.env.CASHFREE_SECURE_ID_CLIENT_SECRET?.trim() || '';
  const env = (process.env.CASHFREE_SECURE_ID_ENV || 'sandbox').trim().toLowerCase();
  return { clientId, clientSecret, env };
}

export function cashfreeKybConfigured(): boolean {
  const { clientId, clientSecret } = credentials();
  return Boolean(clientId && clientSecret);
}

function baseUrl(): string {
  return credentials().env === 'production'
    ? 'https://api.cashfree.com/verification'
    : 'https://sandbox.cashfree.com/verification';
}

/** Vercel has no fixed IP, so Cashfree Public Key 2FA signs each request. */
function publicKeyPem(): string {
  const raw = process.env.CASHFREE_SECURE_ID_PUBLIC_KEY?.trim() || '';
  if (!raw) return '';
  return raw.replace(/\\n/g, '\n');
}

function requestSignature(clientId: string): string | null {
  const pem = publicKeyPem();
  if (!pem) return null;
  const payload = `${clientId}.${Math.floor(Date.now() / 1000)}`;
  return publicEncrypt(
    {
      key: pem,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha1',
    },
    Buffer.from(payload),
  ).toString('base64');
}

function publicCashfreeError(status: number, body: CashfreeErrorBody): CashfreeKybError {
  const code = body.code || '';
  if (code === 'insufficient_balance') {
    return new CashfreeKybError(
      'Business verification is temporarily unavailable. Please try again later.',
      code,
    );
  }
  if (code === 'ip_validation_failed') {
    return new CashfreeKybError(
      'This server is not allowed to call Cashfree. For the live website, switch Secure ID 2FA to Public Key and set CASHFREE_SECURE_ID_PUBLIC_KEY.',
      code,
    );
  }
  if (status === 401 || code === 'authentication_failed' || code === 'x-client-secret_value_invalid') {
    return new CashfreeKybError('Business verification is not configured correctly.', code || 'authentication_failed');
  }
  if (status === 429) {
    return new CashfreeKybError('Too many verification attempts. Please wait and try again.', code || 'rate_limit');
  }
  if (code === 'pan_length_short' || code === 'pan_missing') {
    return new CashfreeKybError('Enter a valid 10-character PAN.', code);
  }
  return new CashfreeKybError(
    'Verification could not be completed. Check the number and try again.',
    code || `http_${status}`,
  );
}

export async function cashfreeVerify<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const { clientId, clientSecret } = credentials();
  if (!clientId || !clientSecret) {
    throw new CashfreeKybError(
      'Business verification is not configured yet. Add the Cashfree Secure ID keys on the server.',
      'not_configured',
    );
  }

  const signature = requestSignature(clientId);
  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'x-api-version': '2023-12-18',
        ...(signature ? { 'x-cf-signature': signature } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
      cache: 'no-store',
    });
  } catch {
    throw new CashfreeKybError('Verification service is unreachable. Try again in a minute.', 'unreachable');
  }

  const payload = (await response.json().catch(() => ({}))) as T & CashfreeErrorBody;
  if (!response.ok) throw publicCashfreeError(response.status, payload);
  return payload;
}

export type CashfreePanResult = {
  valid?: boolean;
  type?: string;
  reference_id?: number;
  registered_name?: string;
  name_match_score?: string | number;
  name_match_result?: string;
  pan_status?: string;
  message?: string;
};

export type CashfreeUdyamResult = {
  reference_id?: number;
  status?: string;
  udyam_number?: string | null;
  enterprise_name?: string | null;
};

export type CashfreeGstinResult = {
  reference_id?: number;
  GSTIN?: string;
  legal_name_of_business?: string;
  trade_name_of_business?: string;
  gst_in_status?: string;
};
