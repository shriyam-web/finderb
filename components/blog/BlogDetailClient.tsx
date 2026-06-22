'use client';

import { useState, useEffect } from 'react';
import { articles } from '@/lib/mockData';
import { getBlogBySlug } from '@/app/actions/blog';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Calendar, Share2, Bookmark, User } from 'lucide-react';
import { stripHtml } from '@/lib/stripHtml';

function shouldShowExcerpt(excerpt: string | undefined, title: string): boolean {
  const plain = stripHtml(excerpt || '').trim();
  if (plain.length < 60) return false;
  if (plain.toLowerCase().startsWith('conclusion')) return false;
  if (plain === stripHtml(title).trim()) return false;
  return true;
}

type BlogArticle = {
  id: string;
  title: string;
  slug?: string | null;
  excerpt?: string;
  content?: string;
  image: string;
  date: string;
  author?: string;
};

type BlogDetailClientProps = {
  slugOrId: string;
  initialArticle?: BlogArticle | null;
};

export default function BlogDetailClient({ slugOrId, initialArticle = null }: BlogDetailClientProps) {
  const [article, setArticle] = useState<BlogArticle | null>(initialArticle);
  const [loading, setLoading] = useState(!initialArticle);

  useEffect(() => {
    if (initialArticle) {
      setArticle(initialArticle);
      setLoading(false);
      return;
    }

    async function fetchBlog() {
      if (!slugOrId) return;

      const mockArticle = articles.find((a) => a.id === slugOrId);
      if (mockArticle) {
        setArticle(mockArticle as BlogArticle);
        setLoading(false);
        return;
      }

      const result = await getBlogBySlug(slugOrId);
      if (result.success && result.blog) {
        setArticle(result.blog);
      }
      setLoading(false);
    }
    fetchBlog();
  }, [slugOrId, initialArticle]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white pt-20">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2563eb] border-t-transparent" />
          <p className="text-sm font-medium text-[#64748b]">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 pt-20">
        <div className="max-w-md space-y-6 text-center">
          <h1 className="text-2xl font-bold text-[#1e293b]">Article not found</h1>
          <p className="text-sm text-[#64748b]">
            We couldn&apos;t find the article you&apos;re looking for.
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center justify-center rounded-xl bg-[#2563eb] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
          >
            Browse articles
          </Link>
        </div>
      </div>
    );
  }

  const showExcerpt = shouldShowExcerpt(article.excerpt, article.title);
  const articleHtml = article.content?.includes('<')
    ? article.content
    : `<p>${(article.content || 'Content not available.').replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br />')}</p>`;

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-12">
      <div className="border-b border-gray-100 bg-white pt-[4.25rem] sm:pt-24">
        <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#64748b] transition-colors hover:text-[#2563eb]"
          >
            <ArrowLeft size={16} />
            Back to articles
          </Link>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-[#64748b] sm:text-xs">
          <span className="inline-flex items-center gap-1">
            <Calendar size={12} className="text-[#94a3b8]" />
            {article.date}
          </span>
          <span className="hidden sm:inline text-[#cbd5e1]">·</span>
          <span className="inline-flex items-center gap-1">
            <User size={12} className="text-[#94a3b8]" />
            {article.author || 'FinderB Admin'}
          </span>
          <span className="hidden sm:inline text-[#cbd5e1]">·</span>
          <span>5 min read</span>
        </div>

        <h1 className="mb-5 text-[1.35rem] font-bold leading-snug tracking-tight text-[#1e293b] sm:text-2xl lg:text-[1.75rem]">
          {article.title}
        </h1>

        <div className="relative mb-6 aspect-[16/10] overflow-hidden rounded-xl border border-gray-100 sm:mb-8 sm:aspect-[2/1]">
          <Image
            src={article.image}
            alt={article.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>

        {showExcerpt && (
          <p className="mb-6 border-l-4 border-[#2563eb] pl-4 text-[15px] leading-relaxed text-[#64748b] sm:mb-8">
            {stripHtml(article.excerpt || '')}
          </p>
        )}

        <div
          className="article-content text-[15px] leading-[1.75] text-[#334155] sm:text-base [&_a]:text-[#2563eb] [&_a]:underline [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-[#e2e8f0] [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-[#1e293b] sm:[&_h2]:text-xl [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[#1e293b] sm:[&_h3]:text-lg [&_img]:my-4 [&_img]:rounded-lg [&_li]:mb-1 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: articleHtml }}
        />

        <div className="mt-10 flex flex-col gap-4 border-t border-gray-100 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {['Local', 'Insights', 'Guide', 'India'].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-gray-100 bg-[#f8fafc] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#64748b]"
              >
                #{tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-[#475569] transition-colors hover:border-[#2563eb]/30 hover:text-[#2563eb]"
            >
              <Share2 size={14} />
              Share
            </button>
            <button
              type="button"
              className="rounded-lg border border-gray-200 bg-white p-2 text-[#94a3b8] transition-colors hover:text-[#2563eb]"
              aria-label="Bookmark"
            >
              <Bookmark size={18} />
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
