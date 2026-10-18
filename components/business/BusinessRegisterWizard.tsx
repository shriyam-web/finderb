'use client';

import { useEffect, useState } from 'react';
import { otpSendLabel } from '@/hooks/useOtpCooldown';
import Link from 'next/link';
import {
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Copy,
  Mail,
  MapPin,
  User,
  X,
} from 'lucide-react';
import { SearchableSelect, type SelectOption } from '@/components/SearchableSelect';
import { MerchantAuthMain, MerchantAuthPage } from '@/components/business/MerchantAuthShell';
import MerchantRechargeButton from '@/components/business/MerchantRechargeButton';
import type { BillingCycle } from '@/lib/razorpay/plans';
import IndianPhoneInput from '@/components/IndianPhoneInput';
import { IndiaPhonePrefix } from '@/components/IndiaPhonePrefix';
import { formatIndianMobileDisplay } from '@/lib/indianPhone';
import {
  MerchantAuthField,
  MerchantAuthFormHeader,
  MerchantAuthSubmitButton,
} from '@/components/business/MerchantAuthForm';
import MerchantPasswordField from '@/components/business/MerchantPasswordField';
import OtpCodeBoxes from '@/components/auth/OtpCodeBoxes';
import RegisterMapPin, { type RegisterPin } from '@/components/business/RegisterMapPin';
import { MerchantFieldError, MerchantFormBanner } from '@/components/business/MerchantFieldError';
import type { RegistrationFieldErrors } from '@/lib/merchantRegistrationValidation';

type FormData = {
  fullName: string;
  email: string;
  workEmail: string;
  password: string;
  confirmPassword: string;
  businessName: string;
  displayName: string;
  category: string;
  categoryId: string;
  subcategory: string;
  subcategoryId: string;
  nestedSubcategoryId: string;
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
  fieldErrors: RegistrationFieldErrors;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onFormPatch: (patch: Partial<FormData>) => void;
  categoryOptions: SelectOption[];
  subcategoryOptions: SelectOption[];
  nestedSubcategoryOptions?: SelectOption[];
  loadingSubcategories: boolean;
  loadingNestedSubcategories?: boolean;
  showSubcategory: boolean;
  showNestedSubcategory?: boolean;
  onCategoryChange: (categoryId: string) => void;
  onSubcategoryChange: (subcategoryId: string) => void;
  onNestedSubcategoryChange?: (nestedSubcategoryId: string) => void;
  subcategoryLabel?: string;
  nestedSubcategoryLabel?: string;
  countryOptions: SelectOption[];
  stateOptions: SelectOption[];
  cityOptions: SelectOption[];
  mapPin: RegisterPin | null;
  onMapPinChange: (pin: RegisterPin | null) => void;
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
  emailOtpCode: string;
  onEmailOtpCodeChange: (value: string) => void;
  emailVerified: boolean;
  emailOtpSending: boolean;
  emailOtpVerifying: boolean;
  emailOtpHint?: string;
  emailOtpSent?: boolean;
  emailOtpWait?: number;
  onSendEmailOtp: () => void;
  onVerifyEmailOtp: (value?: string) => void;
  mobileOtp: MobileOtpState;
  whatsappNumber: string;
  onWhatsappChange: (digits: string) => void;
  useMobileForWhatsApp: boolean;
  onUseMobileForWhatsAppChange: (same: boolean) => void;
  whatsappOtp: MobileOtpState;
};

type MobileOtpState = {
  verified: boolean;
  sent: boolean;
  wait: number;
  sending: boolean;
  verifying: boolean;
  code: string;
  onCodeChange: (value: string) => void;
  onSend: () => void;
  onVerify: (value?: string) => void;
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
  fieldErrors,
  onFormChange,
  onFormPatch,
  categoryOptions,
  subcategoryOptions,
  nestedSubcategoryOptions = [],
  loadingSubcategories,
  loadingNestedSubcategories = false,
  showSubcategory,
  showNestedSubcategory = false,
  onCategoryChange,
  onSubcategoryChange,
  onNestedSubcategoryChange,
  subcategoryLabel = 'Category',
  nestedSubcategoryLabel = 'Subcategory',
  countryOptions,
  stateOptions,
  cityOptions,
  mapPin,
  onMapPinChange,
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
  emailOtpCode,
  onEmailOtpCodeChange,
  emailVerified,
  emailOtpSending,
  emailOtpVerifying,
  emailOtpHint,
  emailOtpSent = false,
  emailOtpWait = 0,
  onSendEmailOtp,
  onVerifyEmailOtp,
  mobileOtp,
  whatsappNumber,
  onWhatsappChange,
  useMobileForWhatsApp,
  onUseMobileForWhatsAppChange,
  whatsappOtp,
}: BusinessRegisterWizardProps) {
  const [accuracyAccepted, setAccuracyAccepted] = useState(false);
  const [accuracyError, setAccuracyError] = useState('');

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
                <MerchantFormBanner message={fieldErrors._form} />
                <div className="space-y-4">
                  <MerchantAuthField
                    id="fullName"
                    label="Owner full name"
                    value={formData.fullName}
                    onChange={(v) => onFormPatch({ fullName: v })}
                    placeholder="Your full name (for account & owner records)"
                    icon={User}
                    autoComplete="name"
                    error={fieldErrors.fullName}
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
                    error={fieldErrors.email}
                    endAction={
                      emailVerified ? undefined : (
                        <button
                          type="button"
                          onClick={onSendEmailOtp}
                          disabled={emailOtpSending || emailOtpWait > 0 || !formData.email.trim()}
                          className="h-8 min-w-[4.6rem] rounded-lg bg-[#153551] px-2 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          {emailOtpSending
                            ? 'Sending…'
                            : otpSendLabel(emailOtpSent, emailOtpWait > 0, emailOtpWait)}
                        </button>
                      )
                    }
                  />
                  {emailVerified ? (
                    <p className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                      <CheckCircle2 size={14} strokeWidth={2.5} />
                      Email verified
                    </p>
                  ) : emailOtpSent ? (
                    <div
                      id="field-emailOtp"
                      className="space-y-3 rounded-2xl border border-[#d7e2ee] bg-[#f7fafc] p-4"
                    >
                      <p className="text-center text-[13px] leading-relaxed text-[#475569]">
                        Enter the 6-digit code sent to{' '}
                        <span className="break-all font-semibold text-[#0f273b]">
                          {formData.email.trim()}
                        </span>
                      </p>
                      <OtpCodeBoxes
                        value={emailOtpCode}
                        onChange={onEmailOtpCodeChange}
                        onComplete={(value) => onVerifyEmailOtp(value)}
                        disabled={emailOtpVerifying}
                        tone="neutral"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => onVerifyEmailOtp()}
                        disabled={emailOtpVerifying || emailOtpCode.length !== 6}
                        className="w-full rounded-xl bg-[#153551] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f2840] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {emailOtpVerifying ? 'Verifying…' : 'Verify email'}
                      </button>
                      {emailOtpHint ? (
                        <p className="text-center text-[13px] font-medium text-emerald-700">{emailOtpHint}</p>
                      ) : null}
                      <MerchantFieldError message={fieldErrors.emailOtp} />
                    </div>
                  ) : (
                    <>
                      <p className="text-[13px] leading-relaxed text-[#64748b]">
                        Tap Send OTP to get a 6-digit code on this email.
                      </p>
                      <MerchantFieldError message={fieldErrors.emailOtp} />
                    </>
                  )}
                  <MerchantPasswordField
                    id="password"
                    label="Create password"
                    value={formData.password}
                    onChange={(v) => onFormPatch({ password: v })}
                    error={fieldErrors.password}
                  />
                  <MerchantPasswordField
                    id="confirmPassword"
                    label="Confirm password"
                    value={formData.confirmPassword}
                    onChange={(v) => onFormPatch({ confirmPassword: v })}
                    error={fieldErrors.confirmPassword}
                    showStrength={false}
                  />
                  <div id="field-mobile" className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <label className="merchant-auth-label">
                        {mobileOtp.verified ? 'Verified mobile' : 'Mobile number'}
                      </label>
                      {mobileOtp.verified ? null : (
                        <button
                          type="button"
                          onClick={onBack}
                          className="text-xs font-semibold text-[#215481] hover:underline"
                        >
                          Change number
                        </button>
                      )}
                    </div>
                    <div
                      className={`merchant-auth-phone-field relative flex items-stretch overflow-hidden rounded-2xl border-2 bg-white ${
                        mobileOtp.verified
                          ? 'border-emerald-500/80 shadow-[0_0_0_3px_rgba(16,185,129,0.1)]'
                          : 'border-[#cfd8e3]'
                      }`}
                    >
                      <IndiaPhonePrefix variant="merchant" />
                      <input
                        readOnly
                        disabled
                        value={formatIndianMobileDisplay(mobile)}
                        className="min-w-0 flex-1 bg-white px-3.5 py-3.5 text-[16px] font-semibold tabular-nums text-[#0f273b] sm:px-4 sm:py-4"
                      />
                      {mobileOtp.verified ? (
                        <CheckCircle2
                          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500"
                          size={18}
                          strokeWidth={2.5}
                        />
                      ) : (
                        <div className="flex items-center pr-2">
                          <button
                            type="button"
                            onClick={mobileOtp.onSend}
                            disabled={mobileOtp.sending || mobileOtp.wait > 0}
                            className="h-8 min-w-[4.6rem] rounded-lg bg-[#128C7E] px-2 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            {mobileOtp.sending
                              ? 'Sending…'
                              : otpSendLabel(mobileOtp.sent, mobileOtp.wait > 0, mobileOtp.wait)}
                          </button>
                        </div>
                      )}
                    </div>
                    {mobileOtp.verified ? (
                      <p className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 size={14} strokeWidth={2.5} />
                        Mobile verified on WhatsApp
                      </p>
                    ) : mobileOtp.sent ? (
                      <div className="space-y-3 rounded-2xl border border-[#d7e2ee] bg-[#f7fafc] p-4">
                        <p className="text-center text-[13px] leading-relaxed text-[#475569]">
                          OTP has been sent to the WhatsApp account linked to{' '}
                          <span className="whitespace-nowrap font-semibold text-[#0f273b]">
                            +91 {formatIndianMobileDisplay(mobile)}
                          </span>
                        </p>
                        <OtpCodeBoxes
                          value={mobileOtp.code}
                          onChange={mobileOtp.onCodeChange}
                          onComplete={(value) => mobileOtp.onVerify(value)}
                          disabled={mobileOtp.verifying}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => mobileOtp.onVerify()}
                          disabled={mobileOtp.verifying || mobileOtp.code.length !== 6}
                          className="w-full rounded-xl bg-[#128C7E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f7a6e] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {mobileOtp.verifying ? 'Verifying…' : 'Verify mobile'}
                        </button>
                      </div>
                    ) : (
                      <p className="text-[13px] leading-relaxed text-[#64748b]">
                        Tap Send OTP to get a 6-digit code on this number&apos;s WhatsApp.
                      </p>
                    )}
                    <MerchantFieldError message={fieldErrors.mobile} />
                  </div>
                </div>
            </div>

            <div className={step === 2 ? 'space-y-6' : 'hidden'} aria-hidden={step !== 2}>
                <MerchantAuthFormHeader
                  title="Business details"
                  subtitle="Help customers find and contact your business."
                />
                <div id="field-whatsappNumber" className="space-y-3">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={!useMobileForWhatsApp}
                      onClick={() => onUseMobileForWhatsAppChange(!useMobileForWhatsApp)}
                      className="flex items-start gap-2.5 text-left"
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-[11px] font-bold ${
                          !useMobileForWhatsApp
                            ? 'border-[#153551] bg-[#153551] text-white'
                            : 'border-[#cfd8e3] bg-white text-transparent'
                        }`}
                      >
                        ✓
                      </span>
                      <span className="text-[13px] font-medium leading-5 text-[#334155]">
                        I have a different WhatsApp number
                      </span>
                    </button>
                    <div className="flex items-center justify-between gap-3">
                      <label className="merchant-auth-label">
                        {whatsappOtp.verified ? 'Verified WhatsApp' : 'WhatsApp number'}
                      </label>
                    </div>
                    <div
                      className={`merchant-auth-phone-field relative flex items-stretch overflow-hidden rounded-2xl border-2 bg-white ${
                        whatsappOtp.verified
                          ? 'border-emerald-500/80 shadow-[0_0_0_3px_rgba(16,185,129,0.1)]'
                          : useMobileForWhatsApp
                            ? 'border-[#e2e8f0]'
                            : 'border-[#cfd8e3]'
                      }`}
                    >
                      <IndiaPhonePrefix variant="merchant" />
                      <input
                        id="whatsappNumber"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        disabled={useMobileForWhatsApp || whatsappOtp.verified}
                        value={formatIndianMobileDisplay(
                          useMobileForWhatsApp ? mobile : whatsappNumber,
                        )}
                        onChange={(e) => onWhatsappChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="WhatsApp number"
                        className="min-w-0 flex-1 bg-white px-3.5 py-3.5 text-[16px] font-semibold tabular-nums text-[#0f273b] outline-none placeholder:font-normal placeholder:text-[#94a3b8] disabled:cursor-not-allowed disabled:bg-[#f8fafc] sm:px-4 sm:py-4"
                      />
                      {whatsappOtp.verified ? (
                        <CheckCircle2
                          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500"
                          size={18}
                          strokeWidth={2.5}
                        />
                      ) : useMobileForWhatsApp ? null : (
                        <div className="flex items-center pr-2">
                          <button
                            type="button"
                            onClick={whatsappOtp.onSend}
                            disabled={
                              whatsappOtp.sending ||
                              whatsappOtp.wait > 0 ||
                              whatsappNumber.replace(/\D/g, '').length !== 10
                            }
                            className="h-8 min-w-[4.6rem] rounded-lg bg-[#128C7E] px-2 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            {whatsappOtp.sending
                              ? 'Sending…'
                              : otpSendLabel(whatsappOtp.sent, whatsappOtp.wait > 0, whatsappOtp.wait)}
                          </button>
                        </div>
                      )}
                    </div>
                    {whatsappOtp.verified ? (
                      <p className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 size={14} strokeWidth={2.5} />
                        {useMobileForWhatsApp
                          ? 'This verified mobile will be used as your WhatsApp number.'
                          : 'WhatsApp number verified.'}
                      </p>
                    ) : useMobileForWhatsApp ? (
                      <p className="text-[13px] leading-relaxed text-[#64748b]">
                        {mobileOtp.verified
                          ? 'This verified mobile will be used as your WhatsApp number.'
                          : 'Verify your mobile first. We will use it as your WhatsApp number.'}
                      </p>
                    ) : whatsappOtp.sent ? (
                      <div className="space-y-3 rounded-2xl border border-[#d7e2ee] bg-[#f7fafc] p-4">
                        <p className="text-center text-[13px] leading-relaxed text-[#475569]">
                          OTP has been sent to the WhatsApp account linked to{' '}
                          <span className="whitespace-nowrap font-semibold text-[#0f273b]">
                            +91 {formatIndianMobileDisplay(whatsappNumber)}
                          </span>
                        </p>
                        <OtpCodeBoxes
                          value={whatsappOtp.code}
                          onChange={whatsappOtp.onCodeChange}
                          onComplete={(value) => whatsappOtp.onVerify(value)}
                          disabled={whatsappOtp.verifying}
                          autoFocus={!mobileOtp.sent || mobileOtp.verified}
                        />
                        <button
                          type="button"
                          onClick={() => whatsappOtp.onVerify()}
                          disabled={whatsappOtp.verifying || whatsappOtp.code.length !== 6}
                          className="w-full rounded-xl bg-[#128C7E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f7a6e] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {whatsappOtp.verifying ? 'Verifying…' : 'Verify WhatsApp'}
                        </button>
                      </div>
                    ) : (
                      <p className="text-[13px] leading-relaxed text-[#64748b]">
                        Customers will message this number. Tap Send OTP to confirm it on WhatsApp.
                      </p>
                    )}
                    <MerchantFieldError message={fieldErrors.whatsappNumber} />
                  </div>
                <MerchantFormBanner message={fieldErrors._form} />
                <div className="space-y-4">
                  <MerchantAuthField
                    id="businessName"
                    label="Legal business name"
                    value={formData.businessName}
                    onChange={(v) => onFormPatch({ businessName: v })}
                    placeholder="As on registration / GST certificate"
                    icon={Building2}
                    maxLength={50}
                    error={fieldErrors.businessName}
                  />
                  <p className="-mt-2 text-xs leading-relaxed text-[#64748b]">
                    Registered legal name. Write it in one language only — Hindi and English together, or any mix, will not be saved. Changes later require admin approval in Settings.
                  </p>
                  <MerchantAuthField
                    id="displayName"
                    label="Business display name"
                    value={formData.displayName}
                    onChange={(v) => onFormPatch({ displayName: v })}
                    placeholder="Name shown on your public profile"
                    icon={Building2}
                    maxLength={50}
                    error={fieldErrors.displayName}
                  />
                  <p className="-mt-2 text-xs leading-relaxed text-[#64748b]">
                    This is what customers see on FinderB. One language only. Leave blank to use your legal name.
                  </p>
                  <SearchableSelect
                    tone="merchant"
                    id="categoryId"
                    label="Category"
                    options={categoryOptions}
                    value={formData.categoryId}
                    onChange={onCategoryChange}
                    placeholder="Select category"
                    icon={<Briefcase size={17} />}
                    error={fieldErrors.categoryId}
                  />
                  {showSubcategory && (
                    <SearchableSelect
                      tone="merchant"
                      id="subcategoryId"
                      label={subcategoryLabel}
                      options={subcategoryOptions}
                      value={formData.subcategoryId}
                      onChange={onSubcategoryChange}
                      placeholder={loadingSubcategories ? 'Loading…' : `Select ${subcategoryLabel.toLowerCase()}`}
                      icon={<Briefcase size={17} />}
                      disabled={!formData.categoryId || loadingSubcategories}
                      loading={loadingSubcategories}
                      error={fieldErrors.subcategoryId}
                    />
                  )}
                  {showNestedSubcategory && (
                    <SearchableSelect
                      tone="merchant"
                      id="nestedSubcategoryId"
                      label={nestedSubcategoryLabel}
                      options={nestedSubcategoryOptions}
                      value={formData.nestedSubcategoryId}
                      onChange={(id) => onNestedSubcategoryChange?.(id)}
                      placeholder={
                        loadingNestedSubcategories ? 'Loading subcategories…' : 'Select subcategory'
                      }
                      icon={<Briefcase size={17} />}
                      disabled={!formData.subcategoryId || loadingNestedSubcategories}
                      loading={loadingNestedSubcategories}
                      error={fieldErrors.nestedSubcategoryId}
                    />
                  )}
                  <MerchantAuthField
                    id="addressLine1"
                    label="Address line 1"
                    value={formData.addressLine1}
                    onChange={(v) => onFormPatch({ addressLine1: v })}
                    placeholder="Building, street, area"
                    icon={MapPin}
                    error={fieldErrors.addressLine1}
                  />
                  <MerchantAuthField
                    id="addressLine2"
                    label="Address line 2"
                    value={formData.addressLine2}
                    onChange={(v) => onFormPatch({ addressLine2: v })}
                    placeholder="Landmark, floor, suite (optional)"
                    icon={MapPin}
                    error={fieldErrors.addressLine2}
                  />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <SearchableSelect
                      tone="merchant"
                      id="country"
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
                      error={fieldErrors.country}
                    />
                    <SearchableSelect
                      tone="merchant"
                      id="state"
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
                      error={fieldErrors.state}
                    />
                    <SearchableSelect
                      tone="merchant"
                      id="city"
                      label="City"
                      options={cityOptions}
                      value={formData.city}
                      onChange={(val) => onFormPatch({ city: val })}
                      placeholder="Select city"
                      icon={<Building2 size={17} />}
                      disabled={!formData.stateCode}
                      error={fieldErrors.city}
                    />
                  </div>
                  <RegisterMapPin
                    city={formData.city}
                    state={formData.state}
                    country={formData.country}
                    pin={mapPin}
                    onChange={onMapPinChange}
                  />
                  <div>
                    <label htmlFor="publicPhone" className="merchant-auth-label">
                      Display phone number
                    </label>
                    <IndianPhoneInput
                      id="publicPhone"
                      value={formData.publicPhone}
                      onChange={() => {}}
                      variant="merchant"
                      placeholder="98765 43210"
                      error={fieldErrors.publicPhone}
                      disabled
                    />
                    <p className="mt-2 text-xs leading-relaxed text-[#64748b]">
                      Customers will see the mobile number you verified in the previous step.
                    </p>
                  </div>
                </div>
                <label className="mt-4 flex items-start gap-3 rounded-xl border border-[#e8edf2] bg-white px-3.5 py-3">
                  <input
                    type="checkbox"
                    checked={accuracyAccepted}
                    onChange={(event) => {
                      setAccuracyAccepted(event.target.checked);
                      if (event.target.checked) setAccuracyError('');
                    }}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#215481]"
                  />
                  <span className="text-xs leading-relaxed text-[#3d4f63]">
                    I confirm that the business particulars submitted here are true, complete, and not
                    misleading. I accept responsibility for their accuracy, and I agree that FinderB may
                    suspend or remove this listing if any particular is found to be false, incomplete, or
                    misleading.
                  </span>
                </label>
                {accuracyError ? <p className="mt-2 text-xs text-red-600">{accuracyError}</p> : null}
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
              <MerchantAuthSubmitButton
                type="button"
                onClick={() => {
                  if (step === 2 && !accuracyAccepted) {
                    setAccuracyError('Confirm that these particulars are accurate before submitting.');
                    return;
                  }
                  onNext();
                }}
                disabled={loading}
                loading={loading}
              >
                {step === 3 ? 'Go to dashboard' : step === 2 ? 'Submit listing' : 'Continue'}
              </MerchantAuthSubmitButton>
            </div>
          </div>
        </MerchantAuthMain>
      </section>
    </MerchantAuthPage>
  );
}
