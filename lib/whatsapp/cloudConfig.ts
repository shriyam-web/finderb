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
/** Utility template: {{1}} owner name, {{2}} business name, {{3}} registration number. */
export const WHATSAPP_BUSINESS_WELCOME_TEMPLATE = 'finderb_business_welcome';
/**
 * Utility template sent when admin approves a listing, even hours later.
 * Header: "You're live on FinderB"
 * Body: "Hi {{1}}, good news from FinderB. We approved {{2}}, so your listing is now live. People nearby can find you, see what you offer, and get in touch. {{3}} Open the FinderB app when you have a minute."
 * Footer: FinderB. Button: Open dashboard.
 * {{1}} owner, {{2}} business, {{3}} one-line reminder (verify and/or plan).
 */
export const WHATSAPP_LISTING_LIVE_TEMPLATE = 'finderb_listing_live_v2';

export type WhatsAppOtpButton = 'url' | 'copy_code' | 'none';

export type WhatsAppCloudConfig = {
  token: string;
  phoneNumberId: string;
  template: string;
  language: string;
  button: WhatsAppOtpButton;
  version: string;
  webhookVerifyToken: string;
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
  };
}

export function isWhatsAppOtpConfigured(): boolean {
  const config = getWhatsAppCloudConfig();
  return Boolean(config.token && config.phoneNumberId);
}
