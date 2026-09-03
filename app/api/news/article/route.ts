import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { fetchArticleFromUrl } from '@/lib/extractArticle';
import { resolveNewsArticleUrl } from '@/lib/googleNewsUrl';
import { pickBestNewsImage } from '@/lib/newsImage';
import { normalizeNewsLanguage } from '@/lib/newsFeeds';
import { isValidNewsUrl } from '@/lib/newsId';
import { stripHtml, decodeHtmlEntities } from '@/lib/stripHtml';
import { sanitizeRichHtml } from '@/lib/security/sanitizeHtml';

/** Article extracts cached ~15 min per URL. */
export const revalidate = 900;

const NEWS_ARTICLE_REVALIDATE_SECONDS = 900;

const NEWS_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Max-Age': '86400',
  'Cache-Control':
    'public, s-maxage=900, stale-while-revalidate=300, max-age=60',
} as const;

function articleJson(body: unknown, init?: { status?: number }) {
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

type ExtractedArticlePayload = {
  title: string;
  excerpt: string;
  contentHtml: string;
  image: string | null;
  source: string;
  date: string;
  category: string;
  sourceUrl: string;
};

async function loadArticlePayload(input: {
  url: string;
  lang: 'en' | 'hi';
  title: string;
  excerpt: string;
  image: string;
  source: string;
  date: string;
  category: string;
}): Promise<ExtractedArticlePayload> {
  const publisherUrl = await resolveNewsArticleUrl(
    input.url,
    input.lang === 'en' ? 'en' : 'hi'
  );
  const extracted = await fetchArticleFromUrl(publisherUrl, input.title);

  const resolvedTitle = decodeHtmlEntities(
    extracted?.title || input.title || 'समाचार'
  );
  const resolvedExcerpt =
    extracted?.excerpt || stripHtml(input.excerpt) || resolvedTitle;
  const resolvedImage =
    pickBestNewsImage([extracted?.image, input.image]) || null;
  const resolvedSource =
    extracted?.source ||
    input.source ||
    (() => {
      try {
        return new URL(publisherUrl || input.url).hostname.replace(/^www\./, '');
      } catch {
        return 'स्रोत';
      }
    })();

  const contentHtml = sanitizeRichHtml(
    extracted?.contentHtml ||
      `<p>${stripHtml(resolvedExcerpt).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`
  );

  return {
    title: resolvedTitle,
    excerpt: resolvedExcerpt,
    contentHtml,
    image: resolvedImage,
    source: resolvedSource,
    date: input.date || 'हाल ही में',
    category: input.category || 'समाचार',
    sourceUrl: publisherUrl,
  };
}

function getCachedArticlePayload(input: {
  url: string;
  lang: 'en' | 'hi';
  title: string;
  excerpt: string;
  image: string;
  source: string;
  date: string;
  category: string;
}) {
  return unstable_cache(
    async () => loadArticlePayload(input),
    ['news-article-v2', input.url, input.lang],
    { revalidate: NEWS_ARTICLE_REVALIDATE_SECONDS }
  )();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url') || '';
    const title = searchParams.get('title') || '';
    const excerpt = searchParams.get('excerpt') || '';
    const image = searchParams.get('image') || '';
    const source = searchParams.get('source') || '';
    const date = searchParams.get('date') || '';
    const category = searchParams.get('category') || '';

    if (!isValidNewsUrl(url)) {
      return articleJson(
        { success: false, error: 'Invalid article URL' },
        { status: 400 }
      );
    }

    const lang = normalizeNewsLanguage(searchParams.get('lang'));
    const article = await getCachedArticlePayload({
      url,
      lang: lang === 'en' ? 'en' : 'hi',
      title,
      excerpt,
      image,
      source,
      date,
      category,
    });

    return articleJson({
      success: true,
      article,
    });
  } catch (error) {
    console.error('News article fetch error:', error);
    return articleJson(
      { success: false, error: 'Failed to load article' },
      { status: 500 }
    );
  }
}
