import 'server-only';

/**
 * Sends a password-reset email via Resend when RESEND_API_KEY is set.
 * Returns false (and logs) when mail is not configured — callers must not
 * leak that difference to the client.
 */
export async function sendPasswordResetEmail(
  to: string,
  code: string,
  resetUrl: string
): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || 'FinderB <support@finderb.com>';

  if (!key) {
    console.warn('[password-reset] RESEND_API_KEY is not set; email not sent');
    return false;
  }

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
        subject: 'Your FinderB password reset code',
        text: [
          `Your FinderB reset code is ${code}.`,
          'It expires in 15 minutes.',
          '',
          `Reset your password: ${resetUrl}`,
          '',
          'If you did not ask for this, you can ignore this email.',
        ].join('\n'),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[password-reset] Resend failed', res.status, body.slice(0, 400));
      return false;
    }
    return true;
  } catch (error) {
    console.error('[password-reset] Email send error', error);
    return false;
  }
}
