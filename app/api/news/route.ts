import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';
import {
  cleanNewsSnippet,
  extractImageFromRssItem,
  getCategoryLabel,
  getCategoryMeta,
  getFallbackImages,
  getFeedUrlsForCategory,
  getGoogleNewsUrl,
  normalizeCategorySlug,
  normalizeNewsLanguage,
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
      ['content:encoded', 'content:encoded'],
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

async function fetchCategoryFeed(slug: NewsCategorySlug, lang: NewsLanguage) {
  const feedUrls = [...getFeedUrlsForCategory(slug, lang), getGoogleNewsUrl(slug, lang)];

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = normalizeCategorySlug(searchParams.get('category'));
    const lang = normalizeNewsLanguage(searchParams.get('lang'));
    const meta = getCategoryMeta(slug);
    const fallbacks = getFallbackImages(slug);
    const dateLocale = lang === 'en' ? 'en-IN' : 'hi-IN';
    const defaultTitle = lang === 'en' ? 'News' : 'समाचार';
    const defaultDate = lang === 'en' ? 'Recently' : 'हाल ही में';
    const defaultSource = lang === 'en' ? 'News' : 'समाचार';

    const feed = await fetchCategoryFeed(slug, lang);
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

    const items = feed.items.slice(0, 6);
    const articles = items.map((item, index) => {
      const rawItem = item as unknown as Record<string, unknown>;
      const extractedImage = extractImageFromRssItem(rawItem);
      const image = extractedImage || fallbacks[index % fallbacks.length];

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
        image,
        imageFromFeed: Boolean(extractedImage),
      };
    });

    return NextResponse.json({
      success: true,
      articles,
      lang,
      category: { ...meta, label: getCategoryLabel(meta, lang) },
    });
  } catch (error) {
    console.error('RSS Fetch Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch news' }, { status: 500 });
  }
}
