import 'server-only';

import { SITE_ORIGIN } from '@/lib/siteSeo';

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

/** Free and Starter shops get a visit notice, not the customer's contact details. */
export async function sendLeadUnlockEmail(params: {
  to: string;
  businessName: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || 'FinderB <support@finderb.com>';
  if (!key) return false;

  const business = params.businessName.trim() || 'your business';
  const plansUrl = `${SITE_ORIGIN}/business/dashboard?tab=subscription`;
  const detail =
    'A user has visited your business profile on FinderB and is interested in your services. Unlock FinderB Business premium plans (Growth or Pro) to unlock lead contact info.';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [params.to.trim()],
      subject: 'Someone is interested in your business on FinderB',
      text: `${detail}\n\nView Growth and Pro plans: ${plansUrl}`,
      html: `<p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1f2937;">${escapeHtml(detail)}</p><p style="font-family:Arial,sans-serif;font-size:14px;"><a href="${plansUrl}" style="display:inline-block;background:#153551;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:999px;">View Growth and Pro plans</a></p><p style="font-family:Arial,sans-serif;font-size:12px;color:#6b7280;">This note is for ${escapeHtml(business)}. Lead phone numbers and emails stay hidden on the free plan.</p>`,
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
