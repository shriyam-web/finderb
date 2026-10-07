'use server';

import {
  requestMerchantRegisterPhoneCode,
  verifyMerchantRegisterPhoneCode,
} from '@/lib/auth/phoneVerify.server';

export async function sendMerchantRegisterPhoneOtp(mobile: string) {
  return requestMerchantRegisterPhoneCode(mobile);
}

export async function confirmMerchantRegisterPhoneOtp(mobile: string, code: string) {
  return verifyMerchantRegisterPhoneCode(mobile, code);
}
