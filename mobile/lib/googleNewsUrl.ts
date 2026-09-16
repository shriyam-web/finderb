/**
 * Decode Google News article IDs that embed the publisher URL (no network).
 * Port of lib/googleNewsUrl.ts offline decoder for React Native.
 */
export function decodeGoogleNewsUrlOffline(sourceUrl: string): string | null {
  try {
    const parsed = new URL(sourceUrl);
    if (parsed.hostname !== 'news.google.com') return null;

    const path = parsed.pathname.split('/').filter(Boolean);
    const articlesIdx = path.indexOf('articles');
    if (articlesIdx === -1) return null;

    const base64 = path[articlesIdx + 1]?.split('?')[0];
    if (!base64) return null;

    const padded = base64.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (padded.length % 4)) % 4;
    const b64 = padded + '='.repeat(padLen);

    // atob → binary string (React Native provides atob; avoid Node Buffer)
    if (typeof globalThis.atob !== 'function') return null;
    const binary = globalThis.atob(b64);

    let str = binary;
    const prefix = String.fromCharCode(0x08, 0x13, 0x22);
    if (str.startsWith(prefix)) {
      str = str.substring(prefix.length);
    }

    const suffix = String.fromCharCode(0xd2, 0x01, 0x00);
    if (str.endsWith(suffix)) {
      str = str.substring(0, str.length - suffix.length);
    }

    const bytes = Uint8Array.from(str, (c: string) => c.charCodeAt(0));
    const len = bytes[0];
    if (len === undefined) return null;

    if (len >= 0x80) {
      str = str.substring(2, len + 2);
    } else {
      str = str.substring(1, len + 1);
    }

    if (str.startsWith('http')) return str;
    return null;
  } catch {
    return null;
  }
}

export function isGoogleNewsArticleUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === 'news.google.com' &&
      /\/articles\/[^/]+/i.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}
