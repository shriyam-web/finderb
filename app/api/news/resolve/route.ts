import { NextRequest, NextResponse } from 'next/server';
import { resolveNewsArticleUrl } from '@/lib/googleNewsUrl';
import { normalizeNewsLanguage } from '@/lib/newsFeeds';
import { isValidNewsUrl } from '@/lib/newsId';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NEWS_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Max-Age': '86400',
} as const;

function json(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: NEWS_CORS_HEADERS,
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: NEWS_CORS_HEADERS });
}

/** Fast publisher URL resolve — no article body extract. */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url') || '';
    if (!isValidNewsUrl(url)) {
      return json({ success: false, error: 'Invalid article URL' }, { status: 400 });
    }

    const lang = normalizeNewsLanguage(searchParams.get('lang'));
    const publisherUrl = await resolveNewsArticleUrl(
      url,
      lang === 'en' ? 'en' : 'hi',
    );

    let source = '';
    try {
      source = new URL(publisherUrl).hostname.replace(/^www\./, '');
    } catch {
      source = '';
    }

    return json({
      success: true,
      url: publisherUrl,
      source,
    });
  } catch (error) {
    console.error('News resolve error:', error);
    return json({ success: false, error: 'Failed to resolve article URL' }, { status: 500 });
  }
}
