import 'server-only';

export async function sendNewLeadEmail(params: {
  to: string;
  businessName: string;
  title: string;
  body: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || 'FinderB <support@finderb.com>';
  if (!key) return false;

  const business = params.businessName.trim() || 'your business';
  const subject = params.title.trim() || 'New lead on FinderB';
  const detail = params.body.trim();
  const leadsUrl = 'https://finderb.com/business/dashboard?tab=leads';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [params.to.trim()],
      subject,
      text: `${detail}\n\nOpen your leads: ${leadsUrl}`,
      html: `<p style="font-family:Arial,sans-serif;font-size:15px;color:#1f2937;">${escapeHtml(detail)}</p><p style="font-family:Arial,sans-serif;font-size:14px;"><a href="${leadsUrl}">Open leads for ${escapeHtml(business)}</a></p>`,
    }),
  });
  return res.ok;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
