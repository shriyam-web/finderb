'use server';

import {
  confirmMerchantEmailVerifyCode,
  confirmMerchantMobileVerifyCode,
  confirmMerchantOwnerMobileCode,
  getMerchantContactStatus,
  requestMerchantEmailVerifyCode,
  requestMerchantMobileVerifyCode,
  requestMerchantOwnerMobileCode,
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

export async function sendMerchantOwnerMobileOtp(mobile: string) {
  return requestMerchantOwnerMobileCode(mobile);
}

export async function confirmMerchantOwnerMobileOtp(mobile: string, code: string) {
  return confirmMerchantOwnerMobileCode(mobile, code);
}
