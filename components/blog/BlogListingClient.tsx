'use client';

import { useState, useEffect } from 'react';
import { articles } from '@/lib/mockData';
import { getBlogs } from '@/app/actions/blog';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, ArrowRight, ArrowLeft } from 'lucide-react';
import { stripHtml } from '@/lib/stripHtml';

export default function BlogListingClient({
  initialBlogs = [],
}: {
  initialBlogs?: any[];
}) {
  const [realBlogs, setRealBlogs] = useState<any[]>(initialBlogs.length > 0 ? initialBlogs : articles);
  const [loading, setLoading] = useState(initialBlogs.length === 0);

  useEffect(() => {
    if (initialBlogs.length > 0) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      const result = await getBlogs();
      if (result.success && result.blogs && result.blogs.length > 0) {
        setRealBlogs(result.blogs);
      }
      setLoading(false);
    }
    fetchData();
  }, [initialBlogs.length]);

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
            FinderB <span className="text-[#2563eb]">Blog</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b] sm:text-base">
            Guides, tips, and local insights to help you discover trusted services and places
            across India.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-xl border border-gray-100 bg-white"
              >
                <div className="aspect-[16/10] bg-slate-200" />
                <div className="space-y-3 p-4">
                  <div className="h-3 w-1/4 rounded bg-slate-200" />
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                  <div className="h-3 w-full rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : realBlogs.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white px-6 py-16 text-center">
            <p className="text-base font-semibold text-[#1e293b]">No articles yet</p>
            <p className="mt-2 text-sm text-[#64748b]">Check back soon for new posts.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {realBlogs.map((article) => (
              <Link
                key={article.id}
                href={`/blog/${article.slug || article.id}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>

                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <div className="mb-2 flex items-center gap-1.5 text-xs text-[#64748b]">
                    <Calendar size={13} className="text-[#94a3b8]" />
                    <span>{article.date}</span>
                  </div>

                  <h2 className="line-clamp-2 text-[15px] font-bold leading-snug text-[#1e293b] transition-colors group-hover:text-[#2563eb] sm:text-base">
                    {article.title}
                  </h2>

                  <p className="mt-2 line-clamp-2 flex-1 text-[13px] leading-relaxed text-[#64748b]">
                    {stripHtml(article.excerpt || '')}
                  </p>

                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563eb]">
                    Read article
                    <ArrowRight
                      size={15}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
