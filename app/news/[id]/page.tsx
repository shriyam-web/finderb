'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, ExternalLink, Newspaper } from 'lucide-react';
import { decodeNewsArticleId, isValidNewsUrl, NEWS_CACHE_PREFIX } from '@/lib/newsId';
import { stripHtml } from '@/lib/stripHtml';

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
            title: cached.title,
            excerpt: stripHtml(cached.excerpt || cached.title),
            contentHtml: `<p>${stripHtml(cached.excerpt || cached.title)}</p>`,
            image: cached.image || null,
            source: cached.source || 'स्रोत',
            date: cached.date || 'हाल ही में',
            category: cached.category || 'समाचार',
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
      <div className="flex min-h-screen items-center justify-center bg-white pt-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2563eb] border-t-transparent" />
          <p className="text-sm text-[#64748b]">समाचार लोड हो रहा है...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 pt-20">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-xl font-bold text-[#1e293b]">समाचार उपलब्ध नहीं</h1>
          <p className="text-sm text-[#64748b]">{error || 'Unable to load this story.'}</p>
          <Link
            href="/#news"
            className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white"
          >
            <ArrowLeft size={16} />
            वापस समाचार पर
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-12">
      <div className="border-b border-gray-100 bg-white pt-[4.25rem] sm:pt-24">
        <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
          <Link
            href="/#news"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#64748b] hover:text-[#2563eb]"
          >
            <ArrowLeft size={16} />
            वापस समाचार
          </Link>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-[#64748b] sm:text-xs">
          <span className="rounded-md bg-[#eff6ff] px-2 py-0.5 text-[10px] font-bold text-[#2563eb]">
            {article.category}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar size={12} />
            {article.date}
          </span>
          <span className="inline-flex items-center gap-1">
            <Newspaper size={12} />
            {article.source}
          </span>
        </div>

        <h1 className="mb-5 text-[1.35rem] font-bold leading-snug tracking-tight text-[#1e293b] sm:text-2xl">
          {article.title}
        </h1>

        {article.image && (
          <div className="relative mb-6 aspect-[16/10] overflow-hidden rounded-xl border border-gray-100 sm:mb-8 sm:aspect-[2/1]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.image}
              alt={article.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {article.excerpt && (
          <p className="mb-6 border-l-4 border-[#2563eb] pl-4 text-[15px] leading-relaxed text-[#64748b] sm:mb-8">
            {stripHtml(article.excerpt)}
          </p>
        )}

        <div
          className="news-article-body text-[15px] leading-[1.75] text-[#334155] sm:text-base [&_p]:mb-4"
          dangerouslySetInnerHTML={{ __html: article.contentHtml }}
        />

        <div className="mt-10 rounded-xl border border-gray-100 bg-[#f8fafc] p-4 sm:p-5">
          <p className="mb-3 text-sm text-[#64748b]">
            पूरी खबर और अपडेट के लिए मूल स्रोत पर जाएँ।
          </p>
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-[#2563eb]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#2563eb] transition-colors hover:bg-[#eff6ff]"
          >
            {article.source} पर पढ़ें
            <ExternalLink size={15} />
          </a>
        </div>
      </article>
    </div>
  );
}
