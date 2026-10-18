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

export const ABOUT_SINGLE_LANGUAGE_HINT =
  'Write this in one language only. Hindi and English together, or any mix of languages, will not be saved.';

export const ABOUT_MIXED_LANGUAGE_ERROR =
  'This about text uses more than one language. Rewrite the whole section in a single language, then save it.';

/** A single stray character from another script does not count as a second language. */
const MIXED_SCRIPT_MIN = 2;

function aboutScript(code: number): string | null {
  if (
    (code >= 0x41 && code <= 0x5a) ||
    (code >= 0x61 && code <= 0x7a) ||
    (code >= 0xc0 && code <= 0x24f)
  ) {
    return 'latin';
  }
  if (code >= 0x0900 && code <= 0x097f) {
    if (code >= 0x0964 && code <= 0x096f) return null;
    return 'devanagari';
  }
  if (code >= 0x0980 && code <= 0x09ff) return 'bengali';
  if (code >= 0x0a00 && code <= 0x0a7f) return 'gurmukhi';
  if (code >= 0x0a80 && code <= 0x0aff) return 'gujarati';
  if (code >= 0x0b00 && code <= 0x0b7f) return 'oriya';
  if (code >= 0x0b80 && code <= 0x0bff) return 'tamil';
  if (code >= 0x0c00 && code <= 0x0c7f) return 'telugu';
  if (code >= 0x0c80 && code <= 0x0cff) return 'kannada';
  if (code >= 0x0d00 && code <= 0x0d7f) return 'malayalam';
  if (code >= 0x0600 && code <= 0x06ff || code >= 0x0750 && code <= 0x077f || code >= 0x08a0 && code <= 0x08ff) {
    if (code >= 0x0660 && code <= 0x0669) return null;
    return 'arabic';
  }
  if (code >= 0x0e00 && code <= 0x0e7f) return 'thai';
  if (code >= 0x0400 && code <= 0x04ff) return 'cyrillic';
  if (code >= 0x0590 && code <= 0x05ff) return 'hebrew';
  if (code >= 0x4e00 && code <= 0x9fff) return 'cjk';
  if (code >= 0x3040 && code <= 0x30ff) return 'japanese';
  if (code >= 0xac00 && code <= 0xd7af) return 'hangul';
  return null;
}

export const NAME_SINGLE_LANGUAGE_HINT =
  'Write the name in one language only. Hindi and English together, or any mix of languages, will not be saved.';

export const NAME_MIXED_LANGUAGE_ERROR =
  'This name uses more than one language. Rewrite the whole name in a single language.';

function mixedScriptError(text: string, message: string): string | null {
  const counts = new Map<string, number>();
  const plain = plainAboutText(text);
  for (let index = 0; index < plain.length; ) {
    const code = plain.codePointAt(index) ?? 0;
    index += code > 0xffff ? 2 : 1;
    const script = aboutScript(code);
    if (!script) continue;
    counts.set(script, (counts.get(script) || 0) + 1);
  }
  let used = 0;
  for (const count of counts.values()) {
    if (count >= MIXED_SCRIPT_MIN) used += 1;
  }
  return used > 1 ? message : null;
}

/** Null when the about text is empty or uses a single writing system. */
export function mixedAboutLanguageError(text: string): string | null {
  return mixedScriptError(text, ABOUT_MIXED_LANGUAGE_ERROR);
}

/** Null when the name is empty or uses a single writing system. */
export function mixedNameLanguageError(text: string): string | null {
  return mixedScriptError(text, NAME_MIXED_LANGUAGE_ERROR);
}
