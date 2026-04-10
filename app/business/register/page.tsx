'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { registerBusiness, updateBusinessKYC, updateBusinessPayment } from '@/app/actions/business';
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
  X,
  ShieldCheck,
  CreditCard,
  FileText,
  Upload,
  Copy,
  Trophy,
  Building2,
  Mail,
  User,
  Phone,
  LayoutDashboard,
  ChevronDown
} from 'lucide-react';
import { Globe } from 'lucide-react';
import { categories } from '@/lib/mockData';

function RegisterFormContent() {
  const searchParams = useSearchParams();
  const [mobile, setMobile] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const m = searchParams.get('mobile');
    if (m) {
      setMobile(m);
      setShowForm(true);
    }
  }, [searchParams]);

  const [step, setStep] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [registeredBusiness, setRegisteredBusiness] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    workEmail: '',
    password: '',
    businessName: '',
    category: '',
    location: '',
    city: '',
    state: '',
    publicPhone: '',
    businessAddress: ''
  });

  const [kycData, setKycData] = useState({
    panNumber: '',
    aadharNumber: '',
    panUrl: '',
    aadharUrl: '',
    msmeGstUrl: ''
  });

  const totalSteps = 3;
  const stepLabels = ['Basic Details', 'Business Info', 'Success'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = async () => {
    if (step === 1) {
      if (!formData.fullName || !formData.email || !formData.password) {
        alert('Please fill all required details');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        alert('Please enter a valid email address');
        return;
      }

      if (formData.password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
      }

      setStep(2);
    } else if (step === 2) {
      handleRegistration();
    } else if (step === 3) {
      window.location.href = `/business/dashboard?id=${registeredBusiness?.id}`;
    }
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleRegistration = async () => {
    // Validate all required fields
    if (!formData.fullName) {
      alert('Please enter your full name');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    if (!mobile || mobile.length < 10) {
      alert('Valid mobile number is required');
      return;
    }

    if (!formData.businessName) {
      alert('Please enter your business name');
      return;
    }
    if (!formData.category) {
      alert('Please select a business category');
      return;
    }
    if (!formData.city) {
      alert('Please enter your city');
      return;
    }
    if (!formData.state) {
      alert('Please enter your state');
      return;
    }
    if (!formData.publicPhone || formData.publicPhone.length < 10) {
      alert('Please enter a valid 10-digit business phone number');
      return;
    }
    if (!formData.businessAddress) {
      alert('Please enter your business address');
      return;
    }

    setLoading(true);
    try {
      const registrationData = {
        ...formData,
        mobile,
        selectedPlan,
        billingCycle
      };

      console.log('Sending registration data:', {
        fullName: registrationData.fullName,
        email: registrationData.email,
        mobile: registrationData.mobile,
        businessName: registrationData.businessName,
        category: registrationData.category,
        city: registrationData.city,
        state: registrationData.state,
        publicPhone: registrationData.publicPhone,
        businessAddress: registrationData.businessAddress,
        selectedPlan: registrationData.selectedPlan,
        billingCycle: registrationData.billingCycle,
      });

      const result = await registerBusiness(registrationData);

      if (result.success) {
        setRegisteredBusiness(result.business);
        setStep(3);
      } else {
        console.error('Registration failed:', result.error);
        alert(result.error || 'Registration failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      alert('An unexpected error occurred: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleStartNow = () => {
    if (mobile.length >= 10) {
      setShowForm(true);
    } else {
      alert('Please enter a valid mobile number');
    }
  };

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

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 pt-16 animate-in fade-in duration-500">
        <div className="w-full max-w-full sm:max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-gray-100 md:min-h-[500px]">

          {/* Professional Sidebar - Refined */}
          <div className={`w-full md:w-72 bg-blue-700 text-white flex flex-col justify-between relative overflow-hidden shrink-0 transition-all duration-500 ${isSidebarOpen ? 'max-h-[1000px] py-10' : 'max-h-16 md:max-h-none py-4 md:py-10'}`}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl -ml-16 -mb-16"></div>

            <div className="relative z-10 px-8">
              <div className="flex items-center justify-between mb-12">
                <Link href="/" className="inline-flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-blue-700 font-black italic text-sm shadow-lg shadow-blue-900/20">B</div>
                  <span className="text-base font-black tracking-tighter italic uppercase">BOOMB</span>
                </Link>
                {/* Mobile Toggle */}
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="md:hidden p-2 bg-white/10 rounded-xl"
                >
                  <ChevronDown size={20} className={`transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              <div className={`space-y-6 transition-all duration-500 ${isSidebarOpen ? 'opacity-100 block' : 'opacity-0 hidden md:opacity-100 md:block'}`}>
                {stepLabels.map((label, i) => (
                  <div key={i} className="flex items-center gap-4 group cursor-default">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all duration-500 ${step > i + 1 ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/30' : step === i + 1 ? 'bg-white border-white text-blue-700 font-black shadow-lg shadow-blue-900/20' : 'border-blue-400/30 text-blue-300/50'}`}>
                      {step > i + 1 ? <CheckCircle2 size={16} /> : <span className="text-xs">{i + 1}</span>}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className={`text-[9px] font-black uppercase tracking-[0.2em] leading-none mb-1 transition-all duration-500 ${step === i + 1 ? 'text-blue-100' : 'text-blue-400'}`}>Step 0{i + 1}</span>
                      <span className={`text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${step === i + 1 ? 'text-white' : 'text-blue-300/50'}`}>{label}</span>
                    </div>
                  </div>
                ))}
              </div>

              {!isSidebarOpen && (
                <div className="md:hidden flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-blue-700 font-bold text-[10px]">
                    {step}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">{stepLabels[step - 1]}</span>
                </div>
              )}
            </div>

            <div className={`relative z-10 px-6 pt-8 transition-all duration-500 ${isSidebarOpen ? 'opacity-100 block' : 'opacity-0 hidden md:opacity-100 md:block'}`}>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck size={14} className="text-blue-200" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Verified Listing</span>
                </div>
                <p className="text-[9px] text-blue-100/70 leading-relaxed">Join India's most trusted discovery engine for businesses.</p>
              </div>
            </div>
          </div>

          {/* Right Main Content */}
          <div className="flex-grow p-6 md:p-10 flex flex-col relative bg-white">
            <div className="absolute top-6 right-6 flex items-center gap-4 z-20">
              <Link
                href="/business/login"
                className="hidden sm:block text-[9px] font-bold text-gray-400 uppercase tracking-wider hover:text-blue-600 transition-colors"
              >
                Already have an account? Login
              </Link>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="font-bold text-blue-600 uppercase tracking-widest text-[9px]">Processing...</p>
              </div>
            )}

            <div className="flex-grow flex flex-col justify-center max-w-xl mx-auto w-full">
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Create your <span className="text-blue-600">Workspace</span></h2>
                    <p className="text-gray-500 font-medium text-xs">Enter your professional details to get started</p>
                  </div>
                  <div className="space-y-4">
                    <div className="group space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider ml-0.5 group-focus-within:text-blue-600 transition-colors">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" size={16} />
                        <input
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none font-medium text-gray-900 transition-all placeholder:text-gray-300 text-sm"
                          placeholder="Your legal name"
                        />
                      </div>
                    </div>
                    <div className="group space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider ml-0.5 group-focus-within:text-blue-600 transition-colors">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" size={16} />
                        <input
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none font-medium text-gray-900 transition-all placeholder:text-gray-300 text-sm"
                          placeholder="Professional email address"
                        />
                      </div>
                    </div>
                    <div className="group space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider ml-0.5 group-focus-within:text-blue-600 transition-colors">Password</label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" size={16} />
                        <input
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none font-medium text-gray-900 transition-all placeholder:text-gray-300 text-sm"
                          placeholder="Create a strong password"
                        />
                      </div>
                    </div>
                    <div className="group space-y-1 opacity-80">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider ml-0.5">Verified Mobile</label>
                      <div className="relative">
                        <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                        <input
                          value={mobile}
                          readOnly
                          disabled
                          className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-100 rounded-xl font-medium text-gray-500 cursor-not-allowed text-sm"
                        />
                        <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-500" size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Business <span className="text-blue-600">Identity</span></h2>
                    <p className="text-gray-500 font-medium text-xs">Tell us more about your business</p>
                  </div>
                  <div className="space-y-4">
                    <div className="group space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider ml-0.5 group-focus-within:text-blue-600 transition-colors">Business Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" size={16} />
                        <input
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none font-medium text-gray-900 transition-all placeholder:text-gray-300 text-sm"
                          placeholder="Official entity name"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="group space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] ml-1 group-focus-within:text-blue-600 transition-colors">Category</label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-600 outline-none font-semibold text-gray-900 transition-all appearance-none text-sm"
                        >
                          <option value="">Select category</option>
                          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="group space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] ml-1 group-focus-within:text-blue-600 transition-colors">City</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                          <input
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            className="w-full pl-11 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-600 outline-none font-semibold text-gray-900 transition-all placeholder:text-gray-300 text-sm"
                            placeholder="e.g. Mumbai"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="group space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] ml-1 group-focus-within:text-blue-600 transition-colors">State</label>
                        <div className="relative">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                          <input
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            className="w-full pl-11 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-600 outline-none font-semibold text-gray-900 transition-all placeholder:text-gray-300 text-sm"
                            placeholder="e.g. Maharashtra"
                          />
                        </div>
                      </div>
                      <div className="group space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] ml-1 group-focus-within:text-blue-600 transition-colors">Customer Support No.</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                          <input
                            name="publicPhone"
                            value={formData.publicPhone}
                            onChange={handleChange}
                            className="w-full pl-11 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-600 outline-none font-semibold text-gray-900 transition-all placeholder:text-gray-300 text-sm"
                            placeholder="Contact for leads"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="group space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] ml-1 group-focus-within:text-blue-600 transition-colors">Business Address</label>
                      <textarea
                        name="businessAddress"
                        value={formData.businessAddress}
                        onChange={handleChange}
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-600 outline-none font-semibold text-gray-900 transition-all placeholder:text-gray-300 text-sm"
                        rows={2}
                        placeholder="Complete physical address"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && registeredBusiness && (
                <div className="animate-in zoom-in-95 duration-500 text-center space-y-10">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 bg-green-500 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-green-100 rotate-6">
                      <CheckCircle2 size={40} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">Registration <br /><span className="text-blue-600 font-black italic">Successful</span></h2>
                    <p className="text-gray-400 font-medium text-sm">Your unique business identifier has been created.</p>
                  </div>

                  <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 max-w-sm mx-auto group relative">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.25em] mb-3">Business ID</p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl font-extrabold text-blue-600 tracking-tight">{registeredBusiness.registrationNumber}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(registeredBusiness.registrationNumber);
                          alert('Copied!');
                        }}
                        className="p-2 bg-white border border-gray-100 shadow-sm rounded-xl text-blue-600 hover:scale-110 active:scale-95 transition-all"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-center text-gray-400 bg-gray-50/50 py-3 px-6 rounded-2xl border border-gray-100 text-xs font-semibold italic">
                    <ShieldCheck size={16} className="text-green-500" />
                    <span>Proceed for KYC later from your dashboard.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Controls */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-gray-50">
              <button
                onClick={prevStep}
                disabled={step === 1 || step === 3}
                className={`flex items-center justify-center gap-1.5 px-6 py-4 font-bold text-[10px] uppercase tracking-widest transition-all w-full sm:w-auto ${step === 1 || step === 3 ? 'opacity-0 pointer-events-none' : 'text-gray-400 hover:text-gray-900'}`}
              >
                <ChevronLeft size={16} />
                Back
              </button>

              <button
                onClick={nextStep}
                className="flex items-center justify-center gap-3 px-10 py-5 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95 group"
              >
                {step === 3 ? 'Finish Registration' : 'Next Step'}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Content from /business/list page
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
                <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.3]">
                  Free Business Listing <br />
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">with India’s No. 1 Local Search Engine</span>
                </h1>
                <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-xl">
                  Get Discovered & Create Your Online Business for Free. Upgrade later to unlock premium leads and grow faster.
                </p>
              </div>

              <div className="bg-white p-2 rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100 w-full max-w-full sm:max-w-md">
                <div className="flex flex-col sm:flex-row sm:items-center w-full">
                  <div className="flex items-center gap-2 pl-4 pr-2 py-3 border-b border-slate-100 sm:border-b-0 sm:border-r sm:py-3">
                    <span className="text-slate-400 font-bold text-sm">+91 <input
                      id="mobile-input"
                      type="tel"
                      value={mobile}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setMobile(val);
                      }}
                      placeholder="Enter Mobile No."
                      className="flex-grow px-4 py-3 bg-transparent outline-none font-bold text-slate-900 placeholder:text-slate-300 text-sm"
                    /></span>
                  </div>

                  <button
                    onClick={handleStartNow}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200 whitespace-nowrap"
                  >
                    Start Now
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                  Already Registered?
                </p>
                <Link href="/business/login" className="text-[10px] text-blue-600 font-black uppercase tracking-widest hover:underline">
                  Login Here
                </Link>
              </div>

              <p className="text-[10px] text-slate-400 font-medium">
                By continuing, you agree to our <Link href="/terms" className="underline">Terms of Use</Link>, <Link href="/privacy" className="underline">Privacy</Link> & <Link href="/policy" className="underline">Infringement Policy</Link>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-200/60">
                {stats.map((stat, i) => (
                  <div key={i} className="space-y-1">
                    <h4 className="text-xl sm:text-2xl font-black text-slate-900">{stat.value}</h4>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden md:block relative">
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
                  <button onClick={() => setShowForm(true)} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Visit Business</button>
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
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setMobile(val);
                      }}
                      placeholder="Enter Mobile No."
                      className="flex-grow px-4 py-3 bg-transparent outline-none font-bold text-slate-900 placeholder:text-slate-300 text-sm"
                    />
                    <button
                      onClick={handleStartNow}
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200"
                    >
                      Start Now
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2">
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                    Already Registered?
                  </p>
                  <Link href="/business/login" className="text-[10px] text-blue-600 font-black uppercase tracking-widest hover:underline">
                    Login Here
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-blue-600/5 rounded-[3rem] -rotate-3"></div>
              <div className="relative bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-slate-900 uppercase tracking-widest text-sm">Common Questions</h4>
                    <HelpCircle className="text-blue-600" size={20} />
                  </div>
                  <div className="space-y-4">
                    {faqs.map((faq, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                        <h5 className="font-bold text-slate-900 text-xs">{faq.q}</h5>
                        <p className="text-slate-500 text-[10px] font-medium leading-relaxed">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer-like CTA */}
      <section className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-8">
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">Ready to <span className="text-blue-600">Grow?</span></h2>
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              document.getElementById('mobile-input')?.focus();
            }}
            className="inline-flex items-center gap-3 px-12 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 group"
          >
            List Your Business Now
            <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
          </button>
        </div>
      </section>
    </div>
  );
}

export default function BusinessRegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <RegisterFormContent />
    </Suspense>
  );
}