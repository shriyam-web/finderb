'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
  Rocket 
} from 'lucide-react';
import { NewsArticle } from '@/lib/mockData';

const NEWS_CATEGORIES = [
  { name: 'Technology', icon: Cpu },
  { name: 'Business', icon: Briefcase },
  { name: 'Sports', icon: Trophy },
  { name: 'Cricket', icon: Target },
  { name: 'Bollywood', icon: Film },
  { name: 'Politics', icon: Scale },
  { name: 'Real Estate', icon: Home },
  { name: 'Local', icon: MapPin },
  { name: 'Startups', icon: Rocket },
];

export default function NewsWidget() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(NEWS_CATEGORIES[0].name);

  const fetchNews = async (category: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/news?category=${category.toLowerCase()}`);
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
  };

  useEffect(() => {
    fetchNews(selectedCategory);
  }, [selectedCategory]);

  const categories = NEWS_CATEGORIES;
  const filteredNews = news;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse bg-white rounded-2xl p-4 border border-slate-100 flex gap-4">
            <div className="bg-slate-200 h-20 w-20 shrink-0 rounded-xl"></div>
            <div className="flex-1 space-y-2">
              <div className="h-2 bg-slate-200 rounded w-1/4"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-2 bg-slate-200 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!loading && filteredNews.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map((category) => (
            <button
              key={category.name}
              onClick={() => setSelectedCategory(category.name)}
              className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border flex items-center gap-1.5 ${
                selectedCategory === category.name
                  ? 'bg-secondary text-white border-secondary shadow-md scale-105'
                  : 'bg-white text-slate-500 border-slate-100 hover:border-secondary/30 hover:text-secondary'
              }`}
            >
              <category.icon size={12} />
              {category.name}
            </button>
          ))}
        </div>
        <div className="bg-white rounded-2xl p-12 border border-slate-100 text-center space-y-4">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <Calendar className="text-slate-300" size={24} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-primary">No news found</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              We couldn't find any recent news for {selectedCategory}. Please try another category.
            </p>
          </div>
          <button 
            onClick={() => fetchNews(selectedCategory)}
            className="px-6 py-2 bg-secondary text-white rounded-full text-xs font-bold uppercase tracking-widest hover:shadow-lg transition-all active:scale-95"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => setSelectedCategory(category.name)}
            className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all border flex items-center gap-1.5 ${
              selectedCategory === category.name
                ? 'bg-secondary text-white border-secondary shadow-md'
                : 'bg-white text-slate-500 border-slate-100 hover:border-secondary/30 hover:text-secondary'
            }`}
          >
            <category.icon size={10} />
            {category.name}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredNews.map((item) => (
          <a 
            key={item.id} 
            href={item.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group bg-white rounded-2xl p-3 hover:bg-slate-50 transition-all border border-slate-100 flex gap-4"
          >
            <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden shadow-sm">
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[7px] font-black text-secondary uppercase tracking-widest">{item.category}</span>
                <span className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">{item.date}</span>
              </div>
              <h3 className="text-xs font-bold text-primary group-hover:text-secondary transition-colors line-clamp-2 leading-tight">
                {item.title}
              </h3>
              <div className="mt-2 flex items-center gap-1 text-[7px] font-black text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                Read Story <ArrowRight size={8} />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
