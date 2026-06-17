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
  type LocalNewsLocation,
  type NewsCategorySlug,
  type NewsLanguage,
} from '@/lib/newsFeeds';

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

async function fetchMergedCategoryFeed(
  slug: NewsCategorySlug,
  lang: NewsLanguage,
  localLocation?: LocalNewsLocation,
  limit = 24
) {
  const hasLocalLocation = Boolean(localLocation?.city || localLocation?.state);
  const publisherUrls =
    slug === 'local' && hasLocalLocation
      ? getLocalFeedUrls(localLocation!, lang)
      : getFeedUrlsForCategory(slug, lang);

  const googleUrl =
    slug === 'local' && hasLocalLocation
      ? getLocalGoogleNewsUrl(localLocation!, lang)
      : getGoogleNewsUrl(slug, lang);

  const settled = await Promise.allSettled(publisherUrls.map((url) => parseFeed(url)));
  const merged: Item[] = [];
  const seen = new Set<string>();
  let feedTitle = '';

  for (const result of settled) {
    if (result.status !== 'fulfilled' || !result.value.items?.length) continue;
    if (!feedTitle) feedTitle = result.value.title || '';
    for (const item of result.value.items) {
      const key = normalizeTitle(item.title);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }

  merged.sort((a, b) => itemTimestamp(b) - itemTimestamp(a));

  if (merged.length < Math.min(limit, 8)) {
    try {
      const googleFeed = await parseFeed(googleUrl);
      for (const item of googleFeed.items ?? []) {
        const key = normalizeTitle(item.title);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        merged.push(item);
      }
      merged.sort((a, b) => itemTimestamp(b) - itemTimestamp(a));
      if (!feedTitle) feedTitle = googleFeed.title || '';
    } catch (error) {
      console.error(`Google News fallback failed (${lang}/${slug})`, error);
    }
  }

  return { items: merged.slice(0, limit), feedTitle };
}

async function resolveArticleImage(
  link: string | undefined,
  rawItem: Record<string, unknown>,
  title?: string
): Promise<string | null> {
  const feedImage = pickBestNewsImage(extractAllImagesFromRssItem(rawItem));
  if (feedImage) return feedImage;

  if (!link) return null;

  const publisherUrl = await resolveNewsArticleUrl(link);

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
  limit: number,
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

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
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

    const { items, feedTitle } = await fetchMergedCategoryFeed(
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

    const articles = await mapWithConcurrency(items, 4, async (item, index) => {
      const rawItem = item as unknown as Record<string, unknown>;
      const image = await resolveArticleImage(item.link, rawItem, item.title);
      const snippet = cleanNewsSnippet(
        item.contentSnippet || item.content || (item as Record<string, unknown>)['content:encoded'],
        item.title
      );

      return {
        id: String(item.guid || item.link || `${lang}-${slug}-${index}`),
        title: item.title || defaultTitle,
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
    return NextResponse.json({ success: false, error: 'Failed to fetch news' }, { status: 500 });
  }
}
