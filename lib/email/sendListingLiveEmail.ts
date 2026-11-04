import 'server-only';

export type ListingLiveEmailParams = {
  to: string;
  businessName: string;
  subject: string;
  paragraphs: string[];
  profileUrl: string;
  dashboardUrl: string;
  primaryLabel: string;
  primaryUrl: string;
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
  const subject = params.subject.trim() || 'Your business is now live on FinderB';
  const paragraphs = params.paragraphs.map((line) => line.trim()).filter(Boolean);

  const text = [
    ...paragraphs,
    '',
    `${params.primaryLabel}: ${params.primaryUrl}`,
    `View your live listing: ${params.profileUrl}`,
    `Merchant dashboard: ${params.dashboardUrl}`,
    '',
    '— Team FinderB',
  ].join('\n');

  const paragraphHtml = paragraphs
    .map(
      (line, index) =>
        `<p style="margin:0 0 ${index === paragraphs.length - 1 ? 20 : 12}px;font-size:${index === 0 ? 16 : 14}px;line-height:1.55;color:${index === 0 ? '#153551' : '#5f564a'};">${escapeHtml(line)}</p>`,
    )
    .join('\n');

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
              ${paragraphHtml}
              <a href="${escapeHtml(params.primaryUrl)}"
                 style="display:inline-block;background:#153551;color:#fff;text-decoration:none;font-size:13px;font-weight:700;padding:11px 18px;border-radius:999px;">
                ${escapeHtml(params.primaryLabel)}
              </a>
              <p style="margin:16px 0 0;font-size:13px;color:#6b6155;">
                <a href="${escapeHtml(params.profileUrl)}" style="color:#153551;font-weight:600;">View ${escapeHtml(name)}</a>
                ·
                <a href="${escapeHtml(params.dashboardUrl)}" style="color:#153551;font-weight:600;">Open your dashboard</a>
              </p>
            </td>
          </tr>
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
