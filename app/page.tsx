import SearchBar from '@/components/SearchBar';
import CategoryCard from '@/components/CategoryCard';
import BusinessCard from '@/components/BusinessCard';
import { categories, featuredBusinesses, testimonials } from '@/lib/mockData';
import { ArrowRight, CheckCircle2, Star, Shield, Zap, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-16 md:pb-24 overflow-hidden">
        <div className="absolute top-0 inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/50 via-white to-white"></div>
        <div className="absolute top-1/4 -right-20 w-[500px] h-[500px] bg-blue-100/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-[55%] space-y-5 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100/50 rounded-full shadow-sm text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                <div className="flex -space-x-1.5">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="relative w-5 h-5 rounded-full border-2 border-white overflow-hidden bg-gray-200">
                      <Image src={`https://i.pravatar.cc/50?u=${i}`} alt="user" fill />
                    </div>
                  ))}
                </div>
                <span className="ml-1">Trusted by 50k+ Users</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-primary leading-[1.1] tracking-tighter">
                Find the <span className="text-secondary italic">Best</span> <br /> 
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Services</span> Near You
              </h1>
              <p className="text-gray-500 text-base md:text-lg font-medium leading-relaxed max-w-xl mx-auto md:mx-0">
                Verified reviews. Upfront pricing. Same-day bookings. Boomb connects you with top local pros in seconds.
              </p>
              <div className="flex justify-center md:justify-start max-w-2xl">
                <SearchBar />
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2 justify-center md:justify-start">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Popular:</p>
                {['Plumbers', 'Electricians', 'Restaurants', 'Gyms'].map((item) => (
                  <Link key={item} href={`/categories/${item.toLowerCase()}`} className="px-3 py-1 bg-white border border-gray-100 rounded-lg text-[11px] font-bold text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:shadow-sm transition-all">
                    {item}
                  </Link>
                ))}
              </div>
            </div>
            <div className="md:w-[45%] relative hidden md:flex justify-center">
              <div className="relative w-full max-w-[380px] aspect-[4/5] rounded-[48px] overflow-hidden shadow-2xl rotate-1 hover:rotate-0 transition-all duration-700 group">
                <Image 
                  src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80&w=800" 
                  alt="Service Professional" 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white/95 backdrop-blur-xl p-5 rounded-[28px] shadow-premium animate-float border border-white/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-200">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-primary uppercase">100% Verified</p>
                    <p className="text-[10px] font-bold text-gray-400">Professional Pros Only</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-16 gap-6">
            <div className="space-y-3 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-black text-primary tracking-tight">Browse Categories</h2>
              <p className="text-gray-500 font-medium">Explore top services across various categories</p>
            </div>
            <Link href="/categories/all" className="text-secondary font-bold flex items-center gap-2 hover:gap-3 transition-all">
              View All <ArrowRight size={20} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Businesses */}
      <section className="py-24 bg-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-16 gap-6">
            <div className="space-y-3 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-black text-primary tracking-tight">Featured Businesses</h2>
              <p className="text-gray-500 font-medium">Top-rated professionals in your city</p>
            </div>
            <Link href="/categories/all" className="text-secondary font-bold flex items-center gap-2 hover:gap-3 transition-all">
              See More <ArrowRight size={20} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredBusinesses.map((biz) => (
              <BusinessCard key={biz.id} business={biz} />
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24 space-y-6">
            <h2 className="text-5xl font-black text-primary tracking-tight">How <span className="text-secondary">Boomb</span> Works</h2>
            <p className="text-gray-500 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
              Get your tasks done in three simple steps. We've streamlined the process to save you time and hassle.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-blue-50 -translate-y-1/2 -z-10"></div>
            {[
              { step: '01', title: 'Search Service', desc: 'Browse through hundreds of categories and find exactly what you need with our smart search.' },
              { step: '02', title: 'Compare Profiles', desc: 'Read verified reviews, check real-time availability, and compare transparent pricing.' },
              { step: '03', title: 'Get it Done', desc: 'Book instantly and get your task completed by top-rated local professionals.' },
            ].map((item, idx) => (
              <div key={idx} className="relative p-12 bg-white rounded-[50px] space-y-8 group hover:-translate-y-4 transition-all duration-500 shadow-premium border border-gray-50">
                <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-100 group-hover:bg-secondary transition-colors duration-500">
                  {item.step}
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-primary">{item.title}</h3>
                  <p className="text-gray-500 font-medium leading-relaxed">{item.desc}</p>
                </div>
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent rounded-full -z-10 group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-32 bg-accent/30 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="md:w-1/2 space-y-8">
              <h2 className="text-5xl font-black text-primary leading-tight tracking-tight">
                Why <span className="text-secondary italic">Boomb</span> is the <br /> Right Choice
              </h2>
              <p className="text-gray-500 text-lg font-medium leading-relaxed">
                We've built a platform that puts trust and efficiency at the forefront, making local service discovery easier than ever before.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                {[
                  { icon: <Shield className="text-blue-600" size={28} />, title: 'Verified Pros', desc: 'Strict background checks' },
                  { icon: <Star className="text-yellow-500" size={28} />, title: 'Real Reviews', desc: '100% authentic feedback' },
                  { icon: <Zap className="text-orange-500" size={28} />, title: 'Instant Booking', desc: 'Fastest response times' },
                  { icon: <TrendingUp className="text-green-500" size={28} />, title: 'Best Value', desc: 'Transparent comparison' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100/50">
                    <div className="p-3 bg-blue-50 rounded-xl flex-shrink-0">{item.icon}</div>
                    <div>
                      <h4 className="font-bold text-primary">{item.title}</h4>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="relative aspect-video rounded-[60px] overflow-hidden shadow-2xl border-8 border-white">
                <Image 
                  src="https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80&w=800" 
                  alt="Quality Service" 
                  fill 
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-secondary rounded-[40px] -z-10 animate-pulse opacity-20"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24 space-y-6">
            <h2 className="text-5xl font-black text-primary tracking-tight text-center">Loved by <span className="text-secondary italic">Local</span> Communities</h2>
            <p className="text-gray-500 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
              Don't just take our word for it. Here's what people across the country are saying about their experience with Boomb.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {testimonials.map((t) => (
              <div key={t.id} className="group relative p-12 bg-gray-50 rounded-[60px] hover:bg-white hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 border border-transparent hover:border-blue-50">
                <div className="absolute top-10 right-12 text-blue-100 group-hover:text-blue-500 transition-colors">
                  <Star size={40} fill="currentColor" />
                </div>
                <div className="space-y-8 relative">
                  <div className="flex gap-1 text-yellow-400">
                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={18} fill="currentColor" />)}
                  </div>
                  <p className="text-gray-600 text-xl font-medium leading-relaxed italic">"{t.content}"</p>
                  <div className="flex items-center gap-5 pt-4">
                    <div className="relative w-16 h-16 rounded-3xl overflow-hidden shadow-lg shadow-blue-100 group-hover:rotate-6 transition-transform">
                      <Image src={t.avatar} alt={t.name} fill className="object-cover" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-primary">{t.name}</h4>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Register Business CTA */}
      <section className="py-32 bg-primary overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-secondary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-16 relative">
          <div className="space-y-10 text-center lg:text-left lg:w-3/5">
            <h2 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tight">
              Ready to grow your <br /> <span className="text-secondary italic">local business?</span>
            </h2>
            <p className="text-blue-100 text-xl font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Join thousands of successful business owners who use Boomb to reach new customers and manage their online presence.
            </p>
            <div className="flex flex-wrap gap-8 justify-center lg:justify-start pt-4">
              {['Reach thousands of customers', 'Manage your listings', 'Get more leads'].map((feat) => (
                <div key={feat} className="flex items-center gap-3 text-blue-100 font-bold text-sm uppercase tracking-widest">
                  <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-primary">
                    <CheckCircle2 size={14} />
                  </div>
                  {feat}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto">
            <Link href="/business/register" className="group bg-white text-primary px-12 py-6 rounded-[30px] font-black hover:bg-secondary hover:text-white transition-all shadow-2xl hover:shadow-secondary/20 active:scale-95 text-xl text-center flex items-center justify-center gap-3">
              Register Now
              <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </Link>
            <Link href="/business/login" className="bg-transparent border-2 border-white/20 text-white px-12 py-6 rounded-[30px] font-black hover:bg-white/10 transition-all text-xl text-center">
              Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
