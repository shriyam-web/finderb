import { NextRequest, NextResponse } from 'next/server';
import { fetchArticleFromUrl } from '@/lib/extractArticle';
import { resolveNewsArticleUrl } from '@/lib/googleNewsUrl';
import { pickBestNewsImage } from '@/lib/newsImage';
import { isValidNewsUrl } from '@/lib/newsId';
import { stripHtml } from '@/lib/stripHtml';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
      return NextResponse.json({ success: false, error: 'Invalid article URL' }, { status: 400 });
    }

    const publisherUrl = await resolveNewsArticleUrl(url);
    const extracted = await fetchArticleFromUrl(publisherUrl, title);

    const resolvedTitle = extracted?.title || title || 'समाचार';
    const resolvedExcerpt = extracted?.excerpt || stripHtml(excerpt) || resolvedTitle;
    const resolvedImage = pickBestNewsImage([extracted?.image, image]) || null;
    const resolvedSource =
      extracted?.source ||
      source ||
      (() => {
        try {
          return new URL(url).hostname.replace(/^www\./, '');
        } catch {
          return 'स्रोत';
        }
      })();

    const contentHtml =
      extracted?.contentHtml ||
      `<p>${stripHtml(resolvedExcerpt).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;

    return NextResponse.json({
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
    return NextResponse.json({ success: false, error: 'Failed to load article' }, { status: 500 });
  }
}
