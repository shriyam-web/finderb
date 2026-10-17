/** Max words for merchant “About Business” in settings. */
export const ABOUT_BUSINESS_MAX_WORDS = 500;

const MARKS = [
  { token: '**', type: 'bold' },
  { token: '__', type: 'underline' },
  { token: '*', type: 'italic' },
] as const;

export type AboutMark = (typeof MARKS)[number]['type'];

export type AboutNode =
  | { type: 'text'; text: string }
  | { type: 'break' }
  | { type: AboutMark; children: AboutNode[] };

/** Visible copy with bold, italic, and underline markers removed. */
export function plainAboutText(text: string): string {
  return text.replace(/\*\*|__|\*/g, '');
}

export function countAboutWords(text: string): number {
  const trimmed = plainAboutText(text).trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function trimAboutToWordLimit(text: string, maxWords = ABOUT_BUSINESS_MAX_WORDS): string {
  if (countAboutWords(text) <= maxWords) return text;
  const parts = text.split(/(\s+)/);
  let words = 0;
  let out = '';
  for (const part of parts) {
    if (!part) continue;
    if (/^\s+$/.test(part)) {
      if (words > 0 && words < maxWords) out += part;
      continue;
    }
    if (!plainAboutText(part).trim()) {
      out += part;
      continue;
    }
    if (words >= maxWords) break;
    words += 1;
    out += part;
  }
  return out;
}

export function parseAboutMarkup(input: string): AboutNode[] {
  const nodes: AboutNode[] = [];
  let index = 0;
  let buffer = '';
  const flush = () => {
    if (!buffer) return;
    nodes.push({ type: 'text', text: buffer });
    buffer = '';
  };

  while (index < input.length) {
    if (input[index] === '\n') {
      flush();
      nodes.push({ type: 'break' });
      index += 1;
      continue;
    }
    const mark = MARKS.find((item) => input.startsWith(item.token, index));
    if (mark) {
      const closeAt = input.indexOf(mark.token, index + mark.token.length);
      if (closeAt > index + mark.token.length) {
        flush();
        nodes.push({
          type: mark.type,
          children: parseAboutMarkup(input.slice(index + mark.token.length, closeAt)),
        });
        index = closeAt + mark.token.length;
        continue;
      }
    }
    buffer += input[index];
    index += 1;
  }
  flush();
  return nodes;
}

/** Keep markers intact, but stop once the visible text reaches `limit`. */
export function previewAboutMarkup(text: string, limit = 180): { text: string; truncated: boolean } {
  if (plainAboutText(text).length <= limit) return { text, truncated: false };
  let visible = 0;
  let index = 0;
  const open: string[] = [];
  while (index < text.length && visible < limit) {
    if (text[index] === '\n') {
      index += 1;
      visible += 1;
      continue;
    }
    const mark = MARKS.find((item) => text.startsWith(item.token, index));
    if (mark) {
      if (open[open.length - 1] === mark.token) open.pop();
      else open.push(mark.token);
      index += mark.token.length;
      continue;
    }
    index += 1;
    visible += 1;
  }
  let slice = text.slice(0, index).trimEnd();
  while (open.length) slice += open.pop();
  return { text: `${slice}…`, truncated: true };
}

export function isAboutWithinWordLimit(
  text: string,
  maxWords = ABOUT_BUSINESS_MAX_WORDS,
): boolean {
  return countAboutWords(text) <= maxWords;
}
