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

/** Primary Hindi RSS feeds per category */
const HINDI_CATEGORY_FEEDS: Record<NewsCategorySlug, string[]> = {
  politics: [
    'https://feeds.bbci.co.uk/hindi/rss.xml',
    'https://www.livehindustan.com/rss/national',
    'https://feeds.feedburner.com/ndtvnews-hindi-news',
  ],
  business: [
    'https://www.livehindustan.com/rss/business',
    'https://hindi.economictimes.com/rssfeeds/2279790.cms',
  ],
  sports: [
    'https://www.livehindustan.com/rss/sports',
    'https://www.jagran.com/rss/sports.xml',
  ],
  cricket: [
    'https://www.jagran.com/rss/cricket.xml',
    'https://www.livehindustan.com/rss/sports',
  ],
  bollywood: [
    'https://www.livehindustan.com/rss/entertainment',
    'https://www.jagran.com/rss/entertainment.xml',
  ],
  technology: [
    'https://www.jagran.com/rss/technology.xml',
    'https://www.livehindustan.com/rss/gadgets',
  ],
  'real-estate': [
    'https://hindi.economictimes.com/rssfeeds/65552464.cms',
    'https://www.livehindustan.com/rss/business',
  ],
  local: [
    'https://www.livehindustan.com/rss/cities/delhi-news',
    'https://www.livehindustan.com/rss/national',
  ],
  startups: [
    'https://www.jagran.com/rss/business.xml',
    'https://hindi.economictimes.com/rssfeeds/2279790.cms',
  ],
};

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
  politics: [
    'https://www.thehindu.com/news/national/feeder/default.rss',
    'https://feeds.feedburner.com/ndtvnews-top-stories',
  ],
  business: [
    'https://economictimes.indiatimes.com/rssfeedsdefault.cms',
    'https://www.livemint.com/rss/homepage',
  ],
  sports: [
    'https://www.thehindu.com/sport/feeder/default.rss',
    'https://www.hindustantimes.com/feeds/rss/sports/rssfeed.xml',
  ],
  cricket: [
    'https://www.hindustantimes.com/feeds/rss/sports/cricket/rssfeed.xml',
    'https://www.espncricinfo.com/rss/content/story/feeds/0.xml',
  ],
  bollywood: [
    'https://www.hindustantimes.com/feeds/rss/entertainment/bollywood/rssfeed.xml',
    'https://www.livehindustan.com/rss/entertainment',
  ],
  technology: [
    'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
    'https://www.jagran.com/rss/technology.xml',
  ],
  'real-estate': [
    'https://economictimes.indiatimes.com/wealth/real-estate/rssfeeds/20000001.cms',
  ],
  local: [
    'https://www.thehindu.com/news/cities/Delhi/feeder/default.rss',
    'https://www.livehindustan.com/rss/cities/delhi-news',
  ],
  startups: [
    'https://yourstory.com/feed',
    'https://economictimes.indiatimes.com/rssfeeds/11993058.cms',
  ],
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

export function getLocalFeedUrls(location: LocalNewsLocation, lang: NewsLanguage): string[] {
  const urls: string[] = [];
  const city = location.city?.trim() || null;

  if (city) {
    const slug = toFeedSlug(city);
    if (slug) {
      urls.push(`https://www.livehindustan.com/rss/cities/${slug}-news`);
    }
    const hinduCity = toHinduCitySegment(city);
    if (hinduCity) {
      urls.push(`https://www.thehindu.com/news/cities/${hinduCity}/feeder/default.rss`);
    }
  }

  urls.push(...getFeedUrlsForCategory('local', lang));
  return [...new Set(urls)];
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

export function extractImageFromRssItem(item: Record<string, unknown>): string | null {
  const enclosure = item.enclosure as { url?: string; type?: string } | undefined;
  if (enclosure?.url && (!enclosure.type || enclosure.type.startsWith('image'))) {
    return enclosure.url;
  }

  const mediaCandidates = [
    item['media:content'],
    item['media:thumbnail'],
    item.mediaContent,
    item.mediaThumbnail,
    item.image,
  ];

  for (const candidate of mediaCandidates) {
    const url = pickMediaUrl(candidate);
    if (url) return url;
  }

  const html = String(item.content || item['content:encoded'] || item.summary || '');
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch?.[1]) return imgMatch[1];

  return null;
}

export function cleanNewsSnippet(raw: unknown, title?: string): string {
  let snippet = String(raw || '');
  if (snippet.includes('<')) {
    snippet = snippet.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  if (snippet.length < 20 || snippet.toLowerCase().includes('rss feed')) {
    return title || '';
  }
  return snippet;
}
