'use client';

import { useState, useEffect } from 'react';
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
import { ArrowRight, CheckCircle2, Star, MapPin, Calendar, Play } from 'lucide-react';
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

export default function Home() {
  const [index, setIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const sortedCategories = [...categories].sort((a, b) => b.businessCount - a.businessCount);
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

  return (
    <div className="flex flex-col bg-white selection:bg-primary/10">
      {/* Hero Section */}
      <section className="relative pt-20 pb-4 lg:pt-32 lg:pb-12 bg-gradient-to-br from-white via-gray-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-6 lg:space-y-8 text-left">
              <div className="space-y-3 lg:space-y-4">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary leading-[1.1]">
                  India's Premier <br />
                  <span className="text-secondary">Local Service Engine</span>
                  <div className="h-[1.3em] overflow-hidden relative mt-2 text-gray-300 md:text-gray-400 text-lg sm:text-2xl lg:text-4xl">
                    <div 
                      className={`${isTransitioning ? 'transition-transform duration-700' : ''} ease-in-out`}
                      style={{ transform: `translateY(-${index * (100 / WORDS.length)}%)` }}
                    >
                      {WORDS.map((word, i) => (
                        <div key={i} className="h-[1.3em] flex items-center justify-start whitespace-nowrap">
                          {word}
                        </div>
                      ))}
                    </div>
                  </div>
                </h1>
                <p className="text-gray-500 text-xs md:text-base font-medium leading-relaxed max-w-xl lg:mx-0">
                  Boomb connects you with verified professionals and elite services across India. Discovery redefined.
                </p>
              </div>

              <div className="w-full max-w-2xl lg:mx-0">
                <SearchBar />
              </div>
            </div>

            {/* Right: Popular Category Grid - Big with Photos */}
            <div className="lg:col-span-6 mt-8 lg:mt-0">
              <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-4 gap-2 sm:gap-4">
                {popularCategories.map((cat) => {
                  // @ts-ignore
                  const IconComponent = LucideIcons[cat.icon] || LucideIcons.HelpCircle;
                  return (
                    <Link 
                      key={cat.id} 
                      href={`/categories/${cat.slug}`} 
                      className="group relative aspect-[4/5] rounded-xl sm:rounded-2xl overflow-hidden border border-gray-100 hover:border-secondary transition-all duration-500 hover:shadow-xl hover:shadow-secondary/20"
                    >
                      <Image 
                        src={cat.image} 
                        alt={cat.name} 
                        fill 
                        className="object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
                        sizes="(max-width: 768px) 33vw, 15vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                      <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3">
                        <div className="w-5 h-5 sm:w-7 sm:h-7 rounded sm:rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center text-white mb-1 sm:mb-2 group-hover:bg-secondary transition-colors border border-white/10">
                          <IconComponent className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </div>
                        <h3 className="text-[8px] sm:text-[10px] font-medium text-white leading-tight mb-0.5">{cat.name}</h3>
                        <p className="text-[6px] sm:text-[7px] text-white/50">{cat.businessCount}+ Pros</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Smaller Buttons for More Categories */}
          <div className="mt-2 lg:mt-6 pt-2 lg:pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-4 lg:mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></div>
              <h2 className="text-[10px] font-medium text-primary">Explore Premium Categories</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {otherCategories.map((cat) => (
                <Link 
                  key={cat.id} 
                  href={`/categories/${cat.slug}`}
                  className="px-3 py-1.5 rounded-full bg-gray-50 hover:bg-secondary hover:text-white text-[9px] sm:text-[10px] font-medium text-gray-500 transition-all border border-gray-100 hover:border-secondary"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* City Cards - Horizontal Scrolling */}
      <section className="py-8 lg:py-16 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg sm:text-2xl font-medium text-primary mb-6 lg:mb-8">Verified Local Services Across Major Indian Cities</h2>
          <div className="flex overflow-x-auto pb-4 gap-4 lg:gap-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {cities.map((city) => (
              <Link 
                key={city.id} 
                href={`/city/${city.name.toLowerCase()}`}
                className="relative min-w-[180px] sm:min-w-[220px] h-[240px] sm:h-[300px] rounded-2xl sm:rounded-3xl overflow-hidden group shrink-0 shadow-lg"
              >
                <Image 
                  src={city.image} 
                  alt={city.name} 
                  fill 
                  className="object-cover group-hover:scale-110 transition-transform duration-700" 
                  sizes="220px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
                  <h3 className="text-lg sm:text-xl font-bold text-white">{city.name}</h3>
                  <p className="text-white/60 text-[10px] font-medium">Explore Services</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

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
                  className="object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-8">
                  <div className="flex items-center gap-2 text-secondary mb-1 sm:mb-2">
                    <MapPin size={12} className="sm:size-[14px]" />
                    <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider">{place.location}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-1 line-clamp-1">{place.name}</h3>
                  <p className="text-white/60 text-xs font-medium">{place.distance}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Businesses */}
      <section className="py-20 lg:py-28 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 lg:mb-20 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-1 bg-secondary rounded-full"></div>
                <span className="text-xs font-black text-secondary uppercase tracking-[0.3em]">Premium Collection</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-primary tracking-tighter leading-none">Featured Local Businesses</h2>
            </div>
            <Link href="/categories/all" className="group flex items-center gap-3 px-6 py-3 bg-gray-50 hover:bg-primary hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">
              Explore All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="flex overflow-x-auto pb-10 gap-6 lg:grid lg:grid-cols-3 lg:gap-8 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {featuredBusinesses.slice(0, 3).map((biz) => (
              <div key={biz.id} className="min-w-[300px] sm:min-w-0 w-full">
                <BusinessCard business={biz} isPremium={true} />
              </div>
            ))}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-32 bg-gray-50/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-12 lg:mb-24">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 mb-4 sm:mb-6 transition-transform hover:scale-105">
              <span className="flex h-1.5 w-1.5 rounded-full bg-secondary animate-ping"></span>
              <span className="text-[8px] sm:text-[10px] font-black text-primary uppercase tracking-[0.2em]">User Feedback</span>
            </div>
            <h2 className="text-2xl sm:text-6xl font-black text-primary tracking-tighter leading-tight max-w-3xl">
              Trusted by Millions: <br />
              <span className="text-secondary">Real Stories</span> from Boomb
            </h2>
          </div>
          
          <div className="flex overflow-x-auto pb-10 gap-4 sm:gap-10 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {testimonials.map((t) => (
              <div key={t.id} className="bg-white pt-14 pb-6 px-6 sm:pt-24 sm:pb-10 sm:px-10 rounded-[2rem] sm:rounded-[3rem] shadow-xl sm:shadow-2xl shadow-gray-200/40 hover:shadow-secondary/10 transition-all duration-700 border border-white text-left relative group min-w-[280px] sm:min-w-[400px] max-w-[320px] sm:max-w-[450px] h-[350px] sm:h-[450px] shrink-0 hover:-translate-y-2 flex flex-col justify-between">
                <div className="absolute -top-4 left-6 sm:-top-5 sm:left-8 w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-[1.5rem] bg-primary flex items-center justify-center text-white shadow-xl sm:shadow-2xl shadow-primary/30 group-hover:bg-secondary group-hover:-rotate-12 transition-all duration-700 ease-out z-20">
                  <Star size={20} className="sm:size-8" fill="white" />
                </div>
                
                <div className="relative flex-grow">
                  <span className="absolute -top-3 -left-1 text-5xl sm:text-8xl text-gray-50 font-serif leading-none select-none">"</span>
                  <p className="text-gray-600 font-medium leading-relaxed italic pt-4 sm:pt-8 text-sm sm:text-xl line-clamp-6 sm:line-clamp-none relative z-10">
                    {t.content}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-gray-50 pt-6 sm:pt-10 mt-auto">
                  <div className="flex items-center gap-3 sm:gap-6">
                    <div className="relative w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-[2.5rem] overflow-hidden border border-gray-100 group-hover:border-secondary transition-all duration-500 group-hover:scale-105">
                      <Image 
                        src={t.avatar} 
                        alt={t.name} 
                        fill 
                        className="object-cover" 
                        sizes="80px"
                      />
                    </div>
                    <div>
                      <h4 className="font-black text-primary text-sm sm:text-2xl tracking-tight">{t.name}</h4>
                      <p className="text-secondary text-[8px] sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-0.5 sm:mt-1">{t.role}</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} fill="currentColor" />
                    ))}
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
            <h2 className="text-4xl sm:text-6xl lg:text-8xl font-black text-white tracking-tighter leading-[0.9]">
              Ready to grow <br className="hidden sm:block" />
              your business? <br />
              <span className="text-secondary">Join Boomb today.</span>
            </h2>
            <p className="text-blue-100/60 text-base sm:text-xl lg:text-2xl font-medium max-w-3xl mx-auto leading-relaxed">
              Join 50,000+ elite business owners already scaling their reach on India's premier discovery network.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8">
            <Link href="/business/register" className="bg-white text-primary px-10 sm:px-14 py-5 sm:py-6 rounded-[2rem] font-black hover:bg-secondary hover:text-white transition-all active:scale-95 uppercase tracking-widest text-xs sm:text-sm shadow-2xl shadow-black/20 hover:shadow-secondary/40">
              List Your Business
            </Link>
            <Link href="/pricing" className="bg-white/5 backdrop-blur-xl border-2 border-white/10 text-white px-10 sm:px-14 py-5 sm:py-6 rounded-[2rem] font-black hover:bg-white hover:text-primary transition-all active:scale-95 uppercase tracking-widest text-xs sm:text-sm">
              View Growth Plans
            </Link>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(0,186,242,0.2),transparent_60%)]"></div>
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,rgba(0,186,242,0.2),transparent_60%)]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,186,242,0.05),transparent_70%)]"></div>
      </section>
    </div>
  );
}
