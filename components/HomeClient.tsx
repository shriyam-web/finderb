'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import CategoryCard from '@/components/CategoryCard';
import BusinessCard from '@/components/BusinessCard';
import NewsWidget from '@/components/NewsWidget';
import * as LucideIcons from 'lucide-react';
import {
  ArrowRight,
  Star,
  MapPin,
  Zap,
  Send,
  Quote,
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

const WORDS = [
  "verified professionals",
  "top-rated local services",
  "300+ cities in India",
  "premium local businesses",
  "trusted by millions",
  "verified professionals" // For seamless loop
];

const FEATURE_GROUPS_FALLBACK = [
  {
    title: "Restaurants",
    subcategories: [
      { name: "Fine Dining", image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=400", href: "/categories/restaurants?type=fine-dining" },
      { name: "Cafes", image: "https://images.unsplash.com/photo-1501339817302-ee4fba6a2e81?auto=format&fit=crop&q=80&w=400", href: "/categories/restaurants?type=cafe" },
      { name: "Quick Bites", image: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&q=80&w=400", href: "/categories/restaurants?type=fast-food" },
      { name: "Bars & Pubs", image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=400", href: "/categories/restaurants?type=bar" },
      { name: "Bakeries", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400", href: "/categories/restaurants?type=bakery" },
      { name: "Desserts", image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=400", href: "/categories/restaurants?type=dessert" },
      { name: "Buffet", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400", href: "/categories/restaurants?type=buffet" },
    ]
  },
  {
    title: "Education",
    subcategories: [
      { name: "Colleges", image: "https://images.unsplash.com/photo-152305085306e-8a3d3ecf047d?auto=format&fit=crop&q=80&w=400", href: "/categories/college" },
      { name: "Tutors", image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=400", href: "/categories/tutors" },
      { name: "Schools", image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=400", href: "/categories/schools" },
      { name: "Coaching", image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=400", href: "/categories/coaching-centers" },
      { name: "Vocational", image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=400", href: "/categories/vocational-training" },
    ]
  },
  {
    title: "Astrologers",
    subcategories: [
      { name: "Astrologers", image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=400", href: "/categories/astrologers" },
      { name: "Palmists", image: "https://images.unsplash.com/photo-1568431109612-43003050c763?auto=format&fit=crop&q=80&w=400", href: "/categories/palmists" },
      { name: "Vastu", image: "https://images.unsplash.com/photo-1585121336019-21b3eb99b8f5?auto=format&fit=crop&q=80&w=400", href: "/categories/vastu-consultants" },
    ]
  },
  {
    title: "Wedding Planning",
    subcategories: [
      { name: "Banquet Halls", image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=400", href: "/categories/banquet-halls" },
      { name: "Photographers", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=400", href: "/categories/photography" },
      { name: "Makeup Artists", image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=400", href: "/categories/bridal-makeup" },
      { name: "Decorators", image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=400", href: "/categories/wedding-decorators" },
      { name: "Caterers", image: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=400", href: "/categories/catering" },
    ]
  }
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
  const [featuredGroups, setFeaturedGroups] = useState<any[]>(initialData.featuredGroups || FEATURE_GROUPS_FALLBACK);
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
      // Only fetch if initial data is empty or we want to refresh
      if (initialData.businesses.length > 0 && initialData.categories.length > 0 && initialData.featuredGroups?.length > 0) {
        setIsBusinessesLoading(false);
        return;
      }
      
      const featuredCategoryNames = ["Restaurants", "Education", "Astrologers", "Wedding Planning"];

      const [bizResult, catResult, movieResult, touristResult, blogResult, groupsResult] = await Promise.all([
        getFeaturedBusinesses(),
        getCategories(),
        getMovies(),
        getTouristPlaces(),
        getBlogs(),
        getFeaturedGroups(featuredCategoryNames)
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

      if (groupsResult.success && groupsResult.groups && groupsResult.groups.length > 0) {
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
      <section className="py-16 lg:py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
            <div className="space-y-4">

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary tracking-tight">What do you need <span className="text-secondary">help</span> with?</h2>
            </div>
            <Link href="/categories" className="group flex items-center gap-2 text-sm font-bold text-primary hover:text-secondary transition-colors">
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
              href="/categories" 
              className="bg-primary text-white px-10 py-4 rounded-2xl font-bold hover:bg-secondary transition-all active:scale-95 uppercase tracking-widest text-xs shadow-lg"
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
          <div className="flex overflow-x-auto pb-12 gap-6 lg:gap-8 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {isBusinessesLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="min-w-[250px] sm:min-w-[320px] shrink-0">
                  <div className="h-[400px] rounded-3xl bg-white border border-gray-100 animate-pulse" />
                </div>
              ))
            ) : (
              realBusinesses.map((biz) => (
                <div key={biz.id} className="min-w-[250px] sm:min-w-[320px] shrink-0">
                  <BusinessCard business={biz} />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Featured Group Categories */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featuredGroups.map((group) => (
              <div key={group.title} className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-5 sm:p-7 hover:shadow-md transition-shadow">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">{group.title}</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {group.subcategories.map((sub: any) => {
                    // @ts-ignore
                    const IconComponent = LucideIcons[sub.icon] || LucideIcons.Grid;
                    return (
                      <Link key={sub.name} href={sub.href} className="group flex flex-col items-center text-center space-y-2">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                          <IconComponent size={20} className="sm:size-6" strokeWidth={1.5} />
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-semibold text-gray-600 group-hover:text-primary transition-colors line-clamp-2 px-1 leading-tight">
                          {sub.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
              <div key={movie.id} className="group relative rounded-2xl overflow-hidden shadow-lg aspect-[2/3]">
                <Image src={movie.image} alt={movie.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-bold text-lg leading-tight mb-1">{movie.title}</h3>
                  <div className="flex items-center justify-between text-white/80 text-xs font-medium">
                    <span>{movie.genre}</span>
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      <span>{movie.rating}</span>
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
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary tracking-tight">
              Explore <span className="text-secondary">Destinations</span>
            </h2>
            <Link href="/tourist-places" className="text-sm font-bold text-primary hover:text-secondary transition-colors flex items-center gap-2">
              View all <ArrowRight size={16} />
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

      {/* AI Search Overlay */}
      {activeMobileTab === 'FinderB AI' && isAiLoading && (
        <div className="fixed inset-0 z-[100] bg-primary flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-secondary/10 blur-[150px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/5 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>

          <div className="relative space-y-12 max-w-lg w-full">
            <div className="relative inline-block">
              <div className="absolute -inset-8 bg-secondary/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="relative w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-12 hover:rotate-0 transition-transform duration-500">
                <Image src="/logo1.png" alt="FinderB AI" width={80} height={80} className="object-contain" />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-4xl font-black text-white tracking-tight">
                Finder<span className="text-secondary">B</span> AI
              </h2>
              <div className="flex items-center justify-center gap-2 text-secondary font-bold uppercase tracking-[0.3em] text-[10px]">
                <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
                {aiLoadStage}
              </div>
            </div>

            <div className="space-y-6">
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden p-[2px]">
                <div 
                  className="h-full bg-gradient-to-r from-secondary to-orange-400 rounded-full transition-all duration-300 ease-out shadow-[0_0_20px_rgba(246,158,50,0.5)]"
                  style={{ width: `${aiLoadProgress}%` }}
                ></div>
              </div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Do not close this window</p>
            </div>

            <div className="pt-8">
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-white/20 animate-shimmer" style={{ animationDelay: `${i * 0.2}s` }}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
