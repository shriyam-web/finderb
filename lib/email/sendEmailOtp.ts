import 'server-only';

/**
 * Sends a 6-digit email OTP via Resend when RESEND_API_KEY is set.
 */
export async function sendEmailOtpEmail(
  to: string,
  code: string,
  purposeLabel = 'verification',
): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || 'FinderB <support@finderb.com>';

  if (!key) {
    console.warn('[email-otp] RESEND_API_KEY is not set; email not sent');
    return false;
  }

  const subject = `Your FinderB ${purposeLabel} code: ${code}`;
  const text = [
    `Your FinderB ${purposeLabel} code is ${code}.`,
    'It expires in 15 minutes.',
    '',
    'If you did not request this, you can ignore this email.',
    '',
    '— Team FinderB',
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f6f3ee;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ee;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2d8cb;">
          <tr>
            <td style="padding:20px 24px;background:#153551;color:#fff;">
              <p style="margin:0;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;opacity:0.85;">FinderB</p>
              <h1 style="margin:8px 0 0;font-size:20px;">Email verification</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:#5f564a;">
                Use this code to verify your email for merchant registration:
              </p>
              <p style="margin:0;font-size:32px;letter-spacing:0.28em;font-weight:700;color:#153551;text-align:center;">
                ${code}
              </p>
              <p style="margin:16px 0 0;font-size:13px;color:#8a7b68;text-align:center;">
                Expires in 15 minutes
              </p>
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
        to: [to],
        subject,
        text,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[email-otp] Resend failed', res.status, body.slice(0, 400));
      return false;
    }
    return true;
  } catch (error) {
    console.error('[email-otp] Email send error', error);
    return false;
  }
}
