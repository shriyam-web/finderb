'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  CheckCircle2, 
  ChevronRight, 
  Star, 
  Users, 
  Store, 
  TrendingUp, 
  MessageSquare, 
  Image as ImageIcon,
  HelpCircle,
  Smartphone,
  MapPin,
  Clock,
  ArrowRight,
  ChevronLeft,
  X
} from 'lucide-react';
import { categories } from '@/lib/mockData';

export default function BusinessRegisterPage() {
  const [mobile, setMobile] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [loading, setLoading] = useState(false);
  const totalSteps = 5;

  const nextStep = () => {
    if (step === 4 && selectedPlan === 'pro') {
      handlePayment();
    } else {
      setStep((s) => Math.min(s + 1, totalSteps));
    }
  };
  
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handlePayment = async () => {
    setLoading(true);
    // Simulate Razorpay
    setTimeout(() => {
      setLoading(false);
      setStep(5);
    }, 1500);
  };

  const stats = [
    { label: 'Buyers*', value: '18.4 Crore+' },
    { label: 'Happy Customers', value: '6.2 Lakh+' },
    { label: 'Businesses Listed', value: '5.2 Crore+' },
  ];

  const testimonials = [
    {
      name: 'Mr. Ashim Kumar Mondal',
      business: 'Astrologer Sri Ashimanandaji Jyotish Mahamohopadhay',
      category: 'Astrologers',
      text: 'I started with a small investment in one city, and today, Boomb has helped me expand across five states with a 35% to 40% increase in business growth.',
      duration: 'Customer since 1 year'
    },
    {
      name: 'Rajesh Chhabria',
      business: 'Chhabria and Sons',
      category: 'Tile Dealers',
      text: 'From 1 showroom to 4 in 20 years, Boomb’s growing returns have helped us to dominate the market.',
      duration: 'Customer since 14 years'
    },
    {
      name: 'Varshini',
      business: 'V2 Makeover',
      category: 'Makeup Artists',
      text: 'Genuine leads from Boomb keep my business active and support me as a woman entrepreneur.',
      duration: 'Customer since 4 year'
    }
  ];

  const steps = [
    {
      step: 'Step 1',
      title: 'Create Account',
      desc: 'Enter your mobile number to get started'
    },
    {
      step: 'Step 2',
      title: 'Enter Business Details',
      desc: 'Add name, address, business hours and photos'
    },
    {
      step: 'Step 3',
      title: 'Select Categories',
      desc: 'Add relevant categories to your free listing page'
    }
  ];

  const faqs = [
    {
      q: 'What are the benefits of listing a business on Boomb?',
      a: 'Listing on Boomb helps you reach millions of potential customers, build trust, and grow your business online with a professional presence.'
    },
    {
      q: 'Is Boomb business listing affordable?',
      a: 'Yes, Boomb offers highly affordable plans starting at just ₹299/month, which includes your business name, contact info, address, and categories.'
    },
    {
      q: 'I already have a website and social media. Do I still need Boomb?',
      a: 'Absolutely! Boomb is India’s leading local search engine, connecting you with users who are actively searching for your services locally.'
    }
  ];

  const handleStartNow = () => {
    if (mobile.length >= 10) {
      setShowForm(true);
    } else {
      alert('Please enter a valid mobile number');
    }
  };

  if (showForm) {
    return (
      <div className="min-h-screen bg-accent pt-24 pb-12 lg:pt-32 lg:pb-24 px-4 relative">
        <button 
          onClick={() => setShowForm(false)}
          className="absolute top-8 right-8 w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 shadow-premium transition-all"
        >
          <X size={24} />
        </button>
        
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-4">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-400 border border-gray-200'}`}>
                    {step > i + 1 ? <CheckCircle2 size={20} /> : i + 1}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${step === i + 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                    {['Account', 'Business', 'Contact', 'Plan', 'Review'][i]}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 min-h-[500px] flex flex-col relative">
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-[40px]">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-black text-blue-600 animate-pulse uppercase tracking-widest text-xs">Initializing Secure Payment...</p>
              </div>
            )}
            
            <div className="p-8 md:p-12 flex-grow">
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-3xl font-black text-gray-900 mb-2">Basic Information</h2>
                  <p className="text-gray-500 mb-8 font-medium">Let's start with your account details</p>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                        <input className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium" placeholder="John Doe" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Work Email</label>
                        <input className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium" placeholder="john@business.com" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Mobile Number</label>
                      <input className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium" value={mobile} readOnly disabled />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-3xl font-black text-gray-900 mb-2">Business Details</h2>
                  <p className="text-gray-500 mb-8 font-medium">Tell us about your business</p>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Business Name</label>
                      <input className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium" placeholder="Acme Services Ltd" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Category</label>
                        <select className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium appearance-none">
                          <option>Select Category</option>
                          {categories.map(c => <option key={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Location</label>
                        <input className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium" placeholder="Mumbai, Maharashtra" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-3xl font-black text-gray-900 mb-2">Contact Info</h2>
                  <p className="text-gray-500 mb-8 font-medium">How should customers reach you?</p>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Public Phone Number</label>
                      <input className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium" placeholder="+91 XXXXX XXXXX" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Business Address</label>
                      <textarea className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium" rows={3} placeholder="Full address of your business"></textarea>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-3xl font-black text-gray-900 mb-2">Choose Plan</h2>
                  <p className="text-gray-500 mb-8 font-medium">Select the best plan for your business</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div 
                      onClick={() => setSelectedPlan('free')}
                      className={`p-6 rounded-3xl border-2 transition-all cursor-pointer ${selectedPlan === 'free' ? 'border-blue-600 bg-blue-50/30' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500">
                          <Store size={24} />
                        </div>
                        {selectedPlan === 'free' && <CheckCircle2 className="text-blue-600" size={24} />}
                      </div>
                      <h4 className="font-black text-xl mb-1">Free Plan</h4>
                      <p className="text-gray-500 text-sm mb-4">Basic listing with standard visibility.</p>
                      <div className="text-2xl font-black">₹0 <span className="text-sm text-gray-400 font-bold">/Forever</span></div>
                    </div>

                    <div 
                      onClick={() => setSelectedPlan('pro')}
                      className={`p-6 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden ${selectedPlan === 'pro' ? 'border-blue-600 bg-blue-50/30 shadow-xl shadow-blue-100' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                    >
                      <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest">Recommended</div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                          <TrendingUp size={24} />
                        </div>
                        {selectedPlan === 'pro' && <CheckCircle2 className="text-blue-600" size={24} />}
                      </div>
                      <h4 className="font-black text-xl mb-1">Growth Pro</h4>
                      <p className="text-gray-500 text-sm mb-4">Priority placement, verified badge & more.</p>
                      <div className="text-2xl font-black">₹299 <span className="text-sm text-gray-400 font-bold">/Month</span></div>
                    </div>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-8">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-2">Registration Complete!</h2>
                  <p className="text-gray-500 mb-8 font-medium max-w-md mx-auto">Your business information has been submitted successfully. Our team will verify it within 24-48 hours.</p>
                  <div className="bg-gray-50 p-6 rounded-2xl text-left space-y-3 mb-8 border border-gray-100">
                    <div className="flex justify-between"><span className="text-gray-500 font-bold text-sm">Business Name:</span> <span className="font-black">Acme Services Ltd</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 font-bold text-sm">Plan Selected:</span> <span className={`font-black uppercase text-xs px-2 py-1 rounded-lg ${selectedPlan === 'pro' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>{selectedPlan === 'pro' ? 'Growth Pro' : 'Free Listing'}</span></div>
                    {selectedPlan === 'pro' && <div className="flex justify-between text-green-600"><span className="font-bold text-sm">Payment Status:</span> <span className="font-black">PAID VIA RAZORPAY</span></div>}
                  </div>
                  <Link href="/business/dashboard" className="inline-flex items-center gap-2 bg-primary text-white font-black px-10 py-5 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                    Go to Dashboard
                    <ArrowRight size={20} />
                  </Link>
                </div>
              )}
            </div>

            {step < 5 && (
              <div className="p-8 border-t border-gray-50 bg-gray-50/50 flex justify-between items-center">
                <button 
                  onClick={prevStep}
                  disabled={step === 1}
                  className={`flex items-center gap-2 font-bold px-6 py-3 rounded-xl transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-500 hover:text-gray-900 hover:bg-white'}`}
                >
                  <ChevronLeft size={20} />
                  Back
                </button>
                <button 
                  onClick={nextStep}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black px-10 py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-95"
                >
                  {step === 4 ? (selectedPlan === 'pro' ? 'Pay & Complete' : 'Finish Setup') : 'Next Step'}
                  {step < 4 && <ChevronRight size={20} />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white pt-24 pb-16 lg:pt-32 lg:pb-24 px-4 overflow-hidden relative">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 relative z-10">
            <h1 className="text-4xl md:text-6xl font-black leading-tight">
              List Your Business at <span className="text-blue-400">Affordable Prices</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 font-medium max-w-lg">
              Boost your visibility for as low as <span className="line-through opacity-60 text-lg">₹2,999</span> <span className="text-white">₹299/mo</span>
            </p>

            <div className="flex items-center gap-4 text-sm font-bold">
              <span>Already listed?</span>
              <Link href="/business/login" className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all border border-white/20">
                Business Login
              </Link>
            </div>
            
            <div className="bg-white p-2 rounded-3xl shadow-2xl flex flex-col md:flex-row gap-2 max-w-md">
              <div className="flex items-center px-4 py-3 bg-gray-50 rounded-2xl flex-1">
                <span className="text-gray-500 font-bold border-r pr-3 mr-3">+91</span>
                <input 
                  type="tel" 
                  placeholder="Enter Mobile No." 
                  className="bg-transparent border-none outline-none text-gray-900 font-bold w-full"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </div>
              <button 
                onClick={handleStartNow}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-900/20"
              >
                Start Now
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-700/50 p-1 rounded-full"><CheckCircle2 size={18} /></div>
                <span className="font-medium">Get Discovered & Create Your Online Business</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-blue-700/50 p-1 rounded-full"><CheckCircle2 size={18} /></div>
                <span className="font-medium">Respond to Customer Reviews & Questions</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-blue-700/50 p-1 rounded-full"><CheckCircle2 size={18} /></div>
                <span className="font-medium">Showcase Your Product & Service Offerings</span>
              </div>
            </div>

            <p className="text-xs text-blue-300 opacity-70">
              By continuing, you agree to our Terms of Use, Privacy & Infringement Policy
            </p>
          </div>

          <div className="hidden md:block relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-[100px] opacity-20"></div>
            <div className="bg-white/10 backdrop-blur-md rounded-[40px] p-8 border border-white/20 shadow-2xl relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                  <Store size={32} />
                </div>
                <div>
                  <h3 className="font-black text-xl">Your Business Name</h3>
                  <p className="text-blue-200">Local Hero Services</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-white/10 rounded-full w-3/4"></div>
                <div className="h-4 bg-white/10 rounded-full w-full"></div>
                <div className="h-4 bg-white/10 rounded-full w-1/2"></div>
              </div>
              <div className="mt-8 pt-8 border-t border-white/10 flex justify-between">
                <div className="text-center">
                  <div className="text-2xl font-black">4.8</div>
                  <div className="flex text-yellow-400 gap-0.5"><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /></div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black">2.5k</div>
                  <div className="text-xs text-blue-200 uppercase tracking-widest font-bold">Views</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black">150+</div>
                  <div className="text-xs text-blue-200 uppercase tracking-widest font-bold">Leads</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((s, i) => (
              <div key={i} className="text-center space-y-2">
                <div className="text-4xl md:text-5xl font-black text-blue-900">{s.value}</div>
                <div className="text-gray-500 font-bold uppercase tracking-widest text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-24 px-4 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-4xl font-black text-gray-900 mb-4">Success Stories</h2>
              <p className="text-gray-500 font-medium text-lg">See how 6.2 Lakh+ Advertisers grew with Boomb</p>
            </div>
            <Link href="/stories" className="text-blue-600 font-black flex items-center gap-2 group">
              See All Stories <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="flex overflow-x-auto pb-8 gap-8 scrollbar-hide -mx-4 px-4">
            {testimonials.map((t, i) => (
              <div key={i} className="min-w-[350px] md:min-w-[450px] bg-accent p-8 rounded-[40px] border border-blue-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 overflow-hidden">
                      <Image src="/icon.png" alt="Avatar" width={64} height={64} className="opacity-20" />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900">{t.name}</h4>
                      <p className="text-sm text-gray-500 font-medium">{t.business}</p>
                      <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">{t.category}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 italic leading-relaxed mb-6 font-medium">"{t.text}"</p>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-blue-100">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.duration}</span>
                  <button className="text-blue-600 font-black text-sm uppercase tracking-wider hover:underline">Visit Business</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-24 px-4 bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Start Your Premium Business Listing in 3 Simple Steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((s, i) => (
              <div key={i} className="relative group">
                <div className="bg-white/5 backdrop-blur-sm p-10 rounded-[40px] border border-white/10 hover:bg-white/10 transition-all text-center h-full">
                  <div className="text-blue-400 font-black uppercase tracking-widest text-sm mb-4">{s.step}</div>
                  <h3 className="text-2xl font-black mb-4">{s.title}</h3>
                  <p className="text-blue-100/70 font-medium">{s.desc}</p>
                </div>
                {i < 2 && <ArrowRight className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 text-blue-400/30" size={32} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Growth Section */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-24 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
              Connect with New Customers & <span className="text-blue-600">Grow Your Business</span>
            </h2>
            
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="bg-blue-50 p-4 rounded-2xl h-fit text-blue-600"><Smartphone size={32} /></div>
                <div>
                  <h4 className="text-xl font-black mb-2 text-gray-900 uppercase tracking-wide text-sm">PREMIUM BUSINESS LISTING PAGE</h4>
                  <p className="text-gray-500 font-medium leading-relaxed">Having a presence on Boomb helps you build trust with your potential customers</p>
                  <ul className="mt-4 space-y-3">
                    <li className="flex items-center gap-2 text-gray-600 font-bold text-sm"><CheckCircle2 size={16} className="text-green-500" /> Enrich your business details</li>
                    <li className="flex items-center gap-2 text-gray-600 font-bold text-sm"><CheckCircle2 size={16} className="text-green-500" /> Increase customer engagement</li>
                    <li className="flex items-center gap-2 text-gray-600 font-bold text-sm"><CheckCircle2 size={16} className="text-green-500" /> Upload photos and videos</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="bg-blue-50 p-4 rounded-2xl h-fit text-blue-600"><TrendingUp size={32} /></div>
                <div>
                  <h4 className="text-xl font-black mb-2 text-gray-900 uppercase tracking-wide text-sm">Boomb ADS</h4>
                  <p className="text-gray-500 font-medium leading-relaxed">Get prominent display over your competitors and reach out to more customers.</p>
                  <ul className="mt-4 space-y-3">
                    <li className="flex items-center gap-2 text-gray-600 font-bold text-sm"><CheckCircle2 size={16} className="text-blue-600" /> Rank higher in search</li>
                    <li className="flex items-center gap-2 text-gray-600 font-bold text-sm"><CheckCircle2 size={16} className="text-blue-600" /> Get customer details over SMS/Email</li>
                    <li className="flex items-center gap-2 text-gray-600 font-bold text-sm"><CheckCircle2 size={16} className="text-blue-600" /> Access competition analytics</li>
                  </ul>
                </div>
              </div>
            </div>

            <button className="bg-blue-600 hover:bg-blue-700 text-white font-black px-12 py-5 rounded-2xl transition-all shadow-xl shadow-blue-100">
              Advertise Now
            </button>
          </div>

          <div className="relative">
            <div className="absolute -inset-10 bg-blue-50 rounded-full blur-[100px] -z-10"></div>
            <div className="bg-accent rounded-[60px] p-12 border border-blue-50 shadow-inner relative">
              <div className="bg-white p-6 rounded-3xl shadow-xl mb-6 flex items-center justify-between border border-blue-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600"><TrendingUp size={24} /></div>
                  <div>
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">Growth</div>
                    <div className="text-xl font-black text-gray-900">+45%</div>
                  </div>
                </div>
                <div className="text-green-600 font-black text-sm">Monthly</div>
              </div>
              <div className="space-y-4">
                <div className="h-64 bg-white rounded-3xl shadow-premium p-6 overflow-hidden relative border border-blue-50">
                  <div className="flex items-center justify-between mb-8">
                    <h5 className="font-black text-gray-900">Lead Generation</h5>
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-200"></div>
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    </div>
                  </div>
                  <div className="flex items-end gap-3 h-32">
                    <div className="bg-blue-50 w-full h-1/2 rounded-t-lg"></div>
                    <div className="bg-blue-100 w-full h-2/3 rounded-t-lg"></div>
                    <div className="bg-blue-200 w-full h-1/3 rounded-t-lg"></div>
                    <div className="bg-blue-600 w-full h-full rounded-t-lg"></div>
                    <div className="bg-blue-400 w-full h-3/4 rounded-t-lg"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 bg-accent">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Got a question?</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <details key={i} className="group bg-white rounded-3xl border border-blue-50/50 shadow-sm overflow-hidden transition-all duration-300 open:shadow-xl open:shadow-blue-900/5">
                <summary className="flex items-center justify-between p-8 cursor-pointer list-none font-black text-gray-900 text-lg">
                  {f.q}
                  <HelpCircle className="text-blue-600 group-open:rotate-180 transition-transform" size={24} />
                </summary>
                <div className="px-8 pb-8 text-gray-500 font-medium leading-relaxed">
                  {f.a}
                </div>
              </details>
            ))}
          </div>
          <div className="text-center mt-12">
            <button className="text-blue-600 font-black flex items-center gap-2 mx-auto hover:underline">
              View More Questions <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Learn How to Make Your Business Profile Look More Professional</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-accent p-8 rounded-[40px] border border-blue-50/50 hover:bg-white hover:shadow-2xl transition-all cursor-pointer">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-premium mb-6"><MapPin size={32} /></div>
              <h4 className="text-xl font-black text-gray-900 mb-4">How to Fill in the Essential Business Information</h4>
              <button className="text-blue-600 font-black flex items-center gap-2">Learn More <ChevronRight size={18} /></button>
            </div>
            <div className="group bg-accent p-8 rounded-[40px] border border-blue-50/50 hover:bg-white hover:shadow-2xl transition-all cursor-pointer">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-premium mb-6"><ImageIcon size={32} /></div>
              <h4 className="text-xl font-black text-gray-900 mb-4">The Art of Selecting the Right Categories</h4>
              <button className="text-blue-600 font-black flex items-center gap-2">Learn More <ChevronRight size={18} /></button>
            </div>
            <div className="group bg-accent p-8 rounded-[40px] border border-blue-50/50 hover:bg-white hover:shadow-2xl transition-all cursor-pointer">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-premium mb-6"><MessageSquare size={32} /></div>
              <h4 className="text-xl font-black text-gray-900 mb-4">How to Respond to Customer Reviews and Questions</h4>
              <button className="text-blue-600 font-black flex items-center gap-2">Learn More <ChevronRight size={18} /></button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 bg-blue-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-800 to-transparent opacity-50 pointer-events-none"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black mb-6">List Your Business at Affordable Prices on Boomb Today</h2>
          <p className="text-xl text-blue-200 mb-12 font-medium">India's Leading Local Search Engine</p>
          
          <div className="bg-white p-2 rounded-3xl shadow-2xl flex flex-col md:flex-row gap-2 max-w-2xl mx-auto">
            <div className="flex items-center px-6 py-4 bg-gray-50 rounded-2xl flex-1 text-left">
              <span className="text-gray-500 font-bold border-r pr-4 mr-4">+91</span>
              <input 
                type="tel" 
                placeholder="Enter Mobile No." 
                className="bg-transparent border-none outline-none text-gray-900 font-bold w-full text-lg"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>
            <button 
              onClick={handleStartNow}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black px-12 py-5 rounded-2xl transition-all shadow-lg text-lg"
            >
              Get Started Now
            </button>
          </div>
          
          <p className="mt-8 text-sm text-blue-300 opacity-70">
            By continuing, you agree to our Terms of Use, Privacy & Infringement Policy
          </p>

          <div className="mt-8">
            <Link href="/business/login" className="text-white font-bold hover:underline">Already have a business account? Sign in here</Link>
          </div>

          <div className="mt-16 pt-16 border-t border-white/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-left space-y-2">
                <h3 className="text-2xl font-black">Boomb</h3>
                <p className="text-blue-300 text-sm max-w-sm">Are you a business owner seeking to expand your reach and attract more customers? Boomb offers an incredible opportunity to list your business at affordable prices and boost your online visibility.</p>
              </div>
              <div className="flex gap-12">
                <div className="text-center">
                  <div className="text-3xl font-black">24/7</div>
                  <div className="text-[10px] uppercase font-black tracking-[0.2em] text-blue-400">Virtual Store</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black">100%</div>
                  <div className="text-[10px] uppercase font-black tracking-[0.2em] text-blue-400">Targeted Leads</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
