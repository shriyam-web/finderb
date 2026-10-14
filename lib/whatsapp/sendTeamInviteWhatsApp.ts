import 'server-only';

import { getWhatsAppCloudConfig } from '@/lib/whatsapp/cloudConfig';
import { extractIndianMobileDigits, isValidIndianMobileDigits } from '@/lib/indianPhone';

export const WHATSAPP_TEAM_INVITE_TEMPLATE = 'finderb_team_invite';

function templateText(value: string, fallback: string) {
  const clean = value.replace(/\s+/g, ' ').trim().slice(0, 120);
  return clean || fallback;
}

/**
 * Expected Meta template `finderb_team_invite` (en):
 * Body: {{1}} invited you to manage {{2}} on FinderB. Open the invite to create your password.
 * URL button: https://finderb.com/business/invite/{{1}}  (dynamic suffix = token)
 */
export async function sendTeamInviteWhatsApp(params: {
  mobile: string;
  inviterName: string;
  businessName: string;
  token: string;
}): Promise<boolean> {
  const config = getWhatsAppCloudConfig();
  if (!config.token || !config.phoneNumberId) {
    console.warn('[team-invite-whatsapp] WhatsApp Cloud API is not configured');
    return false;
  }

  const phone = extractIndianMobileDigits(params.mobile);
  if (!isValidIndianMobileDigits(phone)) return false;

  const template =
    process.env.WHATSAPP_TEAM_INVITE_TEMPLATE?.trim() || WHATSAPP_TEAM_INVITE_TEMPLATE;

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
            name: template,
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: templateText(params.inviterName, 'A teammate') },
                  { type: 'text', text: templateText(params.businessName, 'this business') },
                ],
              },
              {
                type: 'button',
                sub_type: 'url',
                index: '0',
                parameters: [{ type: 'text', text: params.token }],
              },
            ],
          },
        }),
      },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[team-invite-whatsapp] Cloud API failed', res.status, body.slice(0, 400));
      return false;
    }
    return true;
  } catch (error) {
    console.error('[team-invite-whatsapp] send error', error);
    return false;
  }
}
