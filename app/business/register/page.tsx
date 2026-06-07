'use client';

import { useState, useEffect } from 'react';
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
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';
import { Globe } from 'lucide-react';
import { categories as mockCategories } from '@/lib/mockData';
import { getCategories } from '@/app/actions/category';
import { Country, State, City } from 'country-state-city';
import { SearchableSelect } from '@/components/SearchableSelect';

function getCountryFlag(isoCode: string) {
  if (!isoCode) return '';
  return isoCode
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65))
    .join('');
}

function MobileRegisterInput({
  mobile,
  onChange,
  onSubmit,
  id,
}: {
  mobile: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  id?: string;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
      <div className="flex min-w-0 flex-1 items-center rounded-lg border border-slate-200 bg-white focus-within:border-[#215481]/40 focus-within:ring-4 focus-within:ring-[#215481]/10">
        <span className="shrink-0 border-r border-slate-200 px-3 py-3 text-sm font-medium text-slate-500">
          +91
        </span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          value={mobile}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
          placeholder="Mobile number"
          className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>
      <button
        type="button"
        onClick={onSubmit}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#215481] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a4367]"
      >
        Get started
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

function PartnerLoginCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-[#215481]/15 bg-white p-6 shadow-[0_12px_40px_-24px_rgba(33,84,129,0.35)] ${className}`}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#215481]/10 text-[#215481]">
          <LayoutDashboard size={20} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Already registered?</p>
          <p className="text-xs text-slate-500">Manage your listing from the partner portal</p>
        </div>
      </div>
      <ul className="mb-5 space-y-2 text-xs text-slate-600">
        <li className="flex items-center gap-2">
          <CheckCircle2 size={14} className="shrink-0 text-[#215481]" />
          Update business details and photos
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle2 size={14} className="shrink-0 text-[#215481]" />
          View leads and customer enquiries
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle2 size={14} className="shrink-0 text-[#215481]" />
          Complete KYC and verification
        </li>
      </ul>
      <Link
        href="/business/login"
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#215481] bg-white px-4 py-3 text-sm font-semibold text-[#215481] transition-colors hover:bg-[#215481]/5"
      >
        Sign in to partner portal
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}

function RegisterFormContent() {
  const searchParams = useSearchParams();
  const [mobile, setMobile] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [liveCategories, setLiveCategories] = useState<any[]>(mockCategories);

  useEffect(() => {
    async function fetchCats() {
      const res = await getCategories(false);
      if (res.success && res.categories) {
        setLiveCategories(res.categories);
      }
    }
    fetchCats();
  }, []);

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
  const [passwordVisible, setPasswordVisible] = useState(false);
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
    cityCode: '',
    state: '',
    stateCode: '',
    country: 'India',
    countryCode: 'IN',
    publicPhone: '',
    businessAddress: ''
  });

  const countryOptions = Country.getAllCountries().map(c => ({
    label: `${getCountryFlag(c.isoCode)} ${c.name}`,
    value: c.isoCode
  }));

  const stateOptions = formData.countryCode 
    ? State.getStatesOfCountry(formData.countryCode).map(s => ({
        label: s.name,
        value: s.isoCode
      }))
    : [];

  const cityOptions = (formData.countryCode && formData.stateCode)
    ? City.getCitiesOfState(formData.countryCode, formData.stateCode).map(c => ({
        label: c.name,
        value: c.name
      }))
    : [];

  const categoryOptions = liveCategories.map(c => ({
    label: c.name,
    value: c.name
  }));

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
      window.location.href = '/business/dashboard';
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
      testimonial: 'I started with a small investment in one city, and today, FinderB has helped me expand across five states with a 35% to 40% increase in business growth.',
      duration: 'Customer since 1 year',
      image: 'https://i.pravatar.cc/150?u=ashim'
    },
    {
      name: 'Rajesh Chhabria',
      business: 'Chhabria and Sons',
      role: 'Tile Dealers',
      testimonial: 'From 1 showroom to 4 in 20 years, FinderB’s growing returns have helped us to dominate the market.',
      duration: 'Customer since 14 years',
      image: 'https://i.pravatar.cc/150?u=rajesh'
    },
    {
      name: 'Varshini',
      business: 'V2 Makeover',
      role: 'Makeup Artists',
      testimonial: 'Genuine leads from FinderB keep my business active and support me as a woman entrepreneur.',
      duration: 'Customer since 4 year',
      image: 'https://i.pravatar.cc/150?u=varshini'
    }
  ];

  const steps = [
    {
      step: 1,
      title: 'Verify & register',
      desc: 'Enter your mobile number and set up your partner account. Takes about two minutes.',
      icon: Smartphone,
    },
    {
      step: 2,
      title: 'Add business details',
      desc: 'Add your business name, category, city, phone number, and address for your public listing.',
      icon: Building2,
    },
    {
      step: 3,
      title: 'Go live on FinderB',
      desc: 'Your listing goes live in search. Complete KYC verification later from your dashboard.',
      icon: CheckCircle2,
    },
  ];

  const faqs = [
    {
      q: 'What are the benefits of listing a business on FinderB?',
      a: 'Listing on FinderB helps you reach millions of potential customers, build trust, and grow your business online with a professional presence and verified leads.'
    },
    {
      q: 'Can I list my business on FinderB?',
      a: 'Yes, any legitimate business can list on FinderB. We offer premium plans that provide high visibility and verified leads to help your business grow.'
    },
    {
      q: 'I already have a website and social media. Do I still need FinderB?',
      a: 'Absolutely! FinderB is a leading local search engine that connects you with users who are specifically searching for your services in your local area, converting intent into sales.'
    },
    {
      q: 'Do I need to download the FinderB App to manage my listing?',
      a: 'While our app provides a great mobile experience, you can easily manage your business listing through our responsive web dashboard on any device.'
    }
  ];

  if (showForm) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] px-4 pb-8 pt-[5.25rem] sm:px-6 sm:pt-28 lg:pt-10">
        <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_64px_-32px_rgba(15,39,59,0.2)] md:flex md:min-h-[520px]">
          {/* Sidebar */}
          <div
            className={`relative shrink-0 overflow-hidden bg-[#153551] text-white md:w-72 ${isSidebarOpen ? 'max-h-none' : 'max-h-14 md:max-h-none'}`}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              aria-hidden
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />

            <div className="relative z-10 px-6 py-5 md:py-8">
              <div className="mb-6 flex items-center justify-between md:mb-10">
                <Link href="/" className="inline-block">
                  <Image
                    src="/businesslogo.png"
                    alt="FinderB Business"
                    width={120}
                    height={40}
                    className="h-7 w-auto brightness-0 invert"
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="rounded-lg p-2 text-white/80 hover:bg-white/10 md:hidden"
                  aria-label="Toggle steps"
                >
                  <ChevronDown
                    size={18}
                    className={`transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>

              <div
                className={`space-y-5 ${isSidebarOpen ? 'block' : 'hidden md:block'}`}
              >
                {stepLabels.map((label, i) => (
                  <div key={label} className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold ${
                        step > i + 1
                          ? 'border-emerald-400 bg-emerald-500 text-white'
                          : step === i + 1
                            ? 'border-white bg-white text-[#153551]'
                            : 'border-white/25 text-white/45'
                      }`}
                    >
                      {step > i + 1 ? <CheckCircle2 size={15} /> : i + 1}
                    </div>
                    <div>
                      <p
                        className={`text-[11px] font-medium ${
                          step === i + 1 ? 'text-white' : 'text-white/45'
                        }`}
                      >
                        Step {i + 1}
                      </p>
                      <p
                        className={`text-sm ${
                          step === i + 1 ? 'font-semibold text-white' : 'text-white/55'
                        }`}
                      >
                        {label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {!isSidebarOpen && (
                <p className="text-sm font-medium text-white/90 md:hidden">
                  Step {step}: {stepLabels[step - 1]}
                </p>
              )}
            </div>

            <div
              className={`relative z-10 hidden border-t border-white/10 px-6 py-5 md:block ${isSidebarOpen ? 'block' : ''}`}
            >
              <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#f9b864]" />
                <p className="text-xs leading-relaxed text-white/75">
                  Free listing on FinderB. Upgrade anytime for premium visibility.
                </p>
              </div>
            </div>
          </div>

          {/* Main form */}
          <div className="relative flex min-w-0 flex-1 flex-col bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-8">
              <Link
                href="/business/login"
                className="text-sm font-semibold text-[#215481] hover:text-[#1a4367]"
              >
                Already registered? Sign in
              </Link>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close registration form"
              >
                <X size={18} />
              </button>
            </div>

            {loading && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm">
                <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#215481] border-t-transparent" />
                <p className="text-sm font-medium text-slate-600">Creating your listing…</p>
              </div>
            )}

            <div className="flex flex-1 flex-col justify-center px-5 py-8 sm:px-8">
              <div className="mx-auto w-full max-w-xl">
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                      Account details
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Set up your partner account to manage your listing.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Full name</label>
                      <div className="group relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#215481]" size={16} />
                        <input
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#215481]/40 focus:ring-4 focus:ring-[#215481]/10"
                          placeholder="Your legal name"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Email</label>
                      <div className="group relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#215481]" size={16} />
                        <input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#215481]/40 focus:ring-4 focus:ring-[#215481]/10"
                          placeholder="you@business.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Password</label>
                      <div className="group relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#215481]" size={16} />
                        <input
                          name="password"
                          type={passwordVisible ? 'text' : 'password'}
                          value={formData.password}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-11 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#215481]/40 focus:ring-4 focus:ring-[#215481]/10"
                          placeholder="At least 6 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setPasswordVisible((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#215481]"
                          aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                        >
                          {passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Verified mobile</label>
                      <div className="relative">
                        <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          value={mobile}
                          readOnly
                          disabled
                          className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm text-slate-600"
                        />
                        <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                      Business details
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Help customers find and contact your business.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Business name</label>
                      <div className="group relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#215481]" size={16} />
                        <input
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#215481]/40 focus:ring-4 focus:ring-[#215481]/10"
                          placeholder="Official business name"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <SearchableSelect
                        label="Category"
                        options={categoryOptions}
                        value={formData.category}
                        onChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                        placeholder="Select category"
                        icon={<Briefcase size={18} />}
                      />
                      <SearchableSelect
                        label="Country"
                        options={countryOptions}
                        value={formData.countryCode}
                        onChange={(val) => {
                          const countryName = countryOptions.find(c => c.value === val)?.label || '';
                          setFormData(prev => ({ 
                            ...prev, 
                            countryCode: val, 
                            country: countryName,
                            stateCode: '',
                            state: '',
                            city: ''
                          }));
                        }}
                        placeholder="Select country"
                        icon={<Globe size={18} />}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <SearchableSelect
                        label="State"
                        options={stateOptions}
                        value={formData.stateCode}
                        onChange={(val) => {
                          const stateName = stateOptions.find(s => s.value === val)?.label || '';
                          setFormData(prev => ({ 
                            ...prev, 
                            stateCode: val, 
                            state: stateName,
                            city: ''
                          }));
                        }}
                        placeholder="Select state"
                        icon={<MapPin size={18} />}
                        disabled={!formData.countryCode}
                      />
                      <SearchableSelect
                        label="City"
                        options={cityOptions}
                        value={formData.city}
                        onChange={(val) => setFormData(prev => ({ ...prev, city: val }))}
                        placeholder="Select city"
                        icon={<Building2 size={18} />}
                        disabled={!formData.stateCode}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Customer phone</label>
                      <div className="group relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#215481]" size={16} />
                        <input
                          name="publicPhone"
                          value={formData.publicPhone}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#215481]/40 focus:ring-4 focus:ring-[#215481]/10"
                          placeholder="Number shown to customers"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Business address</label>
                      <textarea
                        name="businessAddress"
                        value={formData.businessAddress}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#215481]/40 focus:ring-4 focus:ring-[#215481]/10"
                        rows={3}
                        placeholder="Street, area, landmark"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && registeredBusiness && (
                <div className="space-y-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-white">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                      Registration complete
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Your business profile has been created. Save your ID below.
                    </p>
                  </div>

                  <div className="mx-auto max-w-sm rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-medium text-slate-500">Business ID</p>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className="text-xl font-semibold tracking-tight text-[#215481]">
                        {registeredBusiness.registrationNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(registeredBusiness.registrationNumber);
                          alert('Copied to clipboard');
                        }}
                        className="rounded-lg border border-slate-200 bg-white p-2 text-[#215481] transition-colors hover:bg-slate-50"
                        aria-label="Copy business ID"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500">
                    You can complete KYC verification anytime from your dashboard.
                  </p>
                </div>
              )}
              </div>
            </div>

            <div className="flex flex-col-reverse items-stretch gap-3 border-t border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 1 || step === 3}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  step === 1 || step === 3
                    ? 'invisible pointer-events-none'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ChevronLeft size={16} />
                Back
              </button>

              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#215481] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a4367]"
              >
                {step === 3 ? 'Go to dashboard' : step === 2 ? 'Submit listing' : 'Continue'}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Landing page
  return (
    <div className="min-h-screen bg-[#f4f7fb] selection:bg-[#215481]/10">
      {/* Hero */}
      <section className="border-b border-slate-200/80 bg-white pt-[5.25rem] pb-14 sm:pt-28 lg:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-5 lg:gap-12">
            <div className="lg:col-span-3">
              <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-[2.5rem]">
                List your business on FinderB{' '}
                <span className="text-[#215481]">for free</span>
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
                Reach customers searching for local services across India. Create your listing in
                minutes — no payment required to get started.
              </p>

              <div className="mt-8 max-w-lg rounded-2xl border border-slate-200/80 bg-[#f4f7fb] p-5">
                <p className="mb-3 text-sm font-medium text-slate-800">Start with your mobile number</p>
                <MobileRegisterInput
                  id="mobile-input"
                  mobile={mobile}
                  onChange={setMobile}
                  onSubmit={handleStartNow}
                />
                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                  By continuing, you agree to our{' '}
                  <Link href="/terms" className="text-[#215481] hover:underline">
                    Terms
                  </Link>
                  ,{' '}
                  <Link href="/privacy" className="text-[#215481] hover:underline">
                    Privacy
                  </Link>{' '}
                  and{' '}
                  <Link href="/policy" className="text-[#215481] hover:underline">
                    Infringement Policy
                  </Link>
                  .
                </p>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-slate-200/80 pt-8 sm:gap-6">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-lg font-semibold text-slate-900 sm:text-xl">{stat.value}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              <PartnerLoginCard className="lg:sticky lg:top-28" />
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="border-b border-slate-200/80 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-4 sm:mb-12 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#215481]">
                Partner stories
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Businesses growing with FinderB
              </h2>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {successStories.map((story) => (
              <div
                key={story.name}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white"
              >
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-full border border-slate-200">
                      <Image src={story.image} alt={story.name} width={48} height={48} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{story.name}</h4>
                      <p className="text-xs text-[#215481]">{story.role}</p>
                    </div>
                  </div>
                  <p className="mb-3 text-sm font-medium text-slate-700">{story.business}</p>
                  <p className="text-sm leading-relaxed text-slate-600">&ldquo;{story.testimonial}&rdquo;</p>
                </div>
                <div className="border-t border-slate-100 bg-slate-50 px-6 py-3">
                  <span className="text-xs text-slate-500">{story.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="border-y border-slate-200/80 bg-[#f4f7fb] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#215481]">
              How it works
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Three steps to go live
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              Register, add your details, and start appearing in local search results.
            </p>
          </div>

          <div className="relative">
            <div
              className="pointer-events-none absolute left-0 right-0 top-[2.75rem] hidden h-px bg-slate-200 md:block"
              aria-hidden
            />

            <ol className="grid gap-5 md:grid-cols-3 md:gap-6">
              {steps.map((item) => {
                const Icon = item.icon;
                return (
                  <li
                    key={item.step}
                    className="relative flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_-20px_rgba(15,39,59,0.18)]"
                  >
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#215481] text-sm font-semibold text-white">
                        {item.step}
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f9b864]/20 text-[#215481]">
                        <Icon size={20} strokeWidth={2} />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="mt-10 flex justify-center sm:mt-12">
            <button
              type="button"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                document.getElementById('mobile-input')?.focus();
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#215481] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a4367]"
            >
              Start step 1
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Benefits + FAQ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#215481]">
                Why list on FinderB
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Be found when customers are ready to buy
              </h2>

              <div className="mt-8 space-y-6">
                {[
                  {
                    title: 'Professional listing page',
                    desc: 'Show your services, photos, hours, and contact details in one trusted profile.',
                  },
                  {
                    title: 'Engage with enquiries',
                    desc: 'Respond to reviews and questions to build credibility in your local market.',
                  },
                  {
                    title: 'Reach active searchers',
                    desc: 'Appear when people search for businesses like yours in your city and category.',
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#215481]/10 text-[#215481]">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 max-w-md">
                <p className="mb-3 text-sm font-medium text-slate-800">Ready to list?</p>
                <MobileRegisterInput mobile={mobile} onChange={setMobile} onSubmit={handleStartNow} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Common questions</h3>
                <HelpCircle className="text-[#215481]" size={20} />
              </div>
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <div key={faq.q} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                    <h4 className="text-sm font-semibold text-slate-900">{faq.q}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{faq.a}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <PartnerLoginCard />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-200/80 bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Start your free listing today
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-slate-600 sm:text-base">
            Join thousands of local businesses on FinderB. Registration takes only a few minutes.
          </p>
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              document.getElementById('mobile-input')?.focus();
            }}
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#215481] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a4367]"
          >
            List your business
            <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}

export default function BusinessRegisterPage() {
  return <RegisterFormContent />;
}