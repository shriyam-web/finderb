import 'server-only';

import { GROWTH_PRO_HIGHLIGHTS } from '@/lib/pricing/growthPro';
import { getSiteConfig } from '@/lib/siteConfig';

export type BusinessWelcomeEmailParams = {
  to: string;
  ownerName: string;
  businessName: string;
  city?: string;
};

/**
 * Welcome letter after a business finishes registration.
 * A failed send must not undo the registration.
 */
export async function sendBusinessWelcomeEmail(
  params: BusinessWelcomeEmailParams,
): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || 'FinderB <support@finderb.com>';
  if (!key) {
    console.warn('[welcome] RESEND_API_KEY is not set; email not sent');
    return false;
  }

  const owner = params.ownerName.trim() || 'there';
  const business = params.businessName.trim() || 'your business';
  const city = params.city?.trim();
  const place = city ? `${business} in ${city}` : business;
  const font = 'Arial, Helvetica, sans-serif';
  const upgradeUrl = 'https://finderb.com/business/dashboard';
  const highlights = GROWTH_PRO_HIGHLIGHTS.map((item) => `${item.title}. ${item.desc}`);
  const pricing = (await getSiteConfig()).pricing;
  const GROWTH_PRO_OFFER_MONTHLY = pricing.growthMonthly;
  const GROWTH_PRO_RETAIL_MONTHLY = pricing.growthMonthlyRetail;

  const subject = `Welcome to FinderB, ${business}`;
  const text = [
    `Dear ${owner},`,
    '',
    `Welcome to FinderB Business. ${place} is now registered with us, and we are glad you are here.`,
    '',
    'Our team will review your listing. Once it is approved, customers nearby can find you on FinderB.',
    '',
    'You are on the Starter plan: a basic listing, your name, address and phone, up to 3 photos, and standard search visibility. It is free.',
    '',
    `When you are ready to be found first, Growth is ₹${GROWTH_PRO_OFFER_MONTHLY}/month during our Founder's Launch Wave, instead of ₹${GROWTH_PRO_RETAIL_MONTHLY}.`,
    '',
    ...highlights.map((line) => `- ${line}`),
    '',
    `Upgrade from your dashboard: ${upgradeUrl}`,
    '',
    'With care,',
    'The FinderB team',
    'https://finderb.com',
  ].join('\n');

  const benefitRows = GROWTH_PRO_HIGHLIGHTS.map(
    (item) => `
      <tr>
        <td style="padding:10px 0;font-family:${font};font-size:14px;line-height:1.5;color:#1f2937;">
          <strong style="color:#153551;">${item.title}</strong><br />
          <span style="color:#4b5563;">${item.desc}</span>
        </td>
      </tr>`,
  ).join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Welcome to FinderB</title>
</head>
<body style="margin:0;padding:0;background:#eef2f6;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${business} is registered on FinderB. Welcome — and here is how Growth helps you get found.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f6;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;">
          <tr>
            <td align="center" style="padding:32px 32px 4px;">
              <img src="https://finderb.com/businesslogo.png" width="196" alt="FinderB Business" style="display:block;width:196px;max-width:196px;height:auto;border:0;" />
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:18px 32px 0;font-family:${font};font-size:22px;line-height:1.3;font-weight:700;color:#153551;">
              Welcome to FinderB
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 0;font-family:${font};font-size:15px;line-height:1.65;color:#374151;">
              Dear ${escapeHtml(owner)},<br /><br />
              Thank you for trusting FinderB with <strong>${escapeHtml(place)}</strong>. Your registration is in. We are genuinely glad your business is here — FinderB exists so people nearby can find a place they can count on.
            </td>
          </tr>
          <tr>
            <td style="padding:14px 32px 0;font-family:${font};font-size:15px;line-height:1.65;color:#374151;">
              Our team will review the listing. After approval, customers searching in your city can discover you. You will hear from us as that review moves forward.
            </td>
          </tr>
          <tr>
            <td style="padding:22px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;border:1px solid #d7e2ee;border-radius:12px;">
                <tr>
                  <td style="padding:16px 18px;font-family:${font};">
                    <p style="margin:0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">You are on Starter</p>
                    <p style="margin:6px 0 0;font-size:15px;line-height:1.5;color:#153551;">A free listing with your name, address, phone, up to 3 photos, and standard search visibility.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 32px 0;font-family:${font};font-size:15px;line-height:1.65;color:#374151;">
              When you want customers to notice you first, move to <strong>Growth</strong>. During our Founder's Launch Wave it is <strong>₹${GROWTH_PRO_OFFER_MONTHLY}/month</strong>, instead of ₹${GROWTH_PRO_RETAIL_MONTHLY}.
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${benefitRows}
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 32px 0;">
              <a href="${upgradeUrl}" style="display:inline-block;padding:12px 22px;background:#153551;color:#ffffff;font-family:${font};font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;">See plans in your dashboard</a>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 32px 28px;font-family:${font};font-size:14px;line-height:1.6;color:#153551;">
              With care,<br />The FinderB team<br />
              <a href="https://finderb.com" style="color:#215481;text-decoration:none;">finderb.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject,
        text,
        html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[welcome] Resend failed', res.status, body.slice(0, 400));
      return false;
    }
    return true;
  } catch (error) {
    console.error('[welcome] Email send error', error);
    return false;
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
