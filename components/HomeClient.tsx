'use client';

import { Suspense, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CategoryIcon from '@/components/CategoryIcon';
import MobileHome from '@/components/MobileHome';
import NativeAppsComingSoon from '@/components/NativeAppsComingSoon';
import MerchantListingRating from '@/components/business/MerchantListingRating';
import HomeTrustHighlights from '@/components/HomeTrustHighlights';
import MerchantOfferBadge from '@/components/business/MerchantOfferBadge';
import MerchantJobBadge from '@/components/business/MerchantJobBadge';
import { VerifiedNameTick } from '@/components/business/VerifiedMark';
import HomeHero from '@/components/HomeHero';
import FeaturedCategoryGroup from '@/components/home/FeaturedCategoryGroup';
import NewsWidget from '@/components/NewsWidget';
import { categoryBrowseHref } from '@/lib/categoryDisplay';
import { getBusinessProfilePath } from '@/lib/businessSlug';
import { getTouristPlacePath } from '@/lib/touristPlaceSlug';
import { buildHeroPopularSearches } from '@/lib/homeHeroConstants';
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
  Lightbulb,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  X,
  Cpu,
  Mic,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import TouristPlaceImage from '@/components/TouristPlaceImage';
import { Business, Category, Movie, TouristPlace, testimonials } from '@/lib/mockData';
import { getFeaturedBusinesses } from '@/app/actions/business';
import { getCategories, getFeaturedGroups } from '@/app/actions/category';
import { getMovies } from '@/app/actions/movie';
import { getTouristPlaces } from '@/app/actions/touristPlace';
import { getBlogs } from '@/app/actions/blog';
import { getSession } from '@/app/actions/user';
import { useSortedTouristPlaces } from '@/hooks/useSortedTouristPlaces';
import { useUserCoords, useUserLocationState } from '@/hooks/useUserCoords';
import { appendLocationToSearchQuery } from '@/lib/searchQuery';
import { formatDistanceFromUser } from '@/lib/geo';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';
import VoiceSearchModal from '@/components/VoiceSearchModal';
import { normalizeVoiceTranscript } from '@/lib/voiceSearch';
import { setLastSearchQuery } from '@/lib/lastSearchQuery';
import { recordSearchAnalytics } from '@/lib/searchAnalytics';
import { stripHtml } from '@/lib/stripHtml';
import { SHOW_HOME_LATEST_MOVIES_SECTION } from '@/lib/featureFlags';
import FinderBTutorialsSection from '@/components/home/FinderBTutorialsSection';
import { getBusinessOpenStatus } from '@/lib/businessHours';
import BusinessListingImage from '@/components/business/BusinessListingImage';

const WORDS = [
  "verified professionals",
  "top-rated local services",
  "300+ cities in India",
  "premium local businesses",
  "trusted by millions",
  "verified professionals" // For seamless loop
];

/**
 * useSearchParams() forces a client-render bailout. Keep it in a child behind
 * Suspense so the homepage HTML still SSR's real content for crawlers/AI.
 */
export default function HomeClient({ initialData }: { initialData: any }) {
  return (
    <Suspense fallback={<HomeClientView initialData={initialData} activeTabFromUrl={null} />}>
      <HomeClientWithSearchParams initialData={initialData} />
    </Suspense>
  );
}

function HomeClientWithSearchParams({ initialData }: { initialData: any }) {
  const searchParams = useSearchParams();
  return (
    <HomeClientView initialData={initialData} activeTabFromUrl={searchParams.get('tab')} />
  );
}

function HomeClientView({
  initialData,
  activeTabFromUrl,
}: {
  initialData: any;
  activeTabFromUrl: string | null;
}) {
  const [index, setIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const router = useRouter();

  const [activeMobileTab, setActiveMobileTab] = useState(
    activeTabFromUrl === 'ai' ? 'AI Search' : 'Home'
  );
  const [realBusinesses, setRealBusinesses] = useState<Business[]>(initialData.businesses);
  const [isBusinessesLoading, setIsBusinessesLoading] = useState(initialData.businesses.length === 0);
  const [realCategories, setRealCategories] = useState<Category[]>(initialData.categories);
  const [realMovies, setRealMovies] = useState<Movie[]>(initialData.movies);
  const [realTouristPlaces, setRealTouristPlaces] = useState<TouristPlace[]>(initialData.touristPlaces);
  const sortedTouristPlaces = useSortedTouristPlaces(realTouristPlaces);
  const [realBlogs, setRealBlogs] = useState<any[]>(initialData.blogs);
  const [featuredGroups, setFeaturedGroups] = useState<any[]>(initialData.featuredGroups ?? []);
  const [tutorialPlaylists] = useState(initialData.tutorialPlaylists ?? []);
  const trendingThisWeek: Array<{ label: string; trend: number; query: string }> =
    initialData.trendingThisWeek ?? [];
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiLoadProgress, setAiLoadProgress] = useState(0);
  const [protectedTab, setProtectedTab] = useState<string | null>(null);
  const [manualQuery, setManualQuery] = useState('');
  const manualQueryRef = useRef('');
  const [searchHint, setSearchHint] = useState(false);
  const prevTabFromUrlRef = useRef<string | null | undefined>(undefined);
  const userCoords = useUserCoords();
  const { effectiveSearchLocation } = useUserLocationState();

  const navigateToSearch = useCallback(
    (q: string) => {
      const trimmed = normalizeVoiceTranscript(q);
      if (!trimmed) return;
      const withLocation = appendLocationToSearchQuery(trimmed, effectiveSearchLocation);
      setManualQuery('');
      manualQueryRef.current = '';
      recordSearchAnalytics(withLocation);
      router.push(`/categories?search=${encodeURIComponent(withLocation)}`, { scroll: false });
    },
    [router, effectiveSearchLocation]
  );

  const {
    voiceActive,
    voicePhase,
    voiceTranscript,
    voiceError,
    openVoiceSearch,
    closeVoiceSearch,
    retryVoiceSearch,
  } = useVoiceSearch(navigateToSearch);

  const closeVoiceSearchRef = useRef(closeVoiceSearch);
  closeVoiceSearchRef.current = closeVoiceSearch;

  const handleManualSearch = useCallback(
    (queryText?: string) => {
      if (voiceActive) return;
      const q = (queryText ?? manualQueryRef.current).trim();
      if (!q) {
        setSearchHint(true);
        return;
      }
      setSearchHint(false);
      navigateToSearch(q);
    },
    [navigateToSearch, voiceActive]
  );

  const handleQueryChange = useCallback((value: string) => {
    manualQueryRef.current = value;
    setManualQuery(value);
    setSearchHint(false);
  }, []);

  useEffect(() => {
    if (!searchHint) return;
    const timer = window.setTimeout(() => setSearchHint(false), 4000);
    return () => window.clearTimeout(timer);
  }, [searchHint]);

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
      // Refresh featured groups even when other SSR data is present — merchant
      // coverage changes and we always want up to 6 sections with listings.
      const refreshFeaturedGroups = async () => {
        const groupsResult = await getFeaturedGroups();
        if (groupsResult.success && groupsResult.groups) {
          setFeaturedGroups(groupsResult.groups);
        }
      };

      if (
        initialData.businesses.length > 0 &&
        initialData.categories.length > 0 &&
        initialData.featuredGroups?.length > 0
      ) {
        void refreshFeaturedGroups();
        setIsBusinessesLoading(false);
        return;
      }

      const [bizResult, catResult, movieResult, touristResult, blogResult, groupsResult] = await Promise.all([
        getFeaturedBusinesses(),
        getCategories(),
        SHOW_HOME_LATEST_MOVIES_SECTION ? getMovies() : Promise.resolve({ success: true, movies: [] }),
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

      if (SHOW_HOME_LATEST_MOVIES_SECTION && movieResult.success && movieResult.movies && movieResult.movies.length > 0) {
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
    const tab = activeTabFromUrl;
    const onAi = tab === 'ai' || tab === 'finderb-ai';

    if (prevTabFromUrlRef.current !== undefined && prevTabFromUrlRef.current !== tab) {
      closeVoiceSearchRef.current();
    }
    prevTabFromUrlRef.current = tab;

    if (onAi) {
      setIsAiLoading(false);
      setActiveMobileTab('AI Search');
      setManualQuery('');
      manualQueryRef.current = '';
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
    if (typeof window === 'undefined') return;

    const hash = window.location.hash;
    const tab = activeTabFromUrl;
    const shouldScrollTopPicks = hash === '#top-picks' || tab === 'top-picks';
    const targetId = hash === '#native-apps' ? 'native-apps' : shouldScrollTopPicks ? 'top-picks' : null;

    if (!targetId) return;

    const timer = window.setTimeout(() => {
      if (targetId === 'top-picks') {
        const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-top-picks]'));
        const visible = nodes.find((el) => el.getClientRects().length > 0) ?? nodes[0];
        visible?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);

    return () => window.clearTimeout(timer);
  }, [activeTabFromUrl]);

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
      setActiveMobileTab('Home');
      router.push('/#top-picks', { scroll: false });
      window.setTimeout(() => {
        const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-top-picks]'));
        const visible = nodes.find((el) => el.getClientRects().length > 0) ?? nodes[0];
        visible?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
      return;
    }

    if (label === 'FinderB AI') {
      setIsAiLoading(false);
      setActiveMobileTab('AI Search');
      router.push('/?tab=ai', { scroll: false });
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
  const desktopCategories = sortedCategories.slice(0, 12);
  const desktopFeaturedBusinesses = realBusinesses.slice(0, 4);
  const showFeaturedVerified = featuredGroups.length === 0;
  const heroPopularSearches = useMemo(
    () => buildHeroPopularSearches(realCategories),
    [realCategories]
  );

  const aiKeywordPills = useMemo(
    () => sortedCategories.slice(0, 14).map((cat) => cat.name),
    [sortedCategories]
  );

  const aiSmartQueries = useMemo(() => {
    const loc = effectiveSearchLocation?.trim();
    const locationSuffix = loc ? `in ${loc}` : 'near me';
    return sortedCategories.slice(0, 8).map((cat) => ({
      id: cat.id,
      text: `Best ${cat.name} ${locationSuffix}`,
      icon: cat.icon,
      name: cat.name,
    }));
  }, [sortedCategories, effectiveSearchLocation]);

  const isAiSearchOpen = activeMobileTab === 'AI Search';

  useEffect(() => {
    if (!isAiSearchOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isAiSearchOpen]);

  const getCategorySubtitle = (cat: Category) => {
    const subtitles: Record<string, string> = {
      doctors: 'Hospitals, Clinics',
      restaurants: 'Delivery, Dine-in',
      gyms: 'Fitness Centers',
      salons: 'Beauty Parlours',
      schools: 'CBSE, ICSE, IB',
      'real-estate': 'Buy, Rent, Sell',
      hotels: 'Budget, Luxury',
      lawyers: 'Corporate, Civil',
      cafes: 'Coffee, Bakery',
      dentists: 'Dental Clinics',
      plumbers: 'Home Services',
    };
    return subtitles[cat.slug] ?? 'Top listings';
  };

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
    <div
      className={`flex w-full min-w-0 flex-col overflow-x-hidden bg-white selection:bg-primary/10 font-sans ${
        isAiSearchOpen ? 'h-dvh overflow-hidden lg:h-auto lg:overflow-visible' : ''
      }`}
    >
      {/* AI Search View */}
      {isAiSearchOpen && (
        <div className="fixed inset-0 z-[80] flex flex-col overflow-hidden pt-[4.25rem] sm:pt-24 lg:hidden">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(circle_at_50%_20%,rgba(37,99,235,0.06),transparent_55%)]" />
            <div className="absolute top-1/4 -left-20 h-64 w-64 animate-pulse rounded-full bg-[#2563eb]/5 blur-[100px]" />
            <div
              className="absolute bottom-1/3 -right-20 h-80 w-80 animate-pulse rounded-full bg-cyan-400/5 blur-[120px]"
              style={{ animationDelay: '2s' }}
            />
          </div>

          <div className="relative mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col px-5">
            <div className="flex shrink-0 justify-end py-2">
              <button
                type="button"
                onClick={() => handleTabChange('Home')}
                className="rounded-lg border border-slate-200 p-2 text-slate-400 transition-colors hover:border-slate-300 hover:text-[#215481]"
                aria-label="Close AI search"
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pb-[6.75rem] scrollbar-hide">
              <div className="space-y-8">
                <div className="space-y-2">
                  <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-[#0f172a]">
                    FinderB{' '}
                    <span className="bg-gradient-to-r from-[#2563eb] to-cyan-500 bg-clip-text text-transparent">
                      AI
                    </span>
                  </h1>
                  <p className="text-sm leading-relaxed text-slate-500">
                    Describe what you need — we&apos;ll find matching businesses from live categories.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.06)] transition-shadow focus-within:border-[#2563eb]/35 focus-within:shadow-[0_10px_32px_rgba(37,99,235,0.12)]">
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2563eb]/10">
                      <Sparkles size={18} className="text-[#2563eb]" />
                    </div>
                    <input
                      type="text"
                      placeholder="Try dentists near me, salon, CA firm..."
                      className="min-w-0 flex-1 border-none bg-transparent py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-0 disabled:opacity-50"
                      value={manualQuery}
                      disabled={voiceActive}
                      onChange={(e) => {
                        const v = e.target.value;
                        manualQueryRef.current = v;
                        setManualQuery(v);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && !voiceActive && handleManualSearch()}
                    />
                    <button
                      type="button"
                      disabled={voiceActive}
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.stopPropagation();
                        openVoiceSearch();
                      }}
                      aria-label="Start voice search"
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all active:scale-95 disabled:opacity-40 ${
                        voiceActive
                          ? 'animate-pulse bg-rose-500 text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-[#215481]'
                      }`}
                    >
                      <Mic size={18} className={voiceActive ? 'animate-bounce' : ''} />
                    </button>
                    <button
                      type="button"
                      disabled={voiceActive}
                      onClick={() => handleManualSearch()}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2563eb] text-white transition-all hover:bg-[#1d4ed8] active:scale-95 disabled:pointer-events-none disabled:opacity-40"
                      aria-label="Search"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>

                {aiKeywordPills.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Lightbulb size={15} className="text-amber-500" />
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Browse categories
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {aiKeywordPills.map((kw) => (
                        <button
                          key={kw}
                          type="button"
                          onClick={() => handleManualSearch(kw)}
                          className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:border-[#2563eb]/30 hover:bg-[#2563eb]/5 hover:text-[#215481] active:scale-95"
                        >
                          {kw}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {aiSmartQueries.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={14} className="text-slate-400" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Suggested searches
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {aiSmartQueries.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleManualSearch(item.text)}
                          className="group flex flex-col items-start rounded-xl border border-slate-200/90 bg-white p-3.5 text-left transition-all hover:border-[#2563eb]/25 hover:bg-slate-50/80 active:scale-[0.98]"
                        >
                          <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 transition-colors group-hover:bg-[#2563eb]/10">
                            <CategoryIcon
                              icon={item.icon}
                              name={item.name}
                              size={22}
                              className="h-6 w-6 text-slate-500 group-hover:text-[#215481]"
                              imageClassName="object-contain"
                            />
                          </div>
                          <span className="text-[11px] font-semibold leading-snug text-slate-700 group-hover:text-[#215481]">
                            {item.text}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {!(activeMobileTab === 'AI Search' || (activeMobileTab === 'FinderB AI' && isAiLoading)) && (
        <>
          <HomeHero
            variant="desktop"
            manualQuery={manualQuery}
            onQueryChange={handleQueryChange}
            onSearch={handleManualSearch}
            onVoiceSearch={openVoiceSearch}
            voiceActive={voiceActive}
            searchHint={searchHint}
            popularSearches={heroPopularSearches}
          />

              <div className="mx-auto mt-4 hidden max-w-[1280px] px-8 lg:block">
                {/* Popular Categories — desktop only (mobile uses MobileHome) */}
                <section className="mb-6">
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-[#1e293b]">Popular Categories</h2>
                    <Link
                      href="/categories"
                      className="flex items-center gap-1 text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8]"
                    >
                      View All Categories
                      <ArrowRight size={14} />
                    </Link>
                  </div>

                  <div className="relative">
                    <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-1 pr-14">
                      {desktopCategories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={categoryBrowseHref(cat)}
                          className="flex w-[108px] shrink-0 flex-col items-center rounded-xl border border-gray-100 bg-white px-3 py-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-md"
                        >
                          <div className="mb-2.5 flex h-11 w-11 items-center justify-center">
                            <CategoryIcon
                              icon={cat.icon}
                              name={cat.name}
                              size={40}
                              className="h-10 w-10 text-slate-600"
                              imageClassName="object-contain"
                            />
                          </div>
                          <p className="line-clamp-1 text-[13px] font-semibold leading-tight text-[#1e293b]">
                            {cat.name}
                          </p>
                          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-[#94a3b8]">
                            {getCategorySubtitle(cat)}
                          </p>
                        </Link>
                      ))}
                    </div>
                    <Link
                      href="/categories"
                      className="absolute right-0 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:border-gray-300 hover:text-gray-700"
                      aria-label="View more categories"
                    >
                      <ChevronRight size={18} />
                    </Link>
                  </div>
                </section>

                {/* Trending + Featured */}
                {(trendingThisWeek.length > 0 || showFeaturedVerified) && (
                <section className="mb-5 grid grid-cols-12 gap-5">
                  {trendingThisWeek.length > 0 ? (
                    <div
                      className={`rounded-xl border border-gray-100 bg-white px-4 py-3 ${
                        showFeaturedVerified ? 'col-span-4' : 'col-span-12'
                      }`}
                    >
                      <div className="mb-1.5 flex items-center gap-2">
                        <h3 className="flex items-center gap-1.5 text-base font-bold text-[#1e293b]">
                          Trending This Week
                          <span
                            className="inline-block text-base leading-none animate-fire-flicker"
                            aria-hidden
                          >
                            🔥
                          </span>
                        </h3>
                      </div>
                      <ul
                        className={
                          showFeaturedVerified
                            ? 'divide-y divide-gray-100'
                            : 'grid grid-cols-2 gap-x-6 sm:grid-cols-4'
                        }
                      >
                        {trendingThisWeek.map((item, idx) => (
                          <li key={`${item.label}-${idx}`}>
                            <button
                              type="button"
                              onClick={() => handleManualSearch(item.query)}
                              className="flex w-full items-center gap-2 py-1.5 text-left transition-colors hover:bg-gray-50/80"
                            >
                              <span className="w-4 shrink-0 text-xs font-medium text-[#94a3b8]">
                                {idx + 1}
                              </span>
                              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#334155]">
                                {item.label}
                              </span>
                              <span className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-[#22c55e]">
                                <TrendingUp size={12} strokeWidth={2.5} />
                                +{item.trend}%
                              </span>
                              {showFeaturedVerified ? (
                                <ChevronRight size={14} className="shrink-0 text-[#cbd5e1]" />
                              ) : null}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {showFeaturedVerified ? (
                  <div
                    data-top-picks
                    className={`scroll-mt-28 rounded-xl border border-gray-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ${
                      trendingThisWeek.length > 0 ? 'col-span-8' : 'col-span-12'
                    }`}
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-[#1e293b]">Featured Verified Businesses</h3>
                      <Link
                        href="/categories"
                        className="text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8]"
                      >
                        View All
                      </Link>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      {desktopFeaturedBusinesses.map((biz) => {
                        const distanceLabel = formatDistanceFromUser(
                          userCoords,
                          biz.latitude,
                          biz.longitude
                        );
                        const openStatus = getBusinessOpenStatus(biz.timings);

                        return (
                        <Link
                          key={biz.id}
                          href={getBusinessProfilePath(biz)}
                          onClick={() => {
                            const q =
                              manualQueryRef.current.trim() || voiceTranscript.trim();
                            if (q) setLastSearchQuery(q);
                          }}
                          className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-colors hover:border-gray-300"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                            <BusinessListingImage
                              business={biz}
                              alt={biz.name}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                              sizes="(max-width: 1280px) 25vw, 20vw"
                            />
                          </div>
                          <div className="space-y-1.5 p-3">
                            <p className="flex items-center gap-1 text-[14px] font-semibold text-[#1e293b] group-hover:text-[#2563eb]">
                              <span className="min-w-0 truncate">{biz.name}</span>
                              {(biz.isFinderBVerified || biz.hasVerifiedBadge) && (
                                <VerifiedNameTick size={14} className="shrink-0" />
                              )}
                            </p>
                            <p className="line-clamp-1 text-[12px] text-[#94a3b8]">{biz.category}</p>
                            {openStatus && (
                              <p
                                className={`line-clamp-1 text-[11px] font-semibold ${
                                  openStatus.status === 'Open' ? 'text-emerald-700' : 'text-rose-600'
                                }`}
                              >
                                {openStatus.label}
                              </p>
                            )}
                            <MerchantListingRating
                              rating={biz.rating}
                              reviewCount={biz.reviewsCount}
                            />
                            <div className="flex items-start gap-1 text-[11px] leading-snug text-[#94a3b8]">
                              <MapPin size={12} className="mt-0.5 shrink-0" />
                              <span className="line-clamp-2">
                                {distanceLabel && (
                                  <span className="font-semibold text-[#2563eb]">{distanceLabel} · </span>
                                )}
                                {biz.location}
                              </span>
                            </div>
                            <div className="flex min-w-0 items-center gap-1.5 pt-1 empty:hidden">
                              <MerchantOfferBadge discountRange={biz.discountRange} />
                              {biz.hasActiveJobs ? (
                                <MerchantJobBadge compact className="ml-auto shrink-0" />
                              ) : null}
                            </div>
                          </div>
                        </Link>
                        );
                      })}
                    </div>
                  </div>
                  ) : null}
                </section>
                )}

                <div className="mb-6 flex justify-center">
                  <Link href="/?tab=ai" className="block w-full max-w-3xl">
                    <Image
                      src="/business-register.png"
                      alt="Register your business on FinderB"
                      width={1200}
                      height={320}
                      className="h-auto w-full"
                      sizes="(min-width: 1280px) 768px, 90vw"
                    />
                  </Link>
                </div>

                {/* Trust bar */}
                <HomeTrustHighlights variant="desktop" />
              </div>

          <MobileHome
            manualQuery={manualQuery}
            onQueryChange={handleQueryChange}
            onSearch={handleManualSearch}
            onVoiceSearch={openVoiceSearch}
            voiceActive={voiceActive}
            searchHint={searchHint}
            categories={sortedCategories}
            businesses={realBusinesses}
            isBusinessesLoading={isBusinessesLoading}
            userCoords={userCoords}
            trendingThisWeek={trendingThisWeek}
            showFeaturedVerified={showFeaturedVerified}
            popularSearches={heroPopularSearches}
          />

      {/* Featured categories — Category → subcategory tabs → merchant profiles */}
      {featuredGroups.length > 0 && (
        <section className="relative bg-white pt-0 pb-0 lg:pt-3">
          <div>
            {featuredGroups.map((group: any, index: number) => (
              <FeaturedCategoryGroup
                key={group.id ?? group.title}
                id={group.id}
                title={group.title}
                slug={group.slug}
                subcategories={group.subcategories ?? []}
                tone={index % 2 === 0 ? 'muted' : 'light'}
              />
            ))}
          </div>
        </section>
      )}

      {tutorialPlaylists.length > 0 ? (
        <FinderBTutorialsSection playlists={tutorialPlaylists} />
      ) : null}

      {/* Tourist Places Section */}
      <section className="bg-slate-50 py-6 lg:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="min-w-0 text-2xl font-extrabold tracking-tight text-primary sm:text-3xl lg:text-4xl">
              Explore <span className="text-secondary">Destinations</span>
            </h2>
            <Link
              href="/tourist-places"
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-[#2563eb] transition-colors hover:text-[#1d4ed8]"
            >
              View all
              <ArrowRight size={15} className="shrink-0" />
            </Link>
          </div>
          <div className="scrollbar-hide flex max-w-full gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible">
            {sortedTouristPlaces.slice(0, 6).map((place) => (
              <Link
                key={place.id}
                href={getTouristPlacePath(place)}
                className="group flex w-[min(260px,calc(100vw-2rem))] shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.06)] transition-all hover:border-[#2563eb]/20 hover:shadow-md sm:w-auto sm:shrink"
              >
                <div className="relative h-[88px] w-[88px] shrink-0 sm:h-24 sm:w-24">
                  <TouristPlaceImage
                    src={place.image}
                    alt={place.name}
                    fill
                    className="transition-transform duration-500 group-hover:scale-105"
                    sizes="96px"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2.5">
                  <h3 className="line-clamp-1 text-[13px] font-bold text-[#1e293b] group-hover:text-[#2563eb]">
                    {place.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-[#64748b]">
                    <MapPin size={11} className="shrink-0 text-[#94a3b8]" />
                    <span className="line-clamp-1">{place.location}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex items-center gap-0.5 text-[#f59e0b]">
                      <Star size={11} className="fill-[#f59e0b]" />
                      <span className="text-[11px] font-semibold text-[#1e293b]">{place.rating}</span>
                    </div>
                    {place.distance && (
                      <span className="text-[10px] text-[#94a3b8]">· {place.distance}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest News — RSS headlines only */}
      <section id="news" className="relative w-full min-w-0 overflow-hidden bg-white py-6 lg:py-10">
        <div className="mx-auto w-full min-w-0 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-5 flex min-w-0 items-end justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <h2 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl lg:text-4xl">
                Latest <span className="text-secondary">News</span>
              </h2>
              <p className="text-sm font-medium text-gray-500">
                Top headlines by category — switch between Hindi and English.
              </p>
            </div>
            <Link
              href="/news"
              className="hidden shrink-0 items-center gap-2 text-sm font-semibold text-neutral-700 underline-offset-2 hover:text-neutral-900 hover:underline sm:flex"
            >
              View all news <ArrowRight size={16} />
            </Link>
          </div>
          <NewsWidget />
        </div>
      </section>

      {/* FinderB Blog — editorial articles, separate from news */}
      {realBlogs.length > 0 && (
        <section id="blog" className="relative w-full min-w-0 overflow-hidden bg-slate-50 py-6 lg:py-10">
          <div className="mx-auto w-full min-w-0 max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-5 flex min-w-0 items-end justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <h2 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl lg:text-4xl">
                  FinderB <span className="text-secondary">Blog</span>
                </h2>
                <p className="text-sm font-medium text-gray-500">
                  Guides, tips, and local insights from the FinderB team.
                </p>
              </div>
              <Link
                href="/blog"
                className="hidden shrink-0 items-center gap-2 text-sm font-semibold text-[#2563eb] transition-colors hover:text-[#1d4ed8] sm:flex"
              >
                Read all articles <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid w-full min-w-0 gap-3 sm:grid-cols-2 sm:gap-5">
              {realBlogs.slice(0, 2).map((post: any) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group flex w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-md sm:block"
                >
                  <div className="relative h-[72px] w-[88px] shrink-0 overflow-hidden sm:h-auto sm:w-full sm:aspect-[16/9]">
                    <Image
                      src={post.image || post.coverImage || 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&q=80&w=800'}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 88px, 50vw"
                    />
                    <div className="absolute top-2 left-2 hidden sm:block">
                      <span className="rounded-md bg-white/95 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#2563eb] shadow-sm">
                        Blog
                      </span>
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 overflow-hidden px-3 py-2.5 sm:space-y-2 sm:p-4">
                    <h3 className="line-clamp-2 break-words text-[13px] font-bold leading-snug text-[#1e293b] transition-colors group-hover:text-[#2563eb] sm:text-[15px]">
                      {post.title}
                    </h3>
                    <p className="hidden line-clamp-2 break-words text-[13px] leading-relaxed text-[#64748b] sm:block">
                      {stripHtml(post.excerpt || '')}
                    </p>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                      {post.date || 'Recently'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <Link
              href="/blog"
              className="mt-4 flex w-full min-w-0 items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white py-3 text-sm font-semibold text-[#2563eb] sm:hidden"
            >
              Read all articles <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}

      {SHOW_HOME_LATEST_MOVIES_SECTION && (
      <section className="bg-white py-6 lg:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-primary tracking-tight">
              Latest <span className="text-secondary">Movies</span>
            </h2>
            <Link href="/movies" className="text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8] transition-colors flex items-center gap-1.5">
              View all <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {realMovies.slice(0, 4).map((movie) => (
              <div key={movie.id} className="group relative aspect-[2/3] overflow-hidden rounded-xl border border-gray-100 shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
                <Image
                  src={movie.image}
                  alt={movie.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 z-[2] p-3 text-white">
                  <p className="mb-1 text-sm font-bold leading-tight line-clamp-2">{movie.title}</p>
                  <div className="flex items-center justify-between text-[11px] font-medium text-white/90">
                    <span className="line-clamp-1">{movie.genre}</span>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <Star size={11} className="fill-yellow-400 text-yellow-400" />
                      <span>{movie.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      <NativeAppsComingSoon />

      {/* Testimonials Section */}
      <section className="relative overflow-hidden bg-slate-50 py-6 lg:py-12">
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
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-slate-100">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      fill
                      className="object-cover object-top"
                      sizes="48px"
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
      <VoiceSearchModal
        open={voiceActive}
        phase={voicePhase}
        transcript={voiceTranscript}
        error={voiceError}
        onCancel={closeVoiceSearch}
        onRetry={retryVoiceSearch}
      />
    </div>
  );
}
