import 'server-only';

/**
 * Sends a login code with the WhatsApp Cloud API authentication template.
 * Meta only delivers OTP outside an open chat when the template is approved.
 */
export function isWhatsAppOtpConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_CLOUD_TOKEN?.trim() &&
      process.env.WHATSAPP_PHONE_NUMBER_ID?.trim(),
  );
}

export async function sendWhatsAppOtp(
  phoneE164Digits: string,
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = process.env.WHATSAPP_CLOUD_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!token || !phoneNumberId) {
    return {
      ok: false,
      error:
        'WhatsApp login is not set up on the server yet. Add the WhatsApp Cloud API credentials and try again.',
    };
  }

  const version = process.env.WHATSAPP_GRAPH_VERSION?.trim() || 'v22.0';
  const template = process.env.WHATSAPP_OTP_TEMPLATE?.trim() || 'finderb_login_otp';
  const language = process.env.WHATSAPP_OTP_TEMPLATE_LANG?.trim() || 'en';
  const button = (process.env.WHATSAPP_OTP_BUTTON?.trim() || 'url').toLowerCase();

  const components: Array<Record<string, unknown>> = [
    {
      type: 'body',
      parameters: [{ type: 'text', text: code }],
    },
  ];
  if (button === 'url') {
    components.push({
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: code }],
    });
  } else if (button === 'copy_code') {
    components.push({
      type: 'button',
      sub_type: 'COPY_CODE',
      index: '0',
      parameters: [{ type: 'coupon_code', coupon_code: code }],
    });
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${version}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneE164Digits,
          type: 'template',
          template: {
            name: template,
            language: { code: language },
            components,
          },
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[whatsapp-otp] Cloud API failed', res.status, body.slice(0, 500));
      let detail = '';
      try {
        const parsed = JSON.parse(body) as { error?: { message?: string } };
        detail = parsed.error?.message?.trim() || '';
      } catch {
        detail = '';
      }
      if (/template/i.test(detail)) {
        return {
          ok: false,
          error:
            'WhatsApp rejected the login template. Confirm the authentication template name, language, and button type.',
        };
      }
      return {
        ok: false,
        error: 'WhatsApp could not deliver the code. Check the number and try again.',
      };
    }

    return { ok: true };
  } catch (error) {
    console.error('[whatsapp-otp] send error', error);
    return {
      ok: false,
      error: 'WhatsApp could not deliver the code. Please try again shortly.',
    };
  }
}
