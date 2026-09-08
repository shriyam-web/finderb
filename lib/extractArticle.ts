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
  /** True when we extracted a substantial body (not just a teaser). */
  hasFullContent: boolean;
};

const BODY_CLASS_RE =
  /(?:article[-_ ]?(?:body|content|text|detail)|story[-_ ]?(?:body|content|detail|text)|entry[-_ ]?content|post[-_ ]?content|td-post-content|field[-_ ]?name[-_ ]?body|news[-_ ]?(?:detail|body|content)|detail[-_ ]?content|main[-_ ]?content|rich[-_ ]?text|content[-_ ]?body|article__content|story__content)/i;

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

function extractJsonLdArticles(html: string): Array<{
  body?: string;
  description?: string;
  headline?: string;
  images: string[];
}> {
  const articles: Array<{
    body?: string;
    description?: string;
    headline?: string;
    images: string[];
  }> = [];

  const pushImage = (images: string[], value: unknown) => {
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
        const candidates = graph
          ? [...nodes, ...graph]
          : nodes;
        for (const entry of candidates) {
          const type = String((entry as { '@type'?: string })['@type'] || '');
          if (!/(NewsArticle|Article|WebPage|ReportageNewsArticle)/i.test(type)) continue;
          const record = entry as {
            articleBody?: string;
            description?: string;
            headline?: string;
            name?: string;
            image?: unknown;
            thumbnailUrl?: unknown;
          };
          const images: string[] = [];
          const image = record.image ?? record.thumbnailUrl;
          if (Array.isArray(image)) image.forEach((v) => pushImage(images, v));
          else pushImage(images, image);

          articles.push({
            body:
              typeof record.articleBody === 'string' ? record.articleBody : undefined,
            description:
              typeof record.description === 'string' ? record.description : undefined,
            headline:
              (typeof record.headline === 'string' && record.headline) ||
              (typeof record.name === 'string' && record.name) ||
              undefined,
            images,
          });
        }
      }
    } catch {
      /* ignore malformed JSON-LD */
    }
  }

  return articles;
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

function escapeHtml(text: string): string {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function normalizeParagraph(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function isBoilerplate(text: string): boolean {
  return (
    text.length < 25 ||
    /^(share|follow us|advertisement|subscribe|also read|read more|copyright|©)/i.test(
      text
    ) ||
    /cookie|newsletter|related stories|trending now/i.test(text)
  );
}

function paragraphsFromHtml(html: string, max = 24): string[] {
  const blocks: string[] = [];

  const push = (raw: string) => {
    const text = normalizeParagraph(stripHtml(decodeHtmlEntities(raw)));
    if (isBoilerplate(text)) return;
    if (blocks.some((b) => b === text)) return;
    blocks.push(text);
  };

  for (const m of html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
    push(m[1]);
  }

  if (blocks.length < 3) {
    for (const m of html.matchAll(
      /<(?:div|section|span)[^>]*>([\s\S]*?)<\/(?:div|section|span)>/gi
    )) {
      const inner = m[1];
      if (/<(?:div|p|section)\b/i.test(inner)) continue;
      push(inner);
    }
  }

  if (blocks.length < 2) {
    const plain = normalizeParagraph(stripHtml(decodeHtmlEntities(html)));
    if (plain.length > 80) {
      for (const chunk of plain.split(/(?<=[।.!?])\s+/)) {
        push(chunk);
        if (blocks.length >= max) break;
      }
    }
  }

  return blocks.slice(0, max);
}

function extractTaggedRegion(html: string, tag: string): string | null {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = html.match(re);
  return match?.[1] ?? null;
}

/** Pull inner HTML of the first element whose class/id looks like an article body. */
function extractBodyByClass(html: string): string | null {
  const openTagRe =
    /<(div|section|article|main)\b([^>]*)>/gi;
  let match: RegExpExecArray | null;
  while ((match = openTagRe.exec(html))) {
    const tag = match[1];
    const attrs = match[2] || '';
    const classOrId =
      attrs.match(/(?:class|id)=["']([^"']+)["']/i)?.[1] ||
      attrs.match(/(?:class|id)=([^\s>]+)/i)?.[1] ||
      '';
    if (!BODY_CLASS_RE.test(classOrId)) continue;

    const start = match.index + match[0].length;
    const closeRe = new RegExp(`</${tag}\\s*>`, 'i');
    // naive depth walk
    let depth = 1;
    let i = start;
    const openInner = new RegExp(`<${tag}\\b`, 'gi');
    while (depth > 0 && i < html.length) {
      openInner.lastIndex = i;
      closeRe.lastIndex = i;
      const nextOpen = openInner.exec(html);
      const nextClose = closeRe.exec(html);
      if (!nextClose) break;
      if (nextOpen && nextOpen.index < nextClose.index) {
        depth += 1;
        i = nextOpen.index + nextOpen[0].length;
      } else {
        depth -= 1;
        if (depth === 0) {
          return html.slice(start, nextClose.index);
        }
        i = nextClose.index + nextClose[0].length;
      }
    }
  }
  return null;
}

function bodyToParagraphs(body: string): string[] {
  const trimmed = body.trim();
  if (!trimmed) return [];
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return paragraphsFromHtml(trimmed);
  }
  return trimmed
    .split(/\n+/)
    .map(normalizeParagraph)
    .filter((p) => !isBoilerplate(p));
}

function scoreParagraphs(paragraphs: string[]): number {
  return paragraphs.reduce((sum, p) => sum + p.length, 0);
}

export function articleHasFullContent(contentHtml: string, excerpt = ''): boolean {
  const plain = stripHtml(contentHtml || '').trim();
  if (!plain) return false;
  if (/full story is available on the source/i.test(plain)) return false;
  if (plain.length < 320) return false;
  const excerptPlain = stripHtml(excerpt || '').trim();
  if (excerptPlain && plain.length <= excerptPlain.length + 40) return false;
  return true;
}

export function extractArticleFromHtml(html: string, fallbackTitle = ''): ExtractedArticle {
  const jsonLd = extractJsonLdArticles(html);
  const jsonLdImages = jsonLd.flatMap((a) => a.images);
  const cleaned = sanitizeArticleHtml(html);
  const title =
    metaContent(cleaned, 'og:title') ||
    jsonLd.find((a) => a.headline)?.headline ||
    fallbackTitle;
  const excerpt =
    metaContent(cleaned, 'og:description') ||
    metaContent(cleaned, 'description') ||
    jsonLd.find((a) => a.description)?.description ||
    '';
  const image = extractArticleImages(cleaned, jsonLdImages);

  let best: string[] = [];

  for (const article of jsonLd) {
    if (article.body) {
      const paras = bodyToParagraphs(article.body);
      if (scoreParagraphs(paras) > scoreParagraphs(best)) best = paras;
    }
  }

  const classBody = extractBodyByClass(cleaned);
  if (classBody) {
    const paras = paragraphsFromHtml(classBody);
    if (scoreParagraphs(paras) > scoreParagraphs(best)) best = paras;
  }

  const articleRegion = extractTaggedRegion(cleaned, 'article');
  if (articleRegion) {
    const paras = paragraphsFromHtml(articleRegion);
    if (scoreParagraphs(paras) > scoreParagraphs(best)) best = paras;
  }

  if (best.length < 2) {
    const paras = paragraphsFromHtml(cleaned);
    if (scoreParagraphs(paras) > scoreParagraphs(best)) best = paras;
  }

  if (best.length === 0 && excerpt) {
    best = [normalizeParagraph(stripHtml(excerpt))];
  }

  // Never invent a "go to source" stub — empty body means client/API should use reader fallback.
  const contentHtml =
    best.length > 0 ? best.map((p) => `<p>${escapeHtml(p)}</p>`).join('') : '';

  return {
    title,
    excerpt: excerpt || best[0] || '',
    contentHtml,
    image,
    source: null,
    hasFullContent: articleHasFullContent(contentHtml, excerpt),
  };
}

function paragraphsFromReaderText(raw: string, max = 28): string[] {
  const cleaned = raw
    .replace(/\r/g, '')
    .replace(/^Title:.*$/gim, '')
    .replace(/^URL Source:.*$/gim, '')
    .replace(/^Published Time:.*$/gim, '')
    .replace(/^Markdown Content:\s*/gim, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/!\[[^\]]*]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .trim();

  const chunks = cleaned
    .split(/\n{2,}/)
    .map((block) => normalizeParagraph(block.replace(/\n/g, ' ')))
    .filter((p) => !isBoilerplate(p) && p.length > 40);

  if (chunks.length >= 2) return chunks.slice(0, max);

  // Single blob — split on sentence boundaries for Hindi/English.
  const sentences = cleaned
    .split(/(?<=[।.!?])\s+/)
    .map(normalizeParagraph)
    .filter((p) => !isBoilerplate(p) && p.length > 40);
  return sentences.slice(0, max);
}

/** External reader when publisher HTML is paywalled / bot-blocked. */
async function fetchArticleViaJina(
  url: string,
  fallbackTitle: string
): Promise<ExtractedArticle | null> {
  try {
    const isPublic = await assertResolvablePublicUrl(url);
    if (!isPublic) return null;

    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        Accept: 'text/plain',
        'User-Agent': BROWSER_UA,
        'X-Return-Format': 'markdown',
      },
      signal: AbortSignal.timeout(22_000),
      redirect: 'follow',
    });
    if (!response.ok) return null;

    const text = await response.text();
    if (!text || text.length < 120) return null;

    const titleMatch = text.match(/^Title:\s*(.+)$/im);
    const title = (titleMatch?.[1] || fallbackTitle || '').trim();
    const paragraphs = paragraphsFromReaderText(text);
    if (paragraphs.length === 0) return null;

    const contentHtml = paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('');
    const excerpt = paragraphs[0] || '';

    let source: string | null = null;
    try {
      source = new URL(url).hostname.replace(/^www\./, '');
    } catch {
      source = null;
    }

    return {
      title: title || fallbackTitle,
      excerpt,
      contentHtml,
      image: null,
      source,
      hasFullContent: articleHasFullContent(contentHtml, excerpt),
    };
  } catch {
    return null;
  }
}

async function fetchHtml(url: string): Promise<{ html: string; finalUrl: string } | null> {
  const attempts: Array<Record<string, string>> = [
    {
      'User-Agent': BROWSER_UA,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'hi-IN,hi;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
    },
    {
      'User-Agent':
        'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'hi-IN,hi;q=0.9,en;q=0.8',
    },
  ];

  for (const headers of attempts) {
    try {
      const response = await fetch(url, {
        headers,
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(16_000),
        redirect: 'follow',
      });
      if (!response.ok) continue;
      const html = await response.text();
      if (html.length < 400) continue;
      return { html, finalUrl: response.url || url };
    } catch {
      // try next UA
    }
  }
  return null;
}

function pickRicher(
  a: ExtractedArticle | null,
  b: ExtractedArticle | null
): ExtractedArticle | null {
  if (!a) return b;
  if (!b) return a;
  const aScore = scoreParagraphs(paragraphsFromHtml(a.contentHtml || ''));
  const bScore = scoreParagraphs(paragraphsFromHtml(b.contentHtml || ''));
  // Prefer hasFullContent, then longer body.
  if (a.hasFullContent !== b.hasFullContent) {
    return a.hasFullContent ? a : b;
  }
  return bScore > aScore ? b : a;
}

export async function fetchArticleFromUrl(
  url: string,
  fallbackTitle = ''
): Promise<ExtractedArticle | null> {
  try {
    const isPublic = await assertResolvablePublicUrl(url);
    if (!isPublic) return null;

    let fromHtml: ExtractedArticle | null = null;
    const fetched = await fetchHtml(url);
    if (fetched) {
      fromHtml = extractArticleFromHtml(fetched.html, fallbackTitle);
      try {
        fromHtml = {
          ...fromHtml,
          source: new URL(fetched.finalUrl || url).hostname.replace(/^www\./, ''),
        };
      } catch {
        /* keep */
      }
    }

    if (fromHtml?.hasFullContent) {
      return fromHtml;
    }

    const fromJina = await fetchArticleViaJina(url, fallbackTitle);
    const best = pickRicher(fromHtml, fromJina);
    if (best) return best;

    // Last resort: title/excerpt only — never a "go to website" stub.
    return (
      fromHtml || {
        title: fallbackTitle,
        excerpt: '',
        contentHtml: '',
        image: null,
        source: null,
        hasFullContent: false,
      }
    );
  } catch {
    return null;
  }
}
