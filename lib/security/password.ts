import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export const PASSWORD_MIN_LENGTH_USER = 8;
export const PASSWORD_MIN_LENGTH_MERCHANT = 6;
export const PASSWORD_MAX_LENGTH = 128;

const HASH_PREFIX = 'scrypt:';
const SALT_BYTES = 16;
const KEY_BYTES = 64;

export function validatePasswordLength(
  password: string,
  minLength: number
): { ok: true } | { ok: false; error: string } {
  if (!password || typeof password !== 'string') {
    return { ok: false, error: 'Password is required' };
  }

  if (password.length < minLength) {
    return { ok: false, error: `Password must be at least ${minLength} characters` };
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return {
      ok: false,
      error: `Password must be at most ${PASSWORD_MAX_LENGTH} characters`,
    };
  }

  return { ok: true };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derived = (await scryptAsync(password, salt, KEY_BYTES)) as Buffer;
  return `${HASH_PREFIX}${salt.toString('hex')}:${derived.toString('hex')}`;
}

function isHashedPassword(stored: string): boolean {
  return stored.startsWith(HASH_PREFIX);
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<{ valid: boolean; needsRehash: boolean }> {
  const trimmed = password.trim();

  if (!isHashedPassword(stored)) {
    const valid = stored === trimmed;
    return { valid, needsRehash: valid };
  }

  const payload = stored.slice(HASH_PREFIX.length);
  const colon = payload.indexOf(':');
  if (colon === -1) return { valid: false, needsRehash: false };

  const saltHex = payload.slice(0, colon);
  const hashHex = payload.slice(colon + 1);

  try {
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const derived = (await scryptAsync(trimmed, salt, KEY_BYTES)) as Buffer;

    if (expected.length !== derived.length) {
      return { valid: false, needsRehash: false };
    }

    return {
      valid: timingSafeEqual(derived, expected),
      needsRehash: false,
    };
  } catch {
    return { valid: false, needsRehash: false };
  }
}
