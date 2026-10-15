import { mobileInputDigits } from './phoneInput';
import { SITE_URL } from './supabase';

export type RegisterPayload = {
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
  whatsappNumber: string;
  addressLine1: string;
  addressLine2?: string;
  latitude?: number;
  longitude?: number;
  selectedPlan: 'free';
  billingCycle: 'monthly';
};

type RegisterResult = { success: boolean; error?: string; taken?: 'email' | 'mobile' };

export type EmailOtpResult =
  | { success: true; message: string; emailVerificationToken?: string }
  | { success: false; error: string };

async function postBusinessJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${SITE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return { success: false, error: `Server error (${res.status}). Please try again.` } as T;
  }
}

export async function requestBusinessEmailOtp(email: string): Promise<EmailOtpResult> {
  return postBusinessJson('/api/business/mobile/otp', { email: email.trim().toLowerCase() });
}

export async function verifyBusinessEmailOtp(email: string, code: string): Promise<EmailOtpResult> {
  return postBusinessJson('/api/business/mobile/otp', {
    email: email.trim().toLowerCase(),
    code,
  });
}

export type PhoneOtpResult =
  | { success: true; message: string; phoneVerificationToken?: string }
  | { success: false; error: string };

/** Sends a WhatsApp code to the owner mobile; with `code`, verifies it and returns a proof. */
export async function requestBusinessPhoneOtp(mobile: string): Promise<PhoneOtpResult> {
  return postBusinessJson('/api/business/mobile/otp', { phone: storedMobile(mobile) });
}

export async function verifyBusinessPhoneOtp(mobile: string, code: string): Promise<PhoneOtpResult> {
  return postBusinessJson('/api/business/mobile/otp', { phone: storedMobile(mobile), code });
}

function storedMobile(value: string) {
  return mobileInputDigits(value);
}

export const EMAIL_TAKEN = 'This email is already registered with FinderB Business. Log in instead, or use another email.';
export const MOBILE_TAKEN = 'This mobile number is already registered with FinderB Business. Log in instead, or use another number.';

export type BusinessTaken = {
  /** Held by another business (or an admin), so the value cannot be used. */
  emailTaken: boolean;
  mobileTaken: boolean;
  /** Used by a FinderB user account; the owner may reuse it for the business after confirming. */
  emailOnUserAccount: boolean;
  mobileOnUserAccount: boolean;
};

const AVAILABILITY_TIMEOUT_MS = 6000;

/** Server lookup that can see every business, including ones still pending approval. */
async function serverTaken(email: string, mobile: string): Promise<BusinessTaken | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AVAILABILITY_TIMEOUT_MS);
  try {
    const res = await fetch(`${SITE_URL}/api/business/mobile/availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: email || undefined, mobile: mobile || undefined }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const body = (await res.json()) as Partial<BusinessTaken>;
    if (typeof body.emailTaken !== 'boolean' || typeof body.mobileTaken !== 'boolean') return null;
    return {
      emailTaken: body.emailTaken,
      mobileTaken: body.mobileTaken,
      emailOnUserAccount: body.emailOnUserAccount === true,
      mobileOnUserAccount: body.mobileOnUserAccount === true,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * A new business may not reuse an email or mobile held by another business. One held by a FinderB
 * user account is reported separately so the owner can confirm reusing it. Emails match any case;
 * mobiles match the last 10 digits, so `+91…`, `91…` and `0…` forms all count. Null if the lookup failed.
 */
export async function checkBusinessTaken(input: {
  email?: string;
  mobile?: string;
}): Promise<BusinessTaken | null> {
  const email = input.email?.trim().toLowerCase() || '';
  const mobile = input.mobile ? storedMobile(input.mobile) : '';
  const hasMobile = mobile.length === 10;
  if (!email && !hasMobile) {
    return { emailTaken: false, mobileTaken: false, emailOnUserAccount: false, mobileOnUserAccount: false };
  }
  return serverTaken(email, hasMobile ? mobile : '');
}

export async function submitBusinessRegistration(
  payload: RegisterPayload & {
    emailVerificationToken: string;
    phoneVerificationToken: string;
    whatsappVerificationToken?: string;
  },
): Promise<RegisterResult> {
  const email = payload.email.trim().toLowerCase();
  const mobile = storedMobile(payload.mobile);
  const taken = await checkBusinessTaken({ email, mobile });
  if (!taken) {
    return { success: false, error: 'Could not register the business. Please try again.' };
  }
  if (taken.emailTaken) return { success: false, error: EMAIL_TAKEN, taken: 'email' };
  if (taken.mobileTaken) return { success: false, error: MOBILE_TAKEN, taken: 'mobile' };

  if (!payload.emailVerificationToken.trim()) {
    return { success: false, error: 'Verify your work email with the code we send you.' };
  }
  if (!payload.phoneVerificationToken.trim()) {
    return {
      success: false,
      error: 'Verify your mobile number with the WhatsApp OTP before registering.',
    };
  }
  const whatsapp = storedMobile(payload.whatsappNumber || mobile);
  if (whatsapp.length !== 10) {
    return { success: false, error: 'Enter a valid WhatsApp number.' };
  }
  if (whatsapp !== mobile && !payload.whatsappVerificationToken?.trim()) {
    return {
      success: false,
      error: 'Verify your WhatsApp number with the OTP before registering.',
    };
  }

  let result: RegisterResult;
  try {
    result = await postBusinessJson('/api/business/mobile/register', {
      ...payload,
      email,
      mobile,
      publicPhone: storedMobile(payload.publicPhone),
      whatsappNumber: whatsapp,
      emailVerificationToken: payload.emailVerificationToken,
      whatsappVerificationToken: payload.whatsappVerificationToken || undefined,
    });
  } catch {
    return { success: false, error: 'Could not register the business. Please try again.' };
  }

  if (result.success) return { success: true };
  const message = result.error || 'Could not register the business. Please try again.';
  const conflict = /already registered|already exists|sign in instead/i.test(message);
  if (conflict && /mobile|number/i.test(message) && !/email/i.test(message)) {
    return { success: false, error: MOBILE_TAKEN, taken: 'mobile' };
  }
  if (conflict && /email/i.test(message)) {
    return { success: false, error: EMAIL_TAKEN, taken: 'email' };
  }
  return { success: false, error: message };
}
