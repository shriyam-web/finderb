'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import CategoryCard from '@/components/CategoryCard';
import BusinessCard from '@/components/BusinessCard';
import {
  categories,
  featuredBusinesses,
  testimonials,
  cities,
  movies,
  touristPlaces,
  articles
} from '@/lib/mockData';
import * as LucideIcons from 'lucide-react';
import { ArrowRight, CheckCircle2, Star, MapPin, Calendar, Play, ShieldCheck, Zap, Search, Phone, MessageSquare, Heart, Sparkles, History, X, Mic, Send } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const WORDS = [
  "verified professionals",
  "top-rated local services",
  "300+ cities in India",
  "premium local businesses",
  "trusted by millions",
  "verified professionals" // For seamless loop
];

function HomeContent() {
  const [index, setIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTabFromUrl = searchParams.get('tab');

  const [activeMobileTab, setActiveMobileTab] = useState(
    activeTabFromUrl === 'ai' ? 'AI Search' : 'Search'
  );

  useEffect(() => {
    if (activeTabFromUrl === 'ai') {
      setActiveMobileTab('AI Search');
    } else if (activeTabFromUrl === 'finderb-ai') {
      setActiveMobileTab('FinderB AI');
    } else {
      setActiveMobileTab('Search');
    }
  }, [activeTabFromUrl]);

  const handleTabChange = (label: string) => {
    setActiveMobileTab(label);
    if (label === 'AI Search') {
      router.push('/?tab=ai', { scroll: false });
    } else if (label === 'FinderB AI') {
      router.push('/?tab=finderb-ai', { scroll: false });
    } else {
      router.push('/', { scroll: false });
    }
  };

  const excludedSlugs = ['real-estate', 'admissions', 'b2b', 'job'];
  const sortedCategories = [...categories]
    .filter(cat => !excludedSlugs.includes(cat.slug))
    .sort((a, b) => b.businessCount - a.businessCount);
  const popularCategories = sortedCategories.slice(0, 12);
  const otherCategories = sortedCategories.slice(12);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setIndex((prev) => (prev + 1));
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (index === WORDS.length - 1) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setIndex(0);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [index]);

  useEffect(() => {
    if (activeMobileTab === 'FinderB AI') {
      const timer = setTimeout(() => {
        handleTabChange('AI Search');
      }, 3000); // 3 seconds delay
      return () => clearTimeout(timer);
    }
  }, [activeMobileTab]);

  return (
    <div className="flex flex-col bg-white selection:bg-primary/10">
      {/* Featured Categories Strip */}
      <section className="pt-20 lg:pt-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-1">
            {[
              { name: 'Real Estate', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=400', href: '/categories/real-estate', color: 'from-blue-500/20' },
              { name: 'Admissions', image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=400', href: '/categories/admissions', color: 'from-purple-500/20' },
              { name: 'B2B', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=400', href: '/categories/b2b', color: 'from-orange-500/20' },
              { name: 'Job', image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=400', href: '/categories/job', color: 'from-green-500/20' },
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group relative h-16 sm:h-20 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-500"
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${item.color} to-transparent opacity-60 group-hover:opacity-40 transition-opacity`} />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center p-2">
                  <h3 className="text-white text-[10px] sm:text-xs font-black uppercase tracking-widest text-center drop-shadow-lg">
                    {item.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative pt-6 pb-6 lg:pt-12 lg:pb-8">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-primary/5 blur-[120px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-secondary/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 lg:space-y-8">
          <div className="space-y-3 max-w-4xl mx-auto pt-1">

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-primary leading-[1.3]">
              Everything you need, <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">all in one place.</span>
            </h1>

            <div className="flex flex-col items-center justify-center">
              <div className="h-[1.1em] overflow-hidden relative text-slate-400 text-sm sm:text-base font-semibold">
                <div
                  className={`${isTransitioning ? 'transition-transform duration-700' : ''} ease-in-out flex flex-col items-center`}
                  style={{ transform: `translateY(-${index * (100 / WORDS.length)}%)` }}
                >
                  {WORDS.map((word, i) => (
                    <div key={i} className="h-[1.3em] flex items-center justify-center whitespace-nowrap">
                      {word}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-md mx-auto transform  transition-all duration-500 relative z-50">
            <div className="bg-white/90 backdrop-blur-xl p-0 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.05)] border border-white ring-1 ring-black/[0.02]">
              <SearchBar />
            </div>
          </div>

          {/* <div className="flex flex-wrap items-center justify-center gap-2 pt-1 lg:pt-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mr-1">Top Searches:</span>
            {['Salon', 'Plumber', 'AC Repair', 'Cleaning', 'Electrician'].map((tag) => (
              <button
                key={tag}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-500 hover:bg-white hover:border-secondary/20 hover:text-secondary hover:shadow-sm transition-all active:scale-95"
              >
                {tag}
              </button>
            ))}
          </div> */}
        </div>
      </section>

      {/* Category Section */}
      <section className="pt-4 pb-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
            <div className="space-y-4">

              <h2 className="text-3xl sm:text-5xl font-extrabold text-primary tracking-tight">What do you need <span className="text-secondary">help</span> with?</h2>
            </div>
            <Link href="/categories/all" className="group flex items-center gap-2 text-sm font-bold text-primary hover:text-secondary transition-colors">
              View all categories <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {popularCategories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        </div>
      </section>

      {/* Trust Layer / Featured Section */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full text-primary border border-primary/10">
                  <CheckCircle2 size={16} className="text-secondary" />
                  <span className="text-xs font-bold uppercase tracking-widest">Trust First Platform</span>
                </div>
                <h2 className="text-4xl sm:text-6xl font-extrabold text-primary tracking-tight leading-[1.1]">
                  Book with <span className="text-secondary">Confidence.</span>
                </h2>
                <p className="text-gray-500 text-lg font-medium leading-relaxed max-w-xl">
                  Every professional on FinderB is strictly verified. We prioritize your safety and satisfaction above everything else.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { title: 'Verified Pros', desc: 'Background checked experts', icon: ShieldCheck },
                  { title: 'Best Prices', desc: 'No hidden costs, ever', icon: Star },
                  { title: 'Instant Booking', desc: 'Confirm in 30 seconds', icon: Zap },
                  { title: '24/7 Support', desc: 'We are here to help you', icon: ArrowRight },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-muted/50 border border-gray-100 hover:border-secondary/20 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all">
                      <item.icon size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-primary">{item.title}</h4>
                      <p className="text-xs text-gray-500 font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-secondary/10 blur-[100px] -z-10 rounded-full"></div>
              <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-gray-100 relative overflow-hidden">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                    <Star size={32} fill="currentColor" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-primary">4.9/5 Rating</h3>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Across 1M+ Bookings</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {testimonials.slice(0, 2).map((t) => (
                    <div key={t.id} className="p-6 rounded-2xl bg-muted/30 border border-gray-50">
                      <div className="flex gap-1 text-secondary mb-3">
                        {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                      </div>
                      <p className="text-gray-600 font-medium italic mb-4">"{t.content}"</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                          <Image src={`https://i.pravatar.cc/150?u=${t.id}`} alt={t.name} width={40} height={40} className="object-cover" />
                        </div>
                        <div>
                          <h5 className="font-bold text-sm text-primary">{t.name}</h5>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions / Mobile Bottom Bar */}
      <div className="fixed bottom-0 left-0 w-full z-[100] md:hidden bg-white/95 backdrop-blur-2xl border-t border-slate-200">
        <div className="flex items-center justify-around p-1 pb-safe">
          {[
            { icon: Search, label: 'Search' },
            { icon: Sparkles, label: 'FinderB AI' },
            { icon: History, label: 'History' },
            { icon: Heart, label: 'Saved' },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => handleTabChange(item.label)}
              className={`flex flex-col items-center gap-1 p-3 px-4 transition-all duration-300 group relative rounded-2xl ${activeMobileTab === item.label
                ? 'text-slate-900 bg-slate-50'
                : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              {item.label === 'FinderB Ai' && activeMobileTab !== 'FinderB Ai' && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                </span>
              )}
              <item.icon
                size={20}
                className={`transition-all duration-300 ${activeMobileTab === item.label
                  ? 'scale-110 text-secondary'
                  : 'group-active:scale-95'
                  }`}
              />
              <span className={`text-[9px] font-bold uppercase tracking-wider transition-all duration-300 ${activeMobileTab === item.label ? 'opacity-100 scale-100' : 'opacity-70 scale-95'
                }`}>
                {item.label}
              </span>

              {activeMobileTab === item.label && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-secondary rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Latest Movies */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8 lg:mb-10">
            <h2 className="text-lg sm:text-2xl font-medium text-primary">Latest Movies & Entertainment Near You</h2>
            <Link href="/movies" className="text-xs sm:text-sm font-medium text-secondary hover:underline">See All</Link>
          </div>
          <div className="flex overflow-x-auto pb-4 lg:pb-8 gap-4 lg:gap-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {movies.map((movie) => (
              <div key={movie.id} className="group cursor-pointer min-w-[160px] sm:min-w-[240px] shrink-0">
                <div className="relative aspect-[2/3] rounded-xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-4 shadow-lg bg-gray-100">
                  <Image
                    src={movie.image}
                    alt={movie.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
                      <Play className="w-5 h-5 sm:w-6 sm:h-6" fill="white" />
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-secondary text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded sm:rounded-lg text-[8px] sm:text-[10px] font-medium flex items-center gap-1 shadow-lg">
                    <Star size={8} className="sm:size-[10px]" fill="white" /> {movie.rating}
                  </div>
                </div>
                <h3 className="text-xs sm:text-base font-bold text-primary group-hover:text-secondary transition-colors line-clamp-1">{movie.title}</h3>
                <p className="text-gray-400 text-[10px] sm:text-xs font-medium">{movie.genre}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Explore Tourist Places */}
      <section className="py-16 lg:py-20 bg-gray-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-secondary/5 -skew-x-12 translate-x-1/2 blur-3xl"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-8 lg:mb-12">
            <h2 className="text-xl sm:text-3xl font-medium mb-2">Discover Top-Rated Tourist Places & Local Attractions</h2>
            <p className="text-gray-400 text-sm font-medium">Find the best attractions and hidden gems in your vicinity.</p>
          </div>
          <div className="flex overflow-x-auto pb-4 lg:pb-8 gap-4 lg:gap-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {touristPlaces.map((place) => (
              <div key={place.id} className="group relative h-[320px] sm:h-[420px] min-w-[260px] sm:min-w-[400px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-gray-800 shrink-0">
                <Image
                  src={place.image}
                  alt={place.name}
                  fill
                  className="object-cover opacity-70 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6 sm:p-10 space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-secondary" />
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-300">{place.location}</span>
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-black">{place.name}</h3>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Star size={16} className="text-secondary" fill="currentColor" />
                      <span className="text-sm font-bold">{place.rating}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <span className="text-sm font-medium">Popular destination</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-y-1/2 translate-x-1/2"></div>
      </section>

      {/* Articles */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 lg:mb-16 gap-6">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-4xl font-black text-primary tracking-tight">Local Insights & Expert Articles</h2>
              <div className="w-12 h-1 bg-secondary rounded-full"></div>
            </div>
            <Link href="/blog" className="group flex items-center gap-2 text-xs font-bold text-secondary hover:text-primary transition-all uppercase tracking-widest">
              Read All Stories <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="flex overflow-x-auto pb-10 gap-8 lg:grid lg:grid-cols-3 lg:gap-12 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {articles.slice(0, 3).map((article) => (
              <div key={article.id} className="group cursor-pointer min-w-[320px] sm:min-w-0 w-full">
                <div className="relative h-64 sm:h-72 rounded-[2.5rem] overflow-hidden mb-6 shadow-2xl shadow-gray-200/50 bg-gray-100">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-1000"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute top-5 left-5 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg border border-white/20">
                    <Calendar size={12} className="text-secondary" />
                    <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">{article.date}</span>
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-primary group-hover:text-secondary transition-colors mb-3 leading-tight tracking-tight line-clamp-2">{article.title}</h3>
                <p className="text-gray-500 font-medium text-sm sm:text-base line-clamp-2 mb-6 leading-relaxed">{article.excerpt}</p>
                <div className="flex items-center gap-3 text-[10px] font-bold text-secondary uppercase tracking-[0.2em] group-hover:gap-4 transition-all">
                  CONTINUE READING <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-primary relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-10 lg:space-y-16 relative z-10">
          <div className="space-y-6 lg:space-y-8">
            <h2 className="text-4xl sm:text-6xl lg:text-5xl font-black text-white tracking-tighter leading-[1.3]">
              Ready to grow your business?
              <span className="text-secondary">Join FinderB today.</span>
            </h2>
            <p className="text-secondary/60 text-base sm:text-xl lg:text-2xl font-medium max-w-3xl mx-auto leading-relaxed">
              Join 50,000+ elite business owners already scaling their reach on India's premier discovery network.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8">
            <Link href="/business/register" className="bg-white text-primary px-10 sm:px-14 py-5 sm:py-6 rounded-[2rem] font-black hover:bg-blue hover:text-black transition-all active:scale-95 uppercase tracking-widest text-xs sm:text-sm shadow-2xl shadow-black/20 hover:shadow-secondary/40">
              List Your Business
            </Link>
            <Link href="/pricing" className="bg-white/5 backdrop-blur-xl border-2 border-white/10 text-white px-10 sm:px-14 py-5 sm:py-6 rounded-[2rem]   hover:text-black transition-all active:scale-95 uppercase tracking-widest text-xs sm:text-sm">
              View Growth Plans
            </Link>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(0,186,242,0.2),transparent_60%)]"></div>
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,rgba(0,186,242,0.2),transparent_60%)]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,186,242,0.05),transparent_70%)]"></div>
      </section>

      {/* FinderB AI Modal */}
      {activeMobileTab === 'FinderB Ai' && (
        <div className="fixed inset-0 z-[1000] bg-primary/40 backdrop-blur-2xl md:hidden flex flex-col items-center justify-center p-8 transition-all duration-700 animate-in fade-in zoom-in-95">
          <button
            onClick={() => handleTabChange('Search')}
            className="absolute top-10 right-8 text-white/50 hover:text-white transition-colors p-3 bg-white/10 rounded-full"
          >
            <X size={28} />
          </button>

          <div className="relative group mb-12">
            <div className="absolute inset-0 bg-gradient-to-tr from-secondary via-purple-600 to-pink-500 blur-[80px] opacity-60 group-hover:opacity-100 transition-opacity animate-pulse"></div>
            <div className="relative w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-700">
              <Sparkles size={60} className="text-secondary animate-bounce" />
            </div>
          </div>

          <div className="text-center space-y-6 max-w-sm">
            <h2 className="text-5xl font-black text-white tracking-tighter leading-tight">FinderB <span className="text-secondary">AI</span> is <br />Almost Ready.</h2>
            <p className="text-white/60 font-medium text-lg leading-relaxed">We're training India's most powerful service assistant just for you.</p>
          </div>

          <div className="mt-16 w-full max-w-xs space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md">
              <div className="flex items-center gap-4 text-white">
                <div className="w-2 h-2 rounded-full bg-secondary animate-ping"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Learning from 1M+ requests...</span>
              </div>
            </div>

            <button
              onClick={() => handleTabChange('Search')}
              className="w-full bg-white text-primary py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-black/20 hover:scale-105 active:scale-95 transition-all"
            >
              Take me back
            </button>
          </div>
        </div>
      )}

      {/* AI Search Interface */}
      {activeMobileTab === 'AI Search' && (
        <div className="fixed inset-0 z-[1001] bg-primary flex flex-col p-6 animate-in fade-in slide-in-from-bottom-20 duration-500 overflow-hidden selection:bg-secondary/20">
          <div className="flex-1 flex flex-col items-center justify-around text-center py-10 sm:py-20 max-w-5xl mx-auto w-full">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-[1.1]">How can I <span className="text-secondary underline decoration-4 lg:decoration-8 underline-offset-8 lg:underline-offset-[12px]">help</span> you today?</h2>
              <p className="text-white/40 font-medium text-xs sm:text-lg">Search for anything, ask for recommendations</p>
            </div>

            <div className="relative group w-full max-w-[160px] sm:max-w-[300px] aspect-square flex items-center justify-center">
              {/* Voice Rings */}
              <div className="absolute inset-0 bg-secondary/20 rounded-full animate-voice-ring"></div>
              <div className="absolute inset-0 bg-secondary/10 rounded-full animate-voice-ring" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute inset-0 bg-secondary/5 rounded-full animate-voice-ring" style={{ animationDelay: '1s' }}></div>

              <button className="relative w-20 h-20 sm:w-32 sm:h-32 bg-secondary rounded-full flex items-center justify-center text-white shadow-[0_0_50px_rgba(79,70,229,0.4)] hover:scale-110 active:scale-90 transition-all duration-500">
                <Mic size={32} className="animate-pulse sm:scale-125" />
              </button>
            </div>

            <div className="w-full space-y-4">
              <p className="text-[9px] sm:text-[11px] font-black text-white/20 uppercase tracking-[0.3em]">Try asking</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['"Find top plumbers nearby"', '"Best AC repair for home"', '"Salons with 4.5+ rating"', '"Emergency electricians"'].map((q, i) => (
                  <button key={i} className="px-4 py-2 sm:px-8 sm:py-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] sm:text-xs text-white/70 font-bold hover:bg-white/10 hover:border-white/20 transition-all">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pb-6 max-w-3xl mx-auto w-full mt-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-secondary to-purple-600 rounded-[2.2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <input
                type="text"
                placeholder="Ask FinderB AI anything..."
                className="relative w-full bg-white/5 border border-white/10 rounded-[2rem] px-6 py-4 sm:py-8 text-white text-xs sm:text-base font-medium focus:ring-2 focus:ring-secondary transition-all outline-none backdrop-blur-xl"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-14 sm:h-14 bg-white rounded-2xl flex items-center justify-center text-primary hover:bg-secondary hover:text-white hover:scale-105 transition-all shadow-xl">
                <Send size={16} className="sm:scale-110" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}