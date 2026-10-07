import 'server-only';

import {
  getWhatsAppCloudConfig,
  isWhatsAppOtpConfigured,
  type WhatsAppOtpButton,
} from '@/lib/whatsapp/cloudConfig';

export { isWhatsAppOtpConfigured };

type CloudError = {
  message?: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  error_user_msg?: string;
};

function templateComponents(code: string, button: WhatsAppOtpButton) {
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
  return components;
}

function parseCloudError(body: string): CloudError | null {
  try {
    const parsed = JSON.parse(body) as { error?: CloudError };
    return parsed.error || null;
  } catch {
    return null;
  }
}

function userErrorForCloudFailure(status: number, error: CloudError | null): string {
  const code = error?.code;
  const detail = `${error?.error_user_msg || ''} ${error?.message || ''}`.trim();
  if (code === 190 || code === 102 || /session has expired|invalid oauth/i.test(detail)) {
    return 'WhatsApp login is not authorized on the server yet. Replace the Cloud API token and try again.';
  }
  if (code === 132001 || /template name does not exist/i.test(detail)) {
    return 'WhatsApp could not find the login template. Confirm finderb_login_otp is approved in English.';
  }
  if (code === 132000 || code === 132012 || /parameter/i.test(detail)) {
    return 'WhatsApp rejected the login template parameters. Confirm the Copy code authentication template.';
  }
  if (code === 133010 || /not registered/i.test(detail)) {
    return 'This number is not on WhatsApp. Use the WhatsApp mobile number for this account.';
  }
  if (code === 131026 || /undeliverable/i.test(detail)) {
    return 'WhatsApp could not deliver the code to this number. Check the number and try again.';
  }
  if (status === 429 || code === 130429 || /rate/i.test(detail)) {
    return 'WhatsApp is rate-limiting login codes. Wait a minute and try again.';
  }
  if (/template/i.test(detail)) {
    return 'WhatsApp rejected the login template. Confirm the authentication template name, language, and button type.';
  }
  return 'WhatsApp could not deliver the code. Check the number and try again.';
}

function shouldRetryTemplate(error: CloudError | null) {
  const code = error?.code;
  const detail = `${error?.message || ''} ${error?.error_user_msg || ''}`;
  return (
    code === 132000 ||
    code === 132001 ||
    code === 132012 ||
    /template/i.test(detail) ||
    /parameter/i.test(detail)
  );
}

async function postTemplate(input: {
  token: string;
  version: string;
  phoneNumberId: string;
  to: string;
  template: string;
  language: string;
  button: WhatsAppOtpButton;
  code: string;
}) {
  const res = await fetch(
    `https://graph.facebook.com/${input.version}/${input.phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: input.to,
        type: 'template',
        template: {
          name: input.template,
          language: { code: input.language },
          components: templateComponents(input.code, input.button),
        },
      }),
    },
  );
  const body = await res.text().catch(() => '');
  const error = res.ok ? null : parseCloudError(body);
  return { ok: res.ok, status: res.status, body, error };
}

/**
 * Sends a login code with the WhatsApp Cloud API authentication template.
 * Meta only delivers OTP outside an open chat when the template is approved.
 */
export async function sendWhatsAppOtp(
  phoneE164Digits: string,
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const config = getWhatsAppCloudConfig();
  if (!config.token || !config.phoneNumberId) {
    return {
      ok: false,
      error:
        'WhatsApp login is not set up on the server yet. Add the WhatsApp Cloud API credentials and try again.',
    };
  }

  const attempts: Array<{ language: string; button: WhatsAppOtpButton }> = [
    { language: config.language, button: config.button },
  ];
  if (config.language !== 'en_US') {
    attempts.push({ language: 'en_US', button: config.button });
  }
  if (config.button !== 'copy_code') {
    attempts.push({ language: config.language, button: 'copy_code' });
  }
  if (config.button !== 'none') {
    attempts.push({ language: config.language, button: 'none' });
  }

  try {
    let lastFailure: { status: number; error: CloudError | null; body: string } | null = null;
    for (const attempt of attempts) {
      const result = await postTemplate({
        token: config.token,
        version: config.version,
        phoneNumberId: config.phoneNumberId,
        to: phoneE164Digits,
        template: config.template,
        language: attempt.language,
        button: attempt.button,
        code,
      });
      if (result.ok) return { ok: true };
      lastFailure = { status: result.status, error: result.error, body: result.body };
      if (!shouldRetryTemplate(result.error)) break;
    }

    const failure = lastFailure;
    console.error(
      '[whatsapp-otp] Cloud API failed',
      failure?.status,
      failure?.error?.code,
      (failure?.body || '').slice(0, 500),
    );
    return {
      ok: false,
      error: userErrorForCloudFailure(failure?.status || 500, failure?.error || null),
    };
  } catch (error) {
    console.error('[whatsapp-otp] send error', error);
    return {
      ok: false,
      error: 'WhatsApp could not deliver the code. Please try again shortly.',
    };
  }
}
