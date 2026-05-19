'use client';

import { use, useState, useEffect } from 'react';
import { touristPlaces, TouristPlace } from '@/lib/mockData';
import { getTouristPlace } from '@/app/actions/touristPlace';
import Image from 'next/image';
import { Star, MapPin, Share2, Heart, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TouristPlaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [place, setPlace] = useState<TouristPlace | any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const result = await getTouristPlace(id);
      if (result.success && result.touristPlace) {
        setPlace(result.touristPlace);
      } else {
        const mockPlace = touristPlaces.find((p) => p.id === id) || touristPlaces[0];
        setPlace(mockPlace);
      }
      setIsLoading(false);
    }
    fetchData();
  }, [id]);

  if (isLoading || !place) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium text-xs tracking-tight">Loading place details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-primary/10 font-sans text-slate-900">
      <main className="max-w-6xl mx-auto pt-20 lg:pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        
        {/* Navigation & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight size={12} />
            <span className="text-slate-600">Tourist Places</span>
            <ChevronRight size={12} />
            <span className="text-slate-600">{place.name}</span>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-secondary transition-colors">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Media & Description */}
          <div className="lg:col-span-8 space-y-8">
            <div className="relative aspect-[16/9] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white group">
              <Image 
                src={place.image}
                alt={place.name}
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-105" 
                priority 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/30">
                    <Star size={14} className="fill-secondary text-secondary" />
                    {place.rating} Rating
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/30">
                    <MapPin size={14} className="text-secondary" />
                    {place.location}
                  </div>
                </div>
                <button className="p-3 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-secondary transition-all border border-white/30">
                  <Share2 size={20} />
                </button>
              </div>
            </div>

            <section className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-sm border border-slate-100 space-y-6">
              <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl font-black text-primary tracking-tight">{place.name}</h1>
                <p className="text-secondary font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                  <MapPin size={14} /> {place.location} • {place.distance || 'Nearby'}
                </p>
              </div>

              <div className="w-full h-px bg-slate-100"></div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold text-primary">About this destination</h2>
                <p className="text-slate-600 leading-relaxed text-lg">
                  {place.description || "Experience the beauty and culture of this iconic destination. A must-visit spot that captures the essence of the local area, offering breathtaking views and unforgettable experiences."}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                {[
                  { label: 'Best Time', value: 'Oct - Mar' },
                  { label: 'Duration', value: '2-3 Hours' },
                  { label: 'Entry', value: 'Free' },
                  { label: 'Activity', value: 'Sightseeing' },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-3xl bg-slate-50 border border-slate-100 text-center space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                    <p className="font-bold text-primary text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Actions & Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-primary rounded-[2.5rem] p-8 text-white shadow-xl shadow-primary/20 space-y-8">
              <div className="space-y-2 text-center">
                <h3 className="text-2xl font-bold">Plan your visit</h3>
                <p className="text-white/60 text-sm font-medium">Get the most out of your trip</p>
              </div>
              
              <div className="space-y-4">
                <button className="w-full py-4 bg-secondary text-white rounded-2xl font-bold text-sm tracking-tight hover:bg-white hover:text-primary transition-all shadow-lg flex items-center justify-center gap-2">
                   Get Directions
                </button>
                <button className="w-full py-4 bg-white/10 text-white rounded-2xl font-bold text-sm tracking-tight hover:bg-white/20 border border-white/20 transition-all flex items-center justify-center gap-2">
                  <Heart size={18} /> Add to Favorites
                </button>
              </div>

              <div className="pt-6 border-t border-white/10 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Star size={20} className="text-secondary" fill="currentColor" />
                  </div>
                  <div>
                    <p className="font-bold">{place.rating} / 5.0</p>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">User Rating</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-primary">Nearby Attractions</h3>
              <div className="space-y-4">
                {touristPlaces.filter(p => p.id !== id).slice(0, 3).map((p) => (
                  <Link key={p.id} href={`/tourist-places/${p.id}`} className="flex items-center gap-4 group">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0">
                      <Image src={p.image} alt={p.name} fill className="object-cover group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-primary group-hover:text-secondary transition-colors line-clamp-1">{p.name}</p>
                      <p className="text-[10px] font-medium text-slate-400">{p.location}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
