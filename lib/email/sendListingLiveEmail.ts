import 'server-only';

export type ListingLiveEmailParams = {
  to: string;
  businessName: string;
  profileUrl: string;
  dashboardUrl: string;
  showUpgradeCta: boolean;
  upgradeUrl?: string;
};

/**
 * Congratulates a merchant when their FinderB listing goes live.
 * Returns false when mail is not configured or Resend fails.
 */
export async function sendListingLiveEmail(
  params: ListingLiveEmailParams,
): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || 'FinderB <support@finderb.com>';

  if (!key) {
    console.warn('[listing-live] RESEND_API_KEY is not set; email not sent');
    return false;
  }

  const name = params.businessName.trim() || 'your business';
  const subject = `🎉 ${name} is live on FinderB!`;

  const upgradeText = params.showUpgradeCta
    ? [
        '',
        'You’re currently on the free plan.',
        'Upgrade to Growth or Pro for more visibility, leads, and premium placement:',
        params.upgradeUrl || 'https://finderb.com/pricing',
        '',
      ]
    : [''];

  const text = [
    `Congratulations — ${name} is now live on FinderB!`,
    '',
    'Your public profile is visible to customers searching for local businesses.',
    '',
    `View your live listing: ${params.profileUrl}`,
    `Merchant dashboard: ${params.dashboardUrl}`,
    ...upgradeText,
    'Welcome to FinderB — we’re glad you’re here.',
    '',
    '— Team FinderB',
  ].join('\n');

  const upgradeHtml = params.showUpgradeCta
    ? `
      <tr>
        <td style="padding:20px 24px;background:#fff8ef;border:1px solid #ebd9b8;border-radius:12px;">
          <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#153551;">
            You’re on the free plan
          </p>
          <p style="margin:0 0 14px;font-size:14px;line-height:1.5;color:#5f564a;">
            Upgrade to Growth or Pro for more visibility, leads, and premium placement across FinderB.
          </p>
          <a href="${escapeHtml(params.upgradeUrl || 'https://finderb.com/pricing')}"
             style="display:inline-block;background:#b8893d;color:#fff;text-decoration:none;font-size:13px;font-weight:700;padding:10px 16px;border-radius:999px;">
            Upgrade your plan
          </a>
        </td>
      </tr>
      <tr><td style="height:16px;"></td></tr>
    `
    : '';

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f6f3ee;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ee;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2d8cb;">
          <tr>
            <td style="padding:22px 24px;background:#153551;color:#fff;">
              <p style="margin:0;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;opacity:0.8;">FinderB</p>
              <h1 style="margin:8px 0 0;font-size:22px;line-height:1.25;">You’re live 🎉</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 12px;font-size:16px;line-height:1.5;color:#153551;">
                Congratulations — <strong>${escapeHtml(name)}</strong> is now live on FinderB.
              </p>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.55;color:#5f564a;">
                Your public profile is visible to customers searching for local businesses near you.
              </p>
              <a href="${escapeHtml(params.profileUrl)}"
                 style="display:inline-block;background:#153551;color:#fff;text-decoration:none;font-size:13px;font-weight:700;padding:11px 18px;border-radius:999px;">
                View live listing
              </a>
              <p style="margin:16px 0 0;font-size:13px;color:#6b6155;">
                Or open your
                <a href="${escapeHtml(params.dashboardUrl)}" style="color:#153551;font-weight:600;">merchant dashboard</a>.
              </p>
            </td>
          </tr>
          ${upgradeHtml}
          <tr>
            <td style="padding:0 24px 22px;font-size:12px;line-height:1.5;color:#8a7b68;">
              Welcome to FinderB — we’re glad you’re here.<br/>— Team FinderB
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
      console.error('[listing-live] Resend failed', res.status, body.slice(0, 400));
      return false;
    }
    return true;
  } catch (error) {
    console.error('[listing-live] Email send error', error);
    return false;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
