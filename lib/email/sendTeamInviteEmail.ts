import 'server-only';

export type TeamInviteEmailParams = {
  to: string;
  businessName: string;
  inviterName: string;
  acceptUrl: string;
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
  const subject = `You're invited to manage ${business} on FinderB`;
  const text = [
    `${inviter} invited you to use the same FinderB Business profile for ${business}.`,
    '',
    'Open this link, create your own password, then sign in with this email:',
    params.acceptUrl,
    '',
    'If you were not expecting this, you can ignore the email.',
  ].join('\n');

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
