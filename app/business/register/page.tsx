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

type LiveCategory = { id: string; name: string; icon?: string | null };

function RegisterFormContent() {
  const searchParams = useSearchParams();
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
      markNewBusinessOnboarding();
      window.location.href = '/business/dashboard?welcome=1';
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
    if (!formData.categoryId) {
      alert('Please select a business category');
      return;
    }
    if (subCategories.length > 0 && !formData.subcategoryId) {
      alert('Please select a subcategory');
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
      role: 'Spiritual Consultants',
      testimonial: 'I started with a small investment in one city, and today, FinderB has helped me expand across five states with a 35% to 40% increase in business growth.',
      duration: 'Customer since 1 year',
      image: '/1.jpg'
    },
    {
      name: 'Priya Chhabria',
      business: 'Chhabria Tiles & Décor',
      role: 'Tile Dealers',
      testimonial: 'From 1 showroom to 4 in 20 years, FinderB’s growing returns have helped my business dominate the market.',
      duration: 'Customer since 14 years',
      image: '/2.jpeg'
    },
    {
      name: 'Arjun Verma',
      business: 'Verma Electrical Services',
      role: 'Electricians',
      testimonial: 'Genuine leads from FinderB keep my business active and help me win more service calls every week.',
      duration: 'Customer since 4 year',
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