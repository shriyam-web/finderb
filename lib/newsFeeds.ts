import { decodeHtmlEntities } from '@/lib/stripHtml';

export type NewsCategorySlug =
  | 'politics'
  | 'business'
  | 'sports'
  | 'cricket'
  | 'bollywood'
  | 'technology'
  | 'real-estate'
  | 'local'
  | 'startups';

export type NewsLanguage = 'hi' | 'en';

export type NewsCategory = {
  slug: NewsCategorySlug;
  labelHi: string;
  labelEn: string;
};

export const NEWS_CATEGORIES: NewsCategory[] = [
  { slug: 'local', labelHi: 'स्थानीय', labelEn: 'Local' },
  { slug: 'politics', labelHi: 'राजनीति', labelEn: 'Politics' },
  { slug: 'business', labelHi: 'व्यापार', labelEn: 'Business' },
  { slug: 'sports', labelHi: 'खेल', labelEn: 'Sports' },
  { slug: 'cricket', labelHi: 'क्रिकेट', labelEn: 'Cricket' },
  { slug: 'bollywood', labelHi: 'मनोरंजन', labelEn: 'Entertainment' },
  { slug: 'technology', labelHi: 'तकनीक', labelEn: 'Technology' },
  { slug: 'real-estate', labelHi: 'रियल एस्टेट', labelEn: 'Real Estate' },
  { slug: 'startups', labelHi: 'स्टार्टअप', labelEn: 'Startups' },
];

/** Hindi RSS feeds — one primary topic feed per category (no shared national feeds) */
const HINDI_CATEGORY_FEEDS: Record<NewsCategorySlug, string[]> = {
  politics: [
    'https://www.amarujala.com/rss/india-news.xml',
    'https://feeds.bbci.co.uk/hindi/rss.xml',
  ],
  business: ['https://www.amarujala.com/rss/business.xml'],
  sports: ['https://www.amarujala.com/rss/sports.xml'],
  cricket: ['https://www.amarujala.com/rss/cricket.xml'],
  bollywood: ['https://www.amarujala.com/rss/entertainment.xml'],
  technology: ['https://www.amarujala.com/rss/technology.xml'],
  'real-estate': ['https://www.hindustantimes.com/feeds/rss/real-estate/rssfeed.xml'],
  local: [
    'https://www.amarujala.com/rss/delhi.xml',
    'https://www.amarujala.com/rss/lucknow.xml',
  ],
  startups: ['https://inc42.com/feed/'],
};

/** Categories that rely on Google News RSS when no dedicated publisher feed exists */
export const GOOGLE_PRIMARY_CATEGORIES: Partial<Record<NewsCategorySlug, NewsLanguage[]>> = {};

/** Google News Hindi fallback queries */
const HINDI_GOOGLE_QUERIES: Record<NewsCategorySlug, string> = {
  politics: 'भारत राजनीति समाचार',
  business: 'भारत व्यापार समाचार',
  sports: 'भारत खेल समाचार',
  cricket: 'क्रिकेट समाचार भारत',
  bollywood: 'बॉलीवुड मनोरंजन समाचार',
  technology: 'तकनीक समाचार भारत',
  'real-estate': 'रियल एस्टेट समाचार भारत',
  local: 'दिल्ली स्थानीय समाचार',
  startups: 'स्टार्टअप समाचार भारत',
};

const ENGLISH_CATEGORY_FEEDS: Record<NewsCategorySlug, string[]> = {
  politics: ['https://www.thehindu.com/news/national/feeder/default.rss'],
  business: ['https://economictimes.indiatimes.com/rssfeedsdefault.cms'],
  sports: ['https://www.hindustantimes.com/feeds/rss/sports/rssfeed.xml'],
  cricket: ['https://www.thehindu.com/sport/cricket/feeder/default.rss'],
  bollywood: ['https://www.hindustantimes.com/feeds/rss/entertainment/bollywood/rssfeed.xml'],
  technology: ['https://www.hindustantimes.com/feeds/rss/technology/rssfeed.xml'],
  'real-estate': ['https://www.hindustantimes.com/feeds/rss/real-estate/rssfeed.xml'],
  local: ['https://www.thehindu.com/news/cities/Delhi/feeder/default.rss'],
  startups: ['https://inc42.com/feed/'],
};

const ENGLISH_GOOGLE_QUERIES: Record<NewsCategorySlug, string> = {
  politics: 'India politics news',
  business: 'India business news',
  sports: 'India sports news',
  cricket: 'India cricket news',
  bollywood: 'Bollywood entertainment news India',
  technology: 'India technology news',
  'real-estate': 'India real estate news',
  local: 'Delhi local news India',
  startups: 'India startup news',
};

/** Category-specific fallback images when RSS has no thumbnail */
export const CATEGORY_FALLBACK_IMAGES: Record<NewsCategorySlug, string[]> = {
  politics: [
    'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1541872703-74c5e443d1fe?auto=format&fit=crop&q=80&w=400',
  ],
  business: [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400',
  ],
  sports: [
    'https://images.unsplash.com/photo-1461896756970-f49c121d7221?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=400',
  ],
  cricket: [
    'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?auto=format&fit=crop&q=80&w=400',
  ],
  bollywood: [
    'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&q=80&w=400',
  ],
  technology: [
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=400',
  ],
  'real-estate': [
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1582408921715-18e7806365c1?auto=format&fit=crop&q=80&w=400',
  ],
  local: [
    'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80&w=400',
  ],
  startups: [
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1519389443154-83917a254243?auto=format&fit=crop&q=80&w=400',
  ],
};

const DEFAULT_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&q=80&w=400',
];

export function normalizeCategorySlug(raw: string | null | undefined): NewsCategorySlug {
  const key = (raw || 'politics').toLowerCase().trim().replace(/\s+/g, '-');
  const aliases: Record<string, NewsCategorySlug> = {
    politics: 'politics',
    business: 'business',
    sports: 'sports',
    cricket: 'cricket',
    bollywood: 'bollywood',
    entertainment: 'bollywood',
    technology: 'technology',
    tech: 'technology',
    'real-estate': 'real-estate',
    realestate: 'real-estate',
    local: 'local',
    startups: 'startups',
    startup: 'startups',
  };
  return aliases[key] || 'politics';
}

export function normalizeNewsLanguage(raw: string | null | undefined): NewsLanguage {
  return raw === 'en' ? 'en' : 'hi';
}

export function getCategoryMeta(slug: NewsCategorySlug): NewsCategory {
  return NEWS_CATEGORIES.find((c) => c.slug === slug) ?? NEWS_CATEGORIES[0];
}

export function getCategoryLabel(meta: NewsCategory, lang: NewsLanguage): string {
  return lang === 'en' ? meta.labelEn : meta.labelHi;
}

export function getFeedUrlsForCategory(slug: NewsCategorySlug, lang: NewsLanguage): string[] {
  return lang === 'en' ? ENGLISH_CATEGORY_FEEDS[slug] : HINDI_CATEGORY_FEEDS[slug];
}

export function usesGoogleNewsPrimary(slug: NewsCategorySlug, lang: NewsLanguage): boolean {
  return GOOGLE_PRIMARY_CATEGORIES[slug]?.includes(lang) ?? false;
}

export function getGoogleNewsUrl(slug: NewsCategorySlug, lang: NewsLanguage): string {
  if (lang === 'en') {
    const q = encodeURIComponent(ENGLISH_GOOGLE_QUERIES[slug]);
    return `https://news.google.com/rss/search?q=${q}&hl=en-IN&gl=IN&ceid=IN:en`;
  }
  const q = encodeURIComponent(HINDI_GOOGLE_QUERIES[slug]);
  return `https://news.google.com/rss/search?q=${q}&hl=hi&gl=IN&ceid=IN:hi`;
}

function toFeedSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function toHinduCitySegment(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

export type LocalNewsLocation = {
  city: string | null;
  state: string | null;
};

const NCR_CITY_SLUGS = new Set([
  'noida',
  'greater-noida',
  'gurgaon',
  'gurugram',
  'ghaziabad',
  'faridabad',
  'delhi',
  'new-delhi',
]);

export function getLocalFeedUrls(location: LocalNewsLocation, lang: NewsLanguage): string[] {
  const urls: string[] = [];
  const city = location.city?.trim() || null;

  if (city) {
    const slug = toFeedSlug(city);
    if (slug) {
      urls.push(`https://www.amarujala.com/rss/${slug}.xml`);
      urls.push(`https://www.livehindustan.com/rss/cities/${slug}-news`);
    }
    const hinduCity = toHinduCitySegment(city);
    if (hinduCity) {
      urls.push(`https://www.thehindu.com/news/cities/${hinduCity}/feeder/default.rss`);
    }
    if (slug && NCR_CITY_SLUGS.has(slug)) {
      urls.push('https://www.thehindu.com/news/cities/Delhi/feeder/default.rss');
      urls.push('https://www.amarujala.com/rss/delhi.xml');
    }
    return [...new Set(urls)];
  }

  return getFeedUrlsForCategory('local', lang);
}

export function scoreLocalArticleRelevance(
  item: { title?: string; link?: string },
  city: string | null,
  state: string | null
): number {
  const title = (item.title || '').toLowerCase();
  const link = (item.link || '').toLowerCase();
  let score = 0;

  if (city) {
    const cityKey = city.toLowerCase();
    if (title.includes(cityKey)) score += 12;
    if (link.includes(cityKey)) score += 10;
  }

  if (state) {
    const stateKey = state.toLowerCase();
    if (title.includes(stateKey)) score += 4;
    if (link.includes(stateKey)) score += 3;
  }

  if (link.includes('amarujala.com') || link.includes('livehindustan.com')) score += 6;
  if (link.includes('thehindu.com/news/cities')) score += 8;
  if (link.includes('news.google.com')) score -= 4;

  return score;
}

export function getLocalGoogleNewsUrl(location: LocalNewsLocation, lang: NewsLanguage): string {
  const city = location.city?.trim() || null;
  const state = location.state?.trim() || null;

  if (lang === 'en') {
    const query = city
      ? `${city} local news India`
      : state
        ? `${state} news India`
        : ENGLISH_GOOGLE_QUERIES.local;
    return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
  }

  const query = city
    ? `${city} समाचार`
    : state
      ? `${state} समाचार`
      : HINDI_GOOGLE_QUERIES.local;
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=hi&gl=IN&ceid=IN:hi`;
}

/** @deprecated use NEWS_CATEGORIES */
export const HINDI_NEWS_CATEGORIES = NEWS_CATEGORIES;

export function getFallbackImages(slug: NewsCategorySlug): string[] {
  return CATEGORY_FALLBACK_IMAGES[slug] || DEFAULT_FALLBACK_IMAGES;
}

export { extractImageFromRssItem, normalizeNewsImageUrl } from '@/lib/newsImage';

export function cleanNewsSnippet(raw: unknown, title?: string): string {
  let snippet = String(raw || '');
  if (snippet.includes('<')) {
    snippet = snippet.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  snippet = decodeHtmlEntities(snippet);
  const cleanTitle = title ? decodeHtmlEntities(title) : '';
  if (snippet.length < 20 || snippet.toLowerCase().includes('rss feed')) {
    return cleanTitle;
  }
  return snippet;
}
