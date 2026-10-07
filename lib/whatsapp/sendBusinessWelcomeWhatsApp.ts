import 'server-only';

import {
  getWhatsAppCloudConfig,
  WHATSAPP_BUSINESS_WELCOME_TEMPLATE,
} from '@/lib/whatsapp/cloudConfig';
import { extractIndianMobileDigits, isValidIndianMobileDigits } from '@/lib/indianPhone';

export type BusinessWelcomeWhatsAppParams = {
  mobile: string;
  ownerName: string;
  businessName: string;
  registrationNumber: string;
};

/** Template parameters may not contain newlines, tabs or runs of spaces. */
function templateText(value: string, fallback: string) {
  const clean = value.replace(/\s+/g, ' ').trim().slice(0, 120);
  return clean || fallback;
}

/**
 * Congratulations note on the owner's WhatsApp after a business registers.
 * A failed send must not undo the registration.
 */
export async function sendBusinessWelcomeWhatsApp(
  params: BusinessWelcomeWhatsAppParams,
): Promise<boolean> {
  const config = getWhatsAppCloudConfig();
  if (!config.token || !config.phoneNumberId) {
    console.warn('[welcome-whatsapp] WhatsApp Cloud API is not configured; note not sent');
    return false;
  }

  const phone = extractIndianMobileDigits(params.mobile);
  if (!isValidIndianMobileDigits(phone)) return false;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${config.version}/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: `91${phone}`,
          type: 'template',
          template: {
            name: process.env.WHATSAPP_BUSINESS_WELCOME_TEMPLATE?.trim() || WHATSAPP_BUSINESS_WELCOME_TEMPLATE,
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: templateText(params.ownerName, 'there') },
                  { type: 'text', text: templateText(params.businessName, 'your business') },
                  { type: 'text', text: templateText(params.registrationNumber, 'on your dashboard') },
                ],
              },
            ],
          },
        }),
      },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[welcome-whatsapp] Cloud API failed', res.status, body.slice(0, 400));
      return false;
    }
    return true;
  } catch (error) {
    console.error('[welcome-whatsapp] send error', error);
    return false;
  }
}
