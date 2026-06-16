'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CategoryIcon from '@/components/CategoryIcon';
import MobileHome from '@/components/MobileHome';
import NativeAppsComingSoon from '@/components/NativeAppsComingSoon';
import MerchantListingRating from '@/components/business/MerchantListingRating';
import { VerifiedNameTick } from '@/components/business/VerifiedMark';
import HomeHero from '@/components/HomeHero';
import SubcategoryScrollRow from '@/components/SubcategoryScrollRow';
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
  ChevronDown,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Phone,
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
import { useUserCoords, useUserLocationState } from '@/hooks/useUserCoords';
import { appendLocationToSearchQuery } from '@/lib/searchQuery';
import { formatDistanceFromUser } from '@/lib/geo';
import {
  createVoiceRecognition,
  detachVoiceRecognition,
  getSpeechRecognitionCtor,
  normalizeVoiceTranscript,
  type VoiceRecognitionInstance,
} from '@/lib/voiceSearch';
import { setLastSearchQuery } from '@/lib/lastSearchQuery';
import { stripHtml } from '@/lib/stripHtml';

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
  const [manualQuery, setManualQuery] = useState('');
  const manualQueryRef = useRef('');
  const [searchHint, setSearchHint] = useState(false);

  type VoicePhase = 'speak-now' | 'listening' | 'preview' | 'searching';
  const [voiceActive, setVoiceActive] = useState(false);
  const [voicePhase, setVoicePhase] = useState<VoicePhase>('speak-now');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const recognitionRef = useRef<VoiceRecognitionInstance | null>(null);
  const voiceTranscriptRef = useRef('');
  const voiceSearchQueryRef = useRef('');
  const voiceLockedRef = useRef(false);
  const voiceSessionRef = useRef(0);
  const voiceSilenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userCoords = useUserCoords();
  const { effectiveSearchLocation } = useUserLocationState();

  /** Silence while speaking → show what you said. */
  const VOICE_SILENCE_MS = 2000;
  /** After showing transcript → run search. */
  const VOICE_PREVIEW_SEARCH_MS = 2000;

  const clearVoiceTimers = useCallback(() => {
    if (voiceSilenceTimerRef.current) {
      clearTimeout(voiceSilenceTimerRef.current);
      voiceSilenceTimerRef.current = null;
    }
    if (voiceSearchTimerRef.current) {
      clearTimeout(voiceSearchTimerRef.current);
      voiceSearchTimerRef.current = null;
    }
  }, []);

  const stopRecognitionEngine = useCallback((abort = false) => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    recognitionRef.current = null;
    detachVoiceRecognition(recognition);
    try {
      if (abort) recognition.abort();
      else recognition.stop();
    } catch {
      try {
        recognition.abort();
      } catch {
        /* ignore */
      }
    }
  }, []);

  const cancelVoiceSession = useCallback(() => {
    voiceSessionRef.current += 1;
    clearVoiceTimers();
    stopRecognitionEngine(true);
    voiceLockedRef.current = false;
    voiceTranscriptRef.current = '';
    voiceSearchQueryRef.current = '';
    setVoiceTranscript('');
    setVoicePhase('speak-now');
    setVoiceError(null);
    setVoiceActive(false);
  }, [clearVoiceTimers, stopRecognitionEngine]);

  const navigateToSearch = useCallback(
    (q: string) => {
      const trimmed = normalizeVoiceTranscript(q);
      if (!trimmed) return;
      const withLocation = appendLocationToSearchQuery(trimmed, effectiveSearchLocation);
      cancelVoiceSession();
      setManualQuery('');
      manualQueryRef.current = '';
      router.push(`/categories?search=${encodeURIComponent(withLocation)}`, { scroll: false });
    },
    [router, cancelVoiceSession, effectiveSearchLocation]
  );

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

  const beginPreviewAndSearch = useCallback(
    (session: number) => {
      if (session !== voiceSessionRef.current) return;
      if (voiceLockedRef.current) return;

      const q = normalizeVoiceTranscript(voiceTranscriptRef.current);
      stopRecognitionEngine(false);
      clearVoiceTimers();

      if (q.length < 2) {
        setVoiceError('No speech detected. Tap the mic and try again.');
        setVoicePhase('speak-now');
        setVoiceActive(false);
        return;
      }

      voiceLockedRef.current = true;
      voiceTranscriptRef.current = q;
      voiceSearchQueryRef.current = q;
      setVoicePhase('preview');
      setVoiceTranscript(q);

      voiceSearchTimerRef.current = setTimeout(() => {
        if (session !== voiceSessionRef.current) return;
        const searchQ = voiceSearchQueryRef.current.trim();
        if (!searchQ) return;
        setVoicePhase('searching');
        navigateToSearch(searchQ);
      }, VOICE_PREVIEW_SEARCH_MS);
    },
    [clearVoiceTimers, navigateToSearch, stopRecognitionEngine]
  );

  const scheduleSilenceDetection = useCallback(
    (session: number) => {
      if (session !== voiceSessionRef.current) return;
      if (voiceSilenceTimerRef.current) {
        clearTimeout(voiceSilenceTimerRef.current);
      }
      voiceSilenceTimerRef.current = setTimeout(() => {
        voiceSilenceTimerRef.current = null;
        beginPreviewAndSearch(session);
      }, VOICE_SILENCE_MS);
    },
    [beginPreviewAndSearch]
  );

  const startVoiceSession = useCallback(() => {
    if (!getSpeechRecognitionCtor()) {
      alert('Voice search is not supported in your browser. Try Chrome or Edge on mobile.');
      return;
    }

    cancelVoiceSession();
    const session = voiceSessionRef.current;

    voiceLockedRef.current = false;
    voiceTranscriptRef.current = '';
    voiceSearchQueryRef.current = '';
    setManualQuery('');
    manualQueryRef.current = '';
    setVoiceTranscript('');
    setVoiceError(null);
    setVoicePhase('speak-now');
    setVoiceActive(true);

    const recognition = createVoiceRecognition({
      lang: 'en-IN',
      continuous: true,
      onTranscript: (text) => {
        if (session !== voiceSessionRef.current) return;
        if (voiceLockedRef.current) return;
        const trimmed = normalizeVoiceTranscript(text);
        if (!trimmed) return;

        voiceTranscriptRef.current = trimmed;
        setVoiceTranscript(trimmed);
        setVoicePhase('listening');
        setVoiceError(null);
        scheduleSilenceDetection(session);
      },
      onError: (code) => {
        if (session !== voiceSessionRef.current) return;
        if (code === 'aborted') return;
        clearVoiceTimers();
        stopRecognitionEngine(true);
        if (code === 'not-allowed') {
          setVoiceError('Microphone permission denied. Allow mic access in browser settings.');
        } else if (code === 'no-speech') {
          setVoiceError('No speech detected. Tap the mic and try again.');
        } else {
          setVoiceError('Could not hear you. Please try again.');
        }
        setVoiceActive(false);
        setVoicePhase('speak-now');
      },
      onEnd: () => {
        if (session !== voiceSessionRef.current) return;
        recognitionRef.current = null;
      },
    });

    if (!recognition) return;

    recognitionRef.current = recognition;
    recognition.onstart = () => {
      if (session !== voiceSessionRef.current) return;
      setVoicePhase('speak-now');
      setVoiceError(null);
    };

    try {
      recognition.start();
    } catch {
      setVoiceError('Unable to start microphone. Tap the mic to try again.');
      cancelVoiceSession();
    }
  }, [
    cancelVoiceSession,
    scheduleSilenceDetection,
    clearVoiceTimers,
    stopRecognitionEngine,
  ]);

  const toggleVoiceSearch = useCallback(() => {
    if (voiceActive) {
      cancelVoiceSession();
      return;
    }
    startVoiceSession();
  }, [voiceActive, cancelVoiceSession, startVoiceSession]);

  useEffect(() => () => cancelVoiceSession(), [cancelVoiceSession]);

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
    const onAi =
      activeTabFromUrl === 'ai' || activeTabFromUrl === 'finderb-ai';

    if (onAi) {
      setIsAiLoading(false);
      setActiveMobileTab('AI Search');
      setManualQuery('');
      manualQueryRef.current = '';
      cancelVoiceSession();
    } else {
      setActiveMobileTab('Home');
      cancelVoiceSession();
    }
  }, [activeTabFromUrl, cancelVoiceSession]);

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
  const desktopTrendingItems = [
    { label: 'Best Cafes in Delhi', trend: 12 },
    { label: 'CA Services Near You', trend: 7 },
    { label: 'Home Interior Designers', trend: 15 },
    { label: 'PG in Delhi', trend: 5 },
    { label: 'Immigration Consultants', trend: 15 },
  ];

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
    <div className="flex w-full min-w-0 flex-col overflow-x-hidden bg-white selection:bg-primary/10 font-sans">
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
                      placeholder="e.g., 'quiet cafe with wifi for work'..."
                      className="w-full py-4 bg-transparent border-none focus:ring-0 text-gray-900 font-semibold text-sm placeholder:text-gray-300 disabled:opacity-50"
                      value={manualQuery}
                      disabled={voiceActive}
                      onChange={(e) => {
                        const v = e.target.value;
                        manualQueryRef.current = v;
                        setManualQuery(v);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && !voiceActive && handleManualSearch()}
                    />
                  </div>
                  <div className="flex items-center gap-2 pr-2">
                    <button 
                      type="button"
                      onClick={toggleVoiceSearch}
                      aria-label={voiceActive ? 'Stop voice search' : 'Start voice search'}
                      className={`p-3 rounded-xl transition-all active:scale-95 ${voiceActive ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-50 text-gray-400 hover:text-primary'}`}
                    >
                      <Mic size={20} className={voiceActive ? 'animate-bounce' : ''} />
                    </button>
                    <button 
                      type="button"
                      disabled={voiceActive}
                      onClick={() => handleManualSearch()}
                      className="bg-primary text-white p-4 rounded-xl hover:bg-secondary transition-all active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none"
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
                    onClick={() => handleManualSearch(kw)}
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
                    onClick={() => handleManualSearch(item.text)}
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
          <HomeHero
            variant="desktop"
            manualQuery={manualQuery}
            onQueryChange={handleQueryChange}
            onSearch={handleManualSearch}
            onVoiceSearch={toggleVoiceSearch}
            voiceActive={voiceActive}
            searchHint={searchHint}
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
                          href={`/categories?id=${cat.id}`}
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
                <section className="mb-5 grid grid-cols-12 gap-5">
                  <div className="col-span-4 rounded-xl border border-gray-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="flex items-center gap-1.5 text-lg font-bold text-[#1e293b]">
                        Trending This Week
                        <span className="text-base leading-none" aria-hidden>
                          🔥
                        </span>
                      </h3>
                      <Link
                        href="/categories"
                        className="text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8]"
                      >
                        View All
                      </Link>
                    </div>
                    <ul className="divide-y divide-gray-100">
                      {desktopTrendingItems.map((item, idx) => (
                        <li key={item.label}>
                          <button
                            type="button"
                            onClick={() => handleManualSearch(item.label)}
                            className="flex w-full items-center gap-2 py-3.5 text-left transition-colors hover:bg-gray-50/80"
                          >
                            <span className="w-4 shrink-0 text-xs font-medium text-[#94a3b8]">{idx + 1}</span>
                            <span className="min-w-0 flex-1 text-[13px] font-medium text-[#334155]">{item.label}</span>
                            <span className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-[#22c55e]">
                              <TrendingUp size={13} strokeWidth={2.5} />
                              {item.trend}%
                            </span>
                            <ChevronRight size={14} className="shrink-0 text-[#cbd5e1]" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="col-span-8 rounded-xl border border-gray-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
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

                        return (
                        <Link
                          key={biz.id}
                          href={`/business/${biz.id}`}
                          onClick={() => {
                            const q =
                              manualQueryRef.current.trim() ||
                              voiceSearchQueryRef.current.trim();
                            if (q) setLastSearchQuery(q);
                          }}
                          className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-colors hover:border-gray-300"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                            <Image
                              src={biz.profilePictureUrl || biz.image || '/fallback.jpg'}
                              alt={biz.name}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                              sizes="(max-width: 1280px) 25vw"
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
                          </div>
                        </Link>
                        );
                      })}
                    </div>
                  </div>
                </section>

                <div className="mb-6 flex justify-center">
                  <Link href="/?tab=ai" className="block w-full max-w-3xl">
                    <Image
                      src="/meet-ai.png"
                      alt="Meet FinderB AI — Your smart assistant to find the best businesses near you"
                      width={1200}
                      height={320}
                      className="h-auto w-full"
                      sizes="(min-width: 1280px) 768px, 90vw"
                    />
                  </Link>
                </div>

                {/* Trust bar */}
                <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                  <div className="grid grid-cols-4 divide-x divide-gray-100">
                    {[
                      {
                        title: 'Verified Businesses',
                        subtitle: 'Authentic & Verified Listings',
                        icon: ShieldCheck,
                        iconBg: 'bg-blue-50',
                        iconColor: 'text-blue-600',
                      },
                      {
                        title: 'Real Customer Reviews',
                        subtitle: 'Honest Reviews from Real People',
                        icon: MessageSquare,
                        iconBg: 'bg-emerald-50',
                        iconColor: 'text-emerald-600',
                      },
                      {
                        title: 'Updated Daily',
                        subtitle: 'Latest Information Always',
                        icon: RefreshCw,
                        iconBg: 'bg-violet-50',
                        iconColor: 'text-violet-600',
                      },
                      {
                        title: 'Instant Contact',
                        subtitle: 'Call, Chat or Enquire Directly',
                        icon: Phone,
                        iconBg: 'bg-orange-50',
                        iconColor: 'text-orange-500',
                      },
                    ].map(({ title, subtitle, icon: Icon, iconBg, iconColor }) => (
                      <div key={title} className="flex items-center gap-4 px-6 py-5">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconBg}`}
                        >
                          <Icon size={20} className={iconColor} />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-[#1e293b]">{title}</p>
                          <p className="mt-0.5 text-[11px] leading-snug text-[#94a3b8]">{subtitle}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

          <MobileHome
            manualQuery={manualQuery}
            onQueryChange={handleQueryChange}
            onSearch={handleManualSearch}
            onVoiceSearch={toggleVoiceSearch}
            voiceActive={voiceActive}
            searchHint={searchHint}
            categories={sortedCategories}
            businesses={realBusinesses}
            isBusinessesLoading={isBusinessesLoading}
            userCoords={userCoords}
          />

      {/* Featured Group Categories — parents & subcategories from DB */}
      {featuredGroups.length > 0 && (
        <section className="bg-white pt-3 pb-6 lg:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8">
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
            {realTouristPlaces.slice(0, 6).map((place) => (
              <Link
                key={place.id}
                href={`/tourist-places/${place.id}`}
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
                    <span className="text-[10px] text-[#94a3b8]">· {place.distance}</span>
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
          <div className="mb-5 min-w-0 space-y-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl lg:text-4xl">
              Latest <span className="text-secondary">News</span>
            </h2>
            <p className="text-sm font-medium text-gray-500">
              Top headlines by category — switch between Hindi and English.
            </p>
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

      {/* Movies Section */}
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
      {/* Voice-only overlay (separate from manual text search) */}
      {voiceActive && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 flex flex-col items-center space-y-6 shadow-2xl transform animate-in fade-in zoom-in duration-300">
            <div className="relative">
              <div
                className={`absolute inset-0 rounded-full animate-ping scale-150 ${
                  voicePhase === 'preview' || voicePhase === 'searching'
                    ? 'bg-secondary/20'
                    : 'bg-primary/20'
                }`}
              />
              <div className="relative bg-primary text-white p-6 rounded-full shadow-lg">
                <Mic
                  size={40}
                  className={
                    voicePhase === 'speak-now' || voicePhase === 'listening'
                      ? 'animate-bounce'
                      : ''
                  }
                />
              </div>
            </div>
            <div className="text-center space-y-3 min-h-[88px]">
              <h3 className="text-xl font-bold text-gray-900">
                {voicePhase === 'speak-now' && 'Speak now'}
                {voicePhase === 'listening' && 'Listening to you..'}
                {voicePhase === 'preview' && 'You said'}
                {voicePhase === 'searching' && 'Searching...'}
              </h3>
              {voicePhase === 'listening' && voiceTranscript ? (
                <p className="text-gray-600 text-sm font-medium leading-relaxed">
                  &ldquo;{voiceTranscript}&rdquo;
                </p>
              ) : null}
              {voicePhase === 'preview' || voicePhase === 'searching' ? (
                <p className="text-primary text-base font-bold leading-relaxed">
                  &ldquo;{voiceTranscript}&rdquo;
                </p>
              ) : null}
              {voicePhase === 'preview' ? (
                <p className="text-gray-400 text-xs font-medium">Searching in a moment...</p>
              ) : null}
              {voicePhase === 'speak-now' && !voiceError ? (
                <p className="text-gray-400 text-sm">Say what you&apos;re looking for</p>
              ) : null}
              {voiceError ? (
                <p className="text-xs font-medium text-red-500">{voiceError}</p>
              ) : null}
            </div>
            {voicePhase !== 'searching' ? (
              <button
                type="button"
                onClick={cancelVoiceSession}
                className="w-full px-6 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors active:scale-95"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
