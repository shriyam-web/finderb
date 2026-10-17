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

export function plainAboutText(text: string): string {
  return text.replace(/\*\*|__|\*/g, '');
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
