'use server';

import { mobileUpdateProfile } from '@/lib/auth/mobileAuth.server';
import { requestPhoneVerifyCode, verifyPhoneCode } from '@/lib/auth/phoneVerify.server';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { getSessionUserId } from '@/lib/security/session';

const SIGNED_OUT = 'Your session has ended. Please sign in again.';

export type WebProfilePatch = {
  fullName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string | null;
  emailVerificationToken?: string;
  phoneVerificationToken?: string;
};

function isAllowedAvatarUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'res.cloudinary.com';
  } catch {
    return false;
  }
}

export async function updateMyProfile(patch: WebProfilePatch) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false as const, error: SIGNED_OUT };

  const limit = await enforceRateLimit('write', `profile:${userId}`);
  if (!limit.ok) return { success: false as const, error: limit.error };

  if (typeof patch.avatarUrl === 'string' && !isAllowedAvatarUrl(patch.avatarUrl)) {
    return { success: false as const, error: 'Upload the photo again.' };
  }

  const result = await mobileUpdateProfile(userId, patch);
  if (!result.success) return { success: false as const, error: result.error };
  const { fullName, email, phone, avatarUrl, authProvider } = result.user;
  return {
    success: true as const,
    user: { fullName, email, phone: phone ?? null, avatarUrl: avatarUrl ?? null, authProvider: authProvider ?? null },
  };
}

export async function sendMyPhoneOtp(phone: string) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false as const, error: SIGNED_OUT };
  return requestPhoneVerifyCode(userId, phone);
}

export async function confirmMyPhoneOtp(phone: string, code: string) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false as const, error: SIGNED_OUT };
  return verifyPhoneCode(userId, phone, code);
}
