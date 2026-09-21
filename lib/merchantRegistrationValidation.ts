import { indianMobileValidationError, normalizeIndianPhoneForStorage } from '@/lib/indianPhone';
import {
  combineBusinessAddress,
  validateRegistrationAddressLines,
} from '@/lib/businessAddress';
import {
  validateRegistrationPassword,
} from '@/lib/security/passwordStrength';

export const REGISTRATION_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RegistrationStep1Field = 'fullName' | 'email' | 'emailOtp' | 'password' | 'mobile';
export type RegistrationStep2Field =
  | 'businessName'
  | 'displayName'
  | 'categoryId'
  | 'subcategoryId'
  | 'nestedSubcategoryId'
  | 'addressLine1'
  | 'addressLine2'
  | 'country'
  | 'state'
  | 'city'
  | 'publicPhone';
export type RegistrationFieldKey = RegistrationStep1Field | RegistrationStep2Field | '_form';
export type RegistrationFieldErrors = Partial<Record<RegistrationFieldKey, string>>;

export function firstRegistrationFieldError(errors: RegistrationFieldErrors): string | null {
  const values = Object.values(errors).filter(Boolean);
  return values[0] ?? null;
}

export function mapRegistrationServerError(error: string): RegistrationFieldErrors {
  const lower = error.toLowerCase();
  if (lower.includes('email') && (lower.includes('otp') || lower.includes('verif') || lower.includes('code'))) {
    return { emailOtp: error };
  }
  if (lower.includes('email')) return { email: error };
  if (lower.includes('mobile') || lower.includes('phone')) return { mobile: error };
  if (lower.includes('password')) return { password: error };
  if (lower.includes('full name') || lower.includes('owner')) return { fullName: error };
  if (lower.includes('business name') || lower.includes('legal name')) return { businessName: error };
  if (lower.includes('category')) return { categoryId: error };
  if (lower.includes('subcategory')) return { subcategoryId: error };
  if (lower.includes('address')) return { addressLine1: error };
  if (lower.includes('country')) return { country: error };
  if (lower.includes('state')) return { state: error };
  if (lower.includes('city')) return { city: error };
  return { _form: error };
}

const REGISTRATION_FIELD_SCROLL_ORDER: RegistrationFieldKey[] = [
  'fullName',
  'email',
  'emailOtp',
  'password',
  'mobile',
  'businessName',
  'displayName',
  'categoryId',
  'subcategoryId',
  'nestedSubcategoryId',
  'addressLine1',
  'addressLine2',
  'country',
  'state',
  'city',
  'publicPhone',
];

export function scrollToFirstRegistrationError(errors: RegistrationFieldErrors) {
  if (typeof document === 'undefined') return;

  const firstKey = REGISTRATION_FIELD_SCROLL_ORDER.find((key) => errors[key]);
  if (!firstKey) return;

  requestAnimationFrame(() => {
    const el = document.getElementById(`field-${firstKey}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const focusable = el?.querySelector<HTMLElement>('input:not([disabled]),button,[tabindex="0"]');
    focusable?.focus({ preventScroll: true });
  });
}

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
  nestedSubcategoryId?: string;
  /** Joined multi-category labels already added via "Add category". */
  mappedCategories?: string;
  /** Current draft label from the cascading selects. */
  draftCategory?: string;
  city: string;
  state: string;
  country: string;
  countryCode?: string;
  stateCode?: string;
  publicPhone: string;
  addressLine1: string;
  addressLine2?: string;
  hasSubcategories: boolean;
  hasNestedSubcategories?: boolean;
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
  return validateRegistrationPassword(value);
}

function validateMobile(value: string, fieldLabel = 'mobile number'): string | null {
  const error = indianMobileValidationError(value, { required: true });
  if (!error) return null;
  if (error === 'Enter your mobile number.') {
    return `Please enter a valid 10-digit ${fieldLabel}.`;
  }
  return error;
}

function validatePublicPhone(value: string): string | null {
  return indianMobileValidationError(value, {
    required: true,
    allowLandline: true,
    label: 'display phone number',
  });
}

export function validateRegistrationMobile(mobile: string): string | null {
  return validateMobile(mobile, 'mobile number');
}

export function validateRegistrationStep1Fields(
  input: RegistrationStep1Input,
): RegistrationFieldErrors {
  const errors: RegistrationFieldErrors = {};

  const fullNameError = validatePersonName(input.fullName, 'your full name');
  if (fullNameError) errors.fullName = fullNameError;

  const emailError = validateEmail(input.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(input.password);
  if (passwordError) errors.password = passwordError;

  const mobileError = validateMobile(input.mobile, 'mobile number');
  if (mobileError) errors.mobile = mobileError;

  return errors;
}

export function validateRegistrationStep1(input: RegistrationStep1Input): string | null {
  return firstRegistrationFieldError(validateRegistrationStep1Fields(input));
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
    validatePublicPhone(data.publicPhone)
  );
}

export function validateRegistrationStep2Fields(
  input: RegistrationStep2Input,
): RegistrationFieldErrors {
  const errors: RegistrationFieldErrors = {};

  const hasMapped = Boolean((input.mappedCategories || '').trim());
  const hasDraft = Boolean((input.draftCategory || '').trim() || input.categoryId);

  if (!hasMapped && !hasDraft) {
    errors.categoryId = 'Please add at least one business category.';
  } else if (!hasMapped) {
    // Still completing the first mapping via cascading selects
    if (!input.categoryId) {
      errors.categoryId = 'Please select a business category.';
    }
    if (input.hasSubcategories && !input.subcategoryId) {
      errors.subcategoryId = 'Please select a subcategory.';
    }
    if (input.hasNestedSubcategories && !input.nestedSubcategoryId) {
      errors.nestedSubcategoryId = 'Please select a subcategory.';
    }
  }

  const businessNameError = validateBusinessName(input.businessName);
  if (businessNameError) errors.businessName = businessNameError;

  const displayNameError = validateDisplayName(input.displayName, input.businessName);
  if (displayNameError) errors.displayName = displayNameError;

  const addressError = validateRegistrationAddressLines(input.addressLine1, input.addressLine2);
  if (addressError) errors.addressLine1 = addressError;

  if (!input.country.trim()) errors.country = 'Please select your country.';
  if (!input.state.trim()) errors.state = 'Please select your state.';
  if (!input.city.trim()) errors.city = 'Please select your city.';

  const publicPhoneError = validatePublicPhone(input.publicPhone);
  if (publicPhoneError) errors.publicPhone = publicPhoneError;

  return errors;
}

export function validateRegistrationStep2(input: RegistrationStep2Input): string | null {
  return firstRegistrationFieldError(validateRegistrationStep2Fields(input));
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
