import 'server-only';

export async function sendOwnershipEmail(params: {
  to: string;
  subject: string;
  text: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || 'FinderB <support@finderb.com>';
  if (!key) return false;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [params.to.trim()],
      subject: params.subject,
      text: params.text,
    }),
  });
  return res.ok;
}
