import { NextRequest, NextResponse } from 'next/server';
import { fetchArticleFromUrl } from '@/lib/extractArticle';
import { resolveNewsArticleUrl } from '@/lib/googleNewsUrl';
import { pickBestNewsImage } from '@/lib/newsImage';
import { normalizeNewsLanguage } from '@/lib/newsFeeds';
import { isValidNewsUrl } from '@/lib/newsId';
import { stripHtml, decodeHtmlEntities } from '@/lib/stripHtml';
import { sanitizeRichHtml } from '@/lib/security/sanitizeHtml';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NEWS_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Max-Age': '86400',
} as const;

function articleJson(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: NEWS_CORS_HEADERS,
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: NEWS_CORS_HEADERS });
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
      return articleJson({ success: false, error: 'Invalid article URL' }, { status: 400 });
    }

    const lang = normalizeNewsLanguage(searchParams.get('lang'));
    const publisherUrl = await resolveNewsArticleUrl(url, lang === 'en' ? 'en' : 'hi');
    const extracted = await fetchArticleFromUrl(publisherUrl, title);

    const resolvedTitle = decodeHtmlEntities(extracted?.title || title || 'समाचार');
    const resolvedExcerpt = extracted?.excerpt || stripHtml(excerpt) || resolvedTitle;
    const resolvedImage = pickBestNewsImage([extracted?.image, image]) || null;
    const resolvedSource =
      extracted?.source ||
      source ||
      (() => {
        try {
          return new URL(publisherUrl || url).hostname.replace(/^www\./, '');
        } catch {
          return 'स्रोत';
        }
      })();

    const contentHtml = sanitizeRichHtml(
      extracted?.contentHtml ||
        `<p>${stripHtml(resolvedExcerpt).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`
    );

    return articleJson({
      success: true,
      article: {
        title: resolvedTitle,
        excerpt: resolvedExcerpt,
        contentHtml,
        image: resolvedImage,
        source: resolvedSource,
        date: date || 'हाल ही में',
        category: category || 'समाचार',
        sourceUrl: publisherUrl,
      },
    });
  } catch (error) {
    console.error('News article fetch error:', error);
    return articleJson({ success: false, error: 'Failed to load article' }, { status: 500 });
  }
}
