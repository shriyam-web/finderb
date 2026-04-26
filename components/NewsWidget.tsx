'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Calendar, ArrowRight } from 'lucide-react';
import { NewsArticle } from '@/lib/mockData';

const NEWS_CATEGORIES = ['Technology', 'Business', 'Startups', 'Local'];

export default function NewsWidget() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Technology');

  useEffect(() => {
    async function fetchNews() {
      setLoading(true);
      try {
        const res = await fetch(`/api/news?category=${selectedCategory.toLowerCase()}`);
        const data = await res.json();
        if (data.success) {
          setNews(data.articles);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, [selectedCategory]);

  const categories = NEWS_CATEGORIES;
  const filteredNews = news;

  if (loading) {
    return (
      <div className="flex overflow-x-auto pb-8 gap-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse bg-white rounded-2xl p-4 border border-slate-100 min-w-[220px] md:min-w-[260px] shrink-0">
            <div className="bg-slate-200 aspect-[16/9] rounded-xl mb-4"></div>
            <div className="h-2 bg-slate-200 rounded w-1/4 mb-3"></div>
            <div className="h-4 bg-slate-200 rounded w-3/4 mb-3"></div>
            <div className="h-2 bg-slate-200 rounded w-full mb-2"></div>
            <div className="h-2 bg-slate-200 rounded w-5/6"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
              selectedCategory === category
                ? 'bg-secondary text-white border-secondary shadow-md scale-105'
                : 'bg-white text-slate-500 border-slate-100 hover:border-secondary/30 hover:text-secondary'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="flex overflow-x-auto pb-8 gap-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {filteredNews.map((item) => (
          <a 
            key={item.id} 
            href={item.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group bg-white rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 flex flex-col min-w-[220px] md:min-w-[260px] shrink-0"
          >
          <div className="relative aspect-[16/9] rounded-xl overflow-hidden mb-4 shadow-sm">
            <Image
              src={item.image}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute top-3 left-3 flex gap-2">
              <span className="px-2 py-0.5 bg-secondary text-white rounded-full text-[8px] font-bold uppercase tracking-wider shadow-sm">
                {item.category}
              </span>
              {item.source && (
                <span className="px-2 py-0.5 bg-white/90 backdrop-blur-md rounded-full text-[8px] font-bold text-primary uppercase tracking-wider shadow-sm border border-slate-100">
                  {item.source}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <Calendar size={10} />
            <span className="text-[8px] font-bold uppercase tracking-widest">{item.date}</span>
          </div>
          <h3 className="text-sm font-bold text-primary group-hover:text-secondary transition-colors mb-2 line-clamp-2 leading-tight">
            {item.title}
          </h3>
          <p className="text-slate-500 text-[10px] font-medium line-clamp-2 mb-4 flex-grow">
            {item.excerpt}
          </p>
          <div className="flex items-center gap-2 text-[8px] font-black text-secondary uppercase tracking-[0.2em] group-hover:gap-3 transition-all mt-auto">
            Read Full Story <ArrowRight size={10} />
          </div>
        </a>
      ))}
    </div>
  </div>
);
}
