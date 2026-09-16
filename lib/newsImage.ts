const JUNK_IMAGE_PATTERNS = [
  /news\.google\.com/i,
  /google\.com\/images\/branding/i,
  /google\.com\/favicon/i,
  /gstatic\.com\/images/i,
  /\/favicon[\w.-]*\.(?:ico|png|gif)/i,
  /\/apple-touch-icon/i,
  /placeholder/i,
  /\/1x1[./]/i,
  /pixel\.gif/i,
  /spacer\.gif/i,
  /googleg_standard/i,
  /google_news/i,
  /newsstand/i,
];

const SMALL_THUMB_PATTERN = /(?:[?&/=])(?:s|w|h)(\d{1,2})(?:[-/]|$)/i;

export function isJunkNewsImage(url: string | null | undefined): boolean {
  if (!url?.trim()) return true;
  const value = url.trim();
  if (!value.startsWith('http')) return true;
  if (JUNK_IMAGE_PATTERNS.some((pattern) => pattern.test(value))) return true;

  const sizeMatch = value.match(SMALL_THUMB_PATTERN);
  if (sizeMatch && Number(sizeMatch[1]) <= 32) return true;

  return false;
}

export function scoreNewsImage(url: string): number {
  if (isJunkNewsImage(url)) return -1;

  let score = 10;
  if (/\.(?:jpg|jpeg|webp)(\?|$)/i.test(url)) score += 8;
  if (/\.png(\?|$)/i.test(url)) score += 4;
  if (/og-image|featured|lead|hero|thumb|resize|images\//i.test(url)) score += 5;
  if (/ichef\.bbci\.co\.uk|livehindustan|jagran|aajtak|ndtv|hindustantimes|thehindu|tosshub|inc42|yourstory|thgim\.com|ht-img/i.test(url)) {
    score += 6;
  }
  if (/googleusercontent\.com/i.test(url)) score += 2;
  if (/logo|icon|avatar|badge/i.test(url)) score -= 12;

  const widthMatch = url.match(/(?:w|width)[=_-]?(\d{2,4})/i);
  if (widthMatch && Number(widthMatch[1]) >= 200) score += 4;

  return score;
}

export function pickBestNewsImage(candidates: Array<string | null | undefined>): string | null {
  const ranked = candidates
    .filter((url): url is string => Boolean(url?.trim()))
    .map((url) => ({ url: url.trim(), score: scoreNewsImage(url) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.url ?? null;
}

function pickMediaUrl(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string' && value.startsWith('http')) return value;
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.url === 'string') return obj.url;
    const attrs = obj.$ as Record<string, string> | undefined;
    if (attrs?.url) return attrs.url;
  }
  return null;
}

export function normalizeNewsImageUrl(url: string): string | null {
  if (!url?.trim()) return null;
  let value = url.trim().replace(/&amp;/g, '&');
  if (value.startsWith('//')) value = `https:${value}`;
  if (!value.startsWith('http')) return null;
  if (value.includes('pixel') || value.includes('1x1') || value.includes('spacer')) return null;
  if (isJunkNewsImage(value)) return null;
  return value;
}

export function extractAllImagesFromRssItem(item: Record<string, unknown>): string[] {
  const found: string[] = [];

  const push = (url: string | null) => {
    const normalized = url ? normalizeNewsImageUrl(url) : null;
    if (normalized) found.push(normalized);
  };

  const enclosure = item.enclosure as { url?: string; type?: string } | undefined;
  if (enclosure?.url) {
    const type = enclosure.type?.toLowerCase() ?? '';
    if (!type || type.startsWith('image') || type.includes('jpeg') || type.includes('png')) {
      push(enclosure.url);
    }
  }

  const mediaContent = item['media:content'];
  const mediaList = Array.isArray(mediaContent) ? mediaContent : mediaContent ? [mediaContent] : [];

  const mediaCandidates = [
    ...mediaList,
    item['media:thumbnail'],
    item['media:group'],
    item.mediaContent,
    item.mediaThumbnail,
    item.image,
    item.thumbnail,
    (item as { itunes?: { image?: string } }).itunes?.image,
  ];

  for (const candidate of mediaCandidates) {
    push(pickMediaUrl(candidate));
  }

  const html = String(
    item.content || item['content:encoded'] || item.summary || item.description || ''
  );

  const imgPatterns = [
    /<img[^>]+(?:data-src|data-original|data-lazy-src|src)=["']([^"']+)["']/gi,
    /property=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["']/gi,
    /content=["']([^"']+)["'][^>]+property=["']og:image(?::url)?["']/gi,
  ];

  for (const pattern of imgPatterns) {
    for (const match of html.matchAll(pattern)) {
      push(match[1]);
    }
  }

  return [...new Set(found)];
}

export function extractImageFromRssItem(item: Record<string, unknown>): string | null {
  return pickBestNewsImage(extractAllImagesFromRssItem(item));
}
