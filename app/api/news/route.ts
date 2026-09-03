import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import Parser from 'rss-parser';
import type { Item } from 'rss-parser';
import {
  extractAllImagesFromRssItem,
  pickBestNewsImage,
} from '@/lib/newsImage';
import {
  cleanNewsSnippet,
  getCategoryLabel,
  getCategoryMeta,
  getFeedUrlsForCategory,
  getGoogleNewsUrl,
  getLocalFeedUrls,
  getLocalGoogleNewsUrl,
  normalizeCategorySlug,
  normalizeNewsLanguage,
  scoreLocalArticleRelevance,
  usesGoogleNewsPrimary,
  type LocalNewsLocation,
  type NewsCategorySlug,
  type NewsLanguage,
} from '@/lib/newsFeeds';
import { decodeHtmlEntities } from '@/lib/stripHtml';

/** List responses cached ~10 min — no HTML scrape on the list path. */
export const revalidate = 600;

const NEWS_LIST_REVALIDATE_SECONDS = 600;

/** Allow FinderB mobile (Expo web / native fetch) to read homepage news. */
const NEWS_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Max-Age': '86400',
  'Cache-Control':
    'public, s-maxage=600, stale-while-revalidate=300, max-age=60',
} as const;

function newsJson(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: NEWS_CORS_HEADERS,
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Max-Age': '86400',
    },
  });
}

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media:content'],
      ['media:thumbnail', 'media:thumbnail'],
      ['media:group', 'media:group'],
      ['content:encoded', 'content:encoded'],
      ['itunes:image', 'itunes:image'],
    ],
  },
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    Accept: 'application/rss+xml, application/xml, text/xml',
  },
});

async function parseFeed(url: string) {
  return parser.parseURL(url);
}

function normalizeTitle(title?: string): string {
  return (title || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function itemTimestamp(item: Item): number {
  const parsed = item.pubDate ? Date.parse(item.pubDate) : NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

const LOCAL_NEWS_MAX_AGE_DAYS = 60;

function isRecentNewsItem(item: Item, maxAgeDays: number): boolean {
  const ts = itemTimestamp(item);
  if (!ts) return true;
  return Date.now() - ts <= maxAgeDays * 24 * 60 * 60 * 1000;
}

async function fetchAllFeedItems(
  feedUrls: string[]
): Promise<{ items: Item[]; feedTitle: string }> {
  const merged: Item[] = [];
  const seen = new Set<string>();
  let feedTitle = '';

  for (const url of feedUrls) {
    try {
      const feed = await parseFeed(url);
      if (!feed.items?.length) continue;
      if (!feedTitle) feedTitle = feed.title || '';

      for (const item of feed.items) {
        const key = normalizeTitle(item.title);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        merged.push(item);
      }
    } catch (error) {
      console.error(`News feed failed: ${url}`, error);
    }
  }

  return { items: merged, feedTitle };
}

function compareLocalItems(
  a: Item,
  b: Item,
  city: string | null,
  state: string | null
): number {
  const dateDiff = itemTimestamp(b) - itemTimestamp(a);
  const relevanceDiff =
    scoreLocalArticleRelevance(b, city, state) - scoreLocalArticleRelevance(a, city, state);

  // Prefer city match only when articles are similarly recent (within 7 days).
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  if (Math.abs(dateDiff) <= sevenDaysMs && relevanceDiff !== 0) {
    return relevanceDiff;
  }

  if (dateDiff !== 0) return dateDiff;
  return relevanceDiff;
}

function prepareLocalItems(
  items: Item[],
  city: string | null,
  state: string | null,
  limit: number
): Item[] {
  const fresh = items.filter((item) => isRecentNewsItem(item, LOCAL_NEWS_MAX_AGE_DAYS));

  fresh.sort((a, b) => compareLocalItems(a, b, city, state));

  return fresh.slice(0, limit);
}

/** Fill items from feeds in priority order — avoids mixing national BBC into every category. */
async function fetchCategoryItems(
  feedUrls: string[],
  limit: number
): Promise<{ items: Item[]; feedTitle: string }> {
  const merged: Item[] = [];
  const seen = new Set<string>();
  let feedTitle = '';

  for (const url of feedUrls) {
    if (merged.length >= limit) break;

    try {
      const feed = await parseFeed(url);
      if (!feed.items?.length) continue;
      if (!feedTitle) feedTitle = feed.title || '';

      for (const item of feed.items) {
        if (merged.length >= limit) break;
        const key = normalizeTitle(item.title);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        merged.push(item);
      }
    } catch (error) {
      console.error(`News feed failed: ${url}`, error);
    }
  }

  return { items: merged, feedTitle };
}

async function fetchCategoryFeed(
  slug: NewsCategorySlug,
  lang: NewsLanguage,
  localLocation: LocalNewsLocation | undefined,
  limit: number
) {
  const hasLocalLocation = Boolean(localLocation?.city || localLocation?.state);

  if (slug === 'local' && hasLocalLocation) {
    const publisherUrls = getLocalFeedUrls(localLocation!, lang);
    const googleUrl = getLocalGoogleNewsUrl(localLocation!, lang);
    const city = localLocation?.city ?? null;
    const state = localLocation?.state ?? null;

    const { items: merged, feedTitle } = await fetchAllFeedItems(publisherUrls);

    if (prepareLocalItems(merged, city, state, limit).length < limit) {
      try {
        const googleFeed = await parseFeed(googleUrl);
        const seen = new Set(merged.map((item) => normalizeTitle(item.title)));
        const maxGoogle = Math.max(2, Math.floor(limit / 3));
        let googleAdded = 0;

        for (const item of googleFeed.items ?? []) {
          if (googleAdded >= maxGoogle) break;
          if (!isRecentNewsItem(item, LOCAL_NEWS_MAX_AGE_DAYS)) continue;
          const key = normalizeTitle(item.title);
          if (!key || seen.has(key)) continue;
          seen.add(key);
          merged.push(item);
          googleAdded++;
        }
      } catch (error) {
        console.error('Local Google News failed', error);
      }
    }

    return { items: prepareLocalItems(merged, city, state, limit), feedTitle };
  }

  if (usesGoogleNewsPrimary(slug, lang)) {
    try {
      const googleFeed = await parseFeed(getGoogleNewsUrl(slug, lang));
      const items = (googleFeed.items ?? []).slice(0, limit);
      return { items, feedTitle: googleFeed.title || '' };
    } catch (error) {
      console.error(`Google News primary failed (${lang}/${slug})`, error);
    }
  }

  const publisherUrls = getFeedUrlsForCategory(slug, lang);
  const fetchLimit = slug === 'local' ? limit * 3 : limit;
  const { items, feedTitle: publisherFeedTitle } = await fetchCategoryItems(
    publisherUrls,
    fetchLimit
  );
  let feedTitle = publisherFeedTitle;

  if (items.length === 0) {
    try {
      const googleFeed = await parseFeed(getGoogleNewsUrl(slug, lang));
      const seen = new Set<string>();
      for (const item of googleFeed.items ?? []) {
        if (items.length >= limit) break;
        if (slug === 'local' && !isRecentNewsItem(item, LOCAL_NEWS_MAX_AGE_DAYS)) continue;
        const key = normalizeTitle(item.title);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        items.push(item);
      }
      if (!feedTitle) feedTitle = googleFeed.title || '';
    } catch (error) {
      console.error(`Google News fallback failed (${lang}/${slug})`, error);
    }
  }

  let preparedItems =
    slug === 'local'
      ? prepareLocalItems(items, null, null, limit)
      : items.slice(0, limit);

  if (slug !== 'local') {
    preparedItems.sort((a, b) => itemTimestamp(b) - itemTimestamp(a));
  }

  return { items: preparedItems.slice(0, limit), feedTitle };
}

/** RSS / media fields only — never scrape publisher HTML on the list path. */
function imageFromRssItem(rawItem: Record<string, unknown>): string | null {
  return pickBestNewsImage(extractAllImagesFromRssItem(rawItem));
}

type NewsListPayload =
  | {
      success: true;
      articles: Array<{
        id: string;
        title: string;
        link: string | undefined;
        excerpt: string;
        date: string;
        category: string;
        categorySlug: NewsCategorySlug;
        source: string;
        image: string | null;
        imageFromFeed: boolean;
      }>;
      lang: NewsLanguage;
      category: ReturnType<typeof getCategoryMeta> & { label: string };
      location: { city: string | null; state: string | null } | null;
    }
  | { success: false; error: string; status: number };

async function buildNewsListPayload(
  slug: NewsCategorySlug,
  lang: NewsLanguage,
  city: string | null,
  state: string | null,
  limit: number
): Promise<NewsListPayload> {
  const localLocation: LocalNewsLocation = { city, state };
  const meta = getCategoryMeta(slug);
  const dateLocale = lang === 'en' ? 'en-IN' : 'hi-IN';
  const defaultTitle = lang === 'en' ? 'News' : 'समाचार';
  const defaultDate = lang === 'en' ? 'Recently' : 'हाल ही में';
  const defaultSource = lang === 'en' ? 'News' : 'समाचार';

  const { items, feedTitle } = await fetchCategoryFeed(
    slug,
    lang,
    slug === 'local' ? localLocation : undefined,
    limit
  );

  if (!items.length) {
    return {
      success: false,
      status: 502,
      error:
        lang === 'en'
          ? 'No news items were found for this category'
          : 'No Hindi news items were found for this category',
    };
  }

  const articles = items.map((item, index) => {
    const rawItem = item as unknown as Record<string, unknown>;
    const image = imageFromRssItem(rawItem);
    const snippet = cleanNewsSnippet(
      item.contentSnippet ||
        item.content ||
        (item as Record<string, unknown>)['content:encoded'],
      item.title
    );

    return {
      id: String(item.guid || item.link || `${lang}-${slug}-${index}`),
      title: decodeHtmlEntities(item.title || defaultTitle),
      link: item.link,
      excerpt: snippet,
      date: item.pubDate
        ? new Date(item.pubDate).toLocaleDateString(dateLocale, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : defaultDate,
      category: getCategoryLabel(meta, lang),
      categorySlug: slug,
      source:
        (item as { creator?: string }).creator ||
        (item as { author?: string }).author ||
        feedTitle?.split('|')[0]?.trim() ||
        defaultSource,
      image: image || null,
      imageFromFeed: Boolean(image),
    };
  });

  return {
    success: true,
    articles,
    lang,
    category: { ...meta, label: getCategoryLabel(meta, lang) },
    location: slug === 'local' && (city || state) ? { city, state } : null,
  };
}

function getCachedNewsList(
  slug: NewsCategorySlug,
  lang: NewsLanguage,
  city: string | null,
  state: string | null,
  limit: number
) {
  return unstable_cache(
    async () => buildNewsListPayload(slug, lang, city, state, limit),
    [
      'news-list-v2',
      slug,
      lang,
      city || '',
      state || '',
      String(limit),
    ],
    { revalidate: NEWS_LIST_REVALIDATE_SECONDS }
  )();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = normalizeCategorySlug(searchParams.get('category'));
    const lang = normalizeNewsLanguage(searchParams.get('lang'));
    const city = searchParams.get('city')?.trim() || null;
    const state = searchParams.get('state')?.trim() || null;
    const limit = Math.min(Number(searchParams.get('limit') || 12), 24);

    const payload = await getCachedNewsList(slug, lang, city, state, limit);

    if (!payload.success) {
      return newsJson(
        { success: false, error: payload.error },
        { status: payload.status }
      );
    }

    return newsJson({
      success: true,
      articles: payload.articles,
      lang: payload.lang,
      category: payload.category,
      location: payload.location,
    });
  } catch (error) {
    console.error('RSS Fetch Error:', error);
    return newsJson({ success: false, error: 'Failed to fetch news' }, { status: 502 });
  }
}
