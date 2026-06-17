'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  ArrowRight,
  Cpu,
  Briefcase,
  Trophy,
  Target,
  Film,
  Scale,
  Home,
  MapPin,
  Rocket,
  Languages,
  Newspaper,
} from 'lucide-react';
import { NewsArticle } from '@/lib/mockData';
import { stripHtml } from '@/lib/stripHtml';
import {
  NEWS_CATEGORIES,
  getCategoryLabel,
  type NewsCategorySlug,
  type NewsLanguage,
} from '@/lib/newsFeeds';
import { encodeNewsArticleId, NEWS_CACHE_PREFIX } from '@/lib/newsId';
import { useUserLocationState } from '@/hooks/useUserCoords';
import Link from 'next/link';

const CATEGORY_ICONS: Record<NewsCategorySlug, typeof Cpu> = {
  politics: Scale,
  business: Briefcase,
  sports: Trophy,
  cricket: Target,
  bollywood: Film,
  technology: Cpu,
  'real-estate': Home,
  local: MapPin,
  startups: Rocket,
};

const MAX_NEWS_ITEMS = 4;

const UI_COPY = {
  hi: {
    category: 'श्रेणी',
    newsIn: 'हिंदी समाचार',
    read: 'पढ़ें',
    emptyTitle: 'कोई समाचार नहीं मिला',
    emptyBody: (label: string) =>
      `${label} श्रेणी के लिए अभी समाचार उपलब्ध नहीं हैं। दूसरी श्रेणी आज़माएँ।`,
    emptyLocalNoLocation:
      'स्थानीय समाचार के लिए अपना शहर जानने हेतु लोकेशन की अनुमति दें, या ऊपर शहर चुनें।',
    detectingLocation: 'आपका स्थान पता किया जा रहा है…',
    retry: 'पुनः लोड करें',
    language: 'भाषा',
  },
  en: {
    category: 'Category',
    newsIn: 'English news',
    read: 'Read',
    emptyTitle: 'No news found',
    emptyBody: (label: string) =>
      `No articles are available for ${label} right now. Try another category.`,
    emptyLocalNoLocation:
      'Allow location access or pick your city above to see news for your area.',
    detectingLocation: 'Detecting your location…',
    retry: 'Reload',
    language: 'Language',
  },
} as const;

function parseCityFromLocation(location: string | null): string | null {
  if (!location) return null;
  const parts = location.split(',').map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1] ?? null;
}

function NewsThumbnail({ src, alt }: { src: string | null; alt: string }) {
  const [imgSrc, setImgSrc] = useState<string | null>(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setFailed(false);
  }, [src]);

  if (!imgSrc || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-300">
        <Newspaper size={22} aria-hidden />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      onError={() => setFailed(true)}
    />
  );
}

export default function NewsWidget() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState<NewsCategorySlug>('local');
  const [language, setLanguage] = useState<NewsLanguage>('hi');
  const {
    effectiveSearchLocation,
    userCityName,
    userState,
    isLocating,
    isResolvingCity,
    requestLocation,
  } = useUserLocationState();

  const localCity = userCityName || parseCityFromLocation(effectiveSearchLocation);
  const localState = userState;
  const isResolvingLocalLocation = isLocating || isResolvingCity;

  const selectedCategory =
    NEWS_CATEGORIES.find((c) => c.slug === selectedSlug) ?? NEWS_CATEGORIES[0];
  const copy = UI_COPY[language];
  const baseCategoryLabel = getCategoryLabel(selectedCategory, language);
  const categoryLabel =
    selectedSlug === 'local' && effectiveSearchLocation
      ? `${baseCategoryLabel} · ${effectiveSearchLocation}`
      : selectedSlug === 'local' && localState
        ? `${baseCategoryLabel} · ${localState}`
        : baseCategoryLabel;

  const fetchNews = useCallback(
    async (slug: NewsCategorySlug, lang: NewsLanguage) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          category: slug,
          lang,
          limit: String(MAX_NEWS_ITEMS),
        });
        if (slug === 'local') {
          if (localCity) params.set('city', localCity);
          if (localState) params.set('state', localState);
        }
        const res = await fetch(`/api/news?${params.toString()}`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`News API error ${res.status}: ${text.slice(0, 200)}`);
        }
        const data = await res.json();
        if (data.success) {
          setNews(data.articles);
        } else {
          throw new Error(data.error || 'News API returned no articles');
        }
      } catch (error) {
        console.error('Error fetching news:', error);
        setNews([]);
      } finally {
        setLoading(false);
      }
    },
    [localCity, localState]
  );

  useEffect(() => {
    if (selectedSlug === 'local' && isResolvingLocalLocation) {
      setLoading(true);
      return;
    }
    fetchNews(selectedSlug, language);
  }, [selectedSlug, language, fetchNews, isResolvingLocalLocation]);

  const filteredNews = news.slice(0, MAX_NEWS_ITEMS);

  const cacheArticleMeta = (item: NewsArticle) => {
    if (!item.link) return;
    try {
      const id = encodeNewsArticleId(item.link);
      sessionStorage.setItem(
        `${NEWS_CACHE_PREFIX}${id}`,
        JSON.stringify({
          title: item.title,
          excerpt: item.excerpt,
          image: item.image,
          source: item.source,
          date: item.date,
          category: item.category,
        })
      );
    } catch {
      // ignore storage errors
    }
  };

  const languageToggle = (
    <div className="flex items-center gap-2">
      <Languages size={14} className="shrink-0 text-[#94a3b8]" aria-hidden />
      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
        <button
          type="button"
          onClick={() => setLanguage('hi')}
          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors sm:px-3 sm:text-xs ${
            language === 'hi'
              ? 'bg-[#2563eb] text-white'
              : 'text-[#64748b] hover:text-[#2563eb]'
          }`}
        >
          हिंदी
        </button>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors sm:px-3 sm:text-xs ${
            language === 'en'
              ? 'bg-[#2563eb] text-white'
              : 'text-[#64748b] hover:text-[#2563eb]'
          }`}
        >
          English
        </button>
      </div>
    </div>
  );

  const categoryButtons = (
    <div className="flex max-w-full gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {NEWS_CATEGORIES.map((category) => {
        const Icon = CATEGORY_ICONS[category.slug];
        const active = selectedSlug === category.slug;
        const label = getCategoryLabel(category, language);
        return (
          <button
            key={category.slug}
            type="button"
            onClick={() => setSelectedSlug(category.slug)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold transition-all sm:text-[11px] ${
              active
                ? 'border-[#2563eb] bg-[#2563eb] text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-[#2563eb]/30 hover:text-[#2563eb]'
            }`}
          >
            <Icon size={12} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );

  const metaRow = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-medium text-[#64748b]">
        {copy.category}: <span className="font-semibold text-[#1e293b]">{categoryLabel}</span>
        <span className="mx-1.5 text-[#cbd5e1]">·</span>
        <span>{copy.newsIn}</span>
      </p>
      {languageToggle}
    </div>
  );

  if (loading) {
    return (
      <div className="w-full min-w-0 space-y-4 overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200" />
            {selectedSlug === 'local' && isResolvingLocalLocation && (
              <p className="text-[11px] font-medium text-[#64748b]">{copy.detectingLocation}</p>
            )}
          </div>
          {languageToggle}
        </div>
        {categoryButtons}
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex w-full min-w-0 animate-pulse gap-3 rounded-xl border border-slate-100 bg-white p-3"
          >
            <div className="h-20 w-20 shrink-0 rounded-lg bg-slate-200" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-2 w-1/4 rounded bg-slate-200" />
              <div className="h-4 w-3/4 rounded bg-slate-200" />
              <div className="h-2 w-full rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!loading && filteredNews.length === 0) {
    const showLocalLocationHint = selectedSlug === 'local' && !localCity && !localState;

    return (
      <div className="w-full min-w-0 space-y-5 overflow-hidden">
        {metaRow}
        {categoryButtons}
        <div className="space-y-4 rounded-xl border border-slate-100 bg-white p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
            <Calendar className="text-slate-300" size={22} />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-[#1e293b]">{copy.emptyTitle}</h3>
            <p className="mx-auto max-w-xs text-sm text-slate-500">
              {showLocalLocationHint ? copy.emptyLocalNoLocation : copy.emptyBody(categoryLabel)}
            </p>
          </div>
          {showLocalLocationHint ? (
            <button
              type="button"
              onClick={requestLocation}
              className="rounded-full bg-[#2563eb] px-5 py-2 text-xs font-bold text-white hover:bg-[#1d4ed8]"
            >
              {language === 'hi' ? 'लोकेशन चालू करें' : 'Enable location'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => fetchNews(selectedSlug, language)}
              className="rounded-full bg-[#2563eb] px-5 py-2 text-xs font-bold text-white hover:bg-[#1d4ed8]"
            >
              {copy.retry}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-4 overflow-hidden">
      {metaRow}
      {categoryButtons}

      <div className="w-full min-w-0 space-y-3">
        {filteredNews.map((item) => {
          if (!item.link) return null;
          const articleId = encodeNewsArticleId(item.link);

          return (
            <Link
              key={item.id}
              href={`/news/${articleId}`}
              onClick={() => cacheArticleMeta(item)}
              className="group flex w-full min-w-0 max-w-full gap-3 overflow-hidden rounded-xl border border-slate-100 bg-white p-3 transition-all hover:border-[#2563eb]/20 hover:bg-slate-50 sm:gap-4"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100 shadow-sm">
                <NewsThumbnail src={item.image} alt={item.title} />
              </div>

              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="mb-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="shrink-0 rounded bg-[#eff6ff] px-1.5 py-0.5 text-[9px] font-bold text-[#2563eb]">
                    {item.category}
                  </span>
                  {item.source && (
                    <span className="truncate text-[9px] font-medium text-slate-400">
                      {item.source}
                    </span>
                  )}
                  <span className="text-[9px] font-medium text-slate-400">{item.date}</span>
                </div>
                <h3 className="line-clamp-2 break-words text-[13px] font-bold leading-snug text-[#1e293b] transition-colors group-hover:text-[#2563eb]">
                  {item.title}
                </h3>
                {item.excerpt && (
                  <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-500">
                    {stripHtml(item.excerpt)}
                  </p>
                )}
                <div className="mt-1.5 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-[#2563eb] opacity-0 transition-opacity group-hover:opacity-100">
                  {copy.read} <ArrowRight size={10} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
