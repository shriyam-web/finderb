import { stripHtml, decodeHtmlEntities } from '@/lib/stripHtml';
import { pickBestNewsImage } from '@/lib/newsImage';
import { assertResolvablePublicUrl } from '@/lib/security/ssrf.server';
import { sanitizeRichHtml } from '@/lib/security/sanitizeHtml';

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export type ExtractedArticle = {
  title: string;
  excerpt: string;
  contentHtml: string;
  image: string | null;
  source: string | null;
};


function metaContent(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
    new RegExp(`name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`content=["']([^"']+)["'][^>]+name=["']${property}["']`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1].trim());
  }
  return null;
}

function extractJsonLdImages(html: string): string[] {
  const images: string[] = [];

  const pushImage = (value: unknown) => {
    if (typeof value === 'string' && value.startsWith('http')) {
      images.push(value);
      return;
    }
    if (value && typeof value === 'object') {
      const obj = value as { url?: string };
      if (obj.url?.startsWith('http')) images.push(obj.url);
    }
  };

  for (const match of html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )) {
    try {
      const parsed = JSON.parse(match[1]);
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        const graph = (node as { '@graph'?: unknown[] })['@graph'];
        const candidates = graph ? [...nodes, ...graph] : nodes;
        for (const entry of candidates) {
          const type = String((entry as { '@type'?: string })['@type'] || '');
          if (!/(NewsArticle|Article|WebPage)/i.test(type)) continue;
          const record = entry as { image?: unknown; thumbnailUrl?: unknown };
          const image = record.image ?? record.thumbnailUrl;
          if (Array.isArray(image)) {
            image.forEach(pushImage);
          } else {
            pushImage(image);
          }
        }
      }
    } catch {
      /* ignore malformed JSON-LD */
    }
  }

  return images;
}

function extractArticleImages(html: string, extra: string[] = []): string | null {
  const candidates = [
    ...extra,
    metaContent(html, 'og:image:secure_url'),
    metaContent(html, 'og:image:url'),
    metaContent(html, 'og:image'),
    metaContent(html, 'twitter:image'),
    metaContent(html, 'twitter:image:src'),
  ];

  const firstImg = html.match(/<img[^>]+(?:src|data-src)=["']([^"']+)["']/i)?.[1] ?? null;
  if (firstImg) candidates.push(firstImg);

  return pickBestNewsImage(candidates);
}

function sanitizeArticleHtml(html: string): string {
  return sanitizeRichHtml(html);
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
  const jsonLdImages = extractJsonLdImages(html);
  const cleaned = sanitizeArticleHtml(html);
  const title = metaContent(cleaned, 'og:title') || fallbackTitle;
  const excerpt =
    metaContent(cleaned, 'og:description') ||
    metaContent(cleaned, 'description') ||
    '';
  const image = extractArticleImages(cleaned, jsonLdImages);

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
    const isPublic = await assertResolvablePublicUrl(url);
    if (!isPublic) return null;

    const response = await fetch(url, {
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'hi-IN,hi;q=0.9,en;q=0.8',
      },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(15_000),
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
