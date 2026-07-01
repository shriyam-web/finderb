'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Briefcase,
  Building2,
  Smartphone,
} from 'lucide-react';
import { Globe } from 'lucide-react';
import { categories as mockCategories } from '@/lib/mockData';
import { getCategories, getSubCategories } from '@/app/actions/category';
import { Country, State, City } from 'country-state-city';
import BusinessRegisterLanding from '@/components/business/BusinessRegisterLanding';
import BusinessRegisterWizard from '@/components/business/BusinessRegisterWizard';
import CategoryIcon from '@/components/CategoryIcon';
import { MerchantAuthPage } from '@/components/business/MerchantAuthShell';
import { registerBusiness } from '@/app/actions/business';
import { countryFlagEmoji } from '@/lib/countryFlag';
import { markNewBusinessOnboarding } from '@/lib/businessOnboarding';
import AuthRedirectScreen from '@/components/auth/AuthRedirectScreen';
import { useAlreadyLoggedInRedirect } from '@/hooks/useAlreadyLoggedInRedirect';

type LiveCategory = { id: string; name: string; icon?: string | null };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateStep1(
  data: {
    fullName: string;
    email: string;
    password: string;
  },
  mobileNum: string,
): string | null {
  if (!data.fullName.trim()) return 'Please enter your full name';
  if (!data.email.trim()) return 'Please enter your email address';
  if (!EMAIL_REGEX.test(data.email.trim())) return 'Please enter a valid email address';
  if (!data.password) return 'Please enter a password';
  if (data.password.length < 6) return 'Password must be at least 6 characters long';
  if (!mobileNum || mobileNum.replace(/\D/g, '').length < 10) {
    return 'Valid mobile number is required';
  }
  return null;
}

function validateStep2(
  data: {
    businessName: string;
    categoryId: string;
    subcategoryId: string;
    city: string;
    state: string;
    publicPhone: string;
    businessAddress: string;
  },
  subs: LiveCategory[],
): string | null {
  if (!data.businessName.trim()) return 'Please enter your business name';
  if (!data.categoryId) return 'Please select a business category';
  if (subs.length > 0 && !data.subcategoryId) return 'Please select a subcategory';
  if (!data.city.trim()) return 'Please select your city';
  if (!data.state.trim()) return 'Please select your state';
  if (data.publicPhone.replace(/\D/g, '').length < 10) {
    return 'Please enter a valid 10-digit business phone number';
  }
  if (!data.businessAddress.trim()) return 'Please enter your business address';
  return null;
}

function isStep1RegistrationError(error: string): boolean {
  const lower = error.toLowerCase();
  return (
    lower.includes('email') ||
    lower.includes('mobile') ||
    lower.includes('password') ||
    lower.includes('full name') ||
    lower.includes('account') ||
    lower.includes('sign in')
  );
}

function RegisterFormContent() {
  const searchParams = useSearchParams();
  const authRedirect = useAlreadyLoggedInRedirect({ kind: 'business' });
  const [mobile, setMobile] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [liveCategories, setLiveCategories] = useState<LiveCategory[]>(mockCategories);
  const [subCategories, setSubCategories] = useState<LiveCategory[]>([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);

  useEffect(() => {
    async function fetchCats() {
      const res = await getCategories(true);
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

    const plan = searchParams.get('plan');
    const billing = searchParams.get('billing');
    if (plan === 'pro') {
      setSelectedPlan('pro');
    }
    if (billing === 'monthly' || billing === 'annual') {
      setBillingCycle(billing);
    }
  }, [searchParams]);

  const [step, setStep] = useState(1);
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
    categoryId: '',
    subcategory: '',
    subcategoryId: '',
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

  const countryOptions = Country.getAllCountries().map((c) => ({
    label: c.name,
    value: c.isoCode,
    prefix: countryFlagEmoji(c.isoCode),
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

  const categoryOptions = liveCategories.map((c) => ({
    label: c.name,
    value: c.id,
    prefix: <CategoryIcon icon={c.icon} name={c.name} size={20} className="h-5 w-5" />,
  }));

  const subcategoryOptions = subCategories.map((c) => ({
    label: c.name,
    value: c.id,
    prefix: <CategoryIcon icon={c.icon} name={c.name} size={20} className="h-5 w-5" />,
  }));

  const handleCategoryChange = async (categoryId: string) => {
    const parent = liveCategories.find((c) => c.id === categoryId);
    setFormData((prev) => ({
      ...prev,
      categoryId,
      category: parent?.name || '',
      subcategoryId: '',
      subcategory: '',
    }));
    setSubCategories([]);

    if (!categoryId) return;

    setLoadingSubcategories(true);
    try {
      const res = await getSubCategories(categoryId);
      if (res.success && res.subCategories) {
        setSubCategories(res.subCategories);
      }
    } finally {
      setLoadingSubcategories(false);
    }
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    const sub = subCategories.find((c) => c.id === subcategoryId);
    const parent = liveCategories.find((c) => c.id === formData.categoryId);
    setFormData((prev) => ({
      ...prev,
      subcategoryId,
      subcategory: sub?.name || '',
      category: sub && parent ? `${parent.name} › ${sub.name}` : prev.category,
    }));
  };
  const stepLabels = ['Basic Details', 'Business Info', 'Success'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = async () => {
    if (step === 1) {
      const step1Error = validateStep1(formData, mobile);
      if (step1Error) {
        alert(step1Error);
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      const step2Error = validateStep2(formData, subCategories);
      if (step2Error) {
        alert(step2Error);
        return;
      }
      await handleRegistration();
      return;
    }

    if (step === 3) {
      markNewBusinessOnboarding();
      window.location.href = '/business/dashboard?welcome=1';
    }
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleRegistration = async () => {
    const step1Error = validateStep1(formData, mobile);
    if (step1Error) {
      alert(step1Error);
      setStep(1);
      return;
    }

    const step2Error = validateStep2(formData, subCategories);
    if (step2Error) {
      alert(step2Error);
      return;
    }

    setLoading(true);
    try {
      const parent = liveCategories.find((c) => c.id === formData.categoryId);
      const sub = subCategories.find((c) => c.id === formData.subcategoryId);
      const categoryLabel =
        sub && parent ? `${parent.name} › ${sub.name}` : parent?.name || formData.category;

      const registrationData = {
        ...formData,
        category: categoryLabel,
        mobile,
        selectedPlan,
        billingCycle,
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
        const message = result.error || 'Registration failed. Please try again.';
        if (isStep1RegistrationError(message)) {
          setStep(1);
        }
        alert(message);
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

  const scrollToRegisterHero = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.setTimeout(() => {
      document.getElementById('mobile-input')?.focus();
    }, 400);
  };

  const handlePlanSelect = (plan: 'free' | 'pro', billing?: 'monthly' | 'annual') => {
    if (plan === 'pro') {
      setSelectedPlan('pro');
      if (billing === 'monthly' || billing === 'annual') {
        setBillingCycle(billing);
      }
    } else {
      setSelectedPlan('free');
    }
    scrollToRegisterHero();
  };

  const stats = [
    { label: 'Buyers*', value: '1K+ monthly searches' },
    { label: 'Happy Customers', value: '500+ early adopters' },
    { label: 'Businesses Listed', value: '500+ local listings' },
  ];

  const successStories = [
    {
      name: 'Mr. Ashim Kumar Mondal',
      business: 'Astrologer Sri Ashimanandaji Jyotish Mahamohopadhay',
      role: 'Spiritual Consultants',
      testimonial: 'I started with a small investment in one city, and today, FinderB has helped me expand across five states with a 35% to 40% increase in business growth.',
      duration: 'Doing business since 2022',
      image: '/1.jpg'
    },
    {
      name: 'Priya Chhabria',
      business: 'Chhabria Tiles & Décor',
      role: 'Tile Dealers',
      testimonial: 'FinderB helped me list my showroom quickly and connect with local customers right away.',
      duration: 'Doing business since 2010',
      image: '/2.jpeg'
    },
    {
      name: 'Arjun Verma',
      business: 'Verma Electrical Services',
      role: 'Electricians',
      testimonial: 'Early traction from FinderB has helped me secure new service jobs each week.',
      duration: 'Doing business since 2019',
      image: '/3.jpeg'
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

  if (authRedirect.status === 'checking') {
    return (
      <div className="flex min-h-[calc(100dvh-5rem)] items-center justify-center bg-[#eef3f9] pt-24">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#215481] border-t-transparent" />
      </div>
    );
  }

  if (authRedirect.status === 'redirecting') {
    return <AuthRedirectScreen message={authRedirect.message} />;
  }

  if (showForm) {
    return (
      <BusinessRegisterWizard
        step={step}
        stepLabels={stepLabels}
        loading={loading}
        mobile={mobile}
        formData={formData}
        passwordVisible={passwordVisible}
        onPasswordVisibleChange={setPasswordVisible}
        onFormChange={handleChange}
        onFormPatch={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
        categoryOptions={categoryOptions}
        subcategoryOptions={subcategoryOptions}
        loadingSubcategories={loadingSubcategories}
        showSubcategory={Boolean(formData.categoryId) && (loadingSubcategories || subCategories.length > 0)}
        onCategoryChange={handleCategoryChange}
        onSubcategoryChange={handleSubcategoryChange}
        countryOptions={countryOptions}
        stateOptions={stateOptions}
        cityOptions={cityOptions}
        registeredBusiness={registeredBusiness}
        selectedPlan={selectedPlan}
        billingCycle={billingCycle as 'monthly' | 'annual'}
        contactEmail={formData.email}
        contactName={formData.fullName}
        onPaymentSuccess={() => {
          markNewBusinessOnboarding();
          window.location.href = '/business/dashboard?welcome=1&payment=success';
        }}
        onBack={() => setShowForm(false)}
        onClose={() => setShowForm(false)}
        onPrev={prevStep}
        onNext={nextStep}
      />
    );
  }

  return (
    <MerchantAuthPage>
      <BusinessRegisterLanding
        mobile={mobile}
        onMobileChange={setMobile}
        onStart={handleStartNow}
        onPlanSelect={handlePlanSelect}
        stats={stats}
        successStories={successStories}
        steps={steps}
        faqs={faqs}
      />
    </MerchantAuthPage>
  );
}

export default function BusinessRegisterPage() {
  return <RegisterFormContent />;
}