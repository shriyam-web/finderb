'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  User,
  X,
} from 'lucide-react';
import { SearchableSelect, type SelectOption } from '@/components/SearchableSelect';
import { MerchantAuthMain, MerchantAuthPage } from '@/components/business/MerchantAuthShell';
import MerchantRechargeButton from '@/components/business/MerchantRechargeButton';
import type { BillingCycle } from '@/lib/razorpay/plans';
import IndianPhoneInput, { INDIAN_PHONE_FIELD_HINT } from '@/components/IndianPhoneInput';
import { IndiaPhonePrefix } from '@/components/IndiaPhonePrefix';
import { formatIndianMobileDisplay } from '@/lib/indianPhone';
import {
  MerchantAuthField,
  MerchantAuthFormHeader,
  MerchantAuthSubmitButton,
  merchantAuthFieldClass,
} from '@/components/business/MerchantAuthForm';

type FormData = {
  fullName: string;
  email: string;
  workEmail: string;
  password: string;
  businessName: string;
  displayName: string;
  category: string;
  categoryId: string;
  subcategory: string;
  subcategoryId: string;
  location: string;
  city: string;
  cityCode: string;
  state: string;
  stateCode: string;
  country: string;
  countryCode: string;
  publicPhone: string;
  addressLine1: string;
  addressLine2: string;
};

type BusinessRegisterWizardProps = {
  step: number;
  stepLabels: string[];
  loading: boolean;
  mobile: string;
  formData: FormData;
  passwordVisible: boolean;
  onPasswordVisibleChange: (visible: boolean) => void;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onFormPatch: (patch: Partial<FormData>) => void;
  categoryOptions: SelectOption[];
  subcategoryOptions: SelectOption[];
  loadingSubcategories: boolean;
  showSubcategory: boolean;
  onCategoryChange: (categoryId: string) => void;
  onSubcategoryChange: (subcategoryId: string) => void;
  countryOptions: SelectOption[];
  stateOptions: SelectOption[];
  cityOptions: SelectOption[];
  registeredBusiness: {
    id: string;
    registrationNumber: string;
    businessName?: string;
    fullName?: string;
    email?: string;
    mobile?: string;
  } | null;
  selectedPlan?: string;
  billingCycle?: BillingCycle;
  contactEmail?: string;
  contactName?: string;
  onPaymentSuccess?: () => void;
  onBack: () => void;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

function MerchantRegisterStepBar({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <nav aria-label="Registration progress" className="mb-8">
      <ol className="flex items-center">
        {steps.map((label, i) => {
          const num = i + 1;
          const done = current > num;
          const active = current === num;
          return (
            <li key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    done
                      ? 'bg-emerald-500 text-white'
                      : active
                        ? 'bg-[#153551] text-white'
                        : 'border-2 border-[#cfd8e3] bg-white text-[#64748b]'
                  }`}
                >
                  {done ? <CheckCircle2 size={17} strokeWidth={2.5} /> : num}
                </span>
                <span
                  className={`hidden max-w-[5.5rem] text-center text-[11px] font-semibold leading-tight sm:block ${
                    active ? 'text-[#153551]' : 'text-[#64748b]'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`mx-2 mb-5 hidden h-0.5 flex-1 sm:block ${done ? 'bg-emerald-400' : 'bg-[#e8edf2]'}`}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm font-semibold text-[#153551] sm:hidden">{steps[current - 1]}</p>
    </nav>
  );
}

export default function BusinessRegisterWizard({
  step,
  stepLabels,
  loading,
  mobile,
  formData,
  passwordVisible,
  onPasswordVisibleChange,
  onFormChange,
  onFormPatch,
  categoryOptions,
  subcategoryOptions,
  loadingSubcategories,
  showSubcategory,
  onCategoryChange,
  onSubcategoryChange,
  countryOptions,
  stateOptions,
  cityOptions,
  registeredBusiness,
  selectedPlan = 'free',
  billingCycle = 'monthly',
  contactEmail = '',
  contactName = '',
  onPaymentSuccess,
  onBack,
  onClose,
  onPrev,
  onNext,
}: BusinessRegisterWizardProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [step]);

  return (
    <MerchantAuthPage>
      <section className="register-hero relative overflow-hidden pb-16 sm:pb-20">
        <div className="register-hero-bg pointer-events-none absolute inset-0" aria-hidden />

        <MerchantAuthMain className="relative z-10">
          <div className="mb-6 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#153551] transition-colors hover:text-[#215481]"
            >
              <ChevronLeft size={16} />
              Back
            </button>
            <div className="flex items-center gap-3">
              <Link
                href="/business/login"
                className="text-sm font-semibold text-[#215481] hover:text-[#153551] hover:underline"
              >
                Sign in
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-[#64748b] transition-colors hover:bg-white/80 hover:text-[#153551]"
                aria-label="Close registration"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="relative mx-auto max-w-2xl">
            <MerchantRegisterStepBar steps={stepLabels} current={step} />

            {loading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-white/90 backdrop-blur-sm">
                <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#153551] border-t-transparent" />
                <p className="text-sm font-medium text-[#3d4f63]">Creating your listing…</p>
              </div>
            )}

            <div className={step === 1 ? 'space-y-6' : 'hidden'} aria-hidden={step !== 1}>
                <MerchantAuthFormHeader
                  title="Account details"
                  subtitle="Set up your partner account to manage your listing."
                />
                <div className="space-y-4">
                  <MerchantAuthField
                    id="fullName"
                    label="Owner full name"
                    value={formData.fullName}
                    onChange={(v) => onFormPatch({ fullName: v })}
                    placeholder="Your full name (for account & owner records)"
                    icon={User}
                    autoComplete="name"
                  />
                  <MerchantAuthField
                    id="email"
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(v) => onFormPatch({ email: v })}
                    placeholder="you@business.com"
                    icon={Mail}
                    autoComplete="email"
                  />
                  <MerchantAuthField
                    id="password"
                    label="Password"
                    type={passwordVisible ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(v) => onFormPatch({ password: v })}
                    placeholder="At least 6 characters"
                    icon={Lock}
                    autoComplete="new-password"
                    trailing={
                      <button
                        type="button"
                        onClick={() => onPasswordVisibleChange(!passwordVisible)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#94a3b8] transition-colors hover:text-[#153551]"
                        aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                      >
                        {passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    }
                  />
                  <div>
                    <label className="merchant-auth-label">Verified mobile</label>
                    <div className="merchant-auth-phone-field relative flex items-stretch overflow-hidden rounded-2xl border-2 border-emerald-500/80 bg-white shadow-[0_0_0_3px_rgba(16,185,129,0.1)]">
                      <IndiaPhonePrefix variant="merchant" />
                      <input
                        readOnly
                        disabled
                        value={formatIndianMobileDisplay(mobile)}
                        className="min-w-0 flex-1 bg-white px-3.5 py-3.5 text-[16px] font-semibold tabular-nums text-[#0f273b] sm:px-4 sm:py-4"
                      />
                      <CheckCircle2
                        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500"
                        size={18}
                        strokeWidth={2.5}
                      />
                    </div>
                  </div>
                </div>
            </div>

            <div className={step === 2 ? 'space-y-6' : 'hidden'} aria-hidden={step !== 2}>
                <MerchantAuthFormHeader
                  title="Business details"
                  subtitle="Help customers find and contact your business."
                />
                <div className="space-y-4">
                  <MerchantAuthField
                    id="businessName"
                    label="Legal business name"
                    value={formData.businessName}
                    onChange={(v) => onFormPatch({ businessName: v })}
                    placeholder="As on registration / GST certificate"
                    icon={Building2}
                  />
                  <p className="-mt-2 text-xs leading-relaxed text-[#64748b]">
                    Registered legal name. Changes later require admin approval in Settings.
                  </p>
                  <MerchantAuthField
                    id="displayName"
                    label="Business display name"
                    value={formData.displayName}
                    onChange={(v) => onFormPatch({ displayName: v })}
                    placeholder="Name shown on your public profile"
                    icon={Building2}
                  />
                  <p className="-mt-2 text-xs leading-relaxed text-[#64748b]">
                    This is what customers see on FinderB. Leave blank to use your legal name.
                  </p>
                  <SearchableSelect
                    tone="merchant"
                    label="Category"
                    options={categoryOptions}
                    value={formData.categoryId}
                    onChange={onCategoryChange}
                    placeholder="Select category"
                    icon={<Briefcase size={17} />}
                  />
                  {showSubcategory && (
                    <SearchableSelect
                      tone="merchant"
                      label="Subcategory"
                      options={subcategoryOptions}
                      value={formData.subcategoryId}
                      onChange={onSubcategoryChange}
                      placeholder={loadingSubcategories ? 'Loading subcategories…' : 'Select subcategory'}
                      icon={<Briefcase size={17} />}
                      disabled={!formData.categoryId || loadingSubcategories}
                      loading={loadingSubcategories}
                    />
                  )}
                  <MerchantAuthField
                    id="addressLine1"
                    label="Address line 1"
                    value={formData.addressLine1}
                    onChange={(v) => onFormPatch({ addressLine1: v })}
                    placeholder="Building, street, area"
                    icon={MapPin}
                  />
                  <MerchantAuthField
                    id="addressLine2"
                    label="Address line 2"
                    value={formData.addressLine2}
                    onChange={(v) => onFormPatch({ addressLine2: v })}
                    placeholder="Landmark, floor, suite (optional)"
                    icon={MapPin}
                  />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <SearchableSelect
                      tone="merchant"
                      label="Country"
                      options={countryOptions}
                      value={formData.countryCode}
                      onChange={(val) => {
                        const country = countryOptions.find((c) => c.value === val);
                        onFormPatch({
                          countryCode: val,
                          country: country?.label || '',
                          stateCode: '',
                          state: '',
                          city: '',
                        });
                      }}
                      placeholder="Select country"
                    />
                    <SearchableSelect
                      tone="merchant"
                      label="State"
                      options={stateOptions}
                      value={formData.stateCode}
                      onChange={(val) => {
                        const stateName = stateOptions.find((s) => s.value === val)?.label || '';
                        onFormPatch({ stateCode: val, state: stateName, city: '' });
                      }}
                      placeholder="Select state"
                      icon={<MapPin size={17} />}
                      disabled={!formData.countryCode}
                    />
                    <SearchableSelect
                      tone="merchant"
                      label="City"
                      options={cityOptions}
                      value={formData.city}
                      onChange={(val) => onFormPatch({ city: val })}
                      placeholder="Select city"
                      icon={<Building2 size={17} />}
                      disabled={!formData.stateCode}
                    />
                  </div>
                  <div>
                    <label htmlFor="publicPhone" className="merchant-auth-label">
                      Display phone number
                    </label>
                    <IndianPhoneInput
                      id="publicPhone"
                      value={formData.publicPhone}
                      onChange={(digits) => onFormPatch({ publicPhone: digits })}
                      variant="merchant"
                      placeholder="98765 43210"
                    />
                    <p className="mt-2 text-xs leading-relaxed text-[#64748b]">{INDIAN_PHONE_FIELD_HINT}</p>
                  </div>
                </div>
            </div>

            {step === 3 && registeredBusiness && (
              <div className="space-y-8 py-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-white">
                  <CheckCircle2 size={32} strokeWidth={2.25} />
                </div>
                <div>
                  <h2 className="merchant-auth-form-title text-center text-[1.5rem]">Registration complete</h2>
                  <p className="merchant-auth-form-subtitle mt-2 text-center">
                    Your business profile has been created. Save your ID below.
                  </p>
                </div>
                <div className="mx-auto max-w-sm rounded-2xl border-2 border-[#dfe6ee] bg-white px-5 py-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Business ID</p>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <span className="text-xl font-bold tracking-tight text-[#153551]">
                      {registeredBusiness.registrationNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(registeredBusiness.registrationNumber);
                        alert('Copied to clipboard');
                      }}
                      className="rounded-lg border-2 border-[#dfe6ee] bg-[#f8fafc] p-2 text-[#153551] transition-colors hover:border-[#153551]/30"
                      aria-label="Copy business ID"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-[#64748b]">
                  You can complete identity verification (KYC) later — handled by FinderB&apos;s verification partner, not in this form.
                </p>
                {selectedPlan === 'pro' && registeredBusiness?.id ? (
                  <div className="mx-auto max-w-sm rounded-2xl border-2 border-[#dfe6ee] bg-[#f8fafc] px-5 py-5 text-left">
                    <p className="text-sm font-semibold text-[#153551]">Activate Pro</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#64748b]">
                      Pay now to unlock leads, verified badge, and premium visibility on FinderB.
                    </p>
                    <MerchantRechargeButton
                      businessId={registeredBusiness.id}
                      businessName={registeredBusiness.businessName || formData.businessName}
                      fullName={contactName || registeredBusiness.fullName || formData.fullName}
                      email={contactEmail || registeredBusiness.email || formData.email}
                      mobile={registeredBusiness.mobile || mobile}
                      billingCycle={billingCycle}
                      directCheckout
                      label="Pay now"
                      className="mt-4 w-full rounded-xl bg-[#153551] px-4 py-3 text-sm font-bold text-white hover:bg-[#215481] disabled:opacity-60"
                      onSuccess={onPaymentSuccess}
                      onError={(message) => alert(message)}
                    />
                    <p className="mt-3 text-center text-[11px] text-[#94a3b8]">
                      You can also pay later from your dashboard.
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#e8edf2] pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={onPrev}
                disabled={step === 1 || step === 3}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  step === 1 || step === 3
                    ? 'invisible pointer-events-none'
                    : 'text-[#3d4f63] hover:bg-white/80 hover:text-[#153551]'
                }`}
              >
                <ChevronLeft size={16} />
                Back
              </button>
              <MerchantAuthSubmitButton type="button" onClick={onNext} disabled={loading} loading={loading}>
                {step === 3 ? 'Go to dashboard' : step === 2 ? 'Submit listing' : 'Continue'}
              </MerchantAuthSubmitButton>
            </div>
          </div>
        </MerchantAuthMain>
      </section>
    </MerchantAuthPage>
  );
}
