import { lookup } from 'dns/promises';
import { isIP } from 'net';

const BLOCKED_HOSTNAMES = new Set(['localhost', 'metadata.google.internal']);

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;

  const [a, b] = parts;

  if (a === 127) return true;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  if (a === 0) return true;

  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  if (normalized === '::1' || normalized === '::') return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  if (normalized.startsWith('fe80:')) return true;

  return false;
}

function isBlockedIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return isPrivateIpv4(ip);
  if (version === 6) return isPrivateIpv6(ip);
  return true;
}

function isAllowedPort(port: string | number | null | undefined): boolean {
  if (port == null || port === '') return true;
  const numeric = Number(port);
  return numeric === 80 || numeric === 443;
}

export function isSafeExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }

    if (!isAllowedPort(parsed.port)) {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.has(hostname)) {
      return false;
    }

    if (isIP(hostname)) {
      return !isBlockedIp(hostname);
    }

    if (hostname.endsWith('.local') || hostname.endsWith('.internal')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/** Resolve hostname and reject if any address is private (DNS rebinding mitigation). */
export async function assertResolvablePublicUrl(url: string): Promise<boolean> {
  if (!isSafeExternalUrl(url)) return false;

  try {
    const { hostname } = new URL(url);

    if (isIP(hostname)) {
      return !isBlockedIp(hostname);
    }

    const records = await lookup(hostname, { all: true });
    return records.every((record) => !isBlockedIp(record.address));
  } catch {
    return false;
  }
}
