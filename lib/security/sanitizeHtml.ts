const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'a',
  'img',
  'span',
  'div',
]);

const GLOBAL_ATTRS = new Set(['class', 'id', 'title', 'aria-label']);
const TAG_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'rel', 'target']),
  img: new Set(['src', 'alt', 'width', 'height', 'loading']),
};

function isSafeUrl(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  return (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('#')
  );
}

function sanitizeAttributes(tag: string, attrs: string): string {
  const allowed = new Set([...GLOBAL_ATTRS, ...(TAG_ATTRS[tag] ?? [])]);
  const cleaned: string[] = [];

  for (const match of attrs.matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    const name = match[1].toLowerCase();
    if (!allowed.has(name) || name.startsWith('on')) continue;

    const value = match[3] ?? match[4] ?? match[5] ?? '';
    if ((name === 'href' || name === 'src') && !isSafeUrl(value)) continue;

    cleaned.push(`${name}="${value.replace(/"/g, '&quot;')}"`);
  }

  return cleaned.length ? ` ${cleaned.join(' ')}` : '';
}

/** Strip dangerous markup while keeping basic article formatting. */
export function sanitizeRichHtml(html: string): string {
  if (!html) return '';

  let sanitized = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  sanitized = sanitized.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (full, tagName, attrs) => {
    const tag = String(tagName).toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return '';

    if (full.startsWith('</')) {
      return `</${tag}>`;
    }

    return `<${tag}${sanitizeAttributes(tag, String(attrs))}>`;
  });

  return sanitized.replace(/javascript:/gi, '');
}
