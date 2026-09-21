'use server';

import {
  isMerchantEmailOtpConfigured,
  requestMerchantRegisterEmailOtp,
  verifyMerchantRegisterEmailOtp,
} from '@/lib/auth/emailOtp.server';

export async function getMerchantEmailOtpRequirement() {
  return { required: isMerchantEmailOtpConfigured() };
}

export async function sendMerchantRegisterEmailOtp(email: string) {
  return requestMerchantRegisterEmailOtp(email);
}

export async function confirmMerchantRegisterEmailOtp(
  email: string,
  code: string,
) {
  return verifyMerchantRegisterEmailOtp(email, code);
}
