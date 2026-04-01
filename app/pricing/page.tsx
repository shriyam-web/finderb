'use client';

import { useState } from 'react';
import Link from 'next/link';
import PricingCard from '@/components/PricingCard';
import { HelpCircle, CheckCircle2 } from 'lucide-react';

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    // This is where Razorpay integration will happen
    // For now, we simulate a delay and redirect
    setTimeout(() => {
      setLoading(false);
      window.location.href = '/business/register?plan=pro';
    }, 1500);
  };

  const planFeatures = [
    'Premium Business Listing',
    'Verified Partner Badge',
    'Priority Search Visibility',
    'Advanced Business Analytics',
    'Unlimited Photo Gallery',
    'SMS & Email Lead Notifications',
    'Direct Customer Chat',
    '24/7 Priority Support'
  ];

  const pricing = isYearly 
    ? { price: '2,999', oldPrice: '₹29,999', period: 'year' }
    : { price: '299', oldPrice: '₹2,999', period: 'month' };

  return (
    <div className="min-h-screen flex flex-col bg-accent/30">
      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-black text-primary animate-pulse uppercase tracking-widest text-xs">Initializing Secure Payment...</p>
        </div>
      )}

      <main className="flex-1 pt-24 lg:pt-32 pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-6">
            <span className="bg-secondary/10 text-secondary px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-sm">Transparent Pricing</span>
            <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tight leading-[1.1]">
              One Simple, <span className="text-secondary">Affordable Plan</span>
            </h1>
            <p className="text-gray-500 text-lg font-medium leading-relaxed">
              No complex tiers. Just one premium plan with everything you need to grow your local business.
            </p>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4 mb-16">
            <span className={`text-sm font-bold ${!isYearly ? 'text-primary' : 'text-gray-400'}`}>Monthly</span>
            <button 
              onClick={() => setIsYearly(!isYearly)}
              className="w-16 h-8 bg-gray-200 rounded-full relative p-1 transition-colors"
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${isYearly ? 'translate-x-8' : 'translate-x-0'}`}></div>
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${isYearly ? 'text-primary' : 'text-gray-400'}`}>Yearly</span>
              <span className="bg-green-100 text-green-600 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider">Save 15%</span>
            </div>
          </div>

          <div className="flex justify-center mb-24">
            <div className="max-w-md w-full">
              <PricingCard 
                plan="Growth Pro" 
                price={`₹${pricing.price}`} 
                oldPrice={pricing.oldPrice}
                features={planFeatures} 
                recommended={true} 
                buttonText={loading ? "Processing..." : "Start Your Growth Journey"} 
                period={pricing.period}
                onClick={handlePayment}
              />
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
            {[
              { title: 'Local Dominance', desc: 'Appear at the top of search results in your neighborhood.' },
              { title: 'Verified Trust', desc: 'Get a verification badge that builds instant customer trust.' },
              { title: 'Instant Leads', desc: 'Receive customer enquiries directly via SMS and Email.' },
              { title: 'Growth Tools', desc: 'Access powerful analytics to track your business performance.' }
            ].map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-premium transition-all">
                <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary mb-6">
                  <CheckCircle2 size={24} />
                </div>
                <h4 className="font-black text-primary mb-2">{f.title}</h4>
                <p className="text-gray-500 text-sm font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Comparison Table Preview or FAQ */}
          <div className="bg-white rounded-[50px] shadow-premium p-10 md:p-16 border border-gray-100">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-black text-primary">Frequently Asked Questions</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {[
                { q: "Can I change my billing cycle?", a: "Yes, you can switch from monthly to yearly billing at any time from your business dashboard." },
                { q: "Are there any hidden charges?", a: "No, the prices shown are all-inclusive. No setup fees or hidden commissions." },
                { q: "What is a 'Verified Badge'?", a: "It's a special visual indicator on your listing that increases user trust and click-through rates after our team verifies your details." },
                { q: "How does priority placement work?", a: "Growth Pro listings appear above standard listings in search results for their respective categories." }
              ].map((faq, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex gap-3 items-center text-primary">
                    <HelpCircle size={20} className="text-secondary" />
                    <h4 className="font-black text-lg">{faq.q}</h4>
                  </div>
                  <p className="text-gray-500 font-medium pl-8">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-24 bg-primary rounded-[50px] p-10 md:p-20 text-center space-y-8 relative overflow-hidden text-white shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
            
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              Ready to take your business <br /> to the next level?
            </h2>
            <p className="text-blue-100 text-lg font-medium max-w-2xl mx-auto">
              Join 6.2 Lakh+ happy business owners who are already growing with Boomb.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
              <Link href="/business/register" className="bg-white text-primary px-10 py-5 rounded-2xl font-black text-lg hover:bg-secondary hover:text-white transition-all shadow-xl active:scale-95 flex items-center justify-center">
                Get Started Now
              </Link>
              <button className="bg-transparent border-2 border-white/20 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-white/10 transition-all">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
