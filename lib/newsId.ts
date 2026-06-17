import { isSafeExternalUrl } from '@/lib/security/urlValidation';

function toBase64Url(value: string): string {
  const base64 =
    typeof Buffer !== 'undefined'
      ? Buffer.from(value, 'utf8').toString('base64')
      : btoa(unescape(encodeURIComponent(value)));

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(id: string): string {
  const base64 = id.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

  try {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(padded, 'base64').toString('utf8');
    }
    return decodeURIComponent(escape(atob(padded)));
  } catch {
    return '';
  }
}

export function encodeNewsArticleId(url: string): string {
  return toBase64Url(url);
}

export function decodeNewsArticleId(id: string): string {
  return fromBase64Url(id);
}

export function isValidNewsUrl(url: string): boolean {
  return isSafeExternalUrl(url);
}

export const NEWS_CACHE_PREFIX = 'finderb-news-meta:';
