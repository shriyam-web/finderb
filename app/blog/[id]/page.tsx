'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, use } from 'react';
import { articles } from '@/lib/mockData';
import { getBlogBySlug } from '@/app/actions/blog';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Calendar, Share2, Bookmark, User, Clock } from 'lucide-react';

export default function BlogDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBlog() {
      if (!id) return;
      
      console.log('Fetching blog with ID/Slug:', id);
      // First try to find in mock data
      const mockArticle = articles.find((a) => a.id === id);
      if (mockArticle) {
        setArticle(mockArticle);
        setLoading(false);
        return;
      }

      // If not in mock, fetch from DB
      const result = await getBlogBySlug(id);
      if (result.success) {
        setArticle(result.blog);
      }
      setLoading(false);
    }
    fetchBlog();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">Loading story...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-6 max-w-md px-4">
          <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto text-primary">
            <ArrowLeft size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-primary">Story Not Found</h1>
            <p className="text-gray-500 font-medium">We couldn't find the article you're looking for. It might have been moved or deleted.</p>
          </div>
          <Link href="/" className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-secondary transition-all active:scale-95 shadow-lg">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Hero Section */}
      <div className="relative h-[50vh] sm:h-[70vh] w-full overflow-hidden">
        <Image
          src={article.image}
          alt={article.title}
          fill
          className="object-cover scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-white/70 hover:text-secondary mb-8 transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-all">
                <ArrowLeft size={16} />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em]">Back to Insights</span>
            </Link>
            
            <div className="space-y-6 max-w-4xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary rounded-full text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
                <Clock size={12} />
                <span>5 min read</span>
              </div>
              
              <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tighter">
                {article.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                    <User size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/60 font-black uppercase tracking-widest">Written by</p>
                    <p className="text-sm font-bold text-white">{article.author || 'FinderB Admin'}</p>
                  </div>
                </div>
                
                <div className="h-8 w-px bg-white/20 hidden sm:block" />
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                    <Calendar size={18} className="text-secondary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/60 font-black uppercase tracking-widest">Published on</p>
                    <p className="text-sm font-bold text-white">{article.date}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Main Content */}
          <div className="flex-1">
            <div className="prose prose-xl prose-slate max-w-none">
              <p className="text-2xl text-gray-600 leading-relaxed font-semibold mb-12 border-l-4 border-secondary pl-8 py-2 italic">
                {article.excerpt}
              </p>
              
              <div className="text-gray-800 leading-[1.8] space-y-8 text-lg font-medium">
                {article.content.split('\n').map((paragraph: string, i: number) => (
                  paragraph ? <p key={i}>{paragraph}</p> : <br key={i} />
                ))}
              </div>
            </div>

            {/* Tags/Footer */}
            <div className="mt-16 pt-12 border-t border-gray-100 flex flex-wrap items-center justify-between gap-8">
              <div className="flex flex-wrap gap-3">
                {['Local', 'Insights', 'Guide', 'India'].map((tag) => (
                  <span key={tag} className="px-5 py-2.5 bg-slate-50 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 hover:border-secondary/20 hover:text-secondary transition-all cursor-default">
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-50 text-slate-600 hover:bg-secondary hover:text-white transition-all font-bold text-xs uppercase tracking-widest border border-slate-100 shadow-sm">
                  <Share2 size={16} />
                  Share Story
                </button>
                <button className="p-3.5 rounded-2xl bg-slate-50 text-slate-400 hover:text-secondary border border-slate-100 transition-all shadow-sm">
                  <Bookmark size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar / More Stories could go here */}
        </div>
      </div>
    </div>
  );
}
