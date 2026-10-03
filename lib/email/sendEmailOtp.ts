import 'server-only';

/**
 * Sends a 6-digit email OTP via Resend when RESEND_API_KEY is set.
 */
export async function sendEmailOtpEmail(
  to: string,
  code: string,
  _purposeLabel = 'verification',
): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || 'FinderB <support@finderb.com>';
  const digits = String(code || '').replace(/\D/g, '').slice(0, 6);

  if (!key) {
    console.warn('[email-otp] RESEND_API_KEY is not set; email not sent');
    return false;
  }
  if (digits.length !== 6) return false;

  const subject = `${digits} is your FinderB verification code`;
  const text = [
    'Welcome to FinderB.',
    '',
    'Use this code to confirm your business email:',
    '',
    digits,
    '',
    'It expires in 15 minutes.',
    '',
    'Enter it in the FinderB app, on the business registration screen, and your listing can continue.',
    '',
    'If you did not start a FinderB registration, you can ignore this email. No business will be created.',
    '',
    'With care,',
    'Team FinderB',
    'https://finderb.com',
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Your FinderB verification code</title>
</head>
<body style="margin:0;padding:0;background:#f4f0e8;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Confirm your business email with FinderB. This code expires in 15 minutes.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f0e8;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e6dccb;">
          <tr>
            <td style="padding:28px 32px 22px;background:#153551;">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:0.22em;text-transform:uppercase;color:#f9b864;">FinderB</p>
              <h1 style="margin:12px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.25;font-weight:normal;color:#ffffff;">Your business email, confirmed.</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3d4a3a;">
                Welcome. Someone — we hope it was you — began listing a business on FinderB with this address.
              </p>
              <p style="margin:0 0 22px;font-size:16px;line-height:1.6;color:#3d4a3a;">
                Enter the code below in the app. It keeps this inbox as the one we trust for your listing.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f4ec;border:1px solid #eadfcb;border-radius:16px;">
                <tr>
                  <td align="center" style="padding:22px 16px 8px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#8a7356;">
                    Verification code
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 16px 8px;font-family:Georgia,'Times New Roman',serif;font-size:36px;letter-spacing:0.28em;color:#153551;">
                    ${digits}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 16px 22px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;color:#8a7356;">
                    Expires in 15 minutes
                  </td>
                </tr>
              </table>
              <p style="margin:22px 0 0;font-size:14px;line-height:1.6;color:#5c6b5a;">
                If you did not start this registration, you can leave the email unread. Nothing is created until the code is entered.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
              <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:#153551;">With care,<br />Team FinderB</p>
              <p style="margin:18px 0 0;font-size:12px;line-height:1.5;color:#9a8b76;">
                FinderB · <a href="https://finderb.com" style="color:#153551;text-decoration:none;">finderb.com</a>
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
