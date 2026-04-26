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
          <div key={i} className="animate-pulse bg-white rounded-2xl p-4 border border-slate-100 min-w-[240px] md:min-w-[280px] w-[240px] md:w-[280px] shrink-0">
            <div className="bg-slate-200 h-32 md:h-40 w-full rounded-xl mb-4"></div>
            <div className="h-2 bg-slate-200 rounded w-1/4 mb-3"></div>
            <div className="h-4 bg-slate-200 rounded w-3/4 mb-3"></div>
            <div className="h-2 bg-slate-200 rounded w-full mb-1"></div>
            <div className="h-2 bg-slate-200 rounded w-full mb-1"></div>
            <div className="h-2 bg-slate-200 rounded w-full mb-1"></div>
            <div className="h-2 bg-slate-200 rounded w-full mb-1"></div>
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
            className="group bg-white rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 flex flex-col min-w-[240px] md:min-w-[280px] w-[240px] md:w-[280px] shrink-0"
          >
          <div className="relative h-32 md:h-40 w-full rounded-xl overflow-hidden mb-3 shadow-sm block">
            <Image
              src={item.image}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute top-2 left-2 flex gap-1">
              <span className="px-1.5 py-0.5 bg-secondary text-white rounded-full text-[7px] font-bold uppercase tracking-wider shadow-sm">
                {item.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <Calendar size={10} />
            <span className="text-[8px] font-bold uppercase tracking-widest">{item.date}</span>
          </div>
          
          <div className="h-10 mb-2 overflow-hidden">
            <h3 className="text-sm font-bold text-primary group-hover:text-secondary transition-colors line-clamp-2 leading-tight">
              {item.title}
            </h3>
          </div>

          <div className="h-[90px] mb-4 overflow-hidden">
            <p className="text-slate-500 text-[11px] sm:text-[10px] font-medium line-clamp-6 leading-relaxed">
              {item.excerpt}
            </p>
          </div>

          <div className="flex items-center gap-2 text-[8px] font-black text-secondary uppercase tracking-[0.2em] group-hover:gap-3 transition-all mt-auto pt-2 border-t border-slate-50">
            Read Full Story <ArrowRight size={10} />
          </div>
        </a>
      ))}
    </div>
  </div>
);
}
