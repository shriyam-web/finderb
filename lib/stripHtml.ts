const NAMED_ENTITIES: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  '#39': "'",
};

export function decodeHtmlEntities(text: string): string {
  if (!text) return '';

  return text
    .replace(/&#(\d+);/g, (_, code) => {
      const num = Number(code);
      return Number.isFinite(num) ? String.fromCharCode(num) : _;
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const num = parseInt(hex, 16);
      return Number.isFinite(num) ? String.fromCharCode(num) : _;
    })
    .replace(/&([a-zA-Z]+|#\d+);/g, (match, name) => {
      const key = name.toLowerCase();
      return NAMED_ENTITIES[key] ?? match;
    });
}

export function stripHtml(html: string): string {
  const stripped = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return decodeHtmlEntities(stripped);
}

export function cleanNewsText(text: string): string {
  return decodeHtmlEntities(stripHtml(text));
}
