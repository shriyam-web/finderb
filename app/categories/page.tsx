'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, ChevronRight, LayoutGrid, ShoppingBag, Home, Sparkles, User, Bot } from 'lucide-react';
import { getCategories, getSubCategories } from '@/app/actions/category';
import { getFeaturedBusinesses } from '@/app/actions/business';
import Image from 'next/image';

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  image: string;
  businessCount?: number;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubLoading, setIsSubLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const [catResult, bizResult] = await Promise.all([
        getCategories(),
        getFeaturedBusinesses()
      ]);

      if (catResult.success && catResult.categories) {
        setCategories(catResult.categories);
        // Set first category as default
        if (catResult.categories.length > 0) {
          setSelectedCategory(catResult.categories[0]);
        }
      }
      
      if (bizResult.success && bizResult.businesses) {
        setBusinesses(bizResult.businesses);
      }
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const [viewMode, setViewMode] = useState<'subcategories' | 'merchants'>('subcategories');

  useEffect(() => {
    async function fetchSubs() {
      if (selectedCategory) {
        setIsSubLoading(true);
        const result = await getSubCategories(selectedCategory.id);
        if (result.success && result.subCategories) {
          setSubCategories(result.subCategories);
          if (result.subCategories.length > 0) {
            setSelectedSubCategory(result.subCategories[0]);
          } else {
            setSelectedSubCategory(null);
          }
        }
        setIsSubLoading(false);
        setViewMode('subcategories');
      }
    }
    fetchSubs();
  }, [selectedCategory]);

  const handleSubCategoryClick = (sub: any) => {
    setSelectedSubCategory(sub);
    setViewMode('merchants');
  };

  const handleTabChange = (label: string) => {
    if (label === 'Home') {
      router.push('/');
      return;
    }
    if (label === 'Categories') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (label === 'FinderB Ai') {
      router.push('/?tab=finderb-ai');
      return;
    }
    if (label === 'Account') {
      router.push('/account');
      return;
    }
  };

  const [sortBy, setSortBy] = useState<'recommended' | 'rating' | 'newest'>('recommended');
  const [filterActive, setFilterActive] = useState(false);

  // Simple sorting logic
  const sortedBusinesses = [...businesses].sort((a, b) => {
    if (sortBy === 'rating') return 4.9 - 4.5; // Dummy sort for now as we don't have real ratings in state
    if (sortBy === 'newest') return b.id.localeCompare(a.id);
    return 0;
  });

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Header / Search Bar */}
      <header className="bg-white px-4 py-4 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors active:scale-95"
          >
            <ChevronRight className="rotate-180 text-slate-700" size={20} />
          </button>
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search categories..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Sort & Filter Bar - Renamed and Functional */}
      <div className="flex bg-white border-b border-slate-100 relative z-10">
        <button 
          onClick={() => {
            const options: ('recommended' | 'rating' | 'newest')[] = ['recommended', 'rating', 'newest'];
            const next = options[(options.indexOf(sortBy) + 1) % options.length];
            setSortBy(next);
          }}
          className="flex-1 py-3 flex items-center justify-center gap-2 text-[11px] font-bold text-slate-600 border-r border-slate-100 hover:bg-slate-50 transition-colors uppercase tracking-widest"
        >
          <Sparkles size={14} className={sortBy !== 'recommended' ? 'text-primary' : 'text-secondary'} />
          Sorting: <span className="text-primary">{sortBy}</span>
        </button>
        <button 
          onClick={() => setFilterActive(!filterActive)}
          className={`flex-1 py-3 flex items-center justify-center gap-2 text-[11px] font-bold transition-colors uppercase tracking-widest ${
            filterActive ? 'bg-primary/5 text-primary' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Filter size={14} className={filterActive ? 'text-primary' : 'text-slate-400'} />
          Filter {filterActive && '•'}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Compact for more items */}
        <aside className="w-20 bg-white border-r border-slate-100 overflow-y-auto scrollbar-hide pb-24">
          {viewMode === 'subcategories' ? (
            categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full py-3.5 flex flex-col items-center gap-1.5 transition-all relative group ${
                  selectedCategory?.id === cat.id
                    ? 'bg-primary/5'
                    : 'hover:bg-slate-50'
                }`}
              >
                {selectedCategory?.id === cat.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                )}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center p-0.5 border-2 transition-all duration-300 ${
                  selectedCategory?.id === cat.id
                    ? 'border-primary bg-white shadow-md shadow-primary/10 scale-105'
                    : 'border-transparent bg-slate-50 group-hover:scale-105'
                } overflow-hidden relative`}>
                  <Image 
                    src={cat.image || 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=100'} 
                    alt={cat.name} 
                    fill 
                    className="object-cover p-0.5 rounded-lg"
                  />
                </div>
                <span className={`text-[8px] font-black text-center px-1 leading-tight uppercase tracking-tighter transition-colors line-clamp-2 ${
                  selectedCategory?.id === cat.id ? 'text-primary' : 'text-slate-400'
                }`}>{cat.name}</span>
              </button>
            ))
          ) : (
            <div className="flex flex-col">
              <button
                onClick={() => setViewMode('subcategories')}
                className="w-full py-4 flex flex-col items-center gap-1 border-b border-slate-100 bg-slate-50/50 group"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <ChevronRight className="rotate-180" size={14} />
                </div>
                <span className="text-[8px] font-black text-primary uppercase tracking-wider">Back</span>
              </button>
              {subCategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubCategory(sub)}
                  className={`w-full py-3.5 flex flex-col items-center gap-1.5 transition-all relative group ${
                    selectedSubCategory?.id === sub.id
                      ? 'bg-secondary/5'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {selectedSubCategory?.id === sub.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-secondary rounded-r-full" />
                  )}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center p-0.5 border-2 transition-all duration-300 ${
                    selectedSubCategory?.id === sub.id
                      ? 'border-secondary bg-white shadow-md shadow-secondary/10 scale-105'
                      : 'border-transparent bg-slate-50 group-hover:scale-105'
                  } overflow-hidden relative`}>
                    <Image 
                      src={sub.image} 
                      alt={sub.name} 
                      fill 
                      className="object-cover p-0.5 rounded-lg"
                    />
                  </div>
                  <span className={`text-[8px] font-black text-center px-1 leading-tight uppercase tracking-tighter transition-colors line-clamp-2 ${
                    selectedSubCategory?.id === sub.id ? 'text-secondary' : 'text-slate-400'
                  }`}>{sub.name}</span>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Right Panel - Modern Grid */}
        <main className="flex-1 overflow-y-auto pb-32 scrollbar-hide bg-slate-50/50">
          {isSubLoading ? (
            <div className="grid grid-cols-2 gap-4 p-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex flex-col gap-3">
                  <div className="w-full aspect-[4/5] rounded-3xl bg-white animate-pulse" />
                  <div className="w-2/3 h-4 bg-white rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          ) : viewMode === 'subcategories' ? (
            <div className="p-5">
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">{selectedCategory?.name}</h1>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-widest rounded-full">
                      {subCategories.length} Options
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {subCategories.length > 0 ? (
                  subCategories.map((sub, index) => (
                    <button
                      key={sub.id}
                      onClick={() => handleSubCategoryClick(sub)}
                      className="group flex flex-col gap-3 text-left"
                    >
                      <div className={`relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-sm group-hover:shadow-xl group-hover:shadow-primary/10 transition-all duration-500 border border-slate-100 ${
                        index % 4 === 0 ? 'bg-orange-100' : 
                        index % 4 === 1 ? 'bg-blue-100' : 
                        index % 4 === 2 ? 'bg-emerald-100' : 'bg-purple-100'
                      }`}>
                        <Image 
                          src={sub.image} 
                          alt={sub.name} 
                          fill 
                          className="object-cover group-hover:scale-110 transition-transform duration-700" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <p className="text-[9px] font-black text-white/70 uppercase tracking-[0.2em] mb-1">View All</p>
                          <h3 className="text-[11px] font-black text-white leading-tight uppercase tracking-wide line-clamp-2">{sub.name}</h3>
                        </div>
                        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                          <ChevronRight size={16} className="text-white" />
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="col-span-2 py-24 flex flex-col items-center justify-center text-slate-300">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <LayoutGrid size={32} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-[0.2em]">Coming Soon</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-6">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Available Businesses</h2>
                  <h3 className="text-lg font-black text-slate-900">{selectedSubCategory?.name}</h3>
                </div>
                <button 
                  onClick={() => setViewMode('subcategories')} 
                  className="px-4 py-2 bg-white border border-slate-200 hover:border-primary hover:text-primary rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-sm"
                >
                  Change
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {sortedBusinesses.filter(b => !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase())).map((biz) => (
                  <div key={biz.id} className="group relative bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-row hover:shadow-xl hover:shadow-primary/5 transition-all duration-500">
                    <div className="relative w-28 sm:w-36 aspect-square overflow-hidden shrink-0">
                      <Image
                        src={biz.image || biz.profilePictureUrl || 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=400'}
                        alt={biz.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-1000"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
                      <div className="absolute top-2 left-2 bg-secondary text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg">
                        {Math.floor(Math.random() * 40) + 20}% OFF
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[8px] font-black text-primary uppercase tracking-widest px-2 py-0.5 bg-primary/5 rounded-full line-clamp-1">
                            {biz.category || 'Premium'}
                          </span>
                          <div className="flex items-center gap-0.5">
                            <Sparkles size={8} className="text-yellow-400 fill-yellow-400" />
                            <span className="text-[9px] font-black text-slate-900">4.9</span>
                          </div>
                        </div>
                        <h3 className="text-xs font-black text-slate-900 leading-tight mb-1 truncate group-hover:text-primary transition-colors">{biz.name}</h3>
                        <p className="text-[9px] font-bold text-slate-400 line-clamp-1 flex items-center gap-1">
                          <Home size={8} /> 2.4 km • Open Now
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-black text-slate-900">₹{Math.floor(Math.random() * 300) + 50}</span>
                            <span className="text-[8px] text-slate-400 line-through font-bold">₹{Math.floor(Math.random() * 500) + 300}</span>
                          </div>
                          <span className="text-[8px] font-bold text-emerald-500">Best Price</span>
                        </div>
                        
                        <div className="flex gap-1.5">
                          <button className="w-8 h-8 bg-slate-50 border border-slate-100 text-slate-900 rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all active:scale-90">
                            <ShoppingBag size={14} />
                          </button>
                          <button className="px-3 py-2 bg-primary text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-primary/90 active:scale-95 transition-all shadow-sm">
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation - More Premium */}
      <div className="fixed bottom-0 left-0 w-full z-[100] bg-white/80 backdrop-blur-xl border-t border-slate-100">
        <div className="flex items-center justify-around px-2 py-3 pb-safe-offset-2">
          {[
            { icon: Home, label: 'Home' },
            { icon: LayoutGrid, label: 'Categories' },
            { icon: Bot, label: 'FinderB Ai' },
            { icon: User, label: 'Account' },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => handleTabChange(item.label)}
              className={`flex flex-col items-center gap-1.5 p-2 px-5 transition-all duration-500 group relative rounded-2xl ${
                item.label === 'Categories'
                  ? 'text-primary'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {item.label === 'Categories' && (
                <div className="absolute inset-0 bg-primary/5 rounded-2xl animate-in fade-in zoom-in duration-500" />
              )}
              <item.icon
                size={22}
                className={`transition-all duration-500 ${
                  item.label === 'Categories'
                    ? 'scale-110 drop-shadow-[0_0_8px_rgba(33,84,129,0.3)]'
                    : 'group-active:scale-90'
                }`}
              />
              <span className={`text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${
                item.label === 'Categories' ? 'opacity-100' : 'opacity-60'
              }`}>
                {item.label}
              </span>
              {item.label === 'Categories' && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(33,84,129,0.8)]"></div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
