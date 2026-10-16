import 'server-only';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function asList(value: string[]): string[] {
  return value.map((item) => item.trim()).filter(Boolean);
}

export async function sendAdminBroadcastEmail(input: {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || 'FinderB <support@finderb.com>';
  if (!key) {
    return { ok: false, error: 'Email is not configured. Add RESEND_API_KEY on the FinderB server.' };
  }

  const to = asList(input.to);
  const cc = asList(input.cc || []);
  const bcc = asList(input.bcc || []);
  const subject = input.subject.trim();
  const body = input.body.trim();
  if (!to.length || !subject || !body) {
    return { ok: false, error: 'Add at least one recipient, a subject, and a message.' };
  }

  const html = body
    .split(/\n{2,}/)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#1f2937;">${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`,
    )
    .join('');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      ...(cc.length ? { cc } : {}),
      ...(bcc.length ? { bcc } : {}),
      subject,
      text: body,
      html,
    }),
  });

  if (res.ok) return { ok: true };
  const payload = (await res.json().catch(() => null)) as { message?: string } | null;
  return { ok: false, error: payload?.message || 'Resend could not deliver this email.' };
}
