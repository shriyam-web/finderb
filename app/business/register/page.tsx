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
  Briefcase,
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
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [billingCycle, setBillingCycle] = useState('monthly');
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
    { 
      label: 'Buyers*', 
      value: '18.4 Crore+', 
      icon: <Users className="text-blue-600" size={24} />,
      desc: 'High intent active shoppers'
    },
    { 
      label: 'Happy Customers', 
      value: '6.2 Lakh+', 
      icon: <Star className="text-yellow-500" size={24} />,
      desc: 'Rated 4.5+ average rating'
    },
    { 
      label: 'Businesses Listed', 
      value: '5.2 Crore+', 
      icon: <Store className="text-green-600" size={24} />,
      desc: 'Growing network of partners'
    },
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
      desc: 'Add relevant categories to your business listing page'
    }
  ];

  const faqs = [
    {
      q: 'What are the benefits of listing a business on Boomb?',
      a: 'Listing on Boomb helps you reach millions of potential customers, build trust, and grow your business online with a professional presence.'
    },
    {
      q: 'Is Boomb business listing affordable?',
      a: 'Yes, Boomb offers highly affordable plans starting at just ₹299/month for our Growth Pro plan. We also offer an annual plan for ₹2,990, giving you 2 months of premium features for free!'
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
      <div className="min-h-screen bg-white pt-24 pb-12 lg:pt-32 lg:pb-24 px-4 relative">
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
                  <div className="text-center mb-8">
                    <h2 className="text-4xl font-black text-gray-900 mb-2">Choose Your <span className="text-blue-600">Growth Plan</span></h2>
                    <p className="text-gray-500 font-medium italic">Dominate search results and convert leads effortlessly</p>
                  </div>
                  
                  {/* Premium Billing Cycle Toggle */}
                  <div className="flex justify-center mb-12">
                    <div className="bg-gray-100 p-1.5 rounded-3xl flex items-center gap-1 relative border border-gray-200/50 shadow-inner w-fit">
                      <div 
                        className={`absolute h-[calc(100%-12px)] top-1.5 rounded-2xl bg-white shadow-premium transition-all duration-500 ease-out z-0 ${billingCycle === 'monthly' ? 'left-1.5 w-[110px]' : 'left-[122px] w-[130px]'}`}
                      ></div>
                      
                      <button 
                        onClick={() => setBillingCycle('monthly')}
                        className={`relative z-10 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 w-[110px] ${billingCycle === 'monthly' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        Monthly
                      </button>
                      <button 
                        onClick={() => setBillingCycle('annual')}
                        className={`relative z-10 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 w-[130px] ${billingCycle === 'annual' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        Annual
                        <span className="absolute -top-3 -right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[9px] font-black px-3 py-1.5 rounded-full animate-bounce shadow-lg shadow-green-200 border border-white/20 whitespace-nowrap">2 MONTHS FREE</span>
                      </button>
                    </div>
                  </div>

                  <div className="max-w-lg mx-auto">
                    {/* Centered Single Growth Pro Plan Card */}
                    <div 
                      className="group p-10 rounded-[40px] border-2 border-blue-600 bg-blue-50/20 shadow-2xl shadow-blue-100 scale-[1.05] relative overflow-hidden flex flex-col justify-between transition-all duration-700 hover:shadow-blue-200"
                    >
                      <div className="absolute top-0 right-0 bg-blue-600 text-white text-[11px] font-black px-8 py-3 rounded-bl-3xl uppercase tracking-[0.2em] shadow-lg">Most Popular</div>
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-200 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                            <TrendingUp size={32} />
                          </div>
                          <div className="bg-blue-600 text-white p-1.5 rounded-full shadow-lg shadow-blue-200"><CheckCircle2 size={24} /></div>
                        </div>
                        
                        <h4 className="font-black text-3xl mb-3 text-blue-900 leading-none">Growth Pro</h4>
                        <p className="text-gray-600 font-medium leading-relaxed mb-8">Unlock India's #1 local search engine's full potential for your business.</p>
                        
                        <ul className="grid grid-cols-1 gap-4 mb-10">
                          {[
                            { icon: <Star className="text-yellow-500" size={16} />, label: 'Priority Search Placement' },
                            { icon: <CheckCircle2 className="text-green-500" size={16} />, label: 'Verified Listing Badge' },
                            { icon: <Users className="text-blue-500" size={16} />, label: 'Advanced Lead Tracking' },
                            { icon: <MessageSquare className="text-purple-500" size={16} />, label: 'Customer Inquiry Alerts' }
                          ].map((f, i) => (
                            <li key={i} className="flex items-center gap-4 text-sm font-bold text-gray-800 bg-white/50 p-3 rounded-2xl border border-blue-100/50 group-hover:bg-white transition-all duration-300">
                              {f.icon}
                              {f.label}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="relative z-10 bg-white p-6 rounded-[32px] border border-blue-50 shadow-inner">
                        <div className="flex items-baseline gap-3 mb-2">
                          <div className="text-4xl font-black text-blue-600 flex items-baseline gap-1.5">
                            {billingCycle === 'monthly' ? (
                              <>
                                <span className="text-lg text-gray-300 line-through font-bold">₹2,999</span>
                                ₹299
                              </>
                            ) : (
                              <>
                                <span className="text-lg text-gray-300 line-through font-bold">₹3,588</span>
                                ₹2,990
                              </>
                            )}
                          </div>
                          <div className="text-[12px] text-gray-400 font-black uppercase tracking-widest">
                            {billingCycle === 'monthly' ? '/ Month' : '/ Year'}
                          </div>
                        </div>
                        {billingCycle === 'annual' ? (
                          <div className="text-[11px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-4 py-1.5 rounded-full w-fit border border-green-100 flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            You Save ₹598 Every Year
                          </div>
                        ) : (
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Limited Time Launch Offer</p>
                        )}
                      </div>
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
                    <div className="flex justify-between"><span className="text-gray-500 font-bold text-sm">Plan Selected:</span> <span className={`font-black uppercase text-xs px-2 py-1 rounded-lg ${selectedPlan === 'pro' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>{selectedPlan === 'pro' ? `Growth Pro (${billingCycle})` : 'Free Listing'}</span></div>
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
      <section className="bg-blue-600 pt-32 pb-16 lg:pt-40 lg:pb-24 px-4 overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none opacity-40">
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[20%] left-[-5%] w-[30%] h-[30%] bg-blue-400/50 rounded-full blur-[80px]"></div>
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/20 shadow-sm">
              <Briefcase size={12} /> For Businesses
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black leading-[0.9] text-white tracking-tight">
              Grow Your <br />
              <span className="text-blue-200">Business Online</span>
            </h1>
            
            <p className="text-xl text-blue-100 font-medium max-w-lg leading-relaxed">
              List your business on India's #1 local search engine and reach millions of customers for just <span className="text-white font-black">₹299/mo</span>
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
              <div className="bg-white p-2 rounded-[28px] shadow-2xl shadow-blue-900/20 flex flex-col sm:flex-row gap-2 w-full max-w-md border border-white/10">
                <div className="flex items-center px-5 py-4 bg-gray-50/50 rounded-2xl flex-1 group focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                  <span className="text-gray-400 font-black border-r border-gray-200 pr-4 mr-4 text-sm">+91</span>
                  <input 
                    type="tel" 
                    placeholder="Enter Mobile No." 
                    className="bg-transparent border-none outline-none text-gray-900 font-bold w-full text-base placeholder:text-gray-300"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                </div>
                <button 
                  onClick={handleStartNow}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black px-10 py-4 rounded-2xl transition-all active:scale-95 shadow-xl shadow-blue-200"
                >
                  Start Now
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-6">
              {[
                'Instant Listing',
                'Verified Badge',
                'Priority Ranking'
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 group">
                  <div className="w-5 h-5 bg-white/10 text-white rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
                    <CheckCircle2 size={12} />
                  </div>
                  <span className="text-[11px] font-black text-blue-100 uppercase tracking-widest">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative group">
            {/* Visual Representation of a Business Card/Preview */}
            <div className="absolute -inset-4 bg-white/20 rounded-[60px] blur-3xl transition-all group-hover:bg-white/30"></div>
            <div className="relative bg-white rounded-[48px] p-10 shadow-[0_40px_80px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-6 mb-10">
                <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-200">
                  <Store size={36} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black text-2xl text-gray-900 tracking-tight">Your Shop Name</h3>
                    <CheckCircle2 size={18} className="text-blue-600" />
                  </div>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Premium Verified Listing</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="h-4 bg-gray-50 rounded-full w-[90%] animate-pulse"></div>
                <div className="h-4 bg-gray-50 rounded-full w-full animate-pulse delay-75"></div>
                <div className="h-4 bg-gray-50 rounded-full w-[60%] animate-pulse delay-150"></div>
              </div>

              <div className="mt-12 pt-10 border-t border-gray-50 grid grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-2xl font-black text-gray-900">4.9</div>
                  <div className="flex justify-center text-yellow-400 gap-0.5 mt-1"><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /></div>
                </div>
                <div className="text-center border-x border-gray-50">
                  <div className="text-2xl font-black text-gray-900">12K+</div>
                  <div className="text-[9px] text-gray-400 uppercase tracking-widest font-black mt-1">Visitors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-blue-600">800+</div>
                  <div className="text-[9px] text-blue-600 uppercase tracking-widest font-black mt-1">Leads</div>
                </div>
              </div>
              
              {/* Floating Action Button Preview */}
              <div className="absolute top-10 right-10 bg-green-500 text-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl shadow-green-200 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                Live Now
              </div>
            </div>
            
            {/* Floating Stats Decoration */}
            <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-3xl shadow-2xl border border-gray-50 hidden lg:block animate-bounce-slow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center"><TrendingUp size={24} /></div>
                <div>
                  <div className="text-sm font-black text-gray-900">+125%</div>
                  <div className="text-[10px] text-gray-400 font-bold">Monthly Growth</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 px-4 bg-gradient-to-b from-accent/30 to-white relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-blue-100/40 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[10%] right-[-5%] w-[25%] h-[25%] bg-blue-50/60 rounded-full blur-[80px]"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 space-y-6">
            <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.25em] shadow-xl shadow-blue-200 border border-white/20">
              <Star size={12} fill="currentColor" /> Premium Access
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-[0.9]">
              Growth <span className="text-blue-600">Pro</span>
            </h2>
            <p className="text-gray-500 font-medium max-w-xl mx-auto text-lg leading-relaxed">
              India's most affordable premium listing. Join 6.2 Lakh+ businesses growing with Boomb.
            </p>
            
            {/* Ultra-Interactive Sliding Toggle */}
            <div className="flex justify-center pt-6">
              <div className="bg-white p-2 rounded-[32px] flex items-center gap-1 relative shadow-[0_20px_50px_rgba(37,99,235,0.1)] border border-gray-100 w-fit group">
                {/* Sliding Background Pill */}
                <div 
                  className={`absolute h-[calc(100%-16px)] top-2 rounded-[24px] bg-blue-600 shadow-xl shadow-blue-200 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-0 ${billingCycle === 'monthly' ? 'left-2 w-[140px]' : 'left-[150px] w-[160px]'}`}
                ></div>
                
                <button 
                  onClick={() => setBillingCycle('monthly')}
                  className={`relative z-10 px-8 py-4 rounded-[24px] font-black text-xs uppercase tracking-[0.15em] transition-all duration-300 w-[140px] ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}
                >
                  Monthly
                </button>
                <button 
                  onClick={() => setBillingCycle('annual')}
                  className={`relative z-10 px-8 py-4 rounded-[24px] font-black text-xs uppercase tracking-[0.15em] transition-all duration-300 w-[160px] ${billingCycle === 'annual' ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}
                >
                  Annual
                  <span className="absolute -top-4 -right-2 bg-gradient-to-br from-green-400 to-emerald-600 text-white text-[9px] font-black px-4 py-2 rounded-full shadow-lg shadow-green-200 border-2 border-white group-hover:scale-110 transition-transform">20% OFF</span>
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-xl mx-auto">
            {/* Centered Premium Pro Card */}
            <div className="group bg-blue-600 p-12 rounded-[60px] border-4 border-white shadow-[0_40px_100px_rgba(37,99,235,0.25)] flex flex-col justify-between relative overflow-hidden transition-all duration-1000 hover:-translate-y-4 hover:shadow-blue-300/50">
              {/* Complex Glassmorphism Backgrounds */}
              <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:bg-white/20 transition-all duration-1000"></div>
              <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="absolute top-0 right-0 bg-white text-blue-600 text-[12px] font-black px-10 py-4 rounded-bl-[40px] uppercase tracking-[0.3em] shadow-2xl">Premium Choice</div>
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-[28px] flex items-center justify-center text-white mb-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-2xl border border-white/30">
                  <TrendingUp size={40} />
                </div>
                <h3 className="text-4xl font-black text-white mb-6 tracking-tight">Growth Pro</h3>
                
                <div className="space-y-6 mb-12">
                  {[
                    'Priority Ranking in Search',
                    'Official Verified Badge',
                    'Direct Lead Analytics Dashboard',
                    'Enhanced Business Portfolio',
                    'Click-to-Call Customer Leads'
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-5 text-white font-bold group/feat">
                      <div className="bg-white/20 rounded-2xl p-2 group-hover/feat:bg-white group-hover/feat:text-blue-600 transition-all duration-300 shadow-lg">
                        <CheckCircle2 size={18} />
                      </div>
                      <span className="text-lg opacity-90 group-hover/feat:opacity-100 transition-opacity">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative z-10">
                <div className="bg-white/10 backdrop-blur-md p-8 rounded-[40px] border border-white/20 mb-10 group-hover:bg-white/20 transition-all duration-500">
                  <div className="flex items-baseline gap-4">
                    <div className="text-6xl font-black text-white tracking-tighter">
                      {billingCycle === 'monthly' ? '₹299' : '₹2,990'}
                    </div>
                    <div className="flex flex-col">
                      <div className="text-sm text-blue-200 font-black uppercase tracking-widest leading-none">
                        {billingCycle === 'monthly' ? '/ Month' : '/ Year'}
                      </div>
                      <div className="text-xl text-white/30 line-through font-black mt-1">
                        {billingCycle === 'monthly' ? '₹2,999' : '₹3,588'}
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setSelectedPlan('pro');
                    setShowForm(true);
                  }}
                  className="w-full py-6 rounded-[30px] bg-white text-blue-600 font-black hover:bg-blue-50 transition-all uppercase tracking-[0.25em] text-sm shadow-[0_20px_40px_rgba(255,255,255,0.2)] active:scale-95 group-hover:shadow-[0_25px_50px_rgba(255,255,255,0.3)]"
                >
                  Activate Now
                </button>
              </div>
            </div>
          </div>
          
          {/* Enhanced Trust Bar */}
          <div className="mt-24 pt-12 border-t border-gray-100 flex flex-wrap justify-center items-center gap-16 opacity-40 hover:opacity-100 transition-all duration-700">
            <div className="flex items-center gap-3 font-black text-gray-900 tracking-tight text-lg">
              <Image src="/secure.svg" alt="Secure" width={24} height={24} className="opacity-0 hidden" />
              <CheckCircle2 className="text-blue-600" size={20} /> SECURE PAYMENTS
            </div>
            <div className="flex items-center gap-3 font-black text-gray-900 tracking-tight text-lg">
              <CheckCircle2 className="text-blue-600" size={20} /> INSTANT ACTIVATION
            </div>
            <div className="flex items-center gap-3 font-black text-gray-900 tracking-tight text-lg">
              <CheckCircle2 className="text-blue-600" size={20} /> 24/7 SUPPORT
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((s, i) => (
              <div key={i} className="group flex items-center gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                <div className="w-14 h-14 shrink-0 bg-gray-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm transition-all duration-500 group-hover:scale-105 group-hover:bg-blue-50">
                  {s.icon}
                </div>
                <div className="text-left">
                  <div className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-1">{s.value}</div>
                  <div className="text-gray-900 font-black uppercase tracking-widest text-[10px]">{s.label}</div>
                  <div className="text-gray-400 font-bold text-xs tracking-wide">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16 px-4 bg-gray-50/50 overflow-hidden relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20">
                Success Stories
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
                See how 6.2 Lakh+ <span className="text-blue-600">Advertisers grew</span> with Boomb
              </h2>
            </div>
            <Link href="/stories" className="bg-white hover:bg-gray-900 hover:text-white px-6 py-3 rounded-xl shadow-sm font-black text-sm flex items-center gap-2 group transition-all duration-500">
              Explore All <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="flex overflow-x-auto pb-8 gap-6 scrollbar-hide -mx-4 px-4 mask-fade-edges">
            {testimonials.map((t, i) => (
              <div key={i} className="min-w-[320px] md:min-w-[450px] bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all duration-700 relative overflow-hidden">
                {/* Accent Background Element */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-[80px] -z-0 transition-all group-hover:w-32 group-hover:h-32"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-5 mb-6">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 overflow-hidden shadow-inner group-hover:scale-105 transition-transform duration-500">
                      <Image src="/icon.png" alt="Avatar" width={64} height={64} className="opacity-10 scale-150 grayscale group-hover:scale-125 transition-transform" />
                      <div className="absolute inset-0 flex items-center justify-center font-black text-2xl">
                        {t.name.charAt(0)}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-black text-xl text-gray-900 mb-1 leading-none">{t.name}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">{t.business}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex text-yellow-400 gap-0.5"><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /></div>
                        <span className="text-[9px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-green-100 flex items-center gap-1">
                          <CheckCircle2 size={8} /> Verified Partner
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-500 italic leading-relaxed mb-6 font-medium text-base text-balance">"{t.text}"</p>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-gray-50 relative z-10">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">PARTNERSHIP</span>
                    <span className="text-xs font-black text-gray-900">{t.duration}</span>
                  </div>
                  <button className="bg-gray-50 group-hover:bg-blue-600 group-hover:text-white text-gray-900 font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl transition-all duration-500 shadow-sm">View Growth Story</button>
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
            <div className="bg-white rounded-[60px] p-12 border border-blue-50 shadow-inner relative">
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
