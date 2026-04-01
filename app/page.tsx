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
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden bg-gradient-to-br from-white via-gray-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-8 text-left">
              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary leading-[1.1]">
                  India's Premier <br />
                  <span className="text-secondary">Local Service Engine</span>
                  <div className="h-[1.3em] overflow-hidden relative mt-2 text-gray-300 md:text-gray-400 text-xl sm:text-2xl lg:text-4xl">
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
                <p className="text-gray-500 text-sm md:text-base font-medium leading-relaxed max-w-xl lg:mx-0">
                  Boomb connects you with verified professionals and elite services across India. Discovery redefined.
                </p>
              </div>

              <div className="w-full max-w-2xl lg:mx-0">
                <SearchBar />
              </div>
            </div>

            {/* Right: Popular Category Grid - Big with Photos */}
            <div className="lg:col-span-6 mt-12 lg:mt-0">
              <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-4 gap-2 sm:gap-4">
                {popularCategories.map((cat) => {
                  // @ts-ignore
                  const IconComponent = LucideIcons[cat.icon] || LucideIcons.HelpCircle;
                  return (
                    <Link 
                      key={cat.id} 
                      href={`/categories/${cat.slug}`} 
                      className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-gray-100 hover:border-secondary transition-all duration-500 hover:shadow-xl hover:shadow-secondary/20"
                    >
                      <Image 
                        src={cat.image} 
                        alt={cat.name} 
                        fill 
                        className="object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
                        sizes="(max-width: 768px) 33vw, 15vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="w-7 h-7 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center text-white mb-2 group-hover:bg-secondary transition-colors border border-white/10">
                          <IconComponent size={14} />
                        </div>
                        <h3 className="text-[10px] font-medium text-white leading-tight mb-0.5">{cat.name}</h3>
                        <p className="text-[7px] text-white/50">{cat.businessCount}+ Pros</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Smaller Buttons for More Categories */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></div>
              <h2 className="text-[10px] font-medium text-primary">Explore Premium Categories</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {otherCategories.map((cat) => (
                <Link 
                  key={cat.id} 
                  href={`/categories/${cat.slug}`}
                  className="px-4 py-2 rounded-full bg-gray-50 hover:bg-secondary hover:text-white text-[10px] font-medium text-gray-500 transition-all border border-gray-100 hover:border-secondary"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* City Cards - Horizontal Scrolling */}
      <section className="py-16 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-medium text-primary mb-8">Verified Local Services Across Major Indian Cities</h2>
          <div className="flex overflow-x-auto pb-4 gap-6 scrollbar-hide">
            {cities.map((city) => (
              <Link 
                key={city.id} 
                href={`/city/${city.name.toLowerCase()}`}
                className="relative min-w-[220px] h-[300px] rounded-3xl overflow-hidden group shrink-0 shadow-lg"
              >
                <Image 
                  src={city.image} 
                  alt={city.name} 
                  fill 
                  className="object-cover group-hover:scale-110 transition-transform duration-700" 
                  sizes="220px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-6 left-6">
                  <h3 className="text-xl font-bold text-white">{city.name}</h3>
                  <p className="text-white/60 text-xs font-medium">Explore Services</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Movies */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-xl sm:text-2xl font-medium text-primary">Latest Movies & Entertainment Near You</h2>
            <Link href="/movies" className="text-sm font-medium text-secondary hover:underline">See All</Link>
          </div>
          <div className="flex overflow-x-auto pb-8 gap-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {movies.map((movie) => (
              <div key={movie.id} className="group cursor-pointer min-w-[200px] sm:min-w-[240px] shrink-0">
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden mb-4 shadow-lg bg-gray-100">
                  <Image 
                    src={movie.image} 
                    alt={movie.title} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500" 
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
                      <Play size={24} fill="white" />
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 bg-secondary text-white px-2 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 shadow-lg">
                    <Star size={10} fill="white" /> {movie.rating}
                  </div>
                </div>
                <h3 className="font-bold text-primary group-hover:text-secondary transition-colors">{movie.title}</h3>
                <p className="text-gray-400 text-xs font-medium">{movie.genre}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Explore Tourist Places */}
      <section className="py-20 bg-gray-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-secondary/5 -skew-x-12 translate-x-1/2 blur-3xl"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-medium mb-2">Discover Top-Rated Tourist Places & Local Attractions</h2>
            <p className="text-gray-400 font-medium">Find the best attractions and hidden gems in your vicinity.</p>
          </div>
          <div className="flex overflow-x-auto pb-8 gap-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {touristPlaces.map((place) => (
              <div key={place.id} className="group relative h-[420px] min-w-[300px] sm:min-w-[400px] rounded-3xl overflow-hidden shadow-2xl bg-gray-800 shrink-0">
                <Image 
                  src={place.image} 
                  alt={place.name} 
                  fill 
                  className="object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="flex items-center gap-2 text-secondary mb-2">
                    <MapPin size={14} />
                    <span className="text-[10px] font-medium">{place.location}</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{place.name}</h3>
                  <p className="text-white/60 text-sm font-medium">{place.distance}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Businesses */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
            <div className="space-y-3">
              <span className="text-[10px] font-medium text-secondary">Curated Selection</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-primary tracking-tighter leading-tight">Premium Featured Local Businesses</h2>
            </div>
            <Link href="/categories/all" className="group flex items-center gap-3 text-xs font-medium text-gray-400 hover:text-primary transition-all">
              Explore All <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
          <div className="flex overflow-x-auto pb-8 gap-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {featuredBusinesses.map((biz) => (
              <div key={biz.id} className="min-w-[280px] sm:min-w-[320px] shrink-0">
                <BusinessCard business={biz} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-medium text-primary mb-12 sm:mb-20">Trusted by Millions: Real User Testimonials</h2>
          <div className="flex overflow-x-auto pb-12 gap-8 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {testimonials.map((t) => (
              <div key={t.id} className="bg-white p-10 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 text-left relative group min-w-[300px] sm:min-w-[400px] shrink-0">
                <div className="absolute -top-6 left-10 w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-white shadow-lg shadow-secondary/30 group-hover:scale-110 transition-transform">
                  <Star size={24} fill="white" />
                </div>
                <p className="text-gray-600 font-medium leading-relaxed italic mb-8 pt-4">"{t.content}"</p>
                <div className="flex items-center gap-4 mt-auto">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-gray-100">
                    <Image 
                      src={t.avatar} 
                      alt={t.name} 
                      fill 
                      className="object-cover" 
                      sizes="56px"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary text-sm">{t.name}</h4>
                    <p className="text-gray-400 text-[10px] font-medium">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-16 gap-4">
            <h2 className="text-2xl sm:text-3xl font-medium text-primary">Local Insights & Expert Articles from Boomb</h2>
            <Link href="/blog" className="text-xs font-medium text-secondary hover:underline whitespace-nowrap">Read Blog</Link>
          </div>
          <div className="flex overflow-x-auto pb-8 gap-10 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {articles.map((article) => (
              <div key={article.id} className="group cursor-pointer min-w-[300px] sm:min-w-[400px] shrink-0">
                <div className="relative h-72 rounded-[2rem] overflow-hidden mb-8 shadow-md bg-gray-100">
                  <Image 
                    src={article.image} 
                    alt={article.title} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-700" 
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
                    <Calendar size={12} className="text-secondary" />
                    <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">{article.date}</span>
                  </div>
                </div>
                <h3 className="text-2xl font-black text-primary group-hover:text-secondary transition-colors mb-4 leading-tight tracking-tight">{article.title}</h3>
                <p className="text-gray-500 font-medium text-base line-clamp-2 mb-6 leading-relaxed">{article.excerpt}</p>
                <div className="flex items-center gap-2 text-xs font-black text-secondary uppercase tracking-[0.2em] group-hover:gap-4 transition-all">
                  Read More <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-28 bg-primary relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-12 relative z-10">
          <div className="space-y-6">
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">
              Ready to grow your business? <br />
              <span className="text-secondary">Join Boomb today.</span>
            </h2>
            <p className="text-blue-100/60 text-xl font-medium max-w-2xl mx-auto">
              Join 50,000+ elite business owners already scaling their reach on Boomb's discovery network.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/business/register" className="bg-white text-primary px-12 py-5 rounded-2xl font-black hover:bg-secondary hover:text-white transition-all active:scale-95 uppercase tracking-[0.2em] text-xs">
              List Your Business
            </Link>
            <Link href="/pricing" className="bg-transparent border-2 border-white/20 text-white px-12 py-5 rounded-2xl font-black hover:bg-white hover:text-primary transition-all active:scale-95 uppercase tracking-[0.2em] text-xs">
              View Growth Plans
            </Link>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(0,186,242,0.15),transparent_50%)]"></div>
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,rgba(0,186,242,0.15),transparent_50%)]"></div>
      </section>
    </div>
  );
}
