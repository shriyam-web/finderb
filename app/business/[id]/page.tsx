'use client';

import { use, useState, useEffect } from 'react';
import { featuredBusinesses, Business } from '@/lib/mockData';
import { getBusiness } from '@/app/actions/business';
import Image from 'next/image';
import { Star, MapPin, Phone, Mail, Globe, Clock, CheckCircle2, MessageSquare, Share2, Heart, ShieldCheck, Zap, Navigation, Languages } from 'lucide-react';

export default function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const result = await getBusiness(id);
      if (result.success && result.business) {
        setBusiness(result.business);
      } else {
        // Fallback to mock data if not found in DB
        const mockBusiness = featuredBusinesses.find((b) => b.id === id) || featuredBusinesses[0];
        setBusiness(mockBusiness);
      }
      setIsLoading(false);
    }
    fetchData();
  }, [id]);

  if (isLoading || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 selection:bg-blue-100 font-sans">
      <main className="flex-1 pt-20 lg:pt-28 pb-12">
        {/* Gallery Section - High-End Mosaic Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 h-[450px] md:h-[500px] lg:h-[550px] gap-3">
            {/* Main Featured Image */}
            <div className="md:col-span-2 lg:col-span-6 relative overflow-hidden rounded-2xl border-2 border-slate-100 shadow-sm group">
             <Image 
  src={
    business.profilePictureUrl ||
    business.image ||
    "/fallback.jpg"
  }
  alt={business.name || "Business Image"}
  fill 
  className="object-cover transition-transform duration-1000 group-hover:scale-105" 
  priority 
  sizes="(max-width: 1024px) 100vw, 50vw"
/>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute bottom-6 left-6 z-10 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                <span className="bg-white/90 backdrop-blur-md text-slate-900 px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2">
                  <Star size={14} className="text-amber-500 fill-amber-500" />
                  Featured Profile
                </span>
              </div>
            </div>
            
            {/* Side Grid - Multiple Pics */}
            <div className="hidden md:grid md:col-span-2 lg:col-span-6 grid-cols-2 grid-rows-2 gap-3">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="relative overflow-hidden rounded-2xl border-2 border-slate-100 shadow-sm group">
                  <Image 
                    src={business.images && business.images[idx+1] ? business.images[idx+1] : `https://images.unsplash.com/photo-${[
                      '1517646281042-749510d7f2bf',
                      '1504148455328-c376907d081c',
                      '1621905251189-08b45d6a269e'
                    ][idx]}?w=800&q=80`} 
                    alt={`Business image ${idx + 2}`} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-110" 
                    sizes="25vw" 
                  />
                  <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              ))}
              <div className="relative overflow-hidden rounded-2xl bg-slate-900 flex items-center justify-center cursor-pointer group border-2 border-slate-100 shadow-sm">
                <Image 
                  src={business.images && business.images[4] ? business.images[4] : "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80"} 
                  alt="Gallery" 
                  fill 
                  className="object-cover opacity-60 group-hover:scale-110 group-hover:opacity-40 transition-all duration-700" 
                  sizes="25vw" 
                />
                <div className="relative z-10 text-center p-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-white/30 group-hover:rotate-12 transition-transform">
                    <Zap size={20} className="text-white fill-white" />
                  </div>
                  <p className="text-white font-black text-xl tracking-tighter leading-none mb-1">View All</p>
                  <p className="text-blue-300 font-bold text-[10px] uppercase tracking-widest">{business.images?.length || 0} Photos</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content Area */}
            <div className="flex-1 space-y-8">
              {/* Header Info - Highly Professional */}
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {business.isFinderBVerified && (
                        <div className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-blue-700 shadow-sm">
                          <ShieldCheck size={14} className="fill-white/20" />
                          FinderB Verified
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                        <Zap size={14} />
                        Quick Response
                      </div>
                      <span className="text-slate-300">|</span>
                      <span className="text-blue-600 text-[11px] font-bold uppercase tracking-widest">{business.category}</span>
                    </div>
                    
                    <div className="space-y-3">
                      <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        {business.name}
                        <CheckCircle2 size={28} className="text-blue-600 fill-blue-50 shrink-0" />
                      </h1>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-black text-lg shadow-sm shadow-emerald-100">
                            {business.rating}
                            <Star size={16} className="fill-white" />
                          </div>
                          <div className="flex flex-col">
                            <p className="text-slate-900 font-black text-sm leading-none">
                              {business.reviewsCount || 150} Ratings
                            </p>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                              Verified Reviews
                            </p>
                          </div>
                        </div>
                        <div className="h-10 w-[1px] bg-slate-200 hidden md:block"></div>
                        <div className="flex flex-col">
                          <p className="text-slate-900 font-black text-sm leading-none">
                            {business.yearsInBusiness || 12} Years
                          </p>
                          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                            In Business
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-4 text-slate-600">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <MapPin size={18} className="text-blue-600 shrink-0" />
                        <span>{business.location}</span>
                        <span className="text-blue-600 hover:underline cursor-pointer text-xs font-black uppercase ml-2 tracking-widest">View on Map</span>
                      </div>
                      <div className="hidden md:block text-slate-300">•</div>
                      <div className="flex items-center gap-1.5 text-emerald-600 font-black text-xs uppercase tracking-widest">
                        <Clock size={16} />
                        {business.timings ? "Check Timings Below" : "Open Now: 9 AM - 9 PM"}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-4 rounded-2xl border-2 border-slate-100 bg-white text-slate-900 font-black text-xs uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition-all active:scale-95 shadow-sm group">
                      <Heart size={20} className="group-hover:fill-red-500 group-hover:text-red-500 transition-colors" />
                      Shortlist
                    </button>
                    <button className="flex items-center gap-2 px-6 py-4 rounded-2xl border-2 border-slate-100 bg-white text-slate-900 font-black text-xs uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition-all active:scale-95 shadow-sm">
                      <Share2 size={20} />
                      Share
                    </button>
                  </div>
                </div>

                {/* Quick Actions Bar - Enhanced Justdial Style */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-slate-100">
                  <a href={`tel:${business.contact}`} className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-8 h-8 bg-white/10 rounded-bl-3xl translate-x-2 -translate-y-2"></div>
                    <Phone size={24} className="group-hover:scale-110 transition-transform relative z-10" />
                    <span className="font-black text-[11px] uppercase tracking-widest relative z-10">Call Now</span>
                  </a>
                  <button className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-8 h-8 bg-white/10 rounded-bl-3xl translate-x-2 -translate-y-2"></div>
                    <MessageSquare size={24} className="group-hover:scale-110 transition-transform relative z-10" />
                    <span className="font-black text-[11px] uppercase tracking-widest relative z-10">Enquiry</span>
                  </button>
                  <button className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 border-slate-100 bg-white text-slate-900 hover:border-blue-600 hover:text-blue-600 transition-all group">
                    <Navigation size={24} className="group-hover:scale-110 transition-transform" />
                    <span className="font-black text-[11px] uppercase tracking-widest">Directions</span>
                  </button>
                  <a href={business.website || "#"} target="_blank" rel="noopener noreferrer" className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 border-slate-100 bg-white text-slate-900 hover:border-blue-600 hover:text-blue-600 transition-all group ${!business.website && 'opacity-50 cursor-not-allowed'}`}>
                    <Globe size={24} className="group-hover:scale-110 transition-transform" />
                    <span className="font-black text-[11px] uppercase tracking-widest">Website</span>
                  </a>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Side: Information */}
                <div className="md:col-span-2 space-y-8">
                  {/* About Section */}
                  <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm space-y-8 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <ShieldCheck size={28} />
                      </div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        About {business.name}
                      </h2>
                    </div>
                    
                    <div className="space-y-6">
                      <p className="text-slate-600 leading-relaxed font-bold text-xl italic border-l-4 border-blue-600 pl-8 py-4 bg-slate-50/50 rounded-r-2xl">
                        {business.description}
                      </p>
                      <p className="text-slate-500 leading-relaxed font-medium text-base">
                        At <span className="text-blue-600 font-black">FinderB</span>, we verify every detail of our partner businesses. {business.name} has been a cornerstone of professional excellence in {business.location} for {business.yearsInBusiness ? `over ${business.yearsInBusiness} years` : 'over a decade'}, consistently delivering premium service standards that our users trust.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8">
                      <div className="flex items-center gap-5 p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all group/card">
                        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover/card:scale-110 transition-transform">
                          <CheckCircle2 size={28} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Legacy</p>
                          <p className="text-lg font-black text-slate-900 tracking-tight">{business.yearsInBusiness || 12}+ Years</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-5 p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5 transition-all group/card">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200 group-hover/card:scale-110 transition-transform">
                          <Languages size={28} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Support</p>
                          <p className="text-lg font-black text-slate-900 tracking-tight">Multi-Lingual</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Services Section */}
                  <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm space-y-10 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <Zap size={28} className="fill-emerald-600/20" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                          Services & Specialties
                        </h2>
                      </div>
                      <div className="hidden sm:flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Available Now</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {business.services?.map((service) => (
                        <div key={service} className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/5 transition-all group/item cursor-default">
                          <div className="flex items-center gap-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 group-hover/item:scale-125 transition-transform"></div>
                            <span className="font-black text-slate-700 text-base tracking-tight">{service}</span>
                          </div>
                          <CheckCircle2 size={20} className="text-emerald-500 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side: Contact & Timings */}
                <div className="space-y-6">
                  {/* Trust & Verification Card */}
                  <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -translate-y-16 translate-x-16"></div>
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center border-2 border-white/20">
                          <ShieldCheck size={20} className="text-white fill-white/20" />
                        </div>
                        <div>
                          <p className="text-white font-black text-sm uppercase tracking-widest leading-none">FinderB Trust Seal</p>
                          <p className="text-blue-400 font-bold text-[10px] uppercase tracking-wider">Verified Business</p>
                        </div>
                      </div>
                      <p className="text-slate-400 text-xs font-medium leading-relaxed">
                        This business has been verified by our team for physical existence and quality standards.
                      </p>
                    </div>
                  </div>

                  {/* Contact Info Card */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-4">
                      Contact Info
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 group hover:border-blue-200 hover:bg-white transition-all cursor-pointer">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 group-hover:text-blue-600">Mobile Number</p>
                        <div className="flex items-center gap-3">
                          <Phone size={18} className="text-emerald-600" />
                          <p className="text-base font-black text-slate-900 tracking-tight">{business.contact}</p>
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 group hover:border-blue-200 hover:bg-white transition-all cursor-pointer">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 group-hover:text-blue-600">Email & Web</p>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Mail size={16} className="text-blue-600" />
                            <p className="text-sm font-bold text-slate-700 truncate">{business.email || `support@${business.name.toLowerCase().replace(/\s+/g, '')}.com`}</p>
                          </div>
                          {business.website && (
                            <a href={business.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                              <Globe size={16} className="text-blue-600" />
                              <p className="text-sm font-bold text-blue-600 underline underline-offset-4 decoration-blue-100 truncate">Visit Website</p>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-3 group">
                      <Phone size={20} className="group-hover:animate-bounce" />
                      Contact Business
                    </button>
                  </div>

                  {/* Hours of Operation */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                        Timings
                      </h3>
                      <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                        <Clock size={12} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Open Now</span>
                      </div>
                    </div>
                    <div className="space-y-3 px-1">
                      {[
                        { day: 'Mon - Fri', hours: '09:00 AM - 09:00 PM' },
                        { day: 'Saturday', hours: '10:00 AM - 07:00 PM' },
                        { day: 'Sunday', hours: 'Closed', closed: true },
                      ].map((item) => (
                        <div key={item.day} className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500">{item.day}</span>
                          <span className={`text-xs font-black ${item.closed ? 'text-red-500' : 'text-slate-900'}`}>{item.hours}</span>
                        </div>
                      ))}
                    </div>
                    <button className="w-full py-3 rounded-lg bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100">Show Full Week</button>
                  </div>
                </div>
              </div>

              {/* Reviews Section - Modern & Social */}
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-8">
                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Customer Reviews</h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Real feedback from verified customers</p>
                  </div>
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">Rate Business</button>
                </div>
                
                <div className="grid grid-cols-1 gap-8">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-8 rounded-2xl border border-slate-100 bg-slate-50/30 space-y-6 relative overflow-hidden group hover:bg-white hover:border-blue-100 transition-all">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[100px] translate-x-8 -translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl ${i === 1 ? 'bg-blue-600' : 'bg-emerald-600'} flex items-center justify-center text-white font-black text-lg shadow-lg border-2 border-white`}>
                            {i === 1 ? 'JD' : 'AS'}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-lg tracking-tight leading-none mb-1">{i === 1 ? 'John Doe' : 'Anjali Sharma'}</p>
                            <div className="flex items-center gap-1.5">
                              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                                <ShieldCheck size={12} className="fill-emerald-600/20" />
                                Verified User
                              </p>
                              <span className="text-slate-300">•</span>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Local Guide</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} size={14} className={s <= 4 ? "text-amber-500 fill-amber-500" : "text-slate-200"} />
                            ))}
                          </div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">2 Days Ago</p>
                        </div>
                      </div>
                      <div className="relative">
                        <MessageSquare size={40} className="absolute -top-4 -left-4 text-blue-500/5 rotate-12" />
                        <p className="text-slate-600 font-bold leading-relaxed text-base relative z-10 pl-2">
                          "The level of professionalism displayed by the team was truly exceptional. They handled our requirements with extreme care and delivered beyond expectations. Highly recommend {business.name} for anyone in {business.location}."
                        </p>
                      </div>
                      <div className="flex items-center gap-4 pt-2 relative z-10">
                        <button className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
                          <Heart size={14} /> Helpful (12)
                        </button>
                        <button className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
                          <Share2 size={14} /> Share
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full py-5 rounded-2xl bg-slate-100 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all border-2 border-transparent">Read All 150+ Verified Reviews</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
