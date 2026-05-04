'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import CategoryCard from '@/components/CategoryCard';
import BusinessCard from '@/components/BusinessCard';
import NewsWidget from '@/components/NewsWidget';
import {
  categories,
  testimonials,
  cities,
  movies,
  touristPlaces,
  articles
} from '@/lib/mockData';
import { getFeaturedBusinesses } from '@/app/actions/business';
import { getCategories } from '@/app/actions/category';
import { getMovies } from '@/app/actions/movie';
import { getTouristPlaces } from '@/app/actions/touristPlace';
import { getSession } from '@/app/actions/user';
import { Business, Category, Movie, TouristPlace } from '@/lib/mockData';
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
    activeTabFromUrl === 'ai' ? 'AI Search' : 'Home'
  );
  const [realBusinesses, setRealBusinesses] = useState<Business[]>([]);
  const [isBusinessesLoading, setIsBusinessesLoading] = useState(true);
  const [realCategories, setRealCategories] = useState<Category[]>(categories);
  const [realMovies, setRealMovies] = useState<Movie[]>(movies);
  const [realTouristPlaces, setRealTouristPlaces] = useState<TouristPlace[]>(touristPlaces);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiLoadProgress, setAiLoadProgress] = useState(0);
  const [protectedTab, setProtectedTab] = useState<string | null>(null);

  const aiLoadStages = [
    { threshold: 15, label: 'Initializing assistant' },
    { threshold: 40, label: 'Loading knowledge base' },
    { threshold: 65, label: 'Tuning suggestions' },
    { threshold: 90, label: 'Checking search quality' },
    { threshold: 100, label: 'Ready to launch' }
  ];

  const aiLoadStage = aiLoadStages.find(stage => aiLoadProgress <= stage.threshold)?.label || 'Launching';

  useEffect(() => {
    async function fetchData() {
      const [bizResult, catResult, movieResult, touristResult] = await Promise.all([
        getFeaturedBusinesses(),
        getCategories(),
        getMovies(),
        getTouristPlaces()
      ]);

      if (bizResult.success && bizResult.businesses && bizResult.businesses.length > 0) {
        setRealBusinesses(bizResult.businesses);
      }

      if (catResult.success && catResult.categories && catResult.categories.length > 0) {
        setRealCategories(catResult.categories);
      }

      if (movieResult.success && movieResult.movies && movieResult.movies.length > 0) {
        setRealMovies(movieResult.movies);
      }

      if (touristResult.success && touristResult.touristPlaces && touristResult.touristPlaces.length > 0) {
        setRealTouristPlaces(touristResult.touristPlaces);
      }

      setIsBusinessesLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTabFromUrl === 'ai') {
      setActiveMobileTab('AI Search');
    } else if (activeTabFromUrl === 'finderb-ai') {
      setActiveMobileTab('FinderB AI');
    } else {
      setActiveMobileTab('Home');
    }
  }, [activeTabFromUrl]);

  useEffect(() => {
    const checkSession = async () => {
      const result = await getSession();
      setIsLoggedIn(!!result?.success);
    };
    checkSession();
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let interval: ReturnType<typeof setInterval>;

    if (activeMobileTab === 'FinderB AI' && isAiLoading) {
      setAiLoadProgress(0);
      interval = setInterval(() => {
        setAiLoadProgress((prev) => {
          const next = Math.min(prev + 6, 100);
          return next;
        });
      }, 120);

      timer = setTimeout(() => {
        setAiLoadProgress(100);
        setIsAiLoading(false);
        setActiveMobileTab('AI Search');
        router.push('/?tab=ai', { scroll: false });
      }, 2200);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [activeMobileTab, isAiLoading, router]);

  const handleTabChange = (label: string) => {
    if (label === 'Home') {
      setProtectedTab(null);
      setActiveMobileTab('Home');
      router.push('/', { scroll: false });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (label === 'FinderB AI') {
      setProtectedTab(null);
      setActiveMobileTab('FinderB AI');
      setAiLoadProgress(0);
      setIsAiLoading(true);
      router.push('/?tab=finderb-ai', { scroll: false });
      return;
    }

    if (label === 'AI Search') {
      setProtectedTab(null);
      setActiveMobileTab('AI Search');
      router.push('/?tab=ai', { scroll: false });
      return;
    }

    if (label === 'History' || label === 'Saved') {
      if (!isLoggedIn) {
        setProtectedTab(label);
        setActiveMobileTab(label);
        return;
      }
      setProtectedTab(null);
      setActiveMobileTab(label);
      router.push(`/?tab=${label.toLowerCase()}`, { scroll: false });
      return;
    }

    setActiveMobileTab(label);
  };

  const excludedSlugs = ['real-estate', 'admissions', 'b2b', 'job'];
  const sortedCategories = [...realCategories]
    .filter(cat => !excludedSlugs.includes(cat.slug))
    .sort((a, b) => b.businessCount - a.businessCount);
  const popularCategories = sortedCategories.slice(0, 18);
  const otherCategories = sortedCategories.slice(18);

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
      {/* Featured Categories Strip */}
      <section className="pt-20 lg:pt-28 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* 1 Row - 5 Cards */}
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {[
              { name: 'Real Estate', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=400', href: '/categories/real-estate' },
              { name: 'Admissions', image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=400', href: '/categories/admissions' },
              { name: 'B2B', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=400', href: '/categories/b2b' },
              { name: 'Job', image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=400', href: '/categories/job' },
              { name: 'FinderB News', image: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&q=80&w=400', href: '#news' },
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group relative h-24 sm:h-28 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
              >
                {/* Image */}
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/55 group-hover:bg-black/45 transition-colors duration-300" />

                {/* Bottom-left Text */}
                <div className="absolute bottom-2 left-2 right-1">
                  <h3
                    className="!text-white text-[10px] sm:text-xs font-semibold uppercase tracking-wide leading-tight drop-shadow-md"
                    style={{ color: "#ffffff" }}
                  >
                    {item.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </section>
  
      {/* Hero */}
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

          <div className="grid grid-cols-6 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-6 mb-12">
            {popularCategories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>

          <div className="flex justify-center">
            <Link 
              href="/categories/all" 
              className="bg-primary text-white px-10 py-4 rounded-2xl font-bold hover:bg-secondary transition-all active:scale-95 uppercase tracking-widest text-xs shadow-lg"
            >
              Explore All Categories
            </Link>
          </div>
        </div>
      </section>

      {/* Merchant Profiles Section */}
      <section className="py-20 bg-slate-50 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-primary tracking-tight w-full md:w-auto">
              Recommended <span className="text-secondary">Merchants</span>
            </h2>
            
            {/* Filters */}
            <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl md:rounded-[2rem] border border-gray-100 shadow-sm min-w-max">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-3 hidden sm:block">Filter:</span>
                <div className="flex gap-2">
                  {[
                    { label: 'Top Rated', icon: Star },
                    { label: 'Best Discount', icon: Zap },
                    { label: 'Nearest', icon: MapPin },
                  ].map((filter) => (
                    <button
                      key={filter.label}
                      className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl bg-white border border-gray-50 text-[10px] font-bold text-gray-500 hover:border-secondary/30 hover:text-secondary hover:shadow-lg hover:shadow-secondary/5 transition-all flex items-center gap-2 group whitespace-nowrap"
                    >
                      <filter.icon size={12} className="group-hover:scale-110 transition-transform text-secondary/70" />
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Horizontal Scrolling List */}
          <div className="flex overflow-x-auto pb-12 gap-6 lg:gap-8 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {isBusinessesLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="min-w-[220px] sm:min-w-[260px] shrink-0">
                  <div className="h-[292px] rounded-3xl border border-gray-200 bg-white p-5 shadow-sm animate-pulse" />
                </div>
              ))
            ) : realBusinesses.length > 0 ? (
              realBusinesses.map((business) => (
                <div key={business.id} className="min-w-[220px] sm:min-w-[260px] shrink-0">
                  <BusinessCard business={business} isPremium={true} compact={true} />
                </div>
              ))
            ) : (
              <div className="py-20 w-full text-center text-gray-500">
                No verified merchants are available right now. Please check back later.
              </div>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
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
                  { title: 'Verified Pros', desc: 'Background checked experts', icon: ShieldCheck, color: '#3B82F6' },
                  { title: 'Best Prices', desc: 'No hidden costs, ever', icon: Star, color: '#F59E0B' },
                  { title: 'Instant Booking', desc: 'Confirm in 30 seconds', icon: Zap, color: '#10B981' },
                  { title: '24/7 Support', desc: 'We are here to help you', icon: ArrowRight, color: '#8B5CF6' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-transparent hover:shadow-xl transition-all group relative overflow-hidden">
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <div 
                      className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-lg [perspective:1000px] border border-gray-50 group-hover:border-transparent"
                      style={{ color: item.color }}
                    >
                      <item.icon size={22} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="relative z-10">
                      <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{item.title}</h4>
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
            { icon: Search, label: 'Home' },
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
              {item.label === 'FinderB AI' && activeMobileTab !== 'FinderB AI' && (
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
            <h2 className="text-lg sm:text-2xl font-medium text-primary">Movies & Entertainment Nearby</h2>
            <Link href="/movies" className="text-xs sm:text-sm font-medium text-secondary hover:underline">See All</Link>
          </div>
          <div className="flex overflow-x-auto pb-4 lg:pb-8 gap-4 lg:gap-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {realMovies.map((movie) => (
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
      <section className="py-16 lg:py-24 bg-slate-50 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 translate-x-1/4 blur-3xl"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-10 lg:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold mb-3 text-primary tracking-tight">Discover Top-Rated Tourist Places & Local Attractions</h2>
            <p className="text-gray-500 text-sm sm:text-base font-medium max-w-2xl">Find the best attractions and hidden gems in your vicinity, curated for the best experience.</p>
          </div>
          <div className="flex overflow-x-auto pb-8 lg:pb-12 gap-6 lg:gap-8 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {realTouristPlaces.map((place) => (
              <div key={place.id} className="group relative h-[350px] sm:h-[450px] min-w-[280px] sm:min-w-[420px] rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 bg-white shrink-0">
                <Image
                  src={place.image}
                  alt={place.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8 sm:p-10 w-full">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-secondary" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white">{place.location}</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-bold text-white mb-4 tracking-tight">{place.name}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 bg-secondary px-3 py-1 rounded-full text-white shadow-lg">
                        <Star size={14} fill="currentColor" />
                        <span className="text-xs font-bold">{place.rating}</span>
                      </div>
                      <span className="text-xs font-medium text-white/80">Popular destination</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:bg-secondary group-hover:border-secondary transition-all">
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FinderB News */}
      <section id="news" className="py-16 lg:py-24 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/10 rounded-full text-secondary border border-secondary/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Latest Updates</span>
              </div>
              <h2 className="text-4xl sm:text-6xl font-black text-primary tracking-tighter">FinderB <span className="text-secondary">News.</span></h2>
              <p className="text-gray-500 text-lg font-medium max-w-xl">Stay updated with the latest happenings, expansions, and technical breakthroughs at FinderB.</p>
            </div>
          </div>

          <NewsWidget />
        </div>
      </section>

      {/* Blog & Articles */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start justify-between mb-12 lg:mb-16 gap-6">
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-5xl font-bold text-primary tracking-tight">Blog & Local Insights</h2>
              <p className="text-gray-500 text-sm sm:text-lg font-medium">Expert guides, local stories and business tips.</p>
            </div>
            <Link href="/blog" className="group flex items-center gap-2 text-[10px] font-bold text-secondary hover:text-primary transition-all uppercase tracking-widest bg-secondary/5 px-6 py-3 rounded-full border border-secondary/10">
              Read All Stories <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="flex overflow-x-auto pb-12 gap-8 lg:gap-10 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {articles.map((article) => (
              <Link key={article.id} href={`/blog/${article.id}`} className="group cursor-pointer min-w-[240px] sm:min-w-[320px] shrink-0">
                <div className="relative h-48 sm:h-64 rounded-[2rem] overflow-hidden mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-500 bg-gray-50">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-1000"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg border border-white/20">
                    <Calendar size={12} className="text-secondary" />
                    <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">{article.date}</span>
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-primary group-hover:text-secondary transition-colors mb-4 leading-tight tracking-tight line-clamp-2">{article.title}</h3>
                <p className="text-gray-500 font-medium text-sm sm:text-base line-clamp-2 mb-6 leading-relaxed">{article.excerpt}</p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-secondary uppercase tracking-[0.2em] group-hover:gap-3 transition-all">
                  CONTINUE READING <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-primary relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-10 lg:space-y-16 relative z-10">
          <div className="space-y-6 lg:space-y-8">
           <h2 className="text-4xl sm:text-6xl lg:text-5xl tracking-tighter leading-[1.3]">
  <span className="text-white">
    Take your business to the next level.
  </span>{' '}
  <span className="text-yellow-400">
    Join FinderB today.
  </span>
</h2>
            <p className="text-white/60 text-base sm:text-xl lg:text-2xl font-medium max-w-3xl mx-auto leading-relaxed">
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

      {/* FinderB AI loader */}
      {activeMobileTab === 'FinderB AI' && isAiLoading && (
        <div className="fixed inset-0 z-[1000] bg-primary/95 backdrop-blur-2xl md:hidden flex flex-col items-center justify-center p-8 transition-all duration-700 animate-in fade-in zoom-in-95">
              <div className="relative mb-12">
            <div className="absolute inset-0 bg-gradient-to-tr from-secondary via-purple-600 to-pink-500 blur-[120px] opacity-80 animate-pulse"></div>
            <div className="relative w-36 h-36 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shadow-2xl overflow-hidden">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-secondary via-purple-500 to-blue-500 opacity-60 animate-spin"></div>
              <div className="relative w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-xl">
                <Sparkles size={48} className="text-secondary animate-pulse" />
              </div>
            </div>
          </div>

          <div className="text-center space-y-4 max-w-md">
            <h2 className="text-4xl sm:text-5xl font-black !text-white tracking-tight">FinderB AI is loading</h2>
            <p className="text-white/70 font-medium text-sm sm:text-base">Getting your smart search ready.</p>
          </div>

          <div className="mt-10 w-full max-w-md space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-white/80 font-semibold">
                <span>{aiLoadStage}</span>
                <span>{aiLoadProgress}%</span>
              </div>
              <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-secondary transition-all duration-300"
                  style={{ width: `${aiLoadProgress}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => handleTabChange('Home')}
              className="w-full bg-secondary text-white py-4 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-black/20 hover:scale-105 active:scale-95 transition-all"
            >
              Return Home
            </button>
          </div>
        </div>
      )}

      {/* Auth prompt for protected tabs */}
      {protectedTab && !isLoggedIn && (
        <div className="fixed inset-0 z-[1002] bg-black/70 md:hidden flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-[2rem] bg-white shadow-2xl border border-slate-200 p-8 text-center">
            <div className="mb-6 rounded-full bg-secondary/10 inline-flex p-4">
              {protectedTab === 'Saved' ? <Heart size={28} className="text-secondary" /> : <History size={28} className="text-secondary" />}
            </div>
            <h2 className="text-2xl font-black text-primary mb-3">Please Sign in first</h2>
            <p className="text-sm text-slate-500 mb-6">
              You need to sign in to access your {protectedTab.toLowerCase()} section.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-secondary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:shadow-xl transition-all"
            >
              Go to Sign In Page
            </button>
            <button
              onClick={() => {
                setProtectedTab(null);
                setActiveMobileTab('Home');
              }}
              className="w-full mt-4 border border-slate-200 text-slate-700 py-4 rounded-2xl font-semibold uppercase tracking-widest text-xs hover:bg-slate-50 transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}

      {(activeMobileTab === 'History' || activeMobileTab === 'Saved') && isLoggedIn && (
        <div className="fixed inset-0 z-[1002] bg-black/70 md:hidden flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-[2rem] bg-white shadow-2xl border border-slate-200 p-8 text-center">
            <div className="mb-6 rounded-full bg-secondary/10 inline-flex p-4">
              {activeMobileTab === 'Saved' ? <Heart size={28} className="text-secondary" /> : <History size={28} className="text-secondary" />}
            </div>
            <h2 className="text-2xl font-black text-primary mb-3">{activeMobileTab}</h2>
            <p className="text-sm text-slate-500 mb-6">
              Your {activeMobileTab.toLowerCase()} will appear here once you have saved items or history.
            </p>
            <button
              onClick={() => {
                setActiveMobileTab('Home');
                router.push('/', { scroll: false });
              }}
              className="w-full bg-secondary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:shadow-xl transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}

      {/* AI Search Interface */}
      {activeMobileTab === 'AI Search' && (
        <div className="fixed inset-0 z-[1001] bg-primary flex flex-col p-6 animate-in fade-in slide-in-from-bottom-20 duration-500 overflow-hidden selection:bg-secondary/20">
          <div className="flex-1 flex flex-col items-center justify-around text-center py-10 sm:py-20 max-w-5xl mx-auto w-full">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-[1.1]">
                <span className="text-white">How can I </span>
                <span className="text-secondary underline decoration-4 lg:decoration-8 underline-offset-8 lg:underline-offset-[12px]">help</span>
                <span className="text-white"> you today?</span>
              </h2>
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
  return <HomeContent />;
}