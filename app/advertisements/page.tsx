'use client';

import { Megaphone, Target, BarChart3, Users, Zap, CheckCircle2, ArrowRight, ShieldCheck, Trophy, Rocket } from 'lucide-react';
import Link from 'next/link';

export default function AdvertisePage() {
  const adTypes = [
    {
      title: 'Premium Listing',
      desc: 'Get featured at the top of your category and search results.',
      icon: Trophy,
      color: 'bg-yellow-50 text-yellow-600'
    },
    {
      title: 'Banner Ads',
      desc: 'High-visibility visual ads on the home page and search pages.',
      icon: Megaphone,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'Category Takeover',
      desc: 'Dominate your industry with exclusive ad spots.',
      icon: Zap,
      color: 'bg-purple-50 text-purple-600'
    }
  ];

  const stats = [
    { label: 'Monthly Active Users', value: '10M+' },
    { label: 'Cities Covered', value: '500+' },
    { label: 'Daily Search Volume', value: '2M+' },
    { label: 'Avg. Conversion Rate', value: '18%' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 pt-24 lg:pt-32 pb-24">
        {/* Hero Section */}
        <section className="px-4 mb-24">
          <div className="max-w-7xl mx-auto text-center space-y-8">
            <span className="bg-secondary/10 text-secondary px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-sm inline-block">Grow Your Brand</span>
            <h1 className="text-4xl md:text-7xl font-black text-primary tracking-tight leading-[1.1] max-w-4xl mx-auto">
              Advertise with <span className="text-secondary underline decoration-secondary/30 underline-offset-8">Precision</span>
            </h1>
            <p className="text-gray-500 text-xl font-medium leading-relaxed max-w-3xl mx-auto">
              Connect with your local audience at the exact moment they're looking for your services. Boomb's ad platform is designed for impact.
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-primary py-20 mb-32 mx-4 rounded-[60px] overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-12 text-center relative z-10">
            {stats.map((stat, i) => (
              <div key={i} className="space-y-2">
                <div className="text-4xl md:text-5xl font-black text-white">{stat.value}</div>
                <div className="text-blue-100 text-sm font-bold uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Ad Types Grid */}
        <section className="max-w-7xl mx-auto px-4 mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-primary mb-4">Our Ad Solutions</h2>
            <p className="text-gray-500 font-medium max-w-2xl mx-auto">Choose the right format to reach your customers and drive meaningful results for your business.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {adTypes.map((type, i) => (
              <div key={i} className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-premium transition-all text-center space-y-6 flex flex-col items-center">
                <div className={`w-16 h-16 ${type.color} rounded-3xl flex items-center justify-center`}>
                  <type.icon size={32} />
                </div>
                <h3 className="text-2xl font-black text-primary">{type.title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed">{type.desc}</p>
                <div className="pt-4 mt-auto">
                  <button className="flex items-center gap-2 text-primary font-black hover:text-secondary transition-colors group">
                    Learn more <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why Advertise with Us? */}
        <section className="max-w-7xl mx-auto px-4 mb-32">
          <div className="bg-accent/10 rounded-[60px] p-12 md:p-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <h2 className="text-4xl font-black text-primary">Why Boomb Ads?</h2>
                <div className="space-y-6">
                  {[
                    { title: 'Highly Targeted', desc: 'Reach customers based on category, location, and intent.', icon: Target },
                    { title: 'Data-Driven Insights', desc: 'Detailed reporting to track impressions, clicks, and conversions.', icon: BarChart3 },
                    { title: 'Cost Effective', desc: 'Flexible budgets with high ROI compared to traditional advertising.', icon: Rocket },
                    { title: 'Verified Audience', desc: 'Our platform is trusted by millions, ensuring quality leads.', icon: ShieldCheck }
                  ].map((benefit, i) => (
                    <div key={i} className="flex gap-6 items-start">
                      <div className="w-12 h-12 bg-white rounded-2xl flex-shrink-0 flex items-center justify-center text-secondary shadow-sm">
                        <benefit.icon size={24} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-black text-primary">{benefit.title}</h4>
                        <p className="text-gray-500 text-sm font-medium leading-relaxed">{benefit.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="bg-white p-8 rounded-[40px] shadow-2xl relative z-10 space-y-6">
                  <div className="h-8 w-1/3 bg-gray-100 rounded-lg"></div>
                  <div className="space-y-3">
                    <div className="h-4 w-full bg-gray-50 rounded-lg"></div>
                    <div className="h-4 w-5/6 bg-gray-50 rounded-lg"></div>
                  </div>
                  <div className="h-40 bg-secondary/10 rounded-2xl flex items-center justify-center">
                    <Megaphone size={64} className="text-secondary opacity-50" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-10 w-24 bg-primary rounded-xl"></div>
                    <div className="h-4 w-20 bg-gray-100 rounded-lg"></div>
                  </div>
                </div>
                {/* Decorative blobs */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-secondary/5 rounded-full blur-3xl -z-10"></div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-7xl mx-auto px-4">
          <div className="bg-secondary rounded-[50px] p-10 md:p-20 text-center space-y-8 relative overflow-hidden text-white shadow-2xl shadow-secondary/20">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              Start Your Campaign Today
            </h2>
            <p className="text-blue-50 text-lg font-medium max-w-2xl mx-auto">
              Our advertising specialists are ready to help you build a campaign that drives growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
              <Link href="/business/register" className="bg-white text-secondary px-10 py-5 rounded-2xl font-black text-lg hover:bg-primary hover:text-white transition-all shadow-xl active:scale-95">
                Get Started
              </Link>
              <Link href="/contact" className="bg-transparent border-2 border-white/20 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-white/10 transition-all">
                Speak to an Expert
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
