import 'server-only';

import { lookup } from 'dns/promises';
import { isIP } from 'net';
import { isBlockedIpAddress, isSafeExternalUrl } from '@/lib/security/urlValidation';

/** Server-only: resolve hostname and reject private addresses (DNS rebinding mitigation). */
export async function assertResolvablePublicUrl(url: string): Promise<boolean> {
  if (!isSafeExternalUrl(url)) return false;

  try {
    const { hostname } = new URL(url);

    if (isIP(hostname)) {
      return !isBlockedIpAddress(hostname);
    }

    const records = await lookup(hostname, { all: true });
    return records.every((record) => !isBlockedIpAddress(record.address));
  } catch {
    return false;
  }
}
