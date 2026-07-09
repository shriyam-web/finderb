'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Languages, Newspaper } from 'lucide-react';
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
  if (parts.length >= 2) {
    return parts[parts.length - 2] ?? null;
  }
  return parts[0] ?? null;
}

function NewsThumb({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-[#cbd5e1]">
        <Newspaper size={24} aria-hidden />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="h-full w-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export default function NewsPageContent() {
  const [articles, setArticles] = useState<
    Array<{
      id: string;
      title: string;
      excerpt: string;
      image: string | null;
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
        const params = new URLSearchParams({
          category: slug,
          lang,
          limit: String(MAX_ITEMS),
        });
        if (slug === 'local') {
          if (localCity) params.set('city', localCity);
          if (localState) params.set('state', localState);
        }
        const res = await fetch(`/api/news?${params.toString()}`);
        const data = await res.json();
        if (data.success) setArticles(data.articles);
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
    <div className="min-h-[calc(100dvh-6.75rem)] bg-[#f8fafc] pb-24 lg:min-h-screen lg:pb-12">
      <div className="border-b border-gray-100 bg-white pt-[4.25rem] sm:pt-24">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#64748b] transition-colors hover:text-[#2563eb]"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[#1e293b] sm:text-3xl">
            FinderB <span className="text-[#2563eb]">News</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b] sm:text-base">
            Headlines from trusted sources — local, national, and by topic. Updated throughout the
            day.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#64748b]">
            {copy.category}: <span className="font-semibold text-[#1e293b]">{displayLabel}</span>
            <span className="mx-1.5 text-[#cbd5e1]">·</span>
            {copy.newsIn}
          </p>
          <div className="flex items-center gap-2">
            <Languages size={14} className="shrink-0 text-[#94a3b8]" aria-hidden />
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
              {(['hi', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                    language === lang
                      ? 'bg-[#2563eb] text-white'
                      : 'text-[#64748b] hover:text-[#2563eb]'
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
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                  active
                    ? 'border-[#2563eb] bg-[#2563eb] text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-[#2563eb]/30 hover:text-[#2563eb]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {selectedSlug === 'local' && isResolvingLocal && (
          <p className="mt-4 text-sm text-[#64748b]">{copy.detecting}</p>
        )}

        {loading ? (
          <ul className="mt-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <li
                key={i}
                className="flex animate-pulse gap-4 rounded-xl border border-gray-100 bg-white p-4"
              >
                <div className="h-20 w-28 shrink-0 rounded-lg bg-slate-200" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-1/4 rounded bg-slate-200" />
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                  <div className="h-3 w-full rounded bg-slate-200" />
                </div>
              </li>
            ))}
          </ul>
        ) : articles.length === 0 ? (
          <div className="mt-8 rounded-xl border border-gray-100 bg-white px-6 py-16 text-center">
            <Calendar size={24} className="mx-auto text-[#cbd5e1]" />
            <p className="mt-3 text-base font-semibold text-[#1e293b]">{copy.emptyTitle}</p>
            <p className="mt-2 text-sm text-[#64748b]">
              {selectedSlug === 'local' && !localCity && !localState
                ? copy.emptyLocal
                : copy.emptyBody(categoryLabel)}
            </p>
            {selectedSlug === 'local' && !localCity && !localState ? (
              <button
                type="button"
                onClick={requestLocation}
                className="mt-4 rounded-full bg-[#2563eb] px-5 py-2 text-xs font-bold text-white hover:bg-[#1d4ed8]"
              >
                {copy.enableLocation}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fetchNews(selectedSlug, language)}
                className="mt-4 text-sm font-semibold text-[#2563eb] hover:underline"
              >
                {copy.retry}
              </button>
            )}
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {articles.map((item) => {
              if (!item.link) return null;
              const articleId = encodeNewsArticleId(item.link);
              return (
                <li key={item.id}>
                  <Link
                    href={`/news/${articleId}`}
                    onClick={() => cacheMeta(item)}
                    className="group flex gap-4 overflow-hidden rounded-xl border border-gray-100 bg-white p-4 shadow-[0_1px_4px_rgba(15,23,42,0.06)] transition-all hover:border-[#2563eb]/20 hover:shadow-md sm:gap-5 sm:p-5"
                  >
                    <div className="relative h-[4.5rem] w-28 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-24 sm:w-36">
                      <NewsThumb src={item.image} alt={item.title} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#64748b]">
                        <span className="rounded bg-[#eff6ff] px-1.5 py-0.5 text-[10px] font-bold text-[#2563eb]">
                          {item.category}
                        </span>
                        {item.source && (
                          <>
                            <span className="text-[#cbd5e1]">·</span>
                            <span className="truncate">{item.source}</span>
                          </>
                        )}
                        <span className="text-[#cbd5e1]">·</span>
                        <span>{item.date}</span>
                      </div>
                      <h2 className="mt-1.5 line-clamp-2 text-[15px] font-bold leading-snug text-[#1e293b] transition-colors group-hover:text-[#2563eb] sm:text-base">
                        {item.title}
                      </h2>
                      {item.excerpt && (
                        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-[#64748b]">
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
