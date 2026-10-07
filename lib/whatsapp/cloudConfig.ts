import 'server-only';

/**
 * Production WhatsApp Cloud API sender from the Meta setup in this project.
 * Template `finderb_login_otp` is an approved Authentication / Copy code template.
 * Only WHATSAPP_CLOUD_TOKEN still has to be set on the server.
 */
export const WHATSAPP_DEFAULT_PHONE_NUMBER_ID = '1395555300288297';
export const WHATSAPP_DEFAULT_TEMPLATE = 'finderb_login_otp';
export const WHATSAPP_DEFAULT_TEMPLATE_LANG = 'en';
export const WHATSAPP_DEFAULT_BUTTON = 'url';
export const WHATSAPP_DEFAULT_GRAPH_VERSION = 'v22.0';
export const WHATSAPP_DEFAULT_WEBHOOK_VERIFY_TOKEN = 'finderb-wa-otp';
export const WHATSAPP_DEFAULT_BUSINESS_NUMBER = '919990222346';

export type WhatsAppOtpButton = 'url' | 'copy_code' | 'none';

export type WhatsAppCloudConfig = {
  token: string;
  phoneNumberId: string;
  template: string;
  language: string;
  button: WhatsAppOtpButton;
  version: string;
  webhookVerifyToken: string;
  /** FinderB's own WhatsApp number in wa.me form (country code, digits only). */
  businessNumber: string;
  appSecret: string;
};

function firstEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return '';
}

function parseButton(value: string): WhatsAppOtpButton {
  const button = value.toLowerCase();
  if (button === 'copy_code' || button === 'none' || button === 'url') return button;
  return WHATSAPP_DEFAULT_BUTTON;
}

export function getWhatsAppCloudConfig(): WhatsAppCloudConfig {
  return {
    token: firstEnv('WHATSAPP_CLOUD_TOKEN'),
    phoneNumberId: firstEnv('WHATSAPP_PHONE_NUMBER_ID') || WHATSAPP_DEFAULT_PHONE_NUMBER_ID,
    template: firstEnv('WHATSAPP_OTP_TEMPLATE') || WHATSAPP_DEFAULT_TEMPLATE,
    language: firstEnv('WHATSAPP_OTP_TEMPLATE_LANG') || WHATSAPP_DEFAULT_TEMPLATE_LANG,
    button: parseButton(firstEnv('WHATSAPP_OTP_BUTTON') || WHATSAPP_DEFAULT_BUTTON),
    version: firstEnv('WHATSAPP_GRAPH_VERSION') || WHATSAPP_DEFAULT_GRAPH_VERSION,
    webhookVerifyToken:
      firstEnv('WHATSAPP_WEBHOOK_VERIFY_TOKEN') || WHATSAPP_DEFAULT_WEBHOOK_VERIFY_TOKEN,
    businessNumber:
      firstEnv('WHATSAPP_BUSINESS_NUMBER').replace(/\D/g, '') || WHATSAPP_DEFAULT_BUSINESS_NUMBER,
    appSecret: firstEnv('WHATSAPP_APP_SECRET', 'META_APP_SECRET'),
  };
}

export function isWhatsAppOtpConfigured(): boolean {
  const config = getWhatsAppCloudConfig();
  return Boolean(config.token && config.phoneNumberId);
}

/**
 * "Message us first" login needs Meta to deliver incoming messages to
 * /api/auth/whatsapp/webhook, so it stays off until WHATSAPP_INBOUND_LOGIN=1.
 */
export function isWhatsAppInboundLoginEnabled(): boolean {
  return /^(1|true|yes)$/i.test(firstEnv('WHATSAPP_INBOUND_LOGIN')) && isWhatsAppOtpConfigured();
}
