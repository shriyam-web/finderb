import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';
import type { Item } from 'rss-parser';
import { fetchArticleFromUrl } from '@/lib/extractArticle';
import { resolveNewsArticleUrl } from '@/lib/googleNewsUrl';
import {
  extractAllImagesFromRssItem,
  extractImageFromRssItem,
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

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    const { items: merged, feedTitle } = await fetchCategoryItems(publisherUrls, limit);

    if (merged.length < limit) {
      try {
        const googleFeed = await parseFeed(googleUrl);
        const seen = new Set(merged.map((item) => normalizeTitle(item.title)));
        const maxGoogle = Math.max(2, Math.floor(limit / 3));
        let googleAdded = 0;

        for (const item of googleFeed.items ?? []) {
          if (merged.length >= limit || googleAdded >= maxGoogle) break;
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

    const city = localLocation?.city ?? null;
    const state = localLocation?.state ?? null;
    merged.sort((a, b) => {
      const relevance =
        scoreLocalArticleRelevance(b, city, state) - scoreLocalArticleRelevance(a, city, state);
      if (relevance !== 0) return relevance;
      return itemTimestamp(b) - itemTimestamp(a);
    });

    return { items: merged.slice(0, limit), feedTitle };
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
  const { items, feedTitle: publisherFeedTitle } = await fetchCategoryItems(publisherUrls, limit);
  let feedTitle = publisherFeedTitle;

  if (items.length === 0) {
    try {
      const googleFeed = await parseFeed(getGoogleNewsUrl(slug, lang));
      const seen = new Set<string>();
      for (const item of googleFeed.items ?? []) {
        if (items.length >= limit) break;
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

  items.sort((a, b) => itemTimestamp(b) - itemTimestamp(a));
  return { items: items.slice(0, limit), feedTitle };
}

async function resolveArticleImage(
  link: string | undefined,
  rawItem: Record<string, unknown>,
  title: string | undefined,
  lang: NewsLanguage
): Promise<string | null> {
  const feedImage = pickBestNewsImage(extractAllImagesFromRssItem(rawItem));
  if (feedImage) return feedImage;

  if (!link) return null;

  const publisherUrl = await resolveNewsArticleUrl(link, lang === 'en' ? 'en' : 'hi');

  try {
    const article = await fetchArticleFromUrl(publisherUrl, title || '');
    if (article?.image) return article.image;
  } catch (error) {
    console.error('News article image fetch failed:', publisherUrl, error);
  }

  if (publisherUrl !== link) {
    const legacyFeedImage = extractImageFromRssItem(rawItem);
    if (legacyFeedImage) return legacyFeedImage;
  }

  return null;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );
  return results;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = normalizeCategorySlug(searchParams.get('category'));
    const lang = normalizeNewsLanguage(searchParams.get('lang'));
    const city = searchParams.get('city')?.trim() || null;
    const state = searchParams.get('state')?.trim() || null;
    const localLocation: LocalNewsLocation = { city, state };
    const meta = getCategoryMeta(slug);
    const dateLocale = lang === 'en' ? 'en-IN' : 'hi-IN';
    const defaultTitle = lang === 'en' ? 'News' : 'समाचार';
    const defaultDate = lang === 'en' ? 'Recently' : 'हाल ही में';
    const defaultSource = lang === 'en' ? 'News' : 'समाचार';
    const limit = Math.min(Number(searchParams.get('limit') || 12), 24);

    const { items, feedTitle } = await fetchCategoryFeed(
      slug,
      lang,
      slug === 'local' ? localLocation : undefined,
      limit
    );

    if (!items.length) {
      return NextResponse.json(
        {
          success: false,
          error:
            lang === 'en'
              ? 'No news items were found for this category'
              : 'No Hindi news items were found for this category',
        },
        { status: 502 }
      );
    }

    const articles = await mapWithConcurrency(items, 8, async (item, index) => {
      const rawItem = item as unknown as Record<string, unknown>;
      const image = await resolveArticleImage(item.link, rawItem, item.title, lang);
      const snippet = cleanNewsSnippet(
        item.contentSnippet || item.content || (item as Record<string, unknown>)['content:encoded'],
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

    return NextResponse.json({
      success: true,
      articles,
      lang,
      category: { ...meta, label: getCategoryLabel(meta, lang) },
      location: slug === 'local' && (city || state) ? { city, state } : null,
    });
  } catch (error) {
    console.error('RSS Fetch Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch news' }, { status: 502 });
  }
}
