'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PricingCard from '@/components/PricingCard';
import { HelpCircle, CheckCircle2 } from 'lucide-react';

export default function PricingPage() {
  const packages = [
    {
      title: 'Basic',
      price: '999',
      features: [
        'Single Business Listing',
        'Basic Dashboard Access',
        'Up to 10 Images',
        'Email Support',
        'Standard Visibility',
      ],
    },
    {
      title: 'Standard',
      price: '2499',
      isRecommended: true,
      features: [
        'Priority Listing Placement',
        'Advanced Analytics',
        'Unlimited Gallery Images',
        'Priority Email & Chat Support',
        'Featured Badge',
        'Performance Reports',
      ],
    },
    {
      title: 'Premium',
      price: '4999',
      features: [
        'Top Search Visibility',
        'Verified Partner Status',
        'Dedicated Account Manager',
        '24/7 Phone Support',
        'Professional Photo Shoot',
        'SMS Lead Notifications',
        'Competitor Analysis',
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-accent/30">
      <Navbar />

      <main className="flex-1 pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
            <span className="bg-secondary/10 text-secondary px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-sm">Simple Pricing</span>
            <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tight leading-[1.1]">
              Scale your business with <br /> <span className="text-secondary">Boomb Plans</span>
            </h1>
            <p className="text-gray-500 text-lg font-medium leading-relaxed">
              Choose the perfect plan to boost your local visibility and connect with more customers in your neighborhood.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            {packages.map((pkg) => (
              <PricingCard key={pkg.title} {...pkg} />
            ))}
          </div>

          {/* Comparison Table Preview or FAQ */}
          <div className="bg-white rounded-[50px] shadow-premium p-10 md:p-16 border border-gray-100">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-black text-primary">Frequently Asked Questions</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {[
                { q: "Can I change my plan later?", a: "Yes, you can upgrade or downgrade your plan at any time from your business dashboard." },
                { q: "Are there any hidden charges?", a: "No, the prices shown are all-inclusive. No setup fees or hidden commissions." },
                { q: "What is a 'Featured Badge'?", a: "It's a special visual indicator on your listing that increases user trust and click-through rates." },
                { q: "How does priority placement work?", a: "Priority listings appear above standard listings in search results for their respective categories." }
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
              Still not sure which plan <br /> is right for you?
            </h2>
            <p className="text-blue-100 text-lg font-medium max-w-2xl mx-auto">
              Schedule a free consultation call with our business growth experts to find the best fit for your goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
              <button className="bg-white text-primary px-10 py-5 rounded-2xl font-black text-lg hover:bg-secondary hover:text-white transition-all shadow-xl active:scale-95">
                Book a Free Call
              </button>
              <button className="bg-transparent border-2 border-white/20 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-white/10 transition-all">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
