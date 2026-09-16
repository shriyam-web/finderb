import { Platform } from 'react-native';
import {
  ensureNewsImages,
  HOME_NEWS_LIMIT,
} from '../constants/newsCategories';
import { SITE_URL } from './supabase';
import { fetchNewsFromRss } from './newsRss';
import {
  decodeGoogleNewsUrlOffline,
  isGoogleNewsArticleUrl,
} from './googleNewsUrl';
import { createSessionMemo } from './sessionMemo';

export type NewsArticle = {
  id: string;
  title: string;
  link: string;
  excerpt: string;
  date: string;
  category: string;
  categorySlug: string;
  source: string;
  image: string | null;
};

const newsMemo = createSessionMemo<{ articles: NewsArticle[]; error?: string }>();

function isBlockedNewsSource(link?: string | null, source?: string | null): boolean {
  const hay = `${link || ''} ${source || ''}`.toLowerCase();
  return (
    hay.includes('amarujala.com') ||
    hay.includes('amar ujala') ||
    hay.includes('अमर उजाला')
  );
}

function withoutBlockedNews(articles: NewsArticle[]): NewsArticle[] {
  return articles.filter(
    (article) => !isBlockedNewsSource(article.link, article.source),
  );
}

function newsKey(options?: {
  category?: string;
  lang?: string;
  city?: string | null;
  state?: string | null;
  limit?: number;
}) {
  return [
    options?.category || 'local',
    options?.lang || 'hi',
    options?.city || '',
    options?.state || '',
    String(options?.limit ?? HOME_NEWS_LIMIT),
  ].join('|');
}

export function peekNewsArticles(options?: {
  category?: string;
  lang?: string;
  city?: string | null;
  state?: string | null;
  limit?: number;
}) {
  return newsMemo.peek(newsKey(options)) ?? null;
}

async function fetchSiteNews(options?: {
  category?: string;
  lang?: string;
  city?: string | null;
  state?: string | null;
  limit?: number;
}): Promise<{ articles: NewsArticle[]; error?: string }> {
  const params = new URLSearchParams({
    category: options?.category || 'local',
    lang: options?.lang || 'hi',
    limit: String(options?.limit ?? 16),
  });
  if (options?.city) params.set('city', options.city);
  if (options?.state) params.set('state', options.state);

  const apiUrl = `${SITE_URL}/api/news?${params.toString()}`;

  const tryFetch = async (url: string) => {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    const text = await res.text();
    let data: {
      success?: boolean;
      articles?: NewsArticle[];
      error?: string;
    };
    try {
      data = JSON.parse(text) as typeof data;
    } catch {
      throw new Error(`News server error (${res.status})`);
    }
    if (!data.success) {
      throw new Error(data.error || 'Failed to load news');
    }
    const slug = options?.category || 'local';
    const filtered = (data.articles || []).filter((a) =>
      Boolean(a?.link && a?.title),
    );
    return ensureNewsImages(filtered, slug).slice(0, options?.limit ?? HOME_NEWS_LIMIT);
  };

  try {
    const articles = await tryFetch(apiUrl);
    return { articles };
  } catch (error) {
    // Expo web: production API may lack CORS until deploy — proxy once.
    if (Platform.OS === 'web') {
      try {
        const proxied = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;
        const articles = await tryFetch(proxied);
        if (articles.length) return { articles };
      } catch {
        // fall through
      }
    }
    return {
      articles: [],
      error: error instanceof Error ? error.message : 'Failed to load news',
    };
  }
}

export async function fetchNewsArticles(options?: {
  category?: string;
  lang?: string;
  city?: string | null;
  state?: string | null;
  limit?: number;
  force?: boolean;
}): Promise<{ articles: NewsArticle[]; error?: string }> {
  const limit = options?.limit ?? HOME_NEWS_LIMIT;
  const slug = options?.category || 'local';
  const key = newsKey({ ...options, limit });

  const result = await newsMemo.get(
    key,
    async () => {
      const site = await fetchSiteNews({ ...options, limit });
      const siteArticles = withoutBlockedNews(site.articles);
      if (siteArticles.length > 0) {
        return {
          articles: ensureNewsImages(siteArticles, slug).slice(0, limit),
        };
      }

      const rss = await fetchNewsFromRss({
        limit: Math.max(limit * 2, 16),
        city: options?.city,
        category: slug,
        lang: options?.lang === 'en' ? 'en' : 'hi',
      });
      const rssArticles = withoutBlockedNews(rss.articles);
      if (rssArticles.length > 0) {
        return {
          articles: ensureNewsImages(rssArticles, slug).slice(0, limit),
        };
      }

      return {
        articles: [],
        error: site.error || rss.error || 'Failed to load news',
      };
    },
    Boolean(options?.force),
  );

  if (result.error && result.articles.length === 0) newsMemo.delete(key);
  return result;
}

/**
 * Homepage-style load: site API (Hindi local first), then RSS fallback.
 */
export async function fetchHomeNews(options?: {
  city?: string | null;
  state?: string | null;
  limit?: number;
}): Promise<{ articles: NewsArticle[]; error?: string }> {
  const limit = options?.limit ?? 8;
  const attempts: Array<{
    category: string;
    lang: string;
    city?: string | null;
    state?: string | null;
  }> = [
    {
      category: 'local',
      lang: 'hi',
      city: options?.city,
      state: options?.state,
    },
    {
      category: 'local',
      lang: 'en',
      city: options?.city,
      state: options?.state,
    },
    { category: 'politics', lang: 'hi' },
    { category: 'business', lang: 'hi' },
  ];

  let lastError = '';
  for (const attempt of attempts) {
    const site = await fetchSiteNews({ ...attempt, limit });
    if (site.articles.length > 0) return site;
    if (site.error) lastError = site.error;
  }

  const rss = await fetchNewsFromRss({
    limit,
    city: options?.city,
  });
  if (rss.articles.length > 0) return rss;

  return { articles: [], error: lastError || rss.error || 'No news found right now' };
}

export type NewsArticleDetail = {
  title: string;
  excerpt: string;
  contentHtml: string;
  image: string | null;
  source: string;
  date: string;
  category: string;
  sourceUrl: string;
  /** False when only a teaser was extracted — client should show in-app source reader. */
  hasFullContent?: boolean;
};

/** Fast resolve: Google News → publisher URL (no body extract). */
export async function resolveNewsPublisherUrl(
  url: string,
): Promise<{ url: string; source?: string } | null> {
  if (!url?.trim()) return null;

  // Instant offline decode when the GN id embeds the publisher URL.
  if (isGoogleNewsArticleUrl(url)) {
    const offline = decodeGoogleNewsUrlOffline(url);
    if (offline) {
      let source = '';
      try {
        source = new URL(offline).hostname.replace(/^www\./, '');
      } catch {
        /* ignore */
      }
      return { url: offline, source };
    }
  } else {
    // Direct publisher link — nothing to resolve.
    let source = '';
    try {
      source = new URL(url).hostname.replace(/^www\./, '');
    } catch {
      /* ignore */
    }
    return { url, source };
  }

  try {
    const params = new URLSearchParams({ url, lang: 'hi' });
    const apiUrl = `${SITE_URL}/api/news/resolve?${params.toString()}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);
    const res = await fetch(apiUrl, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = (await res.json()) as {
      success?: boolean;
      url?: string;
      source?: string;
    };
    if (!data.success || !data.url) return null;
    return { url: data.url, source: data.source };
  } catch {
    return null;
  }
}

export async function fetchNewsArticleDetail(input: {
  url: string;
  title?: string;
  excerpt?: string;
  image?: string;
  source?: string;
  date?: string;
  category?: string;
}): Promise<{ article: NewsArticleDetail | null; error?: string }> {
  const params = new URLSearchParams({ url: input.url });
  if (input.title) params.set('title', input.title.slice(0, 220));
  if (input.excerpt) params.set('excerpt', input.excerpt.slice(0, 400));
  if (input.image && /^https?:\/\//i.test(input.image)) {
    params.set('image', input.image.slice(0, 500));
  }
  if (input.source) params.set('source', input.source.slice(0, 80));
  if (input.date) params.set('date', input.date.slice(0, 40));
  if (input.category) params.set('category', input.category.slice(0, 40));
  params.set('lang', 'hi');

  const apiUrl = `${SITE_URL}/api/news/article?${params.toString()}`;

  const tryOnce = async (url: string) => {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const text = await res.text();
    let data: {
      success?: boolean;
      article?: NewsArticleDetail;
      error?: string;
    };
    try {
      data = JSON.parse(text) as typeof data;
    } catch {
      throw new Error(`Story server error (${res.status})`);
    }
    if (!data.success || !data.article) {
      throw new Error(data.error || 'Unable to show this story');
    }
    return data.article;
  };

  try {
    const article = await tryOnce(apiUrl);
    return { article };
  } catch (error) {
    if (Platform.OS === 'web') {
      try {
        const proxied = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;
        const article = await tryOnce(proxied);
        return { article };
      } catch {
        // fall through
      }
    }
    return {
      article: null,
      error: error instanceof Error ? error.message : 'Unable to show this story',
    };
  }
}
