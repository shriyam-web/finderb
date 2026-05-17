'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, ChevronRight, LayoutGrid, ShoppingBag, Home, Sparkles } from 'lucide-react';
import { getCategories } from '@/app/actions/category';
import { getFeaturedBusinesses } from '@/app/actions/business';
import Image from 'next/image';

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  image: string;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
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
    if (selectedCategory) {
      // Mock sub-categories
      const mockedSubCats = [
        { id: 'sub1', name: 'All', slug: 'all', image: selectedCategory.image },
        { id: 'sub2', name: 'Toor Dal', slug: 'toor-dal', image: 'https://images.unsplash.com/photo-1585996838426-60de385ad218?auto=format&fit=crop&q=80&w=100' },
        { id: 'sub3', name: 'Urad Dal', slug: 'urad-dal', image: 'https://images.unsplash.com/photo-1585996838426-60de385ad218?auto=format&fit=crop&q=80&w=100' },
        { id: 'sub4', name: 'Moong Dal', slug: 'moong-dal', image: 'https://images.unsplash.com/photo-1585996838426-60de385ad218?auto=format&fit=crop&q=80&w=100' },
        { id: 'sub5', name: 'Masoor Dal', slug: 'masoor-dal', image: 'https://images.unsplash.com/photo-1585996838426-60de385ad218?auto=format&fit=crop&q=80&w=100' },
        { id: 'sub6', name: 'Chana Dal', slug: 'chana-dal', image: 'https://images.unsplash.com/photo-1585996838426-60de385ad218?auto=format&fit=crop&q=80&w=100' },
      ];
      setSubCategories(mockedSubCats);
      setSelectedSubCategory(mockedSubCats[0]);
      setViewMode('subcategories');
    }
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
    if (label === 'Top Picks') {
      router.push('/?tab=top-picks');
      return;
    }
    if (label === 'Basket') {
      router.push('/?tab=basket');
      return;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* Header / Search Bar */}
      <header className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1">
            <ChevronRight className="rotate-180 text-gray-700" size={24} />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search Grocery"
              className="w-full bg-gray-50 border border-gray-100 rounded-full py-2.5 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <ShoppingBag size={24} className="text-gray-700" />
        </div>
      </header>

      {/* Sort & Filter Bar */}
      <div className="flex border-b border-gray-100 bg-white">
        <button className="flex-1 py-3.5 flex items-center justify-center gap-2 text-sm font-bold text-gray-700 border-r border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition-colors uppercase tracking-wider">
          Sort
        </button>
        <button className="flex-1 py-3.5 flex items-center justify-center gap-2 text-sm font-bold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors uppercase tracking-wider">
          <Filter size={16} />
          Filter
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-20 sm:w-24 bg-gray-50 border-r border-gray-100 overflow-y-auto scrollbar-hide pb-20">
          {viewMode === 'subcategories' ? (
            categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full py-4 flex flex-col items-center gap-2 transition-all group ${
                  selectedCategory?.id === cat.id
                    ? 'bg-white border-l-4 border-primary'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border transition-all ${
                  selectedCategory?.id === cat.id
                    ? 'bg-white shadow-md border-primary/20'
                    : 'bg-white shadow-sm border-gray-100 group-hover:shadow-md'
                } overflow-hidden relative`}>
                  <Image 
                    src={cat.image || 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=100'} 
                    alt={cat.name} 
                    fill 
                    className="object-cover"
                  />
                </div>
                <span className={`text-[8px] sm:text-[9px] font-black text-center px-1 leading-tight uppercase tracking-tighter ${
                  selectedCategory?.id === cat.id ? 'text-primary' : 'text-gray-400'
                }`}>{cat.name}</span>
              </button>
            ))
          ) : (
            <>
              <button
                onClick={() => setViewMode('subcategories')}
                className="w-full py-4 flex flex-col items-center gap-1 border-b border-gray-100 bg-white"
              >
                <ChevronRight className="rotate-180 text-primary" size={16} />
                <span className="text-[8px] font-black text-primary uppercase tracking-tighter">Back</span>
              </button>
              {subCategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubCategory(sub)}
                  className={`w-full py-4 flex flex-col items-center gap-2 transition-all group ${
                    selectedSubCategory?.id === sub.id
                      ? 'bg-white border-l-4 border-primary'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border transition-all ${
                    selectedSubCategory?.id === sub.id
                      ? 'bg-white shadow-md border-primary/20'
                      : 'bg-white shadow-sm border-gray-100 group-hover:shadow-md'
                  } overflow-hidden relative`}>
                    <Image 
                      src={sub.image} 
                      alt={sub.name} 
                      fill 
                      className="object-cover"
                    />
                  </div>
                  <span className={`text-[8px] sm:text-[9px] font-black text-center px-1 leading-tight uppercase tracking-tighter ${
                    selectedSubCategory?.id === sub.id ? 'text-primary' : 'text-gray-400'
                  }`}>{sub.name}</span>
                </button>
              ))}
            </>
          )}
        </aside>

        {/* Right Panel */}
        <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
          {viewMode === 'subcategories' ? (
            <div className="grid grid-cols-3 gap-3 p-4">
              {subCategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => handleSubCategoryClick(sub)}
                  className="flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-gray-50 active:scale-95 transition-all"
                >
                  <div className="w-full aspect-square rounded-2xl bg-gray-50 border border-gray-100 relative overflow-hidden shadow-sm">
                    <Image src={sub.image} alt={sub.name} fill className="object-cover" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-700 text-center leading-tight">{sub.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">{selectedSubCategory?.name}</h2>
                <button onClick={() => setViewMode('subcategories')} className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">
                  Change
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {businesses.filter(b => !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase())).map((biz) => (
                  <div key={biz.id} className="relative group bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                    <div className="relative aspect-square">
                      <Image
                        src={biz.image || biz.profilePictureUrl || 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=400'}
                        alt={biz.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-green-500 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-lg">
                        {Math.floor(Math.random() * 40) + 20}% OFF
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <h3 className="text-[11px] font-bold text-gray-900 line-clamp-2 leading-snug mb-1">{biz.name}</h3>
                        <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                          <span>{Math.random() > 0.5 ? '2 kg' : '500 g'}</span>
                          <ChevronRight size={12} />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="bg-yellow-400 px-2 py-0.5 rounded shadow-sm">
                            <span className="text-[9px] font-black text-white italic tracking-tighter">KiLoS</span>
                          </div>
                          <div className="flex flex-col">
                            <div className="text-xs font-black text-gray-900">₹{Math.floor(Math.random() * 300) + 50}</div>
                            <div className="text-[9px] text-gray-400 line-through font-bold">MRP ₹{Math.floor(Math.random() * 500) + 300}</div>
                          </div>
                        </div>
                        
                        <button className="w-full py-2.5 bg-white border border-orange-200 text-orange-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-50 active:scale-95 transition-all shadow-sm">
                          Add
                        </button>
                        
                        <div className="text-[9px] font-bold text-gray-400 text-center">
                          Or Pay ₹{Math.floor(Math.random() * 100)} + <span className="text-yellow-500">⚡ {Math.floor(Math.random() * 20)}</span>
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

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 w-full z-[100] bg-white border-t border-gray-200">
        <div className="flex items-center justify-around p-1 pb-safe">
          {[
            { icon: Home, label: 'Home' },
            { icon: LayoutGrid, label: 'Categories' },
            { icon: Sparkles, label: 'Top Picks' },
            { icon: ShoppingBag, label: 'Basket' },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => handleTabChange(item.label)}
              className={`flex flex-col items-center gap-1 p-3 px-4 transition-all duration-300 group relative rounded-2xl ${
                item.label === 'Categories'
                  ? 'text-slate-900 bg-slate-50'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <item.icon
                size={20}
                className={`transition-all duration-300 ${
                  item.label === 'Categories'
                    ? 'scale-110 text-secondary'
                    : 'group-active:scale-95'
                }`}
              />
              <span className={`text-[9px] font-bold uppercase tracking-wider transition-all duration-300 ${
                item.label === 'Categories' ? 'opacity-100 scale-100' : 'opacity-70 scale-95'
              }`}>
                {item.label}
              </span>
              {item.label === 'Categories' && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-secondary rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
