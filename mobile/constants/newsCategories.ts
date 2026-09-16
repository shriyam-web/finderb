export type NewsCategorySlug =
  | 'local'
  | 'politics'
  | 'business'
  | 'sports'
  | 'cricket'
  | 'bollywood'
  | 'technology'
  | 'real-estate'
  | 'startups';

export type NewsLanguage = 'hi' | 'en';

export type NewsCategory = {
  slug: NewsCategorySlug;
  labelHi: string;
  labelEn: string;
  icon:
    | 'location-outline'
    | 'flag-outline'
    | 'briefcase-outline'
    | 'football-outline'
    | 'baseball-outline'
    | 'film-outline'
    | 'hardware-chip-outline'
    | 'home-outline'
    | 'rocket-outline';
};

export const HOME_NEWS_LIMIT = 4;

export const NEWS_CATEGORIES: NewsCategory[] = [
  { slug: 'local', labelHi: 'स्थानीय', labelEn: 'Local', icon: 'location-outline' },
  { slug: 'politics', labelHi: 'राजनीति', labelEn: 'Politics', icon: 'flag-outline' },
  { slug: 'business', labelHi: 'व्यापार', labelEn: 'Business', icon: 'briefcase-outline' },
  { slug: 'sports', labelHi: 'खेल', labelEn: 'Sports', icon: 'football-outline' },
  { slug: 'cricket', labelHi: 'क्रिकेट', labelEn: 'Cricket', icon: 'baseball-outline' },
  { slug: 'bollywood', labelHi: 'मनोरंजन', labelEn: 'Entertainment', icon: 'film-outline' },
  { slug: 'technology', labelHi: 'तकनीक', labelEn: 'Tech', icon: 'hardware-chip-outline' },
  { slug: 'real-estate', labelHi: 'रियल एस्टेट', labelEn: 'Real Estate', icon: 'home-outline' },
  { slug: 'startups', labelHi: 'स्टार्टअप', labelEn: 'Startups', icon: 'rocket-outline' },
];

/** Soft solid placeholder tones — never stock wallpapers. */
export const NEWS_PLACEHOLDER_TONES: Record<
  NewsCategorySlug,
  { bg: string; fg: string }
> = {
  local: { bg: '#E8F1F8', fg: '#215481' },
  politics: { bg: '#EEF0F5', fg: '#3D4A63' },
  business: { bg: '#EAF4EF', fg: '#2F6B4F' },
  sports: { bg: '#FFF1E8', fg: '#B85C1A' },
  cricket: { bg: '#EAF7EE', fg: '#2F7D57' },
  bollywood: { bg: '#F5EEF8', fg: '#6B3D7A' },
  technology: { bg: '#EAF2F8', fg: '#1A6BB5' },
  'real-estate': { bg: '#F3F0EA', fg: '#6B5A3E' },
  startups: { bg: '#EEF4F9', fg: '#215481' },
};

const STOCK_OR_JUNK =
  /unsplash\.com|pexels\.com|pixabay\.com|images\.unsplash|source\.unsplash|news\.google\.com|gstatic\.com\/images|\/favicon|apple-touch-icon|1x1|pixel\.gif|spacer\.gif|placeholder|logo\.(?:png|jpg|svg)/i;

export function newsCategoryLabel(
  slug: NewsCategorySlug,
  lang: NewsLanguage,
): string {
  const cat = NEWS_CATEGORIES.find((c) => c.slug === slug);
  if (!cat) return slug;
  return lang === 'en' ? cat.labelEn : cat.labelHi;
}

export function newsPlaceholderTone(slug?: string) {
  const key = (slug || 'local') as NewsCategorySlug;
  return NEWS_PLACEHOLDER_TONES[key] || NEWS_PLACEHOLDER_TONES.local;
}

/** True only for real article media — stock wallpaper URLs are rejected. */
export function isUsableNewsImage(url: string | null | undefined): boolean {
  const value = url?.trim() || '';
  if (!/^https?:\/\//i.test(value)) return false;
  if (STOCK_OR_JUNK.test(value)) return false;
  return true;
}

/**
 * Keep publisher images; strip stock/junk. Never invent Unsplash wallpapers.
 */
export function ensureNewsImages<
  T extends {
    image: string | null;
    categorySlug?: string;
  },
>(articles: T[], _slug: string): T[] {
  return articles.map((article) => {
    if (isUsableNewsImage(article.image)) return article;
    return { ...article, image: null };
  });
}
