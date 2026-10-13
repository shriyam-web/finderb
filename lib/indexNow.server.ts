import 'server-only';

import { after } from 'next/server';
import { SITE_ORIGIN } from '@/lib/siteSeo';

/** Public by design: IndexNow verifies ownership by fetching `/<key>.txt` from the site root. */
const INDEXNOW_KEY = '124640516bf49513deb62d970d9344fc';
const ENDPOINT = 'https://api.indexnow.org/indexnow';

function enabled(): boolean {
  if (process.env.VERCEL_ENV !== 'production') return false;
  try {
    return new URL(SITE_ORIGIN).hostname.endsWith('finderb.com');
  } catch {
    return false;
  }
}

/**
 * Tells Bing, Yandex, Seznam and Naver that pages changed so they recrawl within minutes.
 * Google does not take IndexNow; it reads the sitemap `lastmod`, which stays accurate.
 */
export async function submitToIndexNow(paths: string[]): Promise<void> {
  if (!enabled()) return;
  const host = new URL(SITE_ORIGIN).hostname;
  const urlList = [...new Set(paths.filter(Boolean).map((path) => new URL(path, SITE_ORIGIN).toString()))];
  if (!urlList.length) return;

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_ORIGIN}/${INDEXNOW_KEY}.txt`,
        urlList: urlList.slice(0, 10000),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok && res.status !== 202) {
      console.warn('[indexnow]', res.status);
    }
  } catch (error) {
    console.warn('[indexnow]', error instanceof Error ? error.message : error);
  }
}

export function queueIndexNow(paths: string[]): void {
  const run = () => submitToIndexNow(paths);
  try {
    after(run);
  } catch {
    void run();
  }
}
