'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  CheckCircle2, 
  Star, 
  TrendingUp, 
  Smartphone, 
  MapPin, 
  ArrowRight, 
  Users, 
  Store, 
  Briefcase,
  Image as ImageIcon,
  HelpCircle,
  MessageSquare,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

export default function BusinessListLandingPage() {
  const [mobile, setMobile] = useState('');

  const stats = [
    { label: 'Buyers*', value: '18.4 Crore+' },
    { label: 'Happy Customers', value: '6.2 Lakh+' },
    { label: 'Businesses Listed', value: '5.2 Crore+' },
  ];

  const successStories = [
    {
      name: 'Mr. Ashim Kumar Mondal',
      business: 'Astrologer Sri Ashimanandaji Jyotish Mahamohopadhay',
      role: 'Astrologers',
      testimonial: 'I started with a small investment in one city, and today, Boomb has helped me expand across five states with a 35% to 40% increase in business growth.',
      duration: 'Customer since 1 year',
      image: 'https://i.pravatar.cc/150?u=ashim'
    },
    {
      name: 'Rajesh Chhabria',
      business: 'Chhabria and Sons',
      role: 'Tile Dealers',
      testimonial: 'From 1 showroom to 4 in 20 years, Boomb’s growing returns have helped us to dominate the market.',
      duration: 'Customer since 14 years',
      image: 'https://i.pravatar.cc/150?u=rajesh'
    },
    {
      name: 'Varshini',
      business: 'V2 Makeover',
      role: 'Makeup Artists',
      testimonial: 'Genuine leads from Boomb keep my business active and support me as a woman entrepreneur.',
      duration: 'Customer since 4 year',
      image: 'https://i.pravatar.cc/150?u=varshini'
    }
  ];

  const steps = [
    { title: 'Create Account', desc: 'Enter your mobile number to get started', step: 1 },
    { title: 'Enter Business Details', desc: 'Add name, address, business hours and photos', step: 2 },
    { title: 'Select Categories', desc: 'Add relevant categories to your premium listing page', step: 3 },
  ];

  const faqs = [
    {
      q: 'What are the benefits of listing a business on Boomb?',
      a: 'Listing on Boomb helps you reach millions of potential customers, build trust, and grow your business online with a professional presence and verified leads.'
    },
    {
      q: 'Can I list my business on Boomb?',
      a: 'Yes, any legitimate business can list on Boomb. We offer premium plans that provide high visibility and verified leads to help your business grow.'
    },
    {
      q: 'I already have a website and social media. Do I still need Boomb?',
      a: 'Absolutely! Boomb is a leading local search engine that connects you with users who are specifically searching for your services in your local area, converting intent into sales.'
    },
    {
      q: 'Do I need to download the Boomb App to manage my listing?',
      a: 'While our app provides a great mobile experience, you can easily manage your business listing through our responsive web dashboard on any device.'
    }
  ];

  return (
    <div className="min-h-screen bg-white selection:bg-blue-600/10">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden bg-slate-50">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-indigo-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                  Premium Business Listing <br />
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">with India’s No. 1 Local Search Engine</span>
                </h1>
                <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-xl">
                  Get Discovered & Create Your Online Business. Respond to Customer Reviews, Showcase Your Products & Scale Your Growth.
                </p>
              </div>

              <div className="bg-white p-2 rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100 max-w-md">
                <div className="flex items-center">
                  <div className="flex items-center gap-2 pl-4 pr-2 py-3 border-r border-slate-100">
                    <span className="text-slate-400 font-bold text-sm">+91</span>
                  </div>
                  <input 
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="Enter Mobile No."
                    className="flex-grow px-4 py-3 bg-transparent outline-none font-bold text-slate-900 placeholder:text-slate-300 text-sm"
                  />
                  <Link 
                    href={`/business/register?mobile=${mobile}`}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200 whitespace-nowrap"
                  >
                    Start Now
                  </Link>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 font-medium">
                By continuing, you agree to our <Link href="/terms" className="underline">Terms of Use</Link>, <Link href="/privacy" className="underline">Privacy</Link> & <Link href="/policy" className="underline">Infringement Policy</Link>
              </p>

              <div className="grid grid-cols-3 gap-8 pt-4 border-t border-slate-200/60">
                {stats.map((stat, i) => (
                  <div key={i} className="space-y-1">
                    <h4 className="text-xl sm:text-2xl font-black text-slate-900">{stat.value}</h4>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:block relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 blur-[100px] -z-10 rounded-full animate-pulse"></div>
              <div className="relative bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: TrendingUp, label: 'Get Discovered', desc: 'Showcase your business' },
                    { icon: MessageSquare, label: 'Respond', desc: 'Answer customer questions' },
                    { icon: ImageIcon, label: 'Showcase', desc: 'Display your offerings' },
                    { icon: ShieldCheck, label: 'Trust', desc: 'Get verified badge' },
                  ].map((item, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600">
                        <item.icon size={20} />
                      </div>
                      <div className="space-y-1">
                        <h5 className="font-bold text-slate-900 text-sm">{item.label}</h5>
                        <p className="text-[10px] text-slate-400 font-medium">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-1 bg-blue-600 rounded-full"></div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-[0.3em]">Growth Stories</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">Real Success with <span className="text-blue-600">Boomb.</span></h2>
            </div>
            <Link href="/stories" className="group flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors">
              See All Stories <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {successStories.map((story, i) => (
              <div key={i} className="flex flex-col bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden group">
                <div className="p-8 space-y-6 flex-grow">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-100 group-hover:border-blue-600 transition-colors">
                      <Image src={story.image} alt={story.name} width={56} height={56} className="object-cover" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 leading-tight">{story.name}</h4>
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{story.role}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h5 className="font-bold text-sm text-slate-700 line-clamp-1">{story.business}</h5>
                    <p className="text-slate-500 text-sm font-medium italic leading-relaxed">"{story.testimonial}"</p>
                  </div>
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{story.duration}</span>
                  <Link href="/business/register" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Visit Business</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 Simple Steps */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/5 -skew-x-12 translate-x-1/2 blur-3xl"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="max-w-3xl mx-auto space-y-4 mb-20">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">Get Your Premium Business Listing in <span className="text-blue-400">3 Simple Steps</span></h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((step, i) => (
              <div key={i} className="space-y-6 relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-gradient-to-r from-blue-500/50 to-transparent"></div>
                )}
                <div className="w-20 h-20 rounded-[2rem] bg-blue-600 text-white mx-auto flex items-center justify-center text-3xl font-black shadow-2xl shadow-blue-900/40 relative z-10">
                  {step.step}
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold uppercase tracking-widest">Step 0{step.step}</h4>
                  <h3 className="text-2xl font-black text-blue-400">{step.title}</h3>
                  <p className="text-slate-400 font-medium max-w-[200px] mx-auto text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-12">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-1 bg-blue-600 rounded-full"></div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-[0.3em]">Why Choose Boomb</span>
                </div>
                <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
                  Connect with New Customers & <span className="text-blue-600">Grow Your Business</span>
                </h2>
              </div>

              <div className="space-y-8">
                {[
                  { title: 'PREMIUM BUSINESS LISTING PAGE', desc: 'Having a presence on Boomb helps you build trust with your potential customers. Enrich your business details so that people can find you online easily.' },
                  { title: 'INCREASE ENGAGEMENT', desc: 'Increase customer engagement by responding to their reviews and questions. Upload photos and videos to showcase your business online.' },
                  { title: 'TARGETED REACH', desc: 'Rank higher in search and get more exposure in front of your potential customers who are actively searching for your services.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                      <CheckCircle2 size={24} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-black text-slate-900 text-sm uppercase tracking-widest">{item.title}</h4>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100 max-w-md">
                  <div className="flex items-center">
                    <div className="flex items-center gap-2 pl-4 pr-2 py-3 border-r border-slate-100">
                      <span className="text-slate-400 font-bold text-sm">+91</span>
                    </div>
                    <input 
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="Enter Mobile No."
                      className="flex-grow px-4 py-3 bg-transparent outline-none font-bold text-slate-900 placeholder:text-slate-300 text-sm"
                    />
                    <Link 
                      href={`/business/register?mobile=${mobile}`}
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200"
                    >
                      Start Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-blue-600/5 rounded-[3rem] -rotate-3"></div>
              <div className="relative bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 space-y-8">
                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Boomb Ads</h3>
                  <p className="text-slate-500 font-medium text-sm">Get prominent display over your competitors and reach out to more customers.</p>
                </div>
                <div className="space-y-6">
                  {[
                    'Rank higher in search and get more exposure.',
                    'Get customer details over SMS, email and push notification.',
                    'Get full access to competition trends and analytics dashboard.',
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-4 text-slate-700">
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0">
                        <CheckCircle2 size={12} strokeWidth={4} />
                      </div>
                      <span className="text-xs font-bold">{benefit}</span>
                    </div>
                  ))}
                </div>
                <Link href="/pricing" className="block w-full py-4 bg-slate-900 text-white text-center rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95">
                  Advertise Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">Got a <span className="text-blue-600">Question?</span></h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm open:shadow-md transition-all">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">{faq.q}</h4>
                  <ChevronDown size={20} className="text-slate-400 group-open:rotate-180 transition-transform duration-300" />
                </summary>
                <div className="px-6 pb-6 text-slate-500 text-sm font-medium leading-relaxed border-t border-slate-50 pt-4">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link href="/faq" className="inline-flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">
              View More Questions <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 bg-blue-600 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10 text-white">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            List Your Business on <br /> Boomb Today
          </h2>
          <p className="text-blue-100 text-lg font-medium opacity-90 max-w-2xl mx-auto">
            India's No. 1 Local Search Engine. Join thousands of successful businesses already growing with us.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
            <div className="bg-white p-2 rounded-2xl shadow-xl max-w-md w-full">
              <div className="flex items-center">
                <div className="flex items-center gap-2 pl-4 pr-2 py-3 border-r border-slate-100">
                  <span className="text-slate-400 font-bold text-sm">+91</span>
                </div>
                <input 
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Enter Mobile No."
                  className="flex-grow px-4 py-3 bg-transparent outline-none font-bold text-slate-900 placeholder:text-slate-300 text-sm"
                />
                <Link 
                  href={`/business/register?mobile=${mobile}`}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
