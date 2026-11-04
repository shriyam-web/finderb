import 'server-only';

import { extractIndianMobileDigits, isValidIndianMobileDigits } from '@/lib/indianPhone';
import {
  getWhatsAppCloudConfig,
  WHATSAPP_LISTING_LIVE_TEMPLATE,
} from '@/lib/whatsapp/cloudConfig';

export type ListingLiveWhatsAppParams = {
  mobile: string;
  ownerName: string;
  businessName: string;
  nextStep: string;
};

/** Template parameters may not contain newlines, tabs or runs of spaces. */
function templateText(value: string, fallback: string, max = 300) {
  const clean = value.replace(/\s+/g, ' ').trim().slice(0, max);
  return clean || fallback;
}

/**
 * Tells the owner their listing is live, hours after registration if needed.
 * Uses the utility template `finderb_listing_live_v2`:
 * Header "You're live on FinderB", then
 * "Hi {{1}}, good news from FinderB. We approved {{2}}, so your listing is now live. ..."
 * A failed send must not block email or the in-app alert.
 */
export async function sendListingLiveWhatsApp(
  params: ListingLiveWhatsAppParams,
): Promise<boolean> {
  const config = getWhatsAppCloudConfig();
  if (!config.token || !config.phoneNumberId) {
    console.warn('[listing-live-whatsapp] WhatsApp Cloud API is not configured; note not sent');
    return false;
  }

  const phone = extractIndianMobileDigits(params.mobile);
  if (!isValidIndianMobileDigits(phone)) return false;

  const owner = templateText(params.ownerName, 'there', 80);
  const business = templateText(params.businessName, 'Your business', 120);
  const nextStep = templateText(
    params.nextStep,
    'Open the FinderB app and have a look at your live page.',
  );

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
          to: `91${phone}`,
          type: 'template',
          template: {
            name: WHATSAPP_LISTING_LIVE_TEMPLATE,
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: owner },
                  { type: 'text', text: business },
                  { type: 'text', text: nextStep },
                ],
              },
            ],
          },
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[listing-live-whatsapp] Graph failed', res.status, body.slice(0, 400));
      return false;
    }
    return true;
  } catch (error) {
    console.error('[listing-live-whatsapp] send error', error);
    return false;
  }
}
