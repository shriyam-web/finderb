import * as Crypto from 'expo-crypto';
import { scrypt } from 'scrypt-js';

const HASH_PREFIX = 'scrypt:';

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Same scrypt format the FinderB website uses to check merchant passwords. */
export async function hashMerchantPassword(password: string): Promise<string> {
  const salt = new Uint8Array(Crypto.getRandomBytes(16));
  const encoded = new TextEncoder().encode(password.trim());
  const derived = await scrypt(encoded, salt, 16384, 8, 1, 64);
  return `${HASH_PREFIX}${toHex(salt)}:${toHex(derived)}`;
}
