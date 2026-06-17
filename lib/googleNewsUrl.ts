const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export type GoogleNewsLocale = 'hi' | 'en';

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

function extractArticleId(url: string): string | null {
  try {
    const path = new URL(url).pathname.split('/').filter(Boolean);
    const idx = path.indexOf('articles');
    if (idx === -1 || !path[idx + 1]) return null;
    return path[idx + 1].split('?')[0];
  } catch {
    return null;
  }
}

function toArticlePageUrl(sourceUrl: string): string {
  const articleId = extractArticleId(sourceUrl);
  if (!articleId) return sourceUrl;
  return `https://news.google.com/articles/${articleId}?oc=5`;
}

function localeParams(locale: GoogleNewsLocale): { hl: string; ceid: string } {
  return locale === 'en'
    ? { hl: 'en-IN', ceid: 'IN:en' }
    : { hl: 'hi', ceid: 'IN:hi' };
}

function decodeOfflineGoogleNewsUrl(sourceUrl: string): string | null {
  try {
    const path = new URL(sourceUrl).pathname.split('/').filter(Boolean);
    const articlesIdx = path.indexOf('articles');
    if (articlesIdx === -1) return null;

    const base64 = path[articlesIdx + 1]?.split('?')[0];
    if (!base64) return null;

    let str = Buffer.from(base64, 'base64').toString('binary');
    const prefix = Buffer.from([0x08, 0x13, 0x22]).toString('binary');
    if (str.startsWith(prefix)) {
      str = str.substring(prefix.length);
    }

    const suffix = Buffer.from([0xd2, 0x01, 0x00]).toString('binary');
    if (str.endsWith(suffix)) {
      str = str.substring(0, str.length - suffix.length);
    }

    const bytes = Uint8Array.from(str, (c) => c.charCodeAt(0));
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

async function decodeViaArticlePage(
  sourceUrl: string,
  locale: GoogleNewsLocale
): Promise<string | null> {
  const articleId = extractArticleId(sourceUrl);
  if (!articleId) return null;

  const pageUrl = toArticlePageUrl(sourceUrl);
  const pageResponse = await fetch(pageUrl, {
    headers: {
      'User-Agent': BROWSER_UA,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': locale === 'en' ? 'en-IN,en;q=0.9' : 'hi-IN,hi;q=0.9,en;q=0.8',
    },
    signal: AbortSignal.timeout(12_000),
  });

  if (!pageResponse.ok) return null;

  const pageText = await pageResponse.text();
  const signature = pageText.match(/data-n-a-sg="([^"]+)"/)?.[1];
  const timestamp = pageText.match(/data-n-a-ts="([^"]+)"/)?.[1];
  if (!signature || !timestamp) return null;

  const { hl, ceid } = localeParams(locale);
  const rpcInner = JSON.stringify([
    'garturlreq',
    [
      [
        hl,
        'IN',
        ['FINANCE_TOP_INDICES', 'WEB_TEST_1_0_0'],
        null,
        null,
        1,
        1,
        ceid,
        null,
        1,
        null,
        null,
        null,
        null,
        null,
        0,
        1,
      ],
      hl,
      'IN',
      1,
      [1, 1, 1],
      1,
      1,
      null,
      0,
      0,
      null,
      0,
    ],
    articleId,
    Number(timestamp),
    signature,
  ]);

  const response = await fetch(
    'https://news.google.com/_/DotsSplashUi/data/batchexecute?rpcids=Fbv4je',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        Referer: 'https://news.google.com/',
        'User-Agent': BROWSER_UA,
      },
      body: `f.req=${encodeURIComponent(JSON.stringify([[['Fbv4je', rpcInner, null, 'generic']]]))}`,
      signal: AbortSignal.timeout(12_000),
    }
  );

  if (!response.ok) return null;

  let body = await response.text();
  if (body.startsWith(")]}'")) {
    body = body.split('\n', 1)[1] ?? body;
  }
  body = body.trimStart();
  const headEnd = body.indexOf('\n');
  if (headEnd > 0 && body.slice(0, headEnd).trim().match(/^\d+$/)) {
    body = body.slice(headEnd + 1);
  }

  try {
    const envelopes = JSON.parse(body) as unknown[];
    for (const env of envelopes) {
      if (
        Array.isArray(env) &&
        env.length >= 3 &&
        env[0] === 'wrb.fr' &&
        env[1] === 'Fbv4je' &&
        typeof env[2] === 'string'
      ) {
        const payload = JSON.parse(env[2]) as unknown[];
        if (Array.isArray(payload) && payload[0] === 'garturlres' && typeof payload[1] === 'string') {
          return payload[1];
        }
      }
    }
  } catch {
    return null;
  }

  return null;
}

/** Resolve a Google News redirect URL to the publisher article URL. */
export async function decodeGoogleNewsUrl(
  sourceUrl: string,
  locale: GoogleNewsLocale = 'hi'
): Promise<string | null> {
  if (!isGoogleNewsArticleUrl(sourceUrl)) return sourceUrl;

  const offline = decodeOfflineGoogleNewsUrl(sourceUrl);
  if (offline) return offline;

  const decoded = await decodeViaArticlePage(sourceUrl, locale);
  if (decoded) return decoded;

  if (locale === 'en') {
    return decodeViaArticlePage(sourceUrl, 'hi');
  }

  return decodeViaArticlePage(sourceUrl, 'en');
}

export async function resolveNewsArticleUrl(
  url: string,
  locale: GoogleNewsLocale = 'hi'
): Promise<string> {
  if (!isGoogleNewsArticleUrl(url)) return url;
  const decoded = await decodeGoogleNewsUrl(url, locale);
  return decoded || url;
}
