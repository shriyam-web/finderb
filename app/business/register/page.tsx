'use client';

import { useState, useEffect } from 'react';
import { useOtpCooldown } from '@/hooks/useOtpCooldown';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Briefcase,
  Building2,
  Smartphone,
} from 'lucide-react';
import { categories as mockCategories } from '@/lib/mockData';
import { getCategories, getSubCategories } from '@/app/actions/category';
import { Country, State, City } from 'country-state-city';
import BusinessRegisterLanding from '@/components/business/BusinessRegisterLanding';
import BusinessRegisterWizard from '@/components/business/BusinessRegisterWizard';
import type { RegisterPin } from '@/components/business/RegisterMapPin';
import CategoryIcon from '@/components/CategoryIcon';
import { MerchantAuthPage } from '@/components/business/MerchantAuthShell';
import {
  checkBusinessMobileAvailable,
  isContactOnUserAccount,
  registerBusiness,
} from '@/app/actions/business';
import UserContactReuseDialog, { type ReusableContact } from '@/components/business/UserContactReuseDialog';
import {
  confirmMerchantRegisterEmailOtp,
  sendMerchantRegisterEmailOtp,
} from '@/app/actions/emailOtp';
import {
  confirmMerchantRegisterPhoneOtp,
  sendMerchantRegisterPhoneOtp,
} from '@/app/actions/phoneOtp';
import {
  validateRegistrationMobile,
  validateRegistrationStep1Fields,
  validateRegistrationStep2Fields,
  mapRegistrationServerError,
  scrollToFirstRegistrationError,
  type RegistrationFieldErrors,
  type RegistrationFieldKey,
} from '@/lib/merchantRegistrationValidation';
import CountryFlagPrefix from '@/components/CountryFlagPrefix';
import { combineBusinessAddress } from '@/lib/businessAddress';
import { markNewBusinessOnboarding } from '@/lib/businessOnboarding';
import AuthRedirectScreen from '@/components/auth/AuthRedirectScreen';
import { useAlreadyLoggedInRedirect } from '@/hooks/useAlreadyLoggedInRedirect';
type LiveCategory = {
  id: string;
  name: string;
  icon?: string | null;
  level?: number | null;
};

function isStep1RegistrationError(error: string): boolean {
  const lower = error.toLowerCase();
  return (
    lower.includes('email') ||
    lower.includes('mobile') ||
    lower.includes('whatsapp') ||
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
  const [nestedSubCategories, setNestedSubCategories] = useState<LiveCategory[]>([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [loadingNestedSubcategories, setLoadingNestedSubcategories] = useState(false);

  useEffect(() => {
    async function fetchCats() {
      try {
        const res = await getCategories(true);
        if (res.success && res.categories) {
          setLiveCategories(res.categories);
        }
      } catch {
        // Keep mock categories if the server action cannot be reached.
      }
    }
    void fetchCats();
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
  const [fieldErrors, setFieldErrors] = useState<RegistrationFieldErrors>({});
  const [landingMobileError, setLandingMobileError] = useState('');
  const [registeredBusiness, setRegisteredBusiness] = useState<any>(null);
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerificationToken, setEmailVerificationToken] = useState('');
  const [emailOtpSending, setEmailOtpSending] = useState(false);
  const [emailOtpVerifying, setEmailOtpVerifying] = useState(false);
  const [emailOtpHint, setEmailOtpHint] = useState('');
  const emailOtpCooldown = useOtpCooldown();
  const [mobileOtpCode, setMobileOtpCode] = useState('');
  const [mobileProof, setMobileProof] = useState('');
  const [mobileProofFor, setMobileProofFor] = useState('');
  const [mobileOtpSending, setMobileOtpSending] = useState(false);
  const [mobileOtpVerifying, setMobileOtpVerifying] = useState(false);
  const mobileOtpCooldown = useOtpCooldown();
  const mobileDigits = mobile.replace(/\D/g, '').slice(-10);
  const mobileVerified = Boolean(mobileProof) && mobileProofFor === mobileDigits;
  const [useMobileForWhatsApp, setUseMobileForWhatsApp] = useState(true);
  const [whatsapp, setWhatsapp] = useState('');
  const [whatsappOtpCode, setWhatsappOtpCode] = useState('');
  const [whatsappProof, setWhatsappProof] = useState('');
  const [whatsappProofFor, setWhatsappProofFor] = useState('');
  const [whatsappOtpSending, setWhatsappOtpSending] = useState(false);
  const [whatsappOtpVerifying, setWhatsappOtpVerifying] = useState(false);
  const whatsappOtpCooldown = useOtpCooldown();
  const whatsappDigits = (useMobileForWhatsApp ? mobileDigits : whatsapp.replace(/\D/g, '').slice(-10));
  const whatsappVerified =
    (useMobileForWhatsApp && mobileVerified) ||
    (Boolean(whatsappProof) && whatsappProofFor === whatsappDigits) ||
    (mobileVerified && whatsappDigits === mobileDigits);
  const [reuseContact, setReuseContact] = useState<ReusableContact | null>(null);
  const [reuseApproved, setReuseApproved] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    workEmail: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    displayName: '',
    category: '',
    categoryId: '',
    subcategory: '',
    subcategoryId: '',
    nestedSubcategoryId: '',
    location: '',
    city: '',
    cityCode: '',
    state: '',
    stateCode: '',
    country: 'India',
    countryCode: 'IN',
    publicPhone: '',
    addressLine1: '',
    addressLine2: '',
  });
  const [mapPin, setMapPin] = useState<RegisterPin | null>(null);

  const countryOptions = Country.getAllCountries().map((c) => ({
    label: c.name,
    value: c.isoCode,
    prefix: <CountryFlagPrefix isoCode={c.isoCode} />,
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

  const nestedSubcategoryOptions = nestedSubCategories.map((c) => ({
    label: c.name,
    value: c.id,
    prefix: <CategoryIcon icon={c.icon} name={c.name} size={20} className="h-5 w-5" />,
  }));
  const selectedRoot = liveCategories.find((c) => c.id === formData.categoryId);
  const rootIsGroup = selectedRoot?.level === 0;

  const clearFieldErrors = (...keys: RegistrationFieldKey[]) => {
    setFieldErrors((prev) => {
      if (keys.length === 0) return prev;
      const next = { ...prev };
      for (const key of keys) {
        delete next[key];
      }
      return next;
    });
  };

  const patchFormData = (patch: Partial<typeof formData>) => {
    if (
      typeof patch.email === 'string' &&
      patch.email.trim().toLowerCase() !== formData.email.trim().toLowerCase()
    ) {
      setEmailVerified(false);
      setEmailVerificationToken('');
      setEmailOtpCode('');
      setEmailOtpHint('');
      clearFieldErrors('emailOtp');
    }
    setFormData((prev) => ({ ...prev, ...patch }));
    if ('city' in patch || 'stateCode' in patch || 'countryCode' in patch) {
      setMapPin(null);
    }
    const keys = new Set<RegistrationFieldKey>(Object.keys(patch) as RegistrationFieldKey[]);
    if ('countryCode' in patch) {
      keys.add('country');
      keys.add('state');
      keys.add('city');
    }
    if ('stateCode' in patch) {
      keys.add('state');
      keys.add('city');
    }
    if ('categoryId' in patch) {
      keys.add('categoryId');
      keys.add('subcategoryId');
    }
    clearFieldErrors(...keys);
  };

  /** Asks before reusing a FinderB user's email or mobile; true means the send must wait for the answer. */
  const needsReuseConfirm = async (contact: ReusableContact) => {
    if (reuseApproved.includes(`${contact.kind}:${contact.value}`)) return false;
    if (!(await isContactOnUserAccount(contact.kind, contact.value))) return false;
    setReuseContact(contact);
    return true;
  };

  const handleSendEmailOtp = async (reuseConfirmed = false) => {
    const email = formData.email.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldErrors({ email: 'Please enter a valid email address.' });
      scrollToFirstRegistrationError({ email: 'Please enter a valid email address.' });
      return;
    }

    const emailKey = email.toLowerCase();
    if (emailOtpCooldown.isWaiting(emailKey)) return;

    setEmailOtpCode('');
    setEmailOtpSending(true);
    clearFieldErrors('email', 'emailOtp', '_form');
    setEmailOtpHint('');
    try {
      if (!reuseConfirmed && (await needsReuseConfirm({ kind: 'email', value: emailKey }))) return;
      const result = await sendMerchantRegisterEmailOtp(email);
      if (!result.success) {
        const mapped = mapRegistrationServerError(result.error);
        setFieldErrors(mapped);
        scrollToFirstRegistrationError(mapped);
        return;
      }
      emailOtpCooldown.markSent(emailKey);
      setFieldErrors({});
      setEmailOtpHint(result.message);
    } catch (error) {
      setFieldErrors({
        emailOtp:
          error instanceof Error
            ? error.message
            : 'Could not send verification code. Please try again.',
      });
    } finally {
      setEmailOtpSending(false);
    }
  };

  const handleVerifyEmailOtp = async (value = emailOtpCode) => {
    if (emailOtpVerifying) return;
    if (value.replace(/\D/g, '').length !== 6) {
      setFieldErrors({ emailOtp: 'Enter the 6-digit code from your email.' });
      return;
    }
    setEmailOtpVerifying(true);
    clearFieldErrors('emailOtp', '_form');
    setEmailOtpHint('');
    try {
      const result = await confirmMerchantRegisterEmailOtp(formData.email, value);
      if (!result.success) {
        setEmailVerified(false);
        setEmailVerificationToken('');
        setEmailOtpCode('');
        setFieldErrors({ emailOtp: result.error });
        return;
      }
      setEmailVerified(true);
      setEmailVerificationToken(result.emailVerificationToken);
      setEmailOtpHint('');
      setFieldErrors({});
    } catch (error) {
      setFieldErrors({
        emailOtp:
          error instanceof Error
            ? error.message
            : 'Could not verify the code. Please try again.',
      });
    } finally {
      setEmailOtpVerifying(false);
    }
  };

  const handleSendMobileOtp = async (reuseConfirmed = false) => {
    if (mobileOtpSending || mobileOtpCooldown.isWaiting(mobileDigits)) return;
    setMobileOtpCode('');
    setMobileOtpSending(true);
    clearFieldErrors('mobile', '_form');
    try {
      if (!reuseConfirmed && (await needsReuseConfirm({ kind: 'mobile', value: mobileDigits }))) return;
      const result = await sendMerchantRegisterPhoneOtp(mobileDigits);
      if (!result.success) {
        const mapped = { mobile: result.error };
        setFieldErrors(mapped);
        scrollToFirstRegistrationError(mapped);
        return;
      }
      mobileOtpCooldown.markSent(mobileDigits);
    } catch {
      setFieldErrors({ mobile: 'Could not send the WhatsApp code. Please try again.' });
    } finally {
      setMobileOtpSending(false);
    }
  };

  const handleVerifyMobileOtp = async (value = mobileOtpCode) => {
    if (value.length !== 6 || mobileOtpVerifying) return;
    setMobileOtpVerifying(true);
    clearFieldErrors('mobile', '_form');
    try {
      const result = await confirmMerchantRegisterPhoneOtp(mobileDigits, value);
      if (!result.success) {
        setMobileOtpCode('');
        setFieldErrors({ mobile: result.error });
        return;
      }
      setMobileProof(result.phoneVerificationToken);
      setMobileProofFor(mobileDigits);
      setMobileOtpCode('');
      if (useMobileForWhatsApp || whatsapp.replace(/\D/g, '').slice(-10) === mobileDigits) {
        setWhatsappProof(result.phoneVerificationToken);
        setWhatsappProofFor(mobileDigits);
      }
    } catch {
      setFieldErrors({ mobile: 'Could not verify the code. Please try again.' });
    } finally {
      setMobileOtpVerifying(false);
    }
  };

  const handleUseMobileForWhatsAppChange = (same: boolean) => {
    setUseMobileForWhatsApp(same);
    clearFieldErrors('whatsappNumber', '_form');
    if (same) {
      setWhatsapp(mobileDigits);
      if (mobileVerified) {
        setWhatsappProof(mobileProof);
        setWhatsappProofFor(mobileDigits);
      }
      setWhatsappOtpCode('');
      return;
    }
    setWhatsapp((prev) => (prev.replace(/\D/g, '').slice(-10) === mobileDigits ? '' : prev));
    setWhatsappProof('');
    setWhatsappProofFor('');
    setWhatsappOtpCode('');
  };

  const handleSendWhatsappOtp = async () => {
    if (whatsappOtpSending || whatsappOtpCooldown.isWaiting(whatsappDigits)) return;
    if (whatsappDigits === mobileDigits && mobileVerified) {
      setWhatsappProof(mobileProof);
      setWhatsappProofFor(mobileDigits);
      return;
    }
    if (whatsappDigits.length !== 10) {
      setFieldErrors({ whatsappNumber: 'Enter a 10-digit WhatsApp number.' });
      return;
    }
    setWhatsappOtpCode('');
    setWhatsappOtpSending(true);
    clearFieldErrors('whatsappNumber', '_form');
    try {
      const result = await sendMerchantRegisterPhoneOtp(whatsappDigits);
      if (!result.success) {
        const mapped = { whatsappNumber: result.error };
        setFieldErrors(mapped);
        scrollToFirstRegistrationError(mapped);
        return;
      }
      whatsappOtpCooldown.markSent(whatsappDigits);
    } catch {
      setFieldErrors({ whatsappNumber: 'Could not send the WhatsApp code. Please try again.' });
    } finally {
      setWhatsappOtpSending(false);
    }
  };

  const handleVerifyWhatsappOtp = async (value = whatsappOtpCode) => {
    if (value.length !== 6 || whatsappOtpVerifying) return;
    setWhatsappOtpVerifying(true);
    clearFieldErrors('whatsappNumber', '_form');
    try {
      const result = await confirmMerchantRegisterPhoneOtp(whatsappDigits, value);
      if (!result.success) {
        setWhatsappOtpCode('');
        setFieldErrors({ whatsappNumber: result.error });
        return;
      }
      setWhatsappProof(result.phoneVerificationToken);
      setWhatsappProofFor(whatsappDigits);
      setWhatsappOtpCode('');
    } catch {
      setFieldErrors({ whatsappNumber: 'Could not verify the WhatsApp code. Please try again.' });
    } finally {
      setWhatsappOtpVerifying(false);
    }
  };

  const handleCategoryChange = async (categoryId: string) => {
    const parent = liveCategories.find((c) => c.id === categoryId);
    patchFormData({
      categoryId,
      category: parent?.name || '',
      subcategoryId: '',
      nestedSubcategoryId: '',
      subcategory: '',
    });
    setSubCategories([]);
    setNestedSubCategories([]);

    if (!categoryId) return;

    setLoadingSubcategories(true);
    try {
      const res = await getSubCategories(categoryId);
      if (res.success && res.subCategories) {
        setSubCategories(res.subCategories);
        // Leaf category with no children — keep draft label for Add / auto-map.
        if (res.subCategories.length === 0 && parent?.name) {
          patchFormData({
            categoryId,
            category: parent.name,
            subcategoryId: '',
            nestedSubcategoryId: '',
            subcategory: '',
          });
        }
      }
    } finally {
      setLoadingSubcategories(false);
    }
  };

  const handleSubcategoryChange = async (subcategoryId: string) => {
    const sub = subCategories.find((c) => c.id === subcategoryId);
    const parent = liveCategories.find((c) => c.id === formData.categoryId);
    const rootIsGroup = parent?.level === 0;
    const draftLabel = rootIsGroup
      ? sub?.name || ''
      : sub && parent
        ? `${parent.name} › ${sub.name}`
        : formData.category;
    patchFormData({
      subcategoryId,
      subcategory: sub?.name || '',
      nestedSubcategoryId: '',
      category: draftLabel,
    });
    setNestedSubCategories([]);
    if (!subcategoryId || !rootIsGroup) return;
    setLoadingNestedSubcategories(true);
    try {
      const res = await getSubCategories(subcategoryId);
      if (res.success && res.subCategories) {
        setNestedSubCategories(res.subCategories as LiveCategory[]);
      }
    } finally {
      setLoadingNestedSubcategories(false);
    }
  };

  const handleNestedSubcategoryChange = (nestedSubcategoryId: string) => {
    const leaf = nestedSubCategories.find((c) => c.id === nestedSubcategoryId);
    const mid = subCategories.find((c) => c.id === formData.subcategoryId);
    patchFormData({
      nestedSubcategoryId,
      category:
        leaf && mid ? `${mid.name} › ${leaf.name}` : mid?.name || formData.category,
    });
  };

  const stepLabels = ['Basic Details', 'Business Info', 'Success'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearFieldErrors(name as RegistrationFieldKey);
  };

  const nextStep = async () => {
    if (step === 1) {
      const errors = validateRegistrationStep1Fields({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        mobile,
      });
      if (!emailVerified || !emailVerificationToken) {
        errors.emailOtp = 'Verify your email with the OTP before continuing.';
      }
      if (!mobileVerified && !errors.mobile) {
        errors.mobile = 'Verify your mobile number with the WhatsApp OTP before continuing.';
      }
      if (!whatsappVerified && !errors.whatsappNumber) {
        errors.whatsappNumber = useMobileForWhatsApp
          ? 'Verify your mobile number first — it will be used as your WhatsApp number.'
          : 'Verify your WhatsApp number with the OTP before continuing.';
      }
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        scrollToFirstRegistrationError(errors);
        return;
      }
      const mobileCheck = await checkBusinessMobileAvailable(mobile);
      if (!mobileCheck.success) {
        const mobileErrors = { mobile: mobileCheck.error };
        setFieldErrors(mobileErrors);
        scrollToFirstRegistrationError(mobileErrors);
        return;
      }
      setFieldErrors({});
      setFormData((prev) => ({
        ...prev,
        publicPhone: mobile,
      }));
      setStep(2);
      return;
    }

    if (step === 2) {
      const errors = validateRegistrationStep2Fields({
        businessName: formData.businessName,
        displayName: formData.displayName,
        categoryId: formData.categoryId,
        subcategoryId: formData.subcategoryId,
        nestedSubcategoryId: formData.nestedSubcategoryId,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        countryCode: formData.countryCode,
        stateCode: formData.stateCode,
        publicPhone: mobile,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        hasSubcategories: subCategories.length > 0,
        hasNestedSubcategories: nestedSubCategories.length > 0,
      });
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        scrollToFirstRegistrationError(errors);
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
    const step1Errors = validateRegistrationStep1Fields({
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      mobile,
    });
    if (Object.keys(step1Errors).length > 0) {
      setFieldErrors(step1Errors);
      setStep(1);
      scrollToFirstRegistrationError(step1Errors);
      return;
    }

    if (!emailVerified || !emailVerificationToken) {
      const otpError = {
        emailOtp: 'Verify your email with the OTP before submitting.',
      };
      setFieldErrors(otpError);
      setStep(1);
      scrollToFirstRegistrationError(otpError);
      return;
    }

    if (!mobileVerified) {
      const otpError = {
        mobile: 'Verify your mobile number with the WhatsApp OTP before submitting.',
      };
      setFieldErrors(otpError);
      setStep(1);
      scrollToFirstRegistrationError(otpError);
      return;
    }

    if (!whatsappVerified) {
      const otpError = {
        whatsappNumber: useMobileForWhatsApp
          ? 'Verify your mobile number first — it will be used as your WhatsApp number.'
          : 'Verify your WhatsApp number with the OTP before submitting.',
      };
      setFieldErrors(otpError);
      setStep(1);
      scrollToFirstRegistrationError(otpError);
      return;
    }

    const step2Errors = validateRegistrationStep2Fields({
      businessName: formData.businessName,
      displayName: formData.displayName,
      categoryId: formData.categoryId,
      subcategoryId: formData.subcategoryId,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      countryCode: formData.countryCode,
      stateCode: formData.stateCode,
      publicPhone: mobile,
      addressLine1: formData.addressLine1,
      addressLine2: formData.addressLine2,
      hasSubcategories: subCategories.length > 0,
    });
    if (Object.keys(step2Errors).length > 0) {
      setFieldErrors(step2Errors);
      scrollToFirstRegistrationError(step2Errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      const parent = liveCategories.find((c) => c.id === formData.categoryId);
      const sub = subCategories.find((c) => c.id === formData.subcategoryId);
      const leaf = nestedSubCategories.find((c) => c.id === formData.nestedSubcategoryId);
      const draftLabel =
        parent?.level === 0
          ? leaf && sub
            ? `${sub.name} › ${leaf.name}`
            : sub?.name || parent?.name || formData.category
          : sub && parent
            ? `${parent.name} › ${sub.name}`
            : parent?.name || formData.category;
      const registrationData = {
        ...formData,
        confirmPassword: undefined,
        category: draftLabel,
        mobile,
        publicPhone: mobile,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        businessAddress: combineBusinessAddress(formData.addressLine1, formData.addressLine2),
        ...(mapPin ? { latitude: mapPin.latitude, longitude: mapPin.longitude } : {}),
        selectedPlan,
        billingCycle,
        emailVerificationToken,
        phoneVerificationToken: mobileVerified ? mobileProof : '',
        whatsappNumber: whatsappDigits,
        whatsappVerificationToken:
          whatsappDigits === mobileDigits ? undefined : whatsappVerified ? whatsappProof : '',
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
        addressLine1: registrationData.addressLine1,
        addressLine2: registrationData.addressLine2,
        selectedPlan: registrationData.selectedPlan,
        billingCycle: registrationData.billingCycle,
      });

      const result = await registerBusiness(registrationData);

      if (result.success) {
        setRegisteredBusiness(result.business);
        setFieldErrors({});
        setStep(3);
      } else {
        console.error('Registration failed:', result.error);
        const message = result.error || 'Registration failed. Please try again.';
        const mappedErrors = mapRegistrationServerError(message);
        if (/whatsapp number/i.test(message)) {
          setWhatsappProof('');
          setWhatsappProofFor('');
        } else if (/mobile verification|verify your mobile/i.test(message)) {
          setMobileProof('');
          setMobileProofFor('');
        }
        if (isStep1RegistrationError(message)) {
          setStep(1);
        }
        setFieldErrors(mappedErrors);
        scrollToFirstRegistrationError(mappedErrors);
      }
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const isNetworkError =
        error instanceof TypeError &&
        (error.message === 'Failed to fetch' || error.message.includes('NetworkError'));
      const message = isNetworkError
        ? 'Could not reach the server. Refresh the page and try again — if you recently restarted dev, make sure you are on the correct localhost port.'
        : error instanceof Error
          ? error.message
          : 'An unexpected error occurred. Please try again.';
      setFieldErrors({ _form: message });
    } finally {
      setLoading(false);
    }
  };

  const handleStartNow = () => {
    const error = validateRegistrationMobile(mobile);
    if (error) {
      setLandingMobileError(error);
      document.getElementById('field-mobile-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById('mobile-input')?.focus();
      return;
    }
    setLandingMobileError('');
    setShowForm(true);
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
      a: 'You can manage your listing from the FinderB Business dashboard in the app, or from the same dashboard on the website. Both sides of FinderB live in one place.'
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

  const approveReuse = () => {
    const contact = reuseContact;
    if (!contact) return;
    setReuseApproved((prev) => [...prev, `${contact.kind}:${contact.value}`]);
    setReuseContact(null);
    if (contact.kind === 'email') void handleSendEmailOtp(true);
    else void handleSendMobileOtp(true);
  };

  const declineReuse = () => {
    const contact = reuseContact;
    setReuseContact(null);
    if (contact?.kind === 'email') {
      patchFormData({ email: '' });
      window.setTimeout(() => document.getElementById('email')?.focus(), 50);
    } else if (contact?.kind === 'mobile') {
      setMobile('');
      setShowForm(false);
      window.setTimeout(() => document.getElementById('mobile-input')?.focus(), 300);
    }
  };

  const reuseDialog = reuseContact ? (
    <UserContactReuseDialog contact={reuseContact} onUseSame={approveReuse} onUseDifferent={declineReuse} />
  ) : null;

  if (showForm) {
    return (
      <>
      {reuseDialog}
      <BusinessRegisterWizard
        step={step}
        stepLabels={stepLabels}
        loading={loading}
        mobile={mobile}
        formData={formData}
        fieldErrors={fieldErrors}
        onFormChange={handleChange}
        onFormPatch={patchFormData}
        categoryOptions={categoryOptions}
        subcategoryOptions={subcategoryOptions}
        nestedSubcategoryOptions={nestedSubcategoryOptions}
        loadingSubcategories={loadingSubcategories}
        loadingNestedSubcategories={loadingNestedSubcategories}
        showSubcategory={Boolean(formData.categoryId) && (loadingSubcategories || subCategories.length > 0)}
        showNestedSubcategory={
          Boolean(formData.subcategoryId) &&
          (loadingNestedSubcategories || nestedSubCategories.length > 0)
        }
        onCategoryChange={handleCategoryChange}
        onSubcategoryChange={handleSubcategoryChange}
        onNestedSubcategoryChange={handleNestedSubcategoryChange}
        subcategoryLabel={rootIsGroup ? 'Category' : 'Subcategory'}
        nestedSubcategoryLabel="Subcategory"
        countryOptions={countryOptions}
        stateOptions={stateOptions}
        cityOptions={cityOptions}
        mapPin={mapPin}
        onMapPinChange={setMapPin}
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
        emailOtpCode={emailOtpCode}
        onEmailOtpCodeChange={(value) => {
          setEmailOtpCode(value);
          clearFieldErrors('emailOtp');
        }}
        emailVerified={emailVerified}
        emailOtpSending={emailOtpSending}
        emailOtpVerifying={emailOtpVerifying}
        emailOtpHint={emailOtpHint}
        emailOtpSent={emailOtpCooldown.isSentTo(formData.email.trim().toLowerCase())}
        emailOtpWait={
          emailOtpCooldown.isWaiting(formData.email.trim().toLowerCase())
            ? emailOtpCooldown.secondsLeft
            : 0
        }
        onSendEmailOtp={() => {
          void handleSendEmailOtp();
        }}
        onVerifyEmailOtp={(value) => {
          void handleVerifyEmailOtp(value);
        }}
        mobileOtp={{
          verified: mobileVerified,
          sent: mobileOtpCooldown.isSentTo(mobileDigits),
          wait: mobileOtpCooldown.isWaiting(mobileDigits) ? mobileOtpCooldown.secondsLeft : 0,
          sending: mobileOtpSending,
          verifying: mobileOtpVerifying,
          code: mobileOtpCode,
          onCodeChange: (value) => {
            setMobileOtpCode(value);
            clearFieldErrors('mobile');
          },
          onSend: () => {
            void handleSendMobileOtp();
          },
          onVerify: (value) => {
            void handleVerifyMobileOtp(value);
          },
        }}
        whatsappNumber={whatsapp}
        onWhatsappChange={(digits) => {
          setWhatsapp(digits);
          if (whatsappProofFor && whatsappProofFor !== digits) {
            setWhatsappProof('');
            setWhatsappProofFor('');
            setWhatsappOtpCode('');
          }
          clearFieldErrors('whatsappNumber');
        }}
        useMobileForWhatsApp={useMobileForWhatsApp}
        onUseMobileForWhatsAppChange={handleUseMobileForWhatsAppChange}
        whatsappOtp={{
          verified: whatsappVerified,
          sent: whatsappOtpCooldown.isSentTo(whatsappDigits),
          wait: whatsappOtpCooldown.isWaiting(whatsappDigits) ? whatsappOtpCooldown.secondsLeft : 0,
          sending: whatsappOtpSending,
          verifying: whatsappOtpVerifying,
          code: whatsappOtpCode,
          onCodeChange: (value) => {
            setWhatsappOtpCode(value);
            clearFieldErrors('whatsappNumber');
          },
          onSend: () => {
            void handleSendWhatsappOtp();
          },
          onVerify: (value) => {
            void handleVerifyWhatsappOtp(value);
          },
        }}
      />
      </>
    );
  }

  return (
    <MerchantAuthPage>
      <BusinessRegisterLanding
        mobile={mobile}
        onMobileChange={(value) => {
          setMobile(value);
          if (landingMobileError) setLandingMobileError('');
        }}
        mobileError={landingMobileError}
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