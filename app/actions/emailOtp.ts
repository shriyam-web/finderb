'use server';

import {
  requestMerchantEmailUpdateOtp,
  requestMerchantRegisterEmailOtp,
  requestUserEmailOtp,
  verifyMerchantEmailUpdateOtp,
  verifyMerchantRegisterEmailOtp,
  verifyUserEmailOtp,
} from '@/lib/auth/emailOtp.server';

export async function sendMerchantRegisterEmailOtp(email: string) {
  return requestMerchantRegisterEmailOtp(email);
}

export async function confirmMerchantRegisterEmailOtp(
  email: string,
  code: string,
) {
  return verifyMerchantRegisterEmailOtp(email, code);
}

export async function sendUserEmailOtp(email: string) {
  return requestUserEmailOtp(email);
}

export async function confirmUserEmailOtp(email: string, code: string) {
  return verifyUserEmailOtp(email, code);
}

export async function sendBusinessEmailChangeOtp(email: string) {
  return requestMerchantEmailUpdateOtp(email);
}

export async function confirmBusinessEmailChangeOtp(email: string, code: string) {
  return verifyMerchantEmailUpdateOtp(email, code);
}
