import { stripHtml } from '@/lib/stripHtml';

export type ExtractedArticle = {
  title: string;
  excerpt: string;
  contentHtml: string;
  image: string | null;
  source: string | null;
};

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function metaContent(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
    new RegExp(`name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1].trim());
  }
  return null;
}

function sanitizeArticleHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
}

function paragraphsFromHtml(html: string, max = 14): string[] {
  const matches = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
  const paragraphs = matches
    .map((m) => stripHtml(decodeHtmlEntities(m[1])))
    .map((p) => p.trim())
    .filter((p) => p.length > 40);

  return paragraphs.slice(0, max);
}

function escapeHtml(text: string): string {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function extractArticleFromHtml(html: string, fallbackTitle = ''): ExtractedArticle {
  const cleaned = sanitizeArticleHtml(html);
  const title = metaContent(cleaned, 'og:title') || fallbackTitle;
  const excerpt =
    metaContent(cleaned, 'og:description') ||
    metaContent(cleaned, 'description') ||
    '';
  const image = metaContent(cleaned, 'og:image');

  const articleMatch = cleaned.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i);
  let paragraphs: string[] = [];

  if (articleMatch?.[1]) {
    paragraphs = paragraphsFromHtml(articleMatch[1]);
  }

  if (paragraphs.length === 0) {
    paragraphs = paragraphsFromHtml(cleaned);
  }

  if (paragraphs.length === 0 && excerpt) {
    paragraphs = [excerpt];
  }

  const contentHtml =
    paragraphs.length > 0
      ? paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('')
      : `<p>${escapeHtml(excerpt || 'Full story is available on the source website.')}</p>`;

  return {
    title,
    excerpt: excerpt || paragraphs[0] || '',
    contentHtml,
    image,
    source: null,
  };
}

export async function fetchArticleFromUrl(
  url: string,
  fallbackTitle = ''
): Promise<ExtractedArticle | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FinderB/1.0 (+https://finderb.com)',
        Accept: 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) return null;

    const html = await response.text();
    const extracted = extractArticleFromHtml(html, fallbackTitle);

    let source: string | null = null;
    try {
      source = new URL(url).hostname.replace(/^www\./, '');
    } catch {
      source = null;
    }

    return { ...extracted, source };
  } catch {
    return null;
  }
}
