'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Languages } from 'lucide-react';
import {
  NEWS_CATEGORIES,
  getCategoryLabel,
  type NewsCategorySlug,
  type NewsLanguage,
} from '@/lib/newsFeeds';
import { encodeNewsArticleId, NEWS_CACHE_PREFIX } from '@/lib/newsId';
import { useUserLocationState } from '@/hooks/useUserCoords';
import { stripHtml } from '@/lib/stripHtml';

const PAGE_COPY = {
  hi: {
    category: 'श्रेणी',
    newsIn: 'हिंदी',
    emptyTitle: 'अभी कोई समाचार नहीं',
    emptyBody: (label: string) => `${label} के लिए समाचार उपलब्ध नहीं हैं।`,
    emptyLocal: 'स्थानीय समाचार के लिए शहर चुनें या लोकेशन चालू करें।',
    detecting: 'स्थान पता किया जा रहा है…',
    retry: 'फिर से लोड करें',
    enableLocation: 'लोकेशन चालू करें',
  },
  en: {
    category: 'Category',
    newsIn: 'English',
    emptyTitle: 'No stories right now',
    emptyBody: (label: string) => `Nothing available for ${label} at the moment.`,
    emptyLocal: 'Pick a city or enable location for local headlines.',
    detecting: 'Detecting location…',
    retry: 'Reload',
    enableLocation: 'Enable location',
  },
} as const;

const MAX_ITEMS = 24;

function parseCityFromLocation(location: string | null): string | null {
  if (!location) return null;
  const parts = location.split(',').map((p) => p.trim()).filter(Boolean);
  return parts[parts.length - 1] ?? null;
}

function NewsThumb({ src, alt }: { src: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(src);
  useEffect(() => setImgSrc(src), [src]);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      loading="lazy"
      className="h-full w-full object-cover"
      onError={() =>
        setImgSrc(
          'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=600'
        )
      }
    />
  );
}

export default function NewsPageContent() {
  const [articles, setArticles] = useState<
    Array<{
      id: string;
      title: string;
      excerpt: string;
      image: string;
      source: string;
      date: string;
      category: string;
      link: string;
    }>
  >([]);
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
  const isResolvingLocal = isLocating || isResolvingCity;
  const copy = PAGE_COPY[language];

  const selectedCategory =
    NEWS_CATEGORIES.find((c) => c.slug === selectedSlug) ?? NEWS_CATEGORIES[0];
  const categoryLabel = getCategoryLabel(selectedCategory, language);
  const displayLabel =
    selectedSlug === 'local' && effectiveSearchLocation
      ? `${categoryLabel} · ${effectiveSearchLocation}`
      : selectedSlug === 'local' && localState
        ? `${categoryLabel} · ${localState}`
        : categoryLabel;

  const fetchNews = useCallback(
    async (slug: NewsCategorySlug, lang: NewsLanguage) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ category: slug, lang });
        if (slug === 'local') {
          if (localCity) params.set('city', localCity);
          if (localState) params.set('state', localState);
        }
        const res = await fetch(`/api/news?${params.toString()}`);
        const data = await res.json();
        if (data.success) setArticles(data.articles.slice(0, MAX_ITEMS));
        else setArticles([]);
      } catch {
        setArticles([]);
      } finally {
        setLoading(false);
      }
    },
    [localCity, localState]
  );

  useEffect(() => {
    if (selectedSlug === 'local' && isResolvingLocal) {
      setLoading(true);
      return;
    }
    fetchNews(selectedSlug, language);
  }, [selectedSlug, language, fetchNews, isResolvingLocal]);

  const cacheMeta = (item: (typeof articles)[0]) => {
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
      /* ignore */
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] pb-16">
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900"
          >
            <ArrowLeft size={15} />
            Home
          </Link>
          <p className="text-sm text-neutral-500">FinderB</p>
          <h1 className="mt-1 font-[family-name:var(--font-outfit)] text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            News
          </h1>
          <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-neutral-600">
            Headlines from trusted sources — local, national, and by topic. Updated throughout the
            day.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-4 border-b border-neutral-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-neutral-600">
            {copy.category}: <span className="font-medium text-neutral-900">{displayLabel}</span>
            <span className="mx-1.5 text-neutral-300">·</span>
            {copy.newsIn}
          </p>
          <div className="flex items-center gap-2">
            <Languages size={14} className="text-neutral-400" aria-hidden />
            <div className="inline-flex rounded-md border border-neutral-300 p-0.5">
              {(['hi', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                    language === lang
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {lang === 'hi' ? 'हिंदी' : 'English'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {NEWS_CATEGORIES.map((cat) => {
            const active = selectedSlug === cat.slug;
            const label = getCategoryLabel(cat, language);
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setSelectedSlug(cat.slug)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {selectedSlug === 'local' && isResolvingLocal && (
          <p className="mt-4 text-sm text-neutral-500">{copy.detecting}</p>
        )}

        {loading ? (
          <ul className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200">
            {[1, 2, 3, 4, 5].map((i) => (
              <li key={i} className="flex gap-4 py-4 animate-pulse">
                <div className="h-20 w-28 shrink-0 rounded bg-neutral-200" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-1/4 rounded bg-neutral-200" />
                  <div className="h-4 w-3/4 rounded bg-neutral-200" />
                  <div className="h-3 w-full rounded bg-neutral-200" />
                </div>
              </li>
            ))}
          </ul>
        ) : articles.length === 0 ? (
          <div className="mt-8 rounded-lg border border-neutral-200 bg-white px-6 py-12 text-center">
            <Calendar size={24} className="mx-auto text-neutral-300" />
            <p className="mt-3 font-medium text-neutral-800">{copy.emptyTitle}</p>
            <p className="mt-1 text-sm text-neutral-500">
              {selectedSlug === 'local' && !localCity && !localState
                ? copy.emptyLocal
                : copy.emptyBody(categoryLabel)}
            </p>
            {selectedSlug === 'local' && !localCity && !localState ? (
              <button
                type="button"
                onClick={requestLocation}
                className="mt-4 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
              >
                {copy.enableLocation}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fetchNews(selectedSlug, language)}
                className="mt-4 text-sm font-medium text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
              >
                {copy.retry}
              </button>
            )}
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200 bg-white">
            {articles.map((item) => {
              if (!item.link) return null;
              const articleId = encodeNewsArticleId(item.link);
              return (
                <li key={item.id}>
                  <Link
                    href={`/news/${articleId}`}
                    onClick={() => cacheMeta(item)}
                    className="group flex gap-4 py-4 transition-colors hover:bg-neutral-50 sm:gap-5 sm:py-5"
                  >
                    <div className="relative h-[4.5rem] w-28 shrink-0 overflow-hidden rounded-md bg-neutral-100 sm:h-24 sm:w-36">
                      <NewsThumb src={item.image} alt="" />
                    </div>
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-neutral-500">
                        <span className="font-medium text-neutral-700">{item.category}</span>
                        {item.source && (
                          <>
                            <span className="text-neutral-300">·</span>
                            <span className="truncate">{item.source}</span>
                          </>
                        )}
                        <span className="text-neutral-300">·</span>
                        <span>{item.date}</span>
                      </div>
                      <h2 className="mt-1 font-[family-name:var(--font-outfit)] text-base font-semibold leading-snug text-neutral-900 group-hover:underline sm:text-lg">
                        {item.title}
                      </h2>
                      {item.excerpt && (
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-neutral-600">
                          {stripHtml(item.excerpt)}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
