import 'server-only';

import { createHmac, timingSafeEqual } from 'crypto';
import { createServiceClient } from '@/lib/supabase/service';
import { mobileAuthSuccessForUserId } from '@/lib/auth/mobileAuth.server';
import {
  findBusinessForIdentity,
  openMerchantPortalForUser,
} from '@/lib/auth/merchantPortal.server';
import {
  getSafeRedirectPath,
  isMerchantPortalPath,
  MERCHANT_HOME_PATH,
} from '@/lib/authRedirect';
import {
  extractIndianMobileDigits,
  isValidIndianMobileDigits,
} from '@/lib/indianPhone';
import { hashPassword } from '@/lib/security/password';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { setUserSessionCookie } from '@/lib/security/session';
import { WHATSAPP_PHONE_EMAIL_DOMAIN } from '@/lib/auth/whatsappConfig';
import { sendWhatsAppOtp } from '@/lib/whatsapp/sendWhatsAppOtp';

const OTP_WINDOW_MS = 15 * 60 * 1000;

export type WhatsAppAudience = 'user' | 'business';
export type WhatsAppClient = 'web' | 'mobile';

type Failure = { success: false; error: string };
type SendOk = { success: true; message: string };

function otpSecret(): string {
  const secret =
    process.env.PASSWORD_RESET_SECRET?.trim() ||
    process.env.MOBILE_SESSION_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!secret) {
    throw new Error('Missing secret for WhatsApp OTP signing');
  }
  return secret;
}

function windowIndex(at = Date.now()): number {
  return Math.floor(at / OTP_WINDOW_MS);
}

function codesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function otpFor(phone: string, audience: WhatsAppAudience, window: number): string {
  const hmac = createHmac('sha256', otpSecret())
    .update(`whatsapp-otp:${audience}:${phone}:${window}`)
    .digest('hex');
  const n = parseInt(hmac.slice(0, 8), 16) % 1_000_000;
  return String(n).padStart(6, '0');
}

export function verifyWhatsAppOtpCode(
  phone: string,
  audience: WhatsAppAudience,
  code: string,
): boolean {
  const digits = String(code || '').replace(/\D/g, '');
  if (digits.length !== 6) return false;
  const current = windowIndex();
  return (
    codesMatch(digits, otpFor(phone, audience, current)) ||
    codesMatch(digits, otpFor(phone, audience, current - 1))
  );
}

function syntheticEmail(phone: string) {
  return `${phone}@${WHATSAPP_PHONE_EMAIL_DOMAIN}`;
}

function isPhoneEmail(email: string | null | undefined) {
  const value = email?.toLowerCase() || '';
  return (
    value.endsWith(`@${WHATSAPP_PHONE_EMAIL_DOMAIN}`) ||
    value.endsWith('@phone.finderb.local')
  );
}

function requireDb() {
  const client = createServiceClient();
  if (!client) return null;
  return client;
}

async function businessForOwnerPhone(phone: string) {
  const client = requireDb();
  if (!client) return null;
  const { data, error } = await client
    .from('Business')
    .select('id, fullName, businessName, workEmail, email, mobile, owner_mobile')
    .or(`mobile.eq.${phone},owner_mobile.eq.${phone}`)
    .limit(1);
  if (error) {
    console.error('[whatsapp-otp] business lookup', error);
    return null;
  }
  return (data?.[0] as {
    id?: string;
    fullName?: string | null;
    businessName?: string | null;
    workEmail?: string | null;
    email?: string | null;
  } | undefined) ?? null;
}

async function findUserByPhone(phone: string) {
  const client = requireDb();
  if (!client) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  const { data, error } = await client
    .from('User')
    .select('id, email, phone, authProvider, fullName')
    .ilike('phone', `%${phone}`)
    .order('createdAt', { ascending: true })
    .limit(1);
  if (error) throw error;
  const row = data?.[0] as
    | {
        id?: string;
        email?: string | null;
        phone?: string | null;
        authProvider?: string | null;
        fullName?: string | null;
      }
    | undefined;
  return row?.id ? row : null;
}

async function findUserByEmail(email: string) {
  const client = requireDb();
  if (!client) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  const { data, error } = await client
    .from('User')
    .select('id, email, phone, authProvider, fullName')
    .ilike('email', email)
    .maybeSingle();
  if (error) throw error;
  return (data as {
    id?: string;
    email?: string | null;
    phone?: string | null;
    authProvider?: string | null;
    fullName?: string | null;
  } | null) ?? null;
}

/**
 * Log in the person who just proved they own this WhatsApp number.
 * A business login only succeeds when that number is already on a business.
 * A user login creates an account the first time that number is used.
 */
async function establishWhatsAppUser(
  phone: string,
  audience: WhatsAppAudience,
): Promise<{ userId: string; isNewUser: boolean } | Failure> {
  const service = createServiceClient();
  if (!service) {
    return {
      success: false,
      error:
        'Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it before WhatsApp login can finish.',
    };
  }

  const business = audience === 'business' ? await businessForOwnerPhone(phone) : null;
  if (audience === 'business' && !business?.id) {
    return {
      success: false,
      error:
        'No FinderB business is registered with this WhatsApp number. Use the mobile from registration, or register the business first.',
    };
  }

  const existing = await findUserByPhone(phone);
  const now = new Date().toISOString();

  if (existing?.id) {
    const provider = String(existing.authProvider || '').toLowerCase();
    const updates: Record<string, unknown> = {
      phone,
      updatedAt: now,
    };
    if (!provider || provider === 'whatsapp') {
      updates.authProvider = 'whatsapp';
    }
    const { error } = await service.from('User').update(updates).eq('id', existing.id);
    if (error) {
      console.error('[whatsapp-otp] user update', error);
      return { success: false, error: 'Could not sign you in. Please try again.' };
    }
    return { userId: existing.id, isNewUser: false };
  }

  const businessEmail = (business?.workEmail || business?.email || '').trim().toLowerCase();
  let email = syntheticEmail(phone);
  let linked = businessEmail ? await findUserByEmail(businessEmail) : null;
  if (linked?.id) {
    const linkedPhone = extractIndianMobileDigits(linked.phone || '');
    if (!linkedPhone || linkedPhone === phone) {
      const provider = String(linked.authProvider || '').toLowerCase();
      const { error } = await service
        .from('User')
        .update({
          phone,
          ...(!provider || provider === 'whatsapp' ? { authProvider: 'whatsapp' } : {}),
          updatedAt: now,
        })
        .eq('id', linked.id);
      if (error) {
        console.error('[whatsapp-otp] link business email', error);
        return { success: false, error: 'Could not sign you in. Please try again.' };
      }
      return { userId: linked.id, isNewUser: false };
    }
    linked = null;
  } else if (businessEmail && !isPhoneEmail(businessEmail)) {
    email = businessEmail;
  }

  const fullName =
    business?.fullName?.trim() ||
    business?.businessName?.trim() ||
    'FinderB User';
  const { data: created, error } = await service
    .from('User')
    .insert({
      id: crypto.randomUUID(),
      fullName,
      email,
      password: await hashPassword(crypto.randomUUID()),
      authProvider: 'whatsapp',
      phone,
      favorites: [],
      searchHistory: [],
      createdAt: now,
      updatedAt: now,
    })
    .select('id')
    .single();

  if (error || !created?.id) {
    if (error?.code === '23505') {
      const again = (await findUserByPhone(phone)) ?? (await findUserByEmail(email));
      if (again?.id) return { userId: again.id, isNewUser: false };
    }
    console.error('[whatsapp-otp] user create', error);
    return { success: false, error: 'Could not create your FinderB account. Please try again.' };
  }

  return { userId: created.id, isNewUser: true };
}

function parseAudience(value: unknown): WhatsAppAudience | null {
  return value === 'user' || value === 'business' ? value : null;
}

export async function requestWhatsAppLoginOtp(input: {
  phone: string;
  audience: unknown;
}): Promise<SendOk | Failure> {
  const audience = parseAudience(input.audience);
  if (!audience) return { success: false, error: 'Choose user or business login.' };

  const phone = extractIndianMobileDigits(input.phone);
  if (!isValidIndianMobileDigits(phone)) {
    return { success: false, error: 'Enter a 10-digit Indian mobile number.' };
  }

  if (!requireDb()) {
    return {
      success: false,
      error:
        'Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it before WhatsApp login can finish.',
    };
  }

  const ipLimit = await enforceRateLimit('auth', 'whatsapp-otp-send');
  if (!ipLimit.ok) return { success: false, error: ipLimit.error };
  const phoneLimit = await enforceRateLimit('authEmail', `whatsapp-otp:${phone}`);
  if (!phoneLimit.ok) return { success: false, error: phoneLimit.error };

  if (audience === 'business') {
    const business = await businessForOwnerPhone(phone);
    if (!business?.id) {
      return {
        success: false,
        error:
          'No FinderB business is registered with this WhatsApp number. Use the mobile from registration, or register the business first.',
      };
    }
  }

  const code = otpFor(phone, audience, windowIndex());
  const sent = await sendWhatsAppOtp(`91${phone}`, code);
  if (!sent.ok) return { success: false, error: sent.error };

  return {
    success: true,
    message: 'We sent a 6-digit code on WhatsApp. It expires in 15 minutes.',
  };
}

export async function completeWhatsAppLogin(input: {
  phone: string;
  code: string;
  audience: unknown;
  client?: WhatsAppClient;
  redirectPath?: string;
}): Promise<
  | { success: true; redirectUrl: string }
  | Awaited<ReturnType<typeof mobileAuthSuccessForUserId>>
  | Failure
> {
  const audience = parseAudience(input.audience);
  if (!audience) return { success: false, error: 'Choose user or business login.' };

  const phone = extractIndianMobileDigits(input.phone);
  if (!isValidIndianMobileDigits(phone)) {
    return { success: false, error: 'Enter a 10-digit Indian mobile number.' };
  }

  const verifyLimit = await enforceRateLimit('authEmail', `whatsapp-otp-verify:${phone}`);
  if (!verifyLimit.ok) return { success: false, error: verifyLimit.error };

  if (!verifyWhatsAppOtpCode(phone, audience, input.code)) {
    return {
      success: false,
      error: 'Invalid or expired code. Check WhatsApp and try again.',
    };
  }

  const established = await establishWhatsAppUser(phone, audience);
  if ('success' in established) return established;

  const client = input.client === 'web' ? 'web' : 'mobile';
  if (client === 'web') {
    const redirectPath = getSafeRedirectPath(input.redirectPath);
    const merchantLogin = audience === 'business' || isMerchantPortalPath(redirectPath);
    if (!merchantLogin) await setUserSessionCookie(established.userId);
    const linked = await openMerchantPortalForUser(established.userId);
    if (merchantLogin && !linked) {
      return {
        success: false,
        error:
          'This WhatsApp number is not linked to a FinderB business. Use the mobile from registration, or register the business first.',
      };
    }
    if (linked && (merchantLogin || redirectPath === '/dashboard')) {
      return { success: true, redirectUrl: MERCHANT_HOME_PATH };
    }
    const redirectUrl = established.isNewUser
      ? `${redirectPath}${redirectPath.includes('?') ? '&' : '?'}welcome=1`
      : redirectPath;
    return { success: true, redirectUrl };
  }

  const auth = await mobileAuthSuccessForUserId(established.userId, established.isNewUser);
  if (!auth.success) return auth;
  if (audience === 'business' && !auth.user.isBusinessAccount) {
    const linked = await findBusinessForIdentity({ phone });
    if (!linked) {
      return {
        success: false,
        error:
          'This WhatsApp number is not linked to a FinderB business. Use the mobile from registration, or register the business first.',
      };
    }
  }
  return auth;
}
