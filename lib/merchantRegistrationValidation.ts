import { indianMobileValidationError, normalizeIndianPhoneForStorage } from '@/lib/indianPhone';
import {
  combineBusinessAddress,
  validateRegistrationAddressLines,
} from '@/lib/businessAddress';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH_MERCHANT,
  validatePasswordLength,
} from '@/lib/security/passwordPolicy';

export const REGISTRATION_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PERSON_NAME_LENGTH = 2;
export const MIN_BUSINESS_NAME_LENGTH = 2;
export const MIN_DISPLAY_NAME_LENGTH = 2;

export type RegistrationStep1Input = {
  fullName: string;
  email: string;
  password: string;
  mobile: string;
};

export type RegistrationStep2Input = {
  businessName: string;
  displayName?: string;
  categoryId: string;
  subcategoryId: string;
  city: string;
  state: string;
  country: string;
  countryCode?: string;
  stateCode?: string;
  publicPhone: string;
  addressLine1: string;
  addressLine2?: string;
  hasSubcategories: boolean;
};

export type NormalizedRegistrationData = {
  fullName: string;
  email: string;
  password: string;
  mobile: string;
  businessName: string;
  displayName: string;
  category: string;
  city: string;
  state: string;
  country: string;
  publicPhone: string;
  businessAddress: string;
  location: string;
  selectedPlan?: string;
  billingCycle?: string;
};

function validatePersonName(value: string, label: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return `Please enter ${label}.`;
  if (trimmed.length < MIN_PERSON_NAME_LENGTH) {
    return `${label} must be at least ${MIN_PERSON_NAME_LENGTH} characters.`;
  }
  return null;
}

function validateBusinessName(value: string, label = 'your legal business name'): string | null {
  const trimmed = value.trim();
  if (!trimmed) return `Please enter ${label}.`;
  if (trimmed.length < MIN_BUSINESS_NAME_LENGTH) {
    return `Legal business name must be at least ${MIN_BUSINESS_NAME_LENGTH} characters.`;
  }
  return null;
}

function validateDisplayName(value: string | undefined, fallbackLegalName: string): string | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return null;
  if (trimmed.length < MIN_DISPLAY_NAME_LENGTH) {
    return `Business display name must be at least ${MIN_DISPLAY_NAME_LENGTH} characters.`;
  }
  if (trimmed.toLowerCase() === fallbackLegalName.trim().toLowerCase()) {
    return null;
  }
  return null;
}

function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Please enter your email address.';
  if (!REGISTRATION_EMAIL_REGEX.test(trimmed)) {
    return 'Please enter a valid email address.';
  }
  return null;
}

function validatePassword(value: string): string | null {
  const result = validatePasswordLength(value, PASSWORD_MIN_LENGTH_MERCHANT);
  if (!result.ok) return result.error;
  if (value.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;
  }
  return null;
}

function validateMobile(value: string, fieldLabel = 'mobile number'): string | null {
  const error = indianMobileValidationError(value, { required: true });
  if (!error) return null;
  if (error === 'Enter your 10-digit mobile number.') {
    return `Please enter a valid 10-digit ${fieldLabel}.`;
  }
  return error;
}

export function validateRegistrationMobile(mobile: string): string | null {
  return validateMobile(mobile, 'mobile number');
}

export function validateRegistrationStep1(input: RegistrationStep1Input): string | null {
  return (
    validatePersonName(input.fullName, 'your full name') ??
    validateEmail(input.email) ??
    validatePassword(input.password) ??
    validateMobile(input.mobile, 'mobile number')
  );
}

export function validateRegistrationBusinessFields(data: {
  businessName: string;
  displayName?: string;
  category: string;
  city: string;
  state: string;
  country: string;
  publicPhone: string;
  addressLine1: string;
  addressLine2?: string;
}): string | null {
  const legalName = data.businessName.trim();

  return (
    validateBusinessName(data.businessName) ??
    validateDisplayName(data.displayName, legalName) ??
    (!data.category.trim() ? 'Please select a business category.' : null) ??
    validateRegistrationAddressLines(data.addressLine1, data.addressLine2) ??
    (!data.country.trim() ? 'Please select your country.' : null) ??
    (!data.state.trim() ? 'Please select your state.' : null) ??
    (!data.city.trim() ? 'Please select your city.' : null) ??
    validateMobile(data.publicPhone, 'display phone number')
  );
}

export function validateRegistrationStep2(input: RegistrationStep2Input): string | null {
  if (!input.categoryId) return 'Please select a business category.';
  if (input.hasSubcategories && !input.subcategoryId) {
    return 'Please select a subcategory.';
  }

  return validateRegistrationBusinessFields({
    businessName: input.businessName,
    displayName: input.displayName,
    category: 'selected',
    city: input.city,
    state: input.state,
    country: input.country,
    publicPhone: input.publicPhone,
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2,
  });
}

export function normalizeRegistrationStep1(input: RegistrationStep1Input) {
  return {
    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    mobile: normalizeIndianPhoneForStorage(input.mobile),
  };
}

export function normalizeRegistrationStep2(
  input: RegistrationStep2Input & { category: string; location?: string },
) {
  const businessName = input.businessName.trim();
  const displayName = input.displayName?.trim() || businessName;
  const city = input.city.trim();
  const state = input.state.trim();
  const country = input.country.trim() || 'India';

  return {
    businessName,
    displayName,
    category: input.category.trim(),
    city,
    state,
    country,
    publicPhone: normalizeIndianPhoneForStorage(input.publicPhone),
    businessAddress: combineBusinessAddress(input.addressLine1, input.addressLine2),
    location: input.location?.trim() || [city, state].filter(Boolean).join(', '),
  };
}

export function validateAndNormalizeRegistrationPayload(data: {
  fullName?: string;
  email?: string;
  password?: string;
  mobile?: string;
  businessName?: string;
  displayName?: string;
  category?: string;
  city?: string;
  state?: string;
  country?: string;
  publicPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  businessAddress?: string;
  location?: string;
  selectedPlan?: string;
  billingCycle?: string;
}): { ok: true; data: NormalizedRegistrationData } | { ok: false; error: string } {
  const step1Error = validateRegistrationStep1({
    fullName: data.fullName ?? '',
    email: data.email ?? '',
    password: data.password ?? '',
    mobile: data.mobile ?? '',
  });
  if (step1Error) return { ok: false, error: step1Error };

  const step2Error = validateRegistrationBusinessFields({
    businessName: data.businessName ?? '',
    displayName: data.displayName,
    category: data.category ?? '',
    city: data.city ?? '',
    state: data.state ?? '',
    country: data.country ?? '',
    publicPhone: data.publicPhone ?? '',
    addressLine1: data.addressLine1 ?? data.businessAddress ?? '',
    addressLine2: data.addressLine2,
  });
  if (step2Error) return { ok: false, error: step2Error };

  const step1 = normalizeRegistrationStep1({
    fullName: data.fullName ?? '',
    email: data.email ?? '',
    password: data.password ?? '',
    mobile: data.mobile ?? '',
  });

  const step2 = normalizeRegistrationStep2({
    businessName: data.businessName ?? '',
    displayName: data.displayName,
    category: data.category ?? '',
    city: data.city ?? '',
    state: data.state ?? '',
    country: data.country ?? '',
    publicPhone: data.publicPhone ?? '',
    addressLine1: data.addressLine1 ?? data.businessAddress ?? '',
    addressLine2: data.addressLine2,
    location: data.location,
    categoryId: '',
    subcategoryId: '',
    hasSubcategories: false,
  });

  return {
    ok: true,
    data: {
      ...step1,
      ...step2,
      selectedPlan: data.selectedPlan,
      billingCycle: data.billingCycle,
    },
  };
}
