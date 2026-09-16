import { Platform } from 'react-native';
import type { NewsArticle } from './news';

/**
 * Lightweight RSS → articles for the mobile app when FinderB /api/news
 * is unreachable (CORS on Expo web, offline edge, etc.).
 * Prefer publishers that extract cleanly for in-app reading.
 */

type Feed = {
  url: string;
  category: string;
  source: string;
  categorySlug: string;
};

const FEEDS_BY_CATEGORY: Record<string, Feed[]> = {
  local: [
    {
      url: 'https://www.thehindu.com/news/cities/Delhi/feeder/default.rss',
      category: 'स्थानीय',
      source: 'The Hindu',
      categorySlug: 'local',
    },
    {
      url: 'https://feeds.bbci.co.uk/hindi/rss.xml',
      category: 'स्थानीय',
      source: 'BBC हिंदी',
      categorySlug: 'local',
    },
    {
      url: 'https://www.hindustantimes.com/feeds/rss/cities/ncr-news/rssfeed.xml',
      category: 'स्थानीय',
      source: 'Hindustan Times',
      categorySlug: 'local',
    },
  ],
  politics: [
    {
      url: 'https://feeds.bbci.co.uk/hindi/rss.xml',
      category: 'राजनीति',
      source: 'BBC हिंदी',
      categorySlug: 'politics',
    },
    {
      url: 'https://www.thehindu.com/news/national/feeder/default.rss',
      category: 'राजनीति',
      source: 'The Hindu',
      categorySlug: 'politics',
    },
  ],
  business: [
    {
      url: 'https://feeds.feedburner.com/ndtvprofit-latest',
      category: 'व्यापार',
      source: 'NDTV Profit',
      categorySlug: 'business',
    },
    {
      url: 'https://economictimes.indiatimes.com/rssfeedsdefault.cms',
      category: 'व्यापार',
      source: 'Economic Times',
      categorySlug: 'business',
    },
  ],
  sports: [
    {
      url: 'https://www.hindustantimes.com/feeds/rss/sports/rssfeed.xml',
      category: 'खेल',
      source: 'Hindustan Times',
      categorySlug: 'sports',
    },
    {
      url: 'https://feeds.bbci.co.uk/hindi/rss.xml',
      category: 'खेल',
      source: 'BBC हिंदी',
      categorySlug: 'sports',
    },
  ],
  cricket: [
    {
      url: 'https://www.thehindu.com/sport/cricket/feeder/default.rss',
      category: 'क्रिकेट',
      source: 'The Hindu',
      categorySlug: 'cricket',
    },
  ],
  bollywood: [
    {
      url: 'https://www.hindustantimes.com/feeds/rss/entertainment/bollywood/rssfeed.xml',
      category: 'मनोरंजन',
      source: 'Hindustan Times',
      categorySlug: 'bollywood',
    },
  ],
  technology: [
    {
      url: 'https://www.hindustantimes.com/feeds/rss/technology/rssfeed.xml',
      category: 'तकनीक',
      source: 'Hindustan Times',
      categorySlug: 'technology',
    },
  ],
  'real-estate': [
    {
      url: 'https://www.hindustantimes.com/feeds/rss/real-estate/rssfeed.xml',
      category: 'रियल एस्टेट',
      source: 'Hindustan Times',
      categorySlug: 'real-estate',
    },
  ],
  startups: [
    {
      url: 'https://inc42.com/feed/',
      category: 'Startups',
      source: 'Inc42',
      categorySlug: 'startups',
    },
  ],
};

function decodeEntities(raw: string): string {
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16)),
    );
}

function tag(xml: string, name: string): string {
  const cdata = xml.match(
    new RegExp(`<${name}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${name}>`, 'i'),
  );
  if (cdata?.[1]) return decodeEntities(cdata[1].trim());
  const plain = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return plain?.[1] ? decodeEntities(plain[1].replace(/<[^>]+>/g, '').trim()) : '';
}

function extractImage(itemXml: string): string | null {
  const media = itemXml.match(
    /<media:content[^>]+url=["']([^"']+)["']/i,
  );
  if (media?.[1]) return media[1];
  const enclosure = itemXml.match(
    /<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image/i,
  );
  if (enclosure?.[1]) return enclosure[1];
  const img = itemXml.match(/<img[^>]+src=["']([^"']+)["']/i);
  return img?.[1] || null;
}

function parseItems(xml: string, feed: Feed): NewsArticle[] {
  const chunks = xml.split(/<item[\s>]/i).slice(1);
  const out: NewsArticle[] = [];
  for (const chunk of chunks) {
    const block = chunk.split(/<\/item>/i)[0] || '';
    const title = tag(block, 'title');
    const link =
      tag(block, 'link') ||
      block.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1] ||
      '';
    if (!title || !link) continue;
    const description = tag(block, 'description') || tag(block, 'content:encoded');
    const pubDate = tag(block, 'pubDate');
    out.push({
      id: link,
      title,
      excerpt: description.slice(0, 220),
      link,
      image: extractImage(block),
      source: feed.source,
      date: pubDate
        ? new Date(pubDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
          })
        : '',
      category: feed.category,
      categorySlug: feed.categorySlug,
    });
  }
  return out;
}

async function fetchFeedXml(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    if (Platform.OS === 'web') {
      try {
        const proxied = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const res = await fetch(proxied);
        if (!res.ok) return null;
        return await res.text();
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function fetchNewsFromRss(options?: {
  category?: string;
  limit?: number;
  city?: string | null;
  lang?: string;
}): Promise<{ articles: NewsArticle[]; error?: string }> {
  const category = (options?.category || 'local').toLowerCase();
  const limit = options?.limit ?? 24;
  const feeds =
    FEEDS_BY_CATEGORY[category] ||
    FEEDS_BY_CATEGORY.local ||
    Object.values(FEEDS_BY_CATEGORY).flat();

  const collected: NewsArticle[] = [];
  let lastError = '';

  for (const feed of feeds) {
    const xml = await fetchFeedXml(feed.url);
    if (!xml) {
      lastError = `Could not reach ${feed.source}`;
      continue;
    }
    collected.push(...parseItems(xml, feed));
    if (collected.length >= limit) break;
  }

  // Optional city bias when present in titles/links.
  const cityKey = options?.city?.trim().toLowerCase();
  if (cityKey) {
    collected.sort((a, b) => {
      const aHit =
        a.title.toLowerCase().includes(cityKey) ||
        a.link.toLowerCase().includes(cityKey)
          ? 1
          : 0;
      const bHit =
        b.title.toLowerCase().includes(cityKey) ||
        b.link.toLowerCase().includes(cityKey)
          ? 1
          : 0;
      return bHit - aHit;
    });
  }

  const seen = new Set<string>();
  const articles = collected
    .filter((item) => {
      if (seen.has(item.link)) return false;
      seen.add(item.link);
      return true;
    })
    .slice(0, limit);

  if (articles.length === 0) {
    return { articles: [], error: lastError || 'No news found right now' };
  }
  return { articles };
}
