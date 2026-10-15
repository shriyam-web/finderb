import 'server-only';

export type TeamInviteEmailParams = {
  to: string;
  businessName: string;
  inviterName: string;
  acceptUrl: string;
  code?: string;
};

export async function sendTeamInviteEmail(params: TeamInviteEmailParams): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || 'FinderB <support@finderb.com>';
  if (!key) {
    console.warn('[team-invite] RESEND_API_KEY is not set; email not sent');
    return false;
  }

  const business = params.businessName.trim() || 'a FinderB business';
  const inviter = params.inviterName.trim() || 'A teammate';
  const digits = String(params.code || '').replace(/\D/g, '').slice(0, 6);
  const subject = digits
    ? `${digits} is your FinderB team code for ${business}`
    : `You're invited to manage ${business} on FinderB`;
  const text = [
    `${inviter} invited you to use the FinderB Business profile for ${business}.`,
    '',
    digits ? `Your 6-digit verification code is ${digits}.` : '',
    'Open this link, enter the code, create your own password, then sign in:',
    params.acceptUrl,
    '',
    'This invitation expires in 48 hours if you do not accept it.',
    '',
    'If you were not expecting this, you can ignore the email.',
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#eef2f6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f6;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;">
          <tr>
            <td align="center" style="padding:32px 32px 8px;">
              <img src="https://finderb.com/businesslogo.png" width="196" alt="FinderB Business" style="display:block;width:196px;max-width:196px;height:auto;border:0;" />
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 32px 0;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:1.3;font-weight:700;color:#153551;">
              Join ${escapeHtml(business)}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:12px 36px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#4b5563;">
              ${escapeHtml(inviter)} invited you to this FinderB Business profile. Verify with the code below, then create your password.
            </td>
          </tr>
          ${
            digits
              ? `<tr>
            <td align="center" style="padding:22px 32px 0;">
              <div style="display:inline-block;letter-spacing:8px;font-family:Arial,Helvetica,sans-serif;font-size:32px;font-weight:700;color:#153551;background:#f4f7fb;border:1px solid #e4ebf3;border-radius:12px;padding:14px 22px 14px 30px;">
                ${digits}
              </div>
            </td>
          </tr>`
              : ''
          }
          <tr>
            <td align="center" style="padding:22px 32px 8px;">
              <a href="${escapeHtml(params.acceptUrl)}" style="display:inline-block;background:#153551;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;padding:12px 22px;">
                Accept invitation
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 36px 28px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#6b7280;">
              This invitation is cancelled automatically if it is not accepted within 48 hours.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

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
      console.error('[team-invite] Resend failed', res.status, body.slice(0, 400));
      return false;
    }
    return true;
  } catch (error) {
    console.error('[team-invite] send error', error);
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
