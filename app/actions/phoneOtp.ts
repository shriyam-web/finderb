'use server';

import {
  requestMerchantRegisterPhoneCode,
  verifyMerchantRegisterPhoneCode,
} from '@/lib/auth/phoneVerify.server';
import { isWhatsAppOtpConfigured } from '@/lib/whatsapp/cloudConfig';

export async function getMerchantPhoneOtpRequirement() {
  return { required: isWhatsAppOtpConfigured() };
}

export async function sendMerchantRegisterPhoneOtp(mobile: string) {
  return requestMerchantRegisterPhoneCode(mobile);
}

export async function confirmMerchantRegisterPhoneOtp(mobile: string, code: string) {
  return verifyMerchantRegisterPhoneCode(mobile, code);
}
