import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { fetchArticleFromUrl } from '@/lib/extractArticle';
import {
  cleanNewsSnippet,
  extractImageFromRssItem,
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
    'User-Agent': 'FinderB/1.0 (+https://finderb.com)',
    Accept: 'application/rss+xml, application/xml, text/xml',
  },
});

async function parseFeed(url: string) {
  return parser.parseURL(url);
}

async function fetchCategoryFeed(
  slug: NewsCategorySlug,
  lang: NewsLanguage,
  localLocation?: LocalNewsLocation
) {
  const hasLocalLocation = Boolean(localLocation?.city || localLocation?.state);
  const feedUrls =
    slug === 'local' && hasLocalLocation
      ? [...getLocalFeedUrls(localLocation!, lang), getLocalGoogleNewsUrl(localLocation!, lang)]
      : [...getFeedUrlsForCategory(slug, lang), getGoogleNewsUrl(slug, lang)];

  for (const url of feedUrls) {
    try {
      const feed = await parseFeed(url);
      if (feed.items?.length) {
        return feed;
      }
    } catch (error) {
      console.error(`News feed failed (${lang}/${slug}): ${url}`, error);
    }
  }

  return null;
}

async function resolveArticleImage(
  link: string | undefined,
  rawItem: Record<string, unknown>,
  title?: string
): Promise<string | null> {
  const fromFeed = extractImageFromRssItem(rawItem);
  if (fromFeed) return fromFeed;

  if (!link) return null;

  try {
    const article = await fetchArticleFromUrl(link, title || '');
    if (article?.image) {
      return article.image;
    }
  } catch (error) {
    console.error('News article image fetch failed:', link, error);
  }

  return null;
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

    const feed = await fetchCategoryFeed(slug, lang, slug === 'local' ? localLocation : undefined);
    if (!feed?.items?.length) {
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

    const items = feed.items.slice(0, limit);
    const articles = await Promise.all(
      items.map(async (item, index) => {
        const rawItem = item as unknown as Record<string, unknown>;
        const image = await resolveArticleImage(item.link, rawItem, item.title);
        const snippet = cleanNewsSnippet(
          item.contentSnippet || item.content || item['content:encoded'],
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
            feed.title?.split('|')[0]?.trim() ||
            defaultSource,
          image: image || null,
          imageFromFeed: Boolean(image),
        };
      })
    );

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
