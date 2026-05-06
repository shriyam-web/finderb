'use client';

import { use, useState, useEffect } from 'react';
import { featuredBusinesses, Business } from '@/lib/mockData';
import { getBusiness } from '@/app/actions/business';
import Image from 'next/image';
import { Star, MapPin, Phone, Mail, Globe, Clock, CheckCircle2, MessageSquare, Share2, Heart, ShieldCheck, Zap, Navigation, Languages, ChevronRight, ExternalLink } from 'lucide-react';

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
        const mockBusiness = featuredBusinesses.find((b) => b.id === id) || featuredBusinesses[0];
        setBusiness(mockBusiness);
      }
      setIsLoading(false);
    }
    fetchData();
  }, [id]);

  if (isLoading || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium text-xs tracking-tight font-outfit">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] selection:bg-blue-100 font-outfit text-slate-900">
      <main className="max-w-6xl mx-auto pt-20 lg:pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb - Compact */}
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-6">
          <span className="hover:text-blue-600 cursor-pointer">Home</span>
          <ChevronRight size={12} />
          <span className="hover:text-blue-600 cursor-pointer">{business.category}</span>
          <ChevronRight size={12} />
          <span className="text-slate-600">{business.name}</span>
        </div>

        {/* Hero Section - Compact & Stylish */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Gallery - Integrated & Refined */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden shadow-sm border border-slate-200/60 group">
              <Image 
                src={business.images?.[0] || business.profilePictureUrl || business.image || "/fallback.jpg"}
                alt={business.name}
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-105" 
                priority 
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
              
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div className="flex gap-1.5">
                  {business.isFinderBVerified && (
                    <div className="flex items-center gap-1.5 bg-blue-600/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      <ShieldCheck size={14} />
                      Verified
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md text-slate-900 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    <Star size={12} className="fill-amber-500 text-amber-500" />
                    {business.rating} • {business.reviewsCount || 150} Reviews
                  </div>
                </div>
                <button className="p-2.5 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-all">
                  <Share2 size={18} />
                </button>
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="hidden md:flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {[1, 2, 3, 4].map((idx) => (
                <div key={idx} className="relative w-32 aspect-video rounded-2xl overflow-hidden flex-shrink-0 border border-slate-200/60 cursor-pointer hover:border-blue-400 transition-colors">
                  <Image 
                    src={business.images?.[idx] || `https://images.unsplash.com/photo-${['1517646281042-749510d7f2bf', '1504148455328-c376907d081c', '1621905251189-08b45d6a269e', '1497366216548-37526070297c'][idx-1]}?w=400&q=80`} 
                    alt={`Gallery ${idx}`} 
                    fill 
                    className="object-cover" 
                    sizes="128px"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Business Core Info - Side Card */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200/60 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">{business.category}</span>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">
                    {business.name}
                  </h1>
                </div>

                <div className="flex items-center gap-4 text-slate-500 text-sm font-medium">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={16} className="text-blue-600" />
                    {business.location}
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                  <div className="flex items-center gap-1.5">
                    <Zap size={16} className="text-emerald-500" />
                    Quick Response
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Experience</p>
                    <p className="font-bold text-slate-900">{business.yearsInBusiness || 12} Years+</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <p className="font-bold text-emerald-600">Open Now</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <a href={`tel:${business.contact}`} className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm tracking-tight hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                  <Phone size={18} />
                  Call Now
                </a>
                <button className="flex items-center justify-center gap-2 w-full py-4 bg-slate-50 text-slate-900 rounded-2xl font-bold text-sm tracking-tight hover:bg-slate-100 border border-slate-200 transition-all">
                  <MessageSquare size={18} />
                  Send Enquiry
                </button>
              </div>
            </div>

            {/* Quick Stats - Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Star size={20} className="fill-amber-600/20" />
                </div>
                <div>
                  <p className="text-lg font-bold leading-none">{business.rating}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rating</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Heart size={20} className="fill-blue-600/20" />
                </div>
                <div>
                  <p className="text-lg font-bold leading-none">Shortlist</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Save</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* About Section */}
            <section className="bg-white rounded-[2rem] p-8 border border-slate-200/60 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                <h2 className="text-xl font-bold text-slate-900">About {business.name}</h2>
              </div>
              <div className="space-y-4">
                <p className="text-slate-600 leading-relaxed font-medium">
                  {business.description}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#F8F9FA] border border-slate-100">
                    <ShieldCheck className="text-blue-600" size={20} />
                    <span className="text-sm font-semibold text-slate-700 uppercase tracking-tight">Verified Merchant</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#F8F9FA] border border-slate-100">
                    <Languages className="text-blue-600" size={20} />
                    <span className="text-sm font-semibold text-slate-700 uppercase tracking-tight">Multi-lingual Support</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Services Section */}
            <section className="bg-white rounded-[2rem] p-8 border border-slate-200/60 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                <h2 className="text-xl font-bold text-slate-900">Our Services</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {business.services?.map((service) => (
                  <div key={service} className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                    <div className="w-2 h-2 rounded-full bg-blue-600 opacity-40 group-hover:opacity-100 group-hover:scale-125 transition-all"></div>
                    <span className="text-sm font-bold text-slate-700">{service}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Reviews Section */}
            <section className="bg-white rounded-[2rem] p-8 border border-slate-200/60 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-amber-500 rounded-full"></div>
                  <h2 className="text-xl font-bold text-slate-900">Customer Reviews</h2>
                </div>
                <button className="text-[11px] font-black uppercase tracking-widest text-blue-600 hover:underline">Write a Review</button>
              </div>

              <div className="space-y-6">
                {[1, 2].map((i) => (
                  <div key={i} className="p-6 rounded-3xl bg-[#F8F9FA] border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${i === 1 ? 'bg-blue-600' : 'bg-emerald-600'} flex items-center justify-center text-white font-bold text-sm`}>
                          {i === 1 ? 'JD' : 'AS'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{i === 1 ? 'John Doe' : 'Anjali Sharma'}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified User</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={12} className={s <= 4 ? "text-amber-500 fill-amber-500" : "text-slate-200"} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
                      "Excellent service and very professional. {business.name} team helped me with my requirements perfectly."
                    </p>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Contact Details Card */}
            <div className="bg-white rounded-[2rem] p-6 border border-slate-200/60 shadow-sm space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Contact Details</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Call Now</p>
                    <p className="text-sm font-bold text-slate-900">{business.contact}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Mail size={18} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{business.email || `hello@${business.name.toLowerCase().replace(/\s+/g, '')}.com`}</p>
                  </div>
                </div>
                {business.website && (
                  <div className="flex items-center gap-4 group cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Globe size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Website</p>
                      <p className="text-sm font-bold text-blue-600 underline underline-offset-4 decoration-blue-100">Visit Site</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timings Card - More Compact */}
            <div className="bg-white rounded-[2rem] p-6 border border-slate-200/60 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Timings</h3>
                <Clock size={16} className="text-slate-300" />
              </div>
              <div className="space-y-3">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                  const timing = business.timings?.[day];
                  const isClosed = !timing || timing === 'Closed' || timing.isClosed;
                  return (
                    <div key={day} className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-500">{day}</span>
                      <span className={`text-xs font-bold ${isClosed ? 'text-rose-500' : 'text-slate-900'}`}>
                        {isClosed ? 'Closed' : (typeof timing === 'string' ? timing : `${timing.open} - ${timing.close}`)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Directions / Map Preview Placeholder */}
            <div className="relative aspect-video rounded-[2rem] overflow-hidden border border-slate-200/60 shadow-sm group cursor-pointer">
              <div className="absolute inset-0 bg-slate-200 animate-pulse"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Located at</p>
                <p className="text-white font-bold text-sm mb-4 truncate">{business.location}</p>
                <button className="flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-widest bg-blue-600 px-4 py-2 rounded-xl self-start">
                  <Navigation size={14} />
                  Get Directions
                </button>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-200/60 flex gap-3 lg:hidden z-50">
        <a href={`tel:${business.contact}`} className="flex-1 flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm">
          <Phone size={18} />
          Call
        </a>
        <button className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm">
          <MessageSquare size={18} />
          Enquire
        </button>
      </div>
    </div>
  );
}
