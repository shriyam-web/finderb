'use client';

import { articles } from '@/lib/mockData';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, ArrowRight, ArrowLeft } from 'lucide-react';

export default function BlogListingPage() {
  return (
    <div className="min-h-screen bg-gray-950 pb-20 pt-32 lg:pt-48">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 lg:mb-16">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Back to Home</span>
          </Link>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-6">
            Blog & Local <span className="text-secondary">Insights</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl font-medium leading-relaxed">
            Discover the best local services, travel guides, and expert advice to help you navigate your city.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {articles.map((article) => (
            <Link key={article.id} href={`/blog/${article.id}`} className="group flex flex-col">
              <div className="relative h-64 sm:h-72 rounded-[2.5rem] overflow-hidden mb-6 shadow-2xl shadow-black/20 bg-gray-900">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-1000 opacity-80 group-hover:opacity-100"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute top-5 left-5 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg border border-white/10">
                  <Calendar size={12} className="text-secondary" />
                  <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{article.date}</span>
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-secondary transition-colors mb-3 leading-tight tracking-tight line-clamp-2">
                {article.title}
              </h3>
              <p className="text-gray-400 font-medium text-sm sm:text-base line-clamp-2 mb-6 leading-relaxed">
                {article.excerpt}
              </p>
              <div className="mt-auto flex items-center gap-3 text-[10px] font-bold text-secondary uppercase tracking-[0.2em] group-hover:gap-4 transition-all">
                CONTINUE READING <ArrowRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
