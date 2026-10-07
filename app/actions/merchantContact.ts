'use server';

import {
  confirmMerchantEmailVerifyCode,
  confirmMerchantMobileVerifyCode,
  getMerchantContactStatus,
  requestMerchantEmailVerifyCode,
  requestMerchantMobileVerifyCode,
} from '@/lib/auth/merchantContactVerify.server';

export async function loadMerchantContactStatus() {
  return getMerchantContactStatus();
}

export async function sendMerchantEmailVerifyOtp(email: string) {
  return requestMerchantEmailVerifyCode(email);
}

export async function confirmMerchantEmailVerifyOtp(email: string, code: string) {
  return confirmMerchantEmailVerifyCode(email, code);
}

export async function sendMerchantMobileVerifyOtp(mobile: string) {
  return requestMerchantMobileVerifyCode(mobile);
}

export async function confirmMerchantMobileVerifyOtp(mobile: string, code: string) {
  return confirmMerchantMobileVerifyCode(mobile, code);
}
