import 'server-only';

/**
 * Sends a 6-digit email OTP via Resend when RESEND_API_KEY is set.
 */
export async function sendEmailOtpEmail(
  to: string,
  code: string,
  purposeLabel: 'registration' | 'account' | 'user' | string = 'registration',
): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || 'FinderB <support@finderb.com>';
  const digits = String(code || '').replace(/\D/g, '').slice(0, 6);
  const font = "Arial, Helvetica, sans-serif";

  if (!key) {
    console.warn('[email-otp] RESEND_API_KEY is not set; email not sent');
    return false;
  }
  if (digits.length !== 6) return false;

  const userFacing = purposeLabel === 'user';
  const account = userFacing || purposeLabel === 'account';
  const logoSrc = userFacing
    ? 'https://finderb.com/logo1.png'
    : 'https://finderb.com/businesslogo.png';
  const logoAlt = userFacing ? 'FinderB' : 'FinderB Business';
  const headline = account ? 'Confirm your email' : 'Confirm your business email';
  const lead = account
    ? 'Enter this code in FinderB to save this address on your account.'
    : 'Thank you for registering your business with FinderB. Enter this code in the app to verify your email and continue.';
  const subject = `${digits} is your FinderB code`;
  const text = [
    'FinderB',
    '',
    headline,
    '',
    lead,
    '',
    digits,
    '',
    'This code expires in 15 minutes.',
    '',
    account
      ? 'If you did not ask to save this email, you can ignore this message. The address will not be added.'
      : 'If you did not start this registration, you can ignore this email. Nothing is created until the code is entered.',
    '',
    'The FinderB team',
    'https://finderb.com',
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Your FinderB code</title>
</head>
<body style="margin:0;padding:0;background:#eef2f6;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
    Your FinderB verification code is ${digits}. It expires in 15 minutes.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f6;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;">
          <tr>
            <td align="center" style="padding:${userFacing ? '22px 32px' : '32px 32px 8px'};font-family:${font};${userFacing ? 'background:#0b1220;border-radius:16px 16px 0 0;' : ''}">
              <img src="${logoSrc}" width="${userFacing ? '220' : '196'}" alt="${logoAlt}" style="display:block;width:${userFacing ? '220' : '196'}px;max-width:${userFacing ? '220' : '196'}px;height:auto;border:0;outline:none;text-decoration:none;" />
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 32px 0;font-family:${font};font-size:22px;line-height:1.3;font-weight:700;color:#153551;">
              ${headline}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:12px 36px 0;font-family:${font};font-size:15px;line-height:1.6;color:#4b5563;">
              ${lead}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 32px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="background:#f4f7fb;border:1px solid #d7e2ee;border-radius:12px;">
                <tr>
                  <td align="center" style="padding:18px 36px;font-family:${font};font-size:32px;line-height:1;font-weight:700;letter-spacing:8px;color:#153551;">
                    ${digits}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:12px 32px 0;font-family:${font};font-size:13px;line-height:1.5;color:#64748b;">
              Expires in 15 minutes
            </td>
          </tr>
          <tr>
            <td style="padding:22px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid #e6edf4;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 36px 0;font-family:${font};font-size:13px;line-height:1.6;color:#64748b;">
              ${account
                ? 'If you did not ask to save this email, you can ignore this message. The address will not be added.'
                : 'If you did not start this registration, you can ignore this email. Nothing is created until the code is entered.'}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 32px 28px;font-family:${font};font-size:13px;line-height:1.5;color:#153551;">
              The FinderB team<br />
              <a href="https://finderb.com" style="font-family:${font};color:#215481;text-decoration:none;">finderb.com</a>
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
