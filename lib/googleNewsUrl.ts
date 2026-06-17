const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

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

async function decodeViaBatchExecute(articleId: string): Promise<string | null> {
  const payload =
    '[[["Fbv4je","[\\"garturlreq\\",[[\\"hi\\",\\"IN\\",[\\"FINANCE_TOP_INDICES\\",\\"WEB_TEST_1_0_0\\"],null,null,1,1,\\"IN:hi\\",null,180,null,null,null,null,null,0,null,null,[1608992183,723341000]],\\"hi\\",\\"IN\\",1,[2,3,4,8],1,0,\\"655000234\\",0,0,null,0],\\"' +
    articleId +
    '\\"]",null,"generic"]]]';

  const response = await fetch(
    'https://news.google.com/_/DotsSplashUi/data/batchexecute?rpcids=Fbv4je',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        Referer: 'https://news.google.com/',
        'User-Agent': BROWSER_UA,
      },
      body: `f.req=${encodeURIComponent(payload)}`,
      signal: AbortSignal.timeout(12_000),
    }
  );

  if (!response.ok) return null;

  const text = await response.text();
  const header = '["garturlres","';
  const start = text.indexOf(header);
  if (start === -1) return null;

  const from = start + header.length;
  const end = text.indexOf('",', from);
  if (end === -1) return null;

  const decoded = text.slice(from, end).replace(/\\u003d/g, '=').replace(/\\\//g, '/');
  return decoded.startsWith('http') ? decoded : null;
}

function decodeOfflineGoogleNewsUrl(sourceUrl: string): string | null {
  try {
    const url = new URL(sourceUrl);
    const path = url.pathname.split('/').filter(Boolean);
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

/** Resolve a Google News redirect URL to the publisher article URL. */
export async function decodeGoogleNewsUrl(sourceUrl: string): Promise<string | null> {
  if (!isGoogleNewsArticleUrl(sourceUrl)) return sourceUrl;

  const offline = decodeOfflineGoogleNewsUrl(sourceUrl);
  if (offline) return offline;

  const articleId = extractArticleId(sourceUrl);
  if (!articleId) return null;

  return decodeViaBatchExecute(articleId);
}

export async function resolveNewsArticleUrl(url: string): Promise<string> {
  if (!isGoogleNewsArticleUrl(url)) return url;
  const decoded = await decodeGoogleNewsUrl(url);
  return decoded || url;
}
