import type { NewsArticle } from './news';

type Stashed = NewsArticle & { stashedAt: number };

const store = new Map<string, Stashed>();

function hashId(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `n_${(h >>> 0).toString(36)}`;
}

/** Stash full article before navigation — Expo params mangle long Google News URLs. */
export function stashNewsArticle(article: NewsArticle): string {
  const id = hashId(article.link || article.id || article.title);
  store.set(id, { ...article, stashedAt: Date.now() });
  // Keep memory bounded
  if (store.size > 40) {
    const oldest = [...store.entries()].sort(
      (a, b) => a[1].stashedAt - b[1].stashedAt,
    )[0];
    if (oldest) store.delete(oldest[0]);
  }
  return id;
}

export function getStashedNewsArticle(id: string | undefined): NewsArticle | null {
  if (!id) return null;
  return store.get(id) ?? null;
}
