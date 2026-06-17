'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, ExternalLink } from 'lucide-react';
import { decodeNewsArticleId, isValidNewsUrl, NEWS_CACHE_PREFIX } from '@/lib/newsId';
import { stripHtml, decodeHtmlEntities } from '@/lib/stripHtml';

type NewsArticleView = {
  title: string;
  excerpt: string;
  contentHtml: string;
  image: string | null;
  source: string;
  date: string;
  category: string;
  sourceUrl: string;
};

export default function NewsReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [article, setArticle] = useState<NewsArticleView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadArticle() {
      const sourceUrl = decodeNewsArticleId(id);
      if (!isValidNewsUrl(sourceUrl)) {
        setError('Invalid news link.');
        setLoading(false);
        return;
      }

      let cached: Partial<NewsArticleView> = {};
      try {
        const raw = sessionStorage.getItem(`${NEWS_CACHE_PREFIX}${id}`);
        if (raw) cached = JSON.parse(raw);
      } catch {
        // ignore cache parse errors
      }

      const query = new URLSearchParams({
        url: sourceUrl,
        title: cached.title || '',
        excerpt: cached.excerpt || '',
        image: cached.image || '',
        source: cached.source || '',
        date: cached.date || '',
        category: cached.category || '',
      });

      try {
        const res = await fetch(`/api/news/article?${query.toString()}`);
        const data = await res.json();

        if (!data.success || !data.article) {
          throw new Error(data.error || 'Could not load article');
        }

        setArticle(data.article);
      } catch (err) {
        if (cached.title) {
          setArticle({
            title: decodeHtmlEntities(cached.title),
            excerpt: stripHtml(cached.excerpt || cached.title),
            contentHtml: `<p>${stripHtml(cached.excerpt || cached.title)}</p>`,
            image: cached.image || null,
            source: cached.source || 'Source',
            date: cached.date || 'Recently',
            category: cached.category || 'News',
            sourceUrl,
          });
        } else {
          setError(err instanceof Error ? err.message : 'Could not load article');
        }
      } finally {
        setLoading(false);
      }
    }

    loadArticle();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafaf9] pt-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-800" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafaf9] px-4 pt-20">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-lg font-semibold text-neutral-900">Story unavailable</h1>
          <p className="text-sm text-neutral-600">{error || 'Unable to load this article.'}</p>
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-800 underline underline-offset-2"
          >
            <ArrowLeft size={15} />
            Back to FinderB News
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] pb-16">
      <div className="border-b border-neutral-200 bg-white pt-[4.25rem] sm:pt-24">
        <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900"
          >
            <ArrowLeft size={15} />
            FinderB News
          </Link>
        </div>
      </div>

      <article className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
          <span className="font-medium text-neutral-700">{article.category}</span>
          <span className="text-neutral-300">·</span>
          <span className="inline-flex items-center gap-1">
            <Calendar size={11} />
            {article.date}
          </span>
          <span className="text-neutral-300">·</span>
          <span>{article.source}</span>
        </div>

        <h1 className="font-[family-name:var(--font-outfit)] text-2xl font-semibold leading-snug tracking-tight text-neutral-900 sm:text-[1.75rem]">
          {article.title}
        </h1>

        {article.image && (
          <div className="relative mt-6 aspect-[16/10] overflow-hidden rounded-md border border-neutral-200 bg-neutral-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.image} alt="" className="h-full w-full object-cover" />
          </div>
        )}

        {article.excerpt && (
          <p className="mt-6 border-l-2 border-neutral-300 pl-4 text-[15px] leading-relaxed text-neutral-600">
            {stripHtml(article.excerpt)}
          </p>
        )}

        <div
          className="news-article-body mt-6 text-[15px] leading-7 text-neutral-700 [&_p]:mb-4"
          dangerouslySetInnerHTML={{ __html: article.contentHtml }}
        />

        <div className="mt-10 border-t border-neutral-200 pt-6">
          <p className="text-sm text-neutral-600">Read the full story at the original publisher.</p>
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition-colors hover:border-neutral-400 hover:bg-neutral-50"
          >
            Continue on {article.source}
            <ExternalLink size={14} />
          </a>
        </div>
      </article>
    </div>
  );
}
