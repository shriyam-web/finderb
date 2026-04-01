'use client';

import { use } from 'react';
import PricingCard from '@/components/PricingCard';
import { featuredBusinesses } from '@/lib/mockData';
import Image from 'next/image';
import { Star, MapPin, Phone, Mail, Globe, Clock, CheckCircle2, MessageSquare, Share2, Heart } from 'lucide-react';

export default function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const business = featuredBusinesses.find((b) => b.id === id) || featuredBusinesses[0];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 pt-24 lg:pt-32">
        {/* Gallery Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 h-[300px] sm:h-[400px] md:h-[500px] gap-2 p-2">
          <div className="md:col-span-2 relative overflow-hidden rounded-2xl group">
            <Image src={business.image} alt={business.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" priority />
          </div>
          <div className="hidden md:grid grid-rows-2 gap-2 md:col-span-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="relative overflow-hidden rounded-2xl group">
                <Image src="https://images.unsplash.com/photo-1517646281042-749510d7f2bf?w=800&q=80" alt="Gallery" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="relative overflow-hidden rounded-2xl group">
                <Image src="https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80" alt="Gallery" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl group">
              <Image src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&q=80" alt="Gallery" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="bg-white text-primary px-6 py-3 rounded-xl font-bold">View All Photos</button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Main Content */}
            <div className="flex-1 space-y-12">
              {/* Header Info */}
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-2">
                    <span className="bg-accent text-secondary px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">{business.category}</span>
                    <h1 className="text-3xl md:text-5xl font-black text-primary tracking-tighter leading-tight">{business.name}</h1>
                  </div>
                  <div className="flex gap-3">
                    <button className="p-3 rounded-2xl border border-gray-100 hover:bg-accent transition-all text-gray-500 hover:text-secondary">
                      <Share2 size={20} />
                    </button>
                    <button className="p-3 rounded-2xl border border-gray-100 hover:bg-accent transition-all text-gray-500 hover:text-red-500">
                      <Heart size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-yellow-400 text-white px-3 py-1 rounded-lg">
                      <Star size={16} fill="white" />
                      <span className="font-bold">{business.rating}</span>
                    </div>
                    <span className="text-gray-400 underline">{business.reviewsCount} verified reviews</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <MapPin size={18} className="text-secondary" />
                    {business.location}
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <Clock size={18} />
                    Open Now (Closes 8:00 PM)
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-primary">About this business</h2>
                <p className="text-gray-600 leading-relaxed text-lg font-medium">
                  {business.description} We take pride in delivering high-quality services tailored to our clients' needs. 
                  Our team of certified professionals ensures every job is completed to the highest standards.
                </p>
              </div>

              {/* Services Offered */}
              <div className="space-y-6">
                <h2 className="text-2xl font-black text-primary">Services Offered</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {business.services?.map((service) => (
                    <div key={service} className="flex items-center gap-3 p-4 bg-accent rounded-2xl border border-transparent hover:border-secondary transition-all group">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-secondary shadow-sm group-hover:bg-secondary group-hover:text-white transition-all">
                        <CheckCircle2 size={20} />
                      </div>
                      <span className="font-bold text-primary">{service}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Section */}
              <div className="space-y-8 pt-8 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-primary">Service Packages</h2>
                  <span className="text-gray-400 text-sm font-bold uppercase tracking-widest">Pricing Plans</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PricingCard
                    plan="Basic Plan"
                    price="₹1,499"
                    features={['Basic Consultation', 'Standard Service', '3 Months Support', 'Essential Features']}
                    buttonText="Choose Basic"
                  />
                  <PricingCard
                    plan="Premium Plan"
                    price="₹3,999"
                    features={['Priority Consultation', 'Advanced Service', '1 Year Support', 'Premium Features', 'Free Follow-up']}
                    recommended={true}
                    buttonText="Go Premium"
                  />
                </div>
              </div>

              {/* Reviews Preview */}
              <div className="space-y-8 pt-8 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-primary">What customers say</h2>
                  <button className="text-secondary font-bold hover:underline">Write a review</button>
                </div>
                <div className="space-y-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-8 bg-white border border-gray-100 rounded-3xl shadow-premium">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-primary font-bold">JD</div>
                          <div>
                            <p className="font-bold text-primary">John Doe</p>
                            <p className="text-xs text-gray-400">2 days ago</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={14} className={s <= 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 font-medium italic">"Excellent service! The team was professional and arrived on time. Highly recommend for any {business.category.toLowerCase()} needs."</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Sidebar */}
            <aside className="w-full lg:w-96">
              <div className="sticky top-24 space-y-6">
                <div className="bg-white rounded-[40px] shadow-premium p-8 border border-gray-100 space-y-8">
                  <h3 className="text-2xl font-black text-primary">Interested?</h3>
                  
                  <div className="space-y-4">
                    <button className="w-full bg-secondary text-white py-5 rounded-2xl font-black text-lg hover:bg-opacity-90 transition-all shadow-xl shadow-secondary/30 flex items-center justify-center gap-3 active:scale-95">
                      <MessageSquare size={22} />
                      Get Free Quote
                    </button>
                    <button className="w-full bg-primary text-white py-5 rounded-2xl font-black text-lg hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95">
                      <Phone size={22} />
                      Show Contact
                    </button>
                  </div>

                  <div className="pt-8 border-t border-gray-100 space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-accent rounded-xl text-secondary">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary">Address</p>
                        <p className="text-sm text-gray-500 font-medium">{business.location}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-accent rounded-xl text-secondary">
                        <Globe size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary">Website</p>
                        <p className="text-sm text-secondary font-medium hover:underline cursor-pointer">www.{business.name.toLowerCase().replace(/\s+/g, '')}.com</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-accent rounded-xl text-secondary">
                        <Mail size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary">Email</p>
                        <p className="text-sm text-gray-500 font-medium">contact@{business.name.toLowerCase().replace(/\s+/g, '')}.com</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-accent rounded-[30px] p-8 text-center space-y-4">
                  <p className="text-primary font-bold">Safe & Secure</p>
                  <p className="text-xs text-gray-500 font-medium">All businesses on Boomb are verified for quality and reliability.</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
