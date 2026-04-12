'use client';

import { Megaphone, Target, BarChart3, Users, Zap, CheckCircle2, ArrowRight, ShieldCheck, Trophy, Rocket, Globe } from 'lucide-react';
import Link from 'next/link';

export default function AdvertisePage() {
  const adTypes = [
    {
      title: 'Premium Listing',
      desc: 'Get featured at the top of your category and search results with a verified badge.',
      icon: Trophy,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
      features: ['Top of Search', 'Verified Badge', 'Priority Support']
    },
    {
      title: 'Banner Ads',
      desc: 'High-visibility visual ads on the home page and search pages to build brand awareness.',
      icon: Megaphone,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      features: ['Multi-page reach', 'Custom Creatives', 'Impression Tracking']
    },
    {
      title: 'Category Takeover',
      desc: 'Dominate your industry with exclusive ad spots and category-specific branding.',
      icon: Zap,
      color: 'text-secondary',
      bg: 'bg-secondary/10',
      features: ['100% Share of Voice', 'Exclusive Placement', 'Deep Insights']
    }
  ];

  const stats = [
    { label: 'Monthly Active Users', value: '10M+', icon: Users },
    { label: 'Cities Covered', value: '500+', icon: Globe },
    { label: 'Daily Search Volume', value: '2M+', icon: Rocket },
    { label: 'Avg. Conversion Rate', value: '18%', icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 pt-24 lg:pt-32 pb-24">
        {/* Hero Section */}
        <section className="px-4 mb-24 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-secondary/5 rounded-full blur-[120px] -z-10"></div>
          
          <div className="max-w-7xl mx-auto text-center space-y-10 relative z-10">
            <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-6 py-2 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-sm">
              <Rocket size={14} className="animate-bounce" />
              Grow Your Brand
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-primary tracking-tight leading-[0.95] max-w-5xl mx-auto">
              Advertise with <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-orange-500 to-secondary bg-[length:200%_auto] animate-gradient">Precision</span>
            </h1>
            <p className="text-gray-500 text-xl md:text-2xl font-medium leading-relaxed max-w-3xl mx-auto">
              Connect with your local audience at the exact moment they're looking for your services. FinderB's ad platform is built for maximum ROI.
            </p>
            <div className="flex flex-wrap justify-center gap-6 pt-4">
              <Link href="/business/register" className="bg-primary text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-secondary transition-all shadow-2xl shadow-primary/20 active:scale-95">
                Start Your Campaign
              </Link>
              <button className="bg-white text-primary px-10 py-5 rounded-2xl font-black text-lg hover:bg-gray-50 transition-all border border-gray-100 shadow-sm active:scale-95">
                Download Media Kit
              </button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="max-w-7xl mx-auto px-4 mb-32">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white p-8 md:p-10 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-premium transition-all text-center space-y-4 group">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-secondary mx-auto group-hover:scale-110 transition-transform">
                  <stat.icon size={32} />
                </div>
                <div className="space-y-1">
                  <div className="text-4xl md:text-5xl font-black text-primary tracking-tighter">{stat.value}</div>
                  <div className="text-gray-400 text-xs font-black uppercase tracking-widest">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Ad Types Grid */}
        <section className="max-w-7xl mx-auto px-4 mb-32">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
            <div className="space-y-4 text-center md:text-left">
              <h2 className="text-5xl font-black text-primary tracking-tight">Ad Solutions</h2>
              <p className="text-gray-500 text-xl font-medium max-w-xl">Choose the right format to reach your customers and drive results.</p>
            </div>
            <div className="hidden md:block">
              <div className="flex bg-gray-50 p-2 rounded-2xl border border-gray-100">
                <button className="px-6 py-3 bg-white shadow-sm rounded-xl font-black text-sm text-primary">Self-Serve</button>
                <button className="px-6 py-3 rounded-xl font-black text-sm text-gray-400 hover:text-primary transition-colors">Managed</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {adTypes.map((type, i) => (
              <div key={i} className="group bg-white p-10 md:p-12 rounded-[50px] border border-gray-100 shadow-sm hover:border-secondary/20 hover:shadow-premium transition-all duration-500 flex flex-col">
                <div className={`w-20 h-20 ${type.bg} ${type.color} rounded-[32px] flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                  <type.icon size={40} />
                </div>
                <h3 className="text-3xl font-black text-primary mb-4 tracking-tight">{type.title}</h3>
                <p className="text-gray-500 text-lg font-medium leading-relaxed mb-8">{type.desc}</p>
                
                <ul className="space-y-4 mb-10 mt-auto">
                  {type.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-primary font-bold">
                      <CheckCircle2 size={20} className="text-secondary" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-gray-50 text-primary group-hover:bg-primary group-hover:text-white rounded-2xl font-black text-base transition-all active:scale-95">
                  Get Started <ArrowRight size={20} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Why Advertise with Us? */}
        <section className="max-w-7xl mx-auto px-4 mb-32">
          <div className="bg-primary py-24 px-8 md:px-20 rounded-[60px] overflow-hidden relative shadow-2xl shadow-primary/20">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
              <div className="space-y-12">
                <div className="space-y-4">
                  <span className="text-secondary font-black uppercase tracking-[0.3em] text-xs">Why FinderB Ads?</span>
                  <h2 className="text-5xl md:text-6xl font-black text-white tracking-tight">Results you can <br />actually see</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {[
                    { title: 'Highly Targeted', desc: 'Reach customers based on intent.', icon: Target },
                    { title: 'Data Insights', desc: 'Detailed real-time reporting.', icon: BarChart3 },
                    { title: 'Cost Effective', desc: 'Flexible budgets, high ROI.', icon: Rocket },
                    { title: 'Verified Only', desc: 'Quality leads from real users.', icon: ShieldCheck }
                  ].map((benefit, i) => (
                    <div key={i} className="space-y-4 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="w-12 h-12 bg-secondary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-secondary/20">
                        <benefit.icon size={24} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xl font-black text-white tracking-tight">{benefit.title}</h4>
                        <p className="text-blue-100/60 text-sm font-medium leading-relaxed">{benefit.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                {/* Mockup Ad */}
                <div className="bg-white p-8 md:p-10 rounded-[50px] shadow-2xl relative z-10 space-y-8 max-w-md mx-auto transform hover:-rotate-2 transition-transform duration-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-3 w-24 bg-gray-100 rounded-full"></div>
                        <div className="h-2 w-16 bg-gray-50 rounded-full"></div>
                      </div>
                    </div>
                    <span className="bg-secondary/10 text-secondary text-[10px] font-black px-2 py-1 rounded">SPONSORED</span>
                  </div>
                  
                  <div className="aspect-[4/3] bg-gray-50 rounded-3xl flex items-center justify-center overflow-hidden border border-gray-100">
                    <Megaphone size={80} className="text-secondary opacity-20" />
                  </div>

                  <div className="space-y-4">
                    <div className="h-4 w-full bg-gray-100 rounded-full"></div>
                    <div className="h-4 w-2/3 bg-gray-100 rounded-full"></div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <div key={s} className="w-3 h-3 bg-secondary rounded-full opacity-20"></div>
                      ))}
                    </div>
                    <div className="h-10 w-32 bg-primary rounded-xl"></div>
                  </div>
                </div>

                {/* Decorative circles */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-white/5 rounded-full blur-[100px] -z-10"></div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-4">
          <div className="bg-secondary rounded-[60px] p-12 md:p-24 text-center space-y-10 relative overflow-hidden text-white shadow-2xl shadow-secondary/30">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            
            <div className="relative z-10 max-w-4xl mx-auto space-y-10">
              <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-[1] text-white">
                Ready to scale your <br />
                <span className="text-primary-foreground underline decoration-white/30 underline-offset-8">local presence?</span>
              </h2>
              <p className="text-blue-50 text-xl md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed">
                Join thousands of businesses growing with FinderB. Our experts are ready to help you launch.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center pt-6">
                <Link href="/business/register" className="bg-white text-secondary px-12 py-6 rounded-2xl font-black text-xl hover:bg-primary hover:text-white transition-all shadow-2xl active:scale-95">
                  Launch Your Ad
                </Link>
                <Link href="/contact" className="bg-transparent border-2 border-white/30 text-white px-12 py-6 rounded-2xl font-black text-xl hover:bg-white/10 transition-all active:scale-95">
                  Talk to an Expert
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
