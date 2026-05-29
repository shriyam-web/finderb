'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import CategoryCard from '@/components/CategoryCard';
import SubcategoryScrollRow from '@/components/SubcategoryScrollRow';
import BusinessCard from '@/components/BusinessCard';
import NewsWidget from '@/components/NewsWidget';
import {
  ArrowRight,
  Star,
  MapPin,
  Zap,
  Send,
  Quote,
  Search,
  Sparkles,
  Brain,
  MessageSquare,
  Coffee,
  Wrench,
  Dumbbell,
  Hotel,
  Heart,
  PlusCircle,
  Lightbulb,
  X,
  Cpu,
  Mic,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Business, Category, Movie, TouristPlace, testimonials } from '@/lib/mockData';
import { getFeaturedBusinesses } from '@/app/actions/business';
import { getCategories, getFeaturedGroups } from '@/app/actions/category';
import { getMovies } from '@/app/actions/movie';
import { getTouristPlaces } from '@/app/actions/touristPlace';
import { getBlogs } from '@/app/actions/blog';
import { getSession } from '@/app/actions/user';
import { formatDistanceFromUser } from '@/lib/geo';

const WORDS = [
  "verified professionals",
  "top-rated local services",
  "300+ cities in India",
  "premium local businesses",
  "trusted by millions",
  "verified professionals" // For seamless loop
];

const AI_SUGGESTIONS = [
  { text: "Best cafes near me", icon: Coffee },
  { text: "Top rated plumbers", icon: Wrench },
  { text: "Gyms with personal trainers", icon: Dumbbell },
  { text: "Luxury hotels in Delhi", icon: Hotel },
  { text: "Yoga classes for beginners", icon: Heart },
  { text: "24/7 Pharmacies nearby", icon: PlusCircle },
  { text: "Electricians in Mumbai", icon: Wrench },
  { text: "Co-working spaces", icon: Coffee },
  { text: "Pet clinics", icon: Heart },
  { text: "Interior designers", icon: Sparkles },
];

const SUGGESTIVE_KEYWORDS = [
  "Restaurants", "Dentists", "Schools", "Packers & Movers", "Event Organizers", 
  "Beauty Parlors", "Car Rentals", "Dry Cleaners", "Boutiques", "Real Estate Agents",
  "Tailors", "Hardware Stores", "Bakeries", "Jewellers", "Clinics"
];

export default function HomeClient({ initialData }: { initialData: any }) {
  const [index, setIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTabFromUrl = searchParams.get('tab');

  const [activeMobileTab, setActiveMobileTab] = useState(
    activeTabFromUrl === 'ai' ? 'AI Search' : 'Home'
  );
  const [realBusinesses, setRealBusinesses] = useState<Business[]>(initialData.businesses);
  const [isBusinessesLoading, setIsBusinessesLoading] = useState(initialData.businesses.length === 0);
  const [realCategories, setRealCategories] = useState<Category[]>(initialData.categories);
  const [realMovies, setRealMovies] = useState<Movie[]>(initialData.movies);
  const [realTouristPlaces, setRealTouristPlaces] = useState<TouristPlace[]>(initialData.touristPlaces);
  const [realBlogs, setRealBlogs] = useState<any[]>(initialData.blogs);
  const [featuredGroups, setFeaturedGroups] = useState<any[]>(initialData.featuredGroups ?? []);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiLoadProgress, setAiLoadProgress] = useState(0);
  const [protectedTab, setProtectedTab] = useState<string | null>(null);
  const [aiQuery, setAiQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 600_000, timeout: 10_000 }
    );
  }, []);

  const toggleVoiceSearch = () => {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Voice search is not supported in your browser.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      if (!isListening) {
        recognition.start();
        setIsListening(true);

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setAiQuery(transcript);
          setIsListening(false);
          handleAiSearch(transcript);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };
      } else {
        recognition.stop();
        setIsListening(false);
      }
    }
  };

  const handleAiSearch = (queryText: string) => {
    const q = queryText || aiQuery;
    if (!q.trim()) return;
    
    // For now, redirect to categories search
    router.push(`/categories?search=${encodeURIComponent(q)}`);
  };

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
      // Only fetch if initial data is empty or we want to refresh
      if (
        initialData.businesses.length > 0 &&
        initialData.categories.length > 0 &&
        initialData.featuredGroups?.length > 0
      ) {
        setIsBusinessesLoading(false);
        return;
      }

      const [bizResult, catResult, movieResult, touristResult, blogResult, groupsResult] = await Promise.all([
        getFeaturedBusinesses(),
        getCategories(),
        getMovies(),
        getTouristPlaces(),
        getBlogs(),
        getFeaturedGroups(),
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

      if (blogResult.success && blogResult.blogs && blogResult.blogs.length > 0) {
        setRealBlogs(blogResult.blogs);
      }

      if (groupsResult.success && groupsResult.groups) {
        setFeaturedGroups(groupsResult.groups);
      }

      setIsBusinessesLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTabFromUrl === 'ai') {
      setActiveMobileTab('AI Search');
    } else if (activeTabFromUrl === 'finderb-ai') {
      setIsAiLoading(true);
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

    if (label === 'Categories') {
      setProtectedTab(null);
      setActiveMobileTab('Categories');
      router.push('/categories', { scroll: false });
      return;
    }

    if (label === 'Top Picks') {
      setProtectedTab(null);
      setActiveMobileTab('Top Picks');
      router.push('/?tab=top-picks', { scroll: false });
      return;
    }

    if (label === 'FinderB AI') {
      setIsAiLoading(true);
      setActiveMobileTab('FinderB AI');
      router.push('/?tab=finderb-ai', { scroll: false });
      return;
    }

    if (label === 'Account') {
      router.push('/account');
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
    <div className="flex flex-col bg-white selection:bg-primary/10 font-sans">
      {/* AI Search View */}
      {activeMobileTab === 'AI Search' && (
        <div className="fixed inset-0 z-[80] bg-white pt-20 pb-24 overflow-y-auto px-6">
          {/* Futuristic Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(var(--color-primary-500),0.02),transparent_70%)]"></div>
            <div className="absolute top-1/4 -left-20 w-64 h-64 bg-primary/5 blur-[100px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-secondary/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
            
            {/* Animated AI Nodes */}
            <div className="absolute top-20 right-10 w-2 h-2 bg-primary/20 rounded-full animate-ping"></div>
            <div className="absolute top-40 left-10 w-1.5 h-1.5 bg-secondary/20 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-40 right-20 w-2.5 h-2.5 bg-primary/20 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
          </div>

          <div className="max-w-md mx-auto flex flex-col space-y-10 relative">
            {/* Top Bar */}
            <div className="flex justify-end items-center">
              <button 
                onClick={() => handleTabChange('Home')}
                className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-primary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Header */}
            <div className="space-y-4">
              <h1 className="text-4xl font-black text-primary tracking-tight leading-tight">
                Finder<span className="text-secondary">B</span> <br />
                <span className="bg-gradient-to-r from-primary via-secondary to-orange-400 bg-clip-text text-transparent">AI Assistant</span>
              </h1>
              <p className="text-gray-500 font-medium text-sm leading-relaxed">
                Experience the next generation of local search. Just tell me what you need, and I'll find it for you.
              </p>
            </div>

            {/* Search Input Container */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000 group-focus-within:duration-200 animate-gradient-x"></div>
              <div className="relative flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <div className="flex items-center p-2">
                  <div className="flex-1 flex items-center px-4">
                    <div className="relative mr-3">
                      <Brain size={22} className="text-primary/60" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-secondary rounded-full animate-ping"></div>
                    </div>
                    <input 
                      type="text" 
                      placeholder={isListening ? "Listening..." : "e.g., 'quiet cafe with wifi for work'..."}
                      className="w-full py-4 bg-transparent border-none focus:ring-0 text-gray-900 font-semibold text-sm placeholder:text-gray-300"
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAiSearch('')}
                    />
                  </div>
                  <div className="flex items-center gap-2 pr-2">
                    <button 
                      onClick={toggleVoiceSearch}
                      className={`p-3 rounded-xl transition-all active:scale-95 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-50 text-gray-400 hover:text-primary'}`}
                    >
                      <Mic size={20} className={isListening ? 'animate-bounce' : ''} />
                    </button>
                    <button 
                      onClick={() => handleAiSearch('')}
                      className="bg-primary text-white p-4 rounded-xl hover:bg-secondary transition-all active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
                
                {/* Visual "Smart" indicator */}
                <div className="px-4 py-2 bg-slate-50 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Real-time Analysis</span>
                </div>
              </div>
            </div>

            {/* Keywords Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Lightbulb size={16} className="text-amber-400" />
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Popular Keywords</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIVE_KEYWORDS.map((kw, i) => (
                  <button
                    key={i}
                    onClick={() => handleAiSearch(kw)}
                    className="px-4 py-2 rounded-full bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-600 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 active:scale-95"
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400">
                  <MessageSquare size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Smart Queries</span>
                </div>
                <div className="h-[1px] flex-1 ml-4 bg-gray-100"></div>
              </div>
              <div className="grid grid-cols-2 gap-3 pb-8">
                {AI_SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAiSearch(item.text)}
                    className="flex flex-col items-start p-4 rounded-2xl bg-white border border-gray-100 hover:border-secondary/30 hover:shadow-2xl hover:shadow-secondary/5 transition-all group text-left relative overflow-hidden active:scale-95"
                  >
                    <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight size={10} className="text-secondary" />
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mb-3 group-hover:bg-secondary/10 transition-colors">
                      <item.icon size={16} className="text-gray-400 group-hover:text-secondary transition-colors" />
                    </div>
                    <span className="text-[11px] font-bold text-gray-700 group-hover:text-primary transition-colors leading-tight">
                      {item.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!(activeMobileTab === 'AI Search' || (activeMobileTab === 'FinderB AI' && isAiLoading)) && (
        <>
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
        </div>
      </section>

      {/* Category Section */}
      <section className="bg-muted/50 py-12 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <div>
              <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-primary sm:text-4xl lg:text-5xl">
                What do you need <span className="text-secondary">help</span> with?
              </h2>
              <p className="mt-2 text-sm text-slate-500 sm:hidden">
                Browse popular services near you
              </p>
            </div>
            <Link
              href="/categories"
              className="group flex shrink-0 items-center gap-1.5 text-sm font-bold text-primary hover:text-secondary"
            >
              View all
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="mb-8 grid grid-cols-5 gap-2.5 sm:mb-12 sm:grid-cols-4 sm:gap-6 lg:grid-cols-6">
            {popularCategories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>

          <div className="flex justify-center">
            <Link
              href="/categories"
              className="rounded-2xl bg-primary px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-md transition-all hover:bg-secondary active:scale-95 sm:px-10 sm:py-4 sm:shadow-lg"
            >
              Explore All Categories
            </Link>
          </div>
        </div>
      </section>

      {/* Merchant Profiles Section */}
      <section className="py-16 lg:py-24 bg-slate-50 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary tracking-tight w-full md:w-auto">
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
          <div className="flex overflow-x-auto pb-12 gap-4 sm:gap-6 lg:gap-8 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {isBusinessesLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-[360px] w-[220px] shrink-0 overflow-hidden rounded-3xl sm:h-[400px] sm:w-[300px]">
                  <div className="h-full w-full animate-pulse bg-white border border-gray-100" />
                </div>
              ))
            ) : (
              realBusinesses.map((biz) => (
                <div
                  key={biz.id}
                  className="h-[360px] w-[220px] shrink-0 overflow-hidden rounded-3xl sm:h-[400px] sm:w-[300px]"
                >
                  <BusinessCard
                    business={biz}
                    hidePriceRange
                    uniform
                    distanceLabel={formatDistanceFromUser(userCoords, biz.latitude, biz.longitude)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Featured Group Categories — parents & subcategories from DB */}
      {featuredGroups.length > 0 && (
        <section className="py-16 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {featuredGroups.map((group: any) => (
                <div
                  key={group.id ?? group.title}
                  className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-5 sm:p-7 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">{group.title}</h3>
                  <SubcategoryScrollRow subcategories={group.subcategories} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Movies Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary tracking-tight">
              Latest <span className="text-secondary">Movies</span>
            </h2>
            <Link href="/movies" className="text-sm font-bold text-primary hover:text-secondary transition-colors flex items-center gap-2">
              View all <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {realMovies.slice(0, 4).map((movie) => (
              <div key={movie.id} className="group relative aspect-[2/3] overflow-hidden rounded-2xl shadow-lg">
                <Image
                  src={movie.image}
                  alt={movie.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 z-[2] p-4 text-white">
                  <p className="mb-1 text-lg font-bold leading-tight !text-white">{movie.title}</p>
                  <div className="flex items-center justify-between text-xs font-medium !text-white/90">
                    <span className="!text-white/90">{movie.genre}</span>
                    <div className="flex items-center gap-1">
                      <Star size={12} className="fill-yellow-400 text-yellow-400" />
                      <span className="!text-white">{movie.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tourist Places Section */}
      <section className="py-16 lg:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between gap-3">
            <h2 className="min-w-0 text-2xl font-extrabold tracking-tight text-primary sm:text-4xl lg:text-5xl">
              Explore <span className="text-secondary">Destinations</span>
            </h2>
            <Link
              href="/tourist-places"
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-bold text-primary transition-colors hover:text-secondary"
            >
              View all
              <ArrowRight size={16} className="shrink-0" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {realTouristPlaces.slice(0, 3).map((place) => (
              <div key={place.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500">
                <div className="relative h-48 overflow-hidden">
                  <Image src={place.image} alt={place.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary">
                    {place.distance}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-primary group-hover:text-secondary transition-colors">{place.name}</h3>
                    <div className="flex items-center gap-1 text-secondary">
                      <Star size={14} className="fill-secondary" />
                      <span className="text-sm font-bold">{place.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 text-sm font-medium mb-4">
                    <MapPin size={14} />
                    <span>{place.location}</span>
                  </div>
                  <Link href={`/tourist-places/${place.id}`} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-50 text-primary font-bold text-xs hover:bg-primary hover:text-white transition-all uppercase tracking-widest">
                    Explore Now <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* News and Updates Section */}
      <section id="news" className="py-16 lg:py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <div className="flex justify-between items-end">
                <div className="space-y-4">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary tracking-tight">FinderB <span className="text-secondary">News</span></h2>
                  <p className="text-gray-500 font-medium">Stay updated with the latest in local services and business trends.</p>
                </div>
                <Link href="/blog" className="hidden sm:flex items-center gap-2 text-sm font-bold text-primary hover:text-secondary transition-colors">
                  Read all articles <ArrowRight size={16} />
                </Link>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-8">
                {realBlogs.slice(0, 4).map((post: any) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="group space-y-4 block">
                    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-sm">
                      <Image 
                        src={post.coverImage || 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&q=80&w=800'} 
                        alt={post.title} 
                        fill 
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-[10px] font-bold text-primary uppercase tracking-widest shadow-sm">
                          {post.category || 'Local News'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-primary group-hover:text-secondary transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
                      <div className="flex items-center gap-3 pt-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{post.date || 'Today'}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">5 min read</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              
              <Link href="/blog" className="flex sm:hidden items-center justify-center gap-2 py-4 rounded-xl border border-gray-100 text-sm font-bold text-primary">
                Read all articles <ArrowRight size={16} />
              </Link>
            </div>
            
            <div className="lg:border-l lg:border-gray-100 lg:pl-12">
              <NewsWidget />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 lg:py-24 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary tracking-tight">
              What our <span className="text-secondary">Users</span> say
            </h2>
            <p className="text-gray-500 font-medium max-w-2xl mx-auto">
              Don't just take our word for it. Here's what people across India are saying about their experience with FinderB.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col relative group hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                <div className="absolute top-8 right-8 text-secondary/10 group-hover:text-secondary/20 transition-colors">
                  <Quote size={48} />
                </div>
                
                <div className="flex items-center gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={14} className="fill-secondary text-secondary" />
                  ))}
                </div>

                <p className="text-gray-600 font-medium leading-relaxed mb-8 flex-grow italic">
                  "{testimonial.content}"
                </p>

                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-slate-50">
                    <Image 
                      src={testimonial.avatar} 
                      alt={testimonial.name} 
                      fill 
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary">{testimonial.name}</h4>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
        </>
      )}

      {/* AI Search Overlay */}
      {activeMobileTab === 'FinderB AI' && isAiLoading && (
        <div className="fixed inset-0 z-[100] bg-primary flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-secondary/10 blur-[150px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/5 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay"></div>
          </div>

          <div className="relative space-y-12 max-w-lg w-full">
            <div className="relative inline-block">
              <div className="absolute -inset-12 bg-secondary/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute -inset-4 bg-gradient-to-tr from-secondary/40 to-transparent rounded-[3rem] animate-spin-slow opacity-30"></div>
              <div className="relative w-36 h-36 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-12 hover:rotate-0 transition-transform duration-500 overflow-hidden group">
                <Image src="/logo1.png" alt="FinderB AI" width={90} height={90} className="object-contain relative z-10 transition-transform group-hover:scale-110" />
                {/* Scanning line effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/40 to-transparent h-1/2 w-full animate-scan z-20"></div>
                {/* Glowing background inside the logo box */}
                <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors"></div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-4xl sm:text-5xl font-black !text-white tracking-tight">
                Finder<span className="text-secondary">B</span> AI
              </h2>
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-secondary font-bold uppercase tracking-[0.4em] text-[10px] sm:text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
                  {aiLoadStage}
                </div>
                <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
                  <span className="text-[9px] !text-white/60 font-medium tracking-[0.1em] uppercase">Processing Quantum Data</span>
                </div>
              </div>
            </div>

            <div className="space-y-6 max-w-xs mx-auto w-full">
              <div className="relative h-2 w-full bg-white/10 rounded-full overflow-hidden p-[2px] shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-secondary via-orange-400 to-secondary rounded-full transition-all duration-300 ease-out shadow-[0_0_20px_rgba(246,158,50,0.6)] relative"
                  style={{ width: `${aiLoadProgress}%` }}
                >
                  <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/40 animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between items-center px-1">
                <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest animate-pulse">Analyzing Environment</p>
                <span className="text-secondary font-black text-[10px]">{Math.round(aiLoadProgress)}%</span>
              </div>
            </div>

            <div className="pt-8">
              <div className="flex justify-center gap-6">
                {[Sparkles, Brain, Zap].map((Icon, i) => (
                  <div key={i} className="relative group">
                    <div className="absolute -inset-2 bg-white/5 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Icon size={24} className={`text-white/20 animate-pulse`} style={{ animationDelay: `${i * 0.5}s` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Voice Search Modal */}
      {isListening && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 flex flex-col items-center space-y-6 shadow-2xl transform animate-in fade-in zoom-in duration-300">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping scale-150"></div>
              <div className="relative bg-primary text-white p-6 rounded-full shadow-lg">
                <Mic size={40} className="animate-bounce" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-gray-900">Listening...</h3>
              <p className="text-gray-500 text-sm">Tell me what you're looking for</p>
            </div>
            <button 
              onClick={toggleVoiceSearch}
              className="px-8 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors active:scale-95"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
