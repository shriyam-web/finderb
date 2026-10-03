import { SITE_URL, supabase } from './supabase';

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

function storedMobile(value: string) {
  let digits = value.replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export const EMAIL_TAKEN = 'This email is already registered with FinderB Business. Log in instead, or use another email.';
export const MOBILE_TAKEN = 'This mobile number is already registered with FinderB Business. Log in instead, or use another number.';

function likeLiteral(value: string) {
  return value.replace(/[%_\\]/g, '\\$&');
}

export const EMAIL_IS_USER =
  'This email belongs to a FinderB user account. Use a different email for your business.';
export const MOBILE_IS_USER =
  'This mobile number is linked to a FinderB user account. Use a different number for your business.';

type AccountKind = 'user' | 'merchant' | 'admin';

export type BusinessTaken = {
  emailTaken: boolean;
  mobileTaken: boolean;
  /** Which kind of account already owns each value, when known. */
  emailRegisteredAs?: AccountKind | null;
  mobileRegisteredAs?: AccountKind | null;
};

export function emailTakenMessage(taken: BusinessTaken | null) {
  return taken?.emailRegisteredAs && taken.emailRegisteredAs !== 'merchant'
    ? EMAIL_IS_USER
    : EMAIL_TAKEN;
}

export function mobileTakenMessage(taken: BusinessTaken | null) {
  return taken?.mobileRegisteredAs && taken.mobileRegisteredAs !== 'merchant'
    ? MOBILE_IS_USER
    : MOBILE_TAKEN;
}

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
      emailRegisteredAs: body.emailRegisteredAs ?? null,
      mobileRegisteredAs: body.mobileRegisteredAs ?? null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

type Lookup = PromiseLike<{ data: unknown[] | null; error: unknown }>;

/**
 * Email and mobile each identify one account (merchants and users can log in with either),
 * so a new business may not reuse a value held by any business or user. Emails match any case;
 * mobiles match the last 10 digits, so `+91…`, `91…` and `0…` forms all count. Null if the lookup failed.
 */
export async function checkBusinessTaken(input: {
  email?: string;
  mobile?: string;
}): Promise<BusinessTaken | null> {
  const email = input.email?.trim().toLowerCase() || '';
  const mobile = input.mobile ? storedMobile(input.mobile) : '';
  const hasMobile = mobile.length === 10;
  if (!email && !hasMobile) return { emailTaken: false, mobileTaken: false };
  const fromServer = await serverTaken(email, hasMobile ? mobile : '');
  if (fromServer) return fromServer;

  // Direct read for while the server route is unreachable; limited to rows the public key can see.
  if (!supabase) return null;
  const db = supabase;
  const none: Lookup = Promise.resolve({ data: [], error: null });
  const emailPattern = likeLiteral(email);
  const mobilePattern = `%${mobile}`;

  try {
    const [bizEmail, bizWorkEmail, userEmail, bizMobile, bizOwnerMobile, userPhone] = await Promise.all([
      email ? db.from('Business').select('id').ilike('email', emailPattern).limit(1) : none,
      email ? db.from('Business').select('id').ilike('workEmail', emailPattern).limit(1) : none,
      email ? db.from('User').select('id').ilike('email', emailPattern).limit(1) : none,
      hasMobile ? db.from('Business').select('id').ilike('mobile', mobilePattern).limit(1) : none,
      hasMobile ? db.from('Business').select('id').ilike('owner_mobile', mobilePattern).limit(1) : none,
      hasMobile ? db.from('User').select('id').ilike('phone', mobilePattern).limit(1) : none,
    ]);
    if ([bizEmail, bizWorkEmail, userEmail, bizMobile, bizOwnerMobile, userPhone].some((res) => res.error)) {
      return null;
    }
    const hit = (res: { data: unknown[] | null }) => Boolean(res.data?.length);
    const emailBiz = hit(bizEmail) || hit(bizWorkEmail);
    const mobileBiz = hit(bizMobile) || hit(bizOwnerMobile);
    return {
      emailTaken: emailBiz || hit(userEmail),
      mobileTaken: mobileBiz || hit(userPhone),
      emailRegisteredAs: emailBiz ? 'merchant' : hit(userEmail) ? 'user' : null,
      mobileRegisteredAs: mobileBiz ? 'merchant' : hit(userPhone) ? 'user' : null,
    };
  } catch {
    return null;
  }
}

export async function submitBusinessRegistration(
  payload: RegisterPayload & { emailVerificationToken: string },
): Promise<RegisterResult> {
  const email = payload.email.trim().toLowerCase();
  const mobile = storedMobile(payload.mobile);
  const taken = await checkBusinessTaken({ email, mobile });
  if (!taken) {
    return { success: false, error: 'Could not register the business. Please try again.' };
  }
  if (taken.emailTaken) return { success: false, error: emailTakenMessage(taken), taken: 'email' };
  if (taken.mobileTaken) return { success: false, error: mobileTakenMessage(taken), taken: 'mobile' };

  if (!payload.emailVerificationToken.trim()) {
    return { success: false, error: 'Verify your work email with the code we send you.' };
  }

  let result: RegisterResult & { registeredAs?: string };
  try {
    result = await postBusinessJson('/api/business/mobile/register', {
      ...payload,
      email,
      mobile,
      publicPhone: storedMobile(payload.publicPhone),
      emailVerificationToken: payload.emailVerificationToken,
    });
  } catch {
    return { success: false, error: 'Could not register the business. Please try again.' };
  }

  if (result.success) return { success: true };
  const message = result.error || 'Could not register the business. Please try again.';
  const conflict = /already registered|already exists|user account|sign in instead/i.test(message);
  const isUser = result.registeredAs === 'user' || /user account/i.test(message);
  if (conflict && /mobile|number/i.test(message) && !/email/i.test(message)) {
    return { success: false, error: isUser ? MOBILE_IS_USER : MOBILE_TAKEN, taken: 'mobile' };
  }
  if (conflict && /email/i.test(message)) {
    return { success: false, error: isUser ? EMAIL_IS_USER : EMAIL_TAKEN, taken: 'email' };
  }
  return { success: false, error: message };
}
