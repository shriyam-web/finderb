import 'server-only';

import {
  consumeOtpChallenge,
  discardOtpChallenge,
  issueOtpChallenge,
  otpIssueErrorMessage,
} from '@/lib/auth/otpChallenge.server';
import { assertPhoneProof, issuePhoneProof } from '@/lib/auth/phoneVerify.server';
import { sendEmailOtpEmail } from '@/lib/email/sendEmailOtp';
import { extractIndianMobileDigits, isValidIndianMobileDigits } from '@/lib/indianPhone';
import { REGISTRATION_EMAIL_REGEX } from '@/lib/merchantRegistrationValidation';
import { isPlaceholderEmail } from '@/lib/placeholderEmail';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { getSessionBusinessId, isBusinessSupportSession } from '@/lib/security/session';
import { createServiceClient } from '@/lib/supabase/service';
import { sendWhatsAppOtp } from '@/lib/whatsapp/sendWhatsAppOtp';

/**
 * Signed-in merchants confirm (or replace) the login email and owner mobile on file.
 * A code proves the merchant controls the new value; only then is it saved and flagged verified.
 */

type Failure = { success: false; error: string };
type Sent = { success: true; message: string };
export type ContactVerified = { success: true; value: string; message: string };

export type MerchantContactStatus = {
  email: string;
  emailVerified: boolean;
  mobile: string;
  mobileVerified: boolean;
};

const emailPurpose = (businessId: string) => `merchant-verify-email:${businessId}`;
const mobilePurpose = (businessId: string) => `merchant-verify-mobile:${businessId}`;

const SIGNED_OUT = 'Your session has ended. Please log in again.';
const EMAIL_TAKEN = 'This email is already used by another FinderB business. Use a different email.';
const MOBILE_TAKEN =
  'This mobile number is already registered with another FinderB business. Use a different number.';

async function sessionBusiness(): Promise<{ id: string } | Failure> {
  const id = await getSessionBusinessId();
  if (!id) return { success: false, error: SIGNED_OUT };
  if (await isBusinessSupportSession()) {
    return { success: false, error: 'Only the business owner can verify contact details.' };
  }
  return { id };
}

function db() {
  const client = createServiceClient();
  if (!client) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  return client;
}

function parseEmail(raw: unknown): string | null {
  const email = String(raw || '').trim().toLowerCase();
  if (!email || !REGISTRATION_EMAIL_REGEX.test(email) || isPlaceholderEmail(email)) return null;
  return email;
}

function parseMobile(raw: unknown): string | null {
  const mobile = extractIndianMobileDigits(raw);
  return isValidIndianMobileDigits(mobile) ? mobile : null;
}

async function emailUsedElsewhere(businessId: string, email: string): Promise<boolean> {
  const client = db();
  const [byEmail, byWork] = await Promise.all([
    client.from('Business').select('id').ilike('email', email).neq('id', businessId).limit(1),
    client.from('Business').select('id').ilike('workEmail', email).neq('id', businessId).limit(1),
  ]);
  const failed = byEmail.error ?? byWork.error;
  if (failed) throw failed;
  return Boolean(byEmail.data?.length || byWork.data?.length);
}

async function mobileUsedElsewhere(businessId: string, mobile: string): Promise<boolean> {
  const client = db();
  const pattern = `%${mobile}`;
  const [byMobile, byOwner] = await Promise.all([
    client.from('Business').select('id').ilike('mobile', pattern).neq('id', businessId).limit(1),
    client.from('Business').select('id').ilike('owner_mobile', pattern).neq('id', businessId).limit(1),
  ]);
  const failed = byMobile.error ?? byOwner.error;
  if (failed) throw failed;
  return Boolean(byMobile.data?.length || byOwner.data?.length);
}

export async function getMerchantContactStatus(): Promise<
  ({ success: true } & MerchantContactStatus) | Failure
> {
  const session = await sessionBusiness();
  if ('success' in session) return session;
  const { data, error } = await db()
    .from('Business')
    .select('email, workEmail, emailVerified, mobile, mobileVerified')
    .eq('id', session.id)
    .maybeSingle();
  if (error || !data) return { success: false, error: SIGNED_OUT };
  const email = [data.workEmail, data.email]
    .map((value) => String(value || '').trim().toLowerCase())
    .find((value) => value && !isPlaceholderEmail(value));
  return {
    success: true,
    email: email || '',
    emailVerified: Boolean(data.emailVerified),
    mobile: parseMobile(data.mobile) || '',
    mobileVerified: Boolean(data.mobileVerified),
  };
}

export async function requestMerchantEmailVerifyCode(rawEmail: unknown): Promise<Sent | Failure> {
  const session = await sessionBusiness();
  if ('success' in session) return session;
  const email = parseEmail(rawEmail);
  if (!email) return { success: false, error: 'Enter a valid email address.' };

  const ipLimit = await enforceRateLimit('auth', 'merchant-verify-send');
  if (!ipLimit.ok) return { success: false, error: ipLimit.error };
  const limit = await enforceRateLimit('authEmail', `merchant-verify-email:${session.id}`);
  if (!limit.ok) return { success: false, error: limit.error };

  try {
    if (await emailUsedElsewhere(session.id, email)) return { success: false, error: EMAIL_TAKEN };
  } catch {
    return { success: false, error: 'Could not check this email. Please try again.' };
  }

  let code = '';
  try {
    code = await issueOtpChallenge(emailPurpose(session.id), email);
  } catch (error) {
    return {
      success: false,
      error: otpIssueErrorMessage(error, 'Could not prepare the verification code. Please try again shortly.'),
    };
  }
  if (!(await sendEmailOtpEmail(email, code, 'account'))) {
    await discardOtpChallenge(emailPurpose(session.id), email);
    return { success: false, error: 'Could not send the verification email. Please try again shortly.' };
  }
  return { success: true, message: 'We sent a 6-digit code to this email. It expires in 15 minutes.' };
}

export async function confirmMerchantEmailVerifyCode(
  rawEmail: unknown,
  code: string,
): Promise<ContactVerified | Failure> {
  const session = await sessionBusiness();
  if ('success' in session) return session;
  const email = parseEmail(rawEmail);
  if (!email) return { success: false, error: 'Enter a valid email address.' };

  const limit = await enforceRateLimit('authEmail', `merchant-verify-email-check:${session.id}`);
  if (!limit.ok) return { success: false, error: limit.error };

  if (!(await consumeOtpChallenge(emailPurpose(session.id), email, code))) {
    return { success: false, error: 'Invalid or expired code. Check the email and try again.' };
  }

  try {
    if (await emailUsedElsewhere(session.id, email)) return { success: false, error: EMAIL_TAKEN };
    const { error } = await db()
      .from('Business')
      .update({
        email,
        workEmail: email,
        emailVerified: true,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', session.id);
    if (error) throw error;
  } catch {
    return { success: false, error: 'Could not save this email. Please try again.' };
  }
  return { success: true, value: email, message: 'Email verified.' };
}

export async function requestMerchantMobileVerifyCode(rawMobile: unknown): Promise<Sent | Failure> {
  const session = await sessionBusiness();
  if ('success' in session) return session;
  const mobile = parseMobile(rawMobile);
  if (!mobile) return { success: false, error: 'Enter a 10-digit Indian mobile number.' };

  const ipLimit = await enforceRateLimit('auth', 'merchant-verify-send');
  if (!ipLimit.ok) return { success: false, error: ipLimit.error };
  const limit = await enforceRateLimit('authEmail', `merchant-verify-mobile:${session.id}`);
  if (!limit.ok) return { success: false, error: limit.error };

  try {
    if (await mobileUsedElsewhere(session.id, mobile)) return { success: false, error: MOBILE_TAKEN };
  } catch {
    return { success: false, error: 'Could not check this number. Please try again.' };
  }

  let code = '';
  try {
    code = await issueOtpChallenge(mobilePurpose(session.id), mobile);
  } catch (error) {
    return {
      success: false,
      error: otpIssueErrorMessage(error, 'Could not prepare the verification code. Please try again shortly.'),
    };
  }
  const sent = await sendWhatsAppOtp(`91${mobile}`, code);
  if (!sent.ok) {
    await discardOtpChallenge(mobilePurpose(session.id), mobile);
    return { success: false, error: sent.error };
  }
  return { success: true, message: 'We sent a 6-digit code on WhatsApp to this number.' };
}

const ownerPurpose = (businessId: string) => `merchant-owner-mobile:${businessId}`;
const ownerProofSubject = (businessId: string) => `merchant-owner:${businessId}`;
const PHONE_UNVERIFIED = {
  owner: 'Verify the new owner mobile with the WhatsApp code before saving.',
  whatsapp: 'Verify the new WhatsApp number with the code we send on WhatsApp before saving.',
} as const;

/**
 * Owner mobile and WhatsApp number both need a code before a new value is saved.
 * The proof only says "this merchant controls this number", so one proof covers either field.
 */
export async function requestMerchantOwnerMobileCode(rawMobile: unknown): Promise<Sent | Failure> {
  const session = await sessionBusiness();
  if ('success' in session) return session;
  const mobile = parseMobile(rawMobile);
  if (!mobile) return { success: false, error: 'Enter a 10-digit Indian mobile number.' };

  const ipLimit = await enforceRateLimit('auth', 'merchant-verify-send');
  if (!ipLimit.ok) return { success: false, error: ipLimit.error };
  const limit = await enforceRateLimit('authEmail', `merchant-owner-mobile:${session.id}`);
  if (!limit.ok) return { success: false, error: limit.error };

  try {
    if (await mobileUsedElsewhere(session.id, mobile)) return { success: false, error: MOBILE_TAKEN };
  } catch {
    return { success: false, error: 'Could not check this number. Please try again.' };
  }

  let code = '';
  try {
    code = await issueOtpChallenge(ownerPurpose(session.id), mobile);
  } catch (error) {
    return {
      success: false,
      error: otpIssueErrorMessage(error, 'Could not prepare the verification code. Please try again shortly.'),
    };
  }
  const sent = await sendWhatsAppOtp(`91${mobile}`, code);
  if (!sent.ok) {
    await discardOtpChallenge(ownerPurpose(session.id), mobile);
    return { success: false, error: sent.error };
  }
  return { success: true, message: 'We sent a 6-digit code on WhatsApp to this number.' };
}

export async function confirmMerchantOwnerMobileCode(
  rawMobile: unknown,
  code: string,
): Promise<(ContactVerified & { ownerMobileVerificationToken: string }) | Failure> {
  const session = await sessionBusiness();
  if ('success' in session) return session;
  const mobile = parseMobile(rawMobile);
  if (!mobile) return { success: false, error: 'Enter a 10-digit Indian mobile number.' };

  const limit = await enforceRateLimit('authEmail', `merchant-owner-mobile-check:${session.id}`);
  if (!limit.ok) return { success: false, error: limit.error };

  if (!(await consumeOtpChallenge(ownerPurpose(session.id), mobile, code))) {
    return { success: false, error: 'Invalid or expired code. Check WhatsApp and try again.' };
  }
  return {
    success: true,
    value: mobile,
    ownerMobileVerificationToken: issuePhoneProof(ownerProofSubject(session.id), mobile),
    message: 'Number verified. Save to keep it.',
  };
}

export function assertOwnerMobileProof(
  businessId: string,
  mobile: string,
  token: unknown,
  field: keyof typeof PHONE_UNVERIFIED = 'owner',
) {
  return assertPhoneProof(
    ownerProofSubject(businessId),
    mobile,
    typeof token === 'string' ? token : null,
    PHONE_UNVERIFIED[field],
  );
}

export async function confirmMerchantMobileVerifyCode(
  rawMobile: unknown,
  code: string,
): Promise<ContactVerified | Failure> {
  const session = await sessionBusiness();
  if ('success' in session) return session;
  const mobile = parseMobile(rawMobile);
  if (!mobile) return { success: false, error: 'Enter a 10-digit Indian mobile number.' };

  const limit = await enforceRateLimit('authEmail', `merchant-verify-mobile-check:${session.id}`);
  if (!limit.ok) return { success: false, error: limit.error };

  if (!(await consumeOtpChallenge(mobilePurpose(session.id), mobile, code))) {
    return { success: false, error: 'Invalid or expired code. Check WhatsApp and try again.' };
  }

  try {
    if (await mobileUsedElsewhere(session.id, mobile)) return { success: false, error: MOBILE_TAKEN };
    const { error } = await db()
      .from('Business')
      .update({ mobile, publicPhone: mobile, mobileVerified: true, updatedAt: new Date().toISOString() })
      .eq('id', session.id);
    if (error) {
      if (error.code === '23505') return { success: false, error: MOBILE_TAKEN };
      throw error;
    }
  } catch {
    return { success: false, error: 'Could not save this number. Please try again.' };
  }
  return { success: true, value: mobile, message: 'Mobile number verified.' };
}
