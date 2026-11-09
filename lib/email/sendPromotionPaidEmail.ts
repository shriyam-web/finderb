import 'server-only';

const ADMIN_TO = 'business@finderb.com';

export async function sendCustomPlanRequestEmail(params: {
  businessName: string;
  requestId: string;
  budgetInr: number;
  durationDays: number;
  coverage: string;
  area: string;
  pincode: string;
  phone: string;
  goal: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || 'FinderB <support@finderb.com>';
  if (!key) return;
  const name = params.businessName.trim() || 'A business';
  const text = [
    `${name} asked for a custom promotion.`,
    `Request ${params.requestId}`,
    `Budget ₹${params.budgetInr.toLocaleString('en-IN')} · ${params.durationDays} days · ${params.coverage}`,
    `Area ${params.area}, ${params.pincode}`,
    `Phone ${params.phone}`,
    `What to promote: ${params.goal}`,
    'Open FinderB Admin → Business Promotions → Custom. Reply within 24 hours.',
  ].join('\n');
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [ADMIN_TO],
        subject: `Custom promotion · ${name} · ${params.requestId}`,
        text,
      }),
    });
  } catch {
    // The request is already stored for the admin panel.
  }
}

export async function sendPromotionPaidEmails(params: {
  merchantEmail: string;
  businessName: string;
  orderId: string;
  packageName: string;
  amountInr: number;
  area: string;
  pincode: string;
  audience?: string;
  content?: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || 'FinderB <support@finderb.com>';
  if (!key) return;

  const name = params.businessName.trim() || 'your business';
  const pack = params.packageName.trim() || 'promotion';
  const amount = `₹${params.amountInr.toLocaleString('en-IN')}`;
  const place = [params.area.trim(), params.pincode.trim()].filter(Boolean).join(', ');
  const orderUrl = `https://finderb.com/business/promotions/${params.orderId}`;
  const merchant = params.merchantEmail.trim();

  const messages: { to: string; subject: string; text: string }[] = [];
  if (merchant) {
    messages.push({
      to: merchant,
      subject: `Payment received for ${pack}`,
      text: [
        `We received ${amount} for ${pack} on ${name}.`,
        `Order ${params.orderId}${place ? ` · ${place}` : ''}.`,
        'FinderB will review the shop video and then run the Facebook and Instagram ads.',
        `Open the promotion: ${orderUrl}`,
      ].join('\n'),
    });
  }
  messages.push({
    to: ADMIN_TO,
    subject: `Promotion paid · ${name} · ${params.orderId}`,
    text: [
      `${name} paid ${amount} for ${pack}.`,
      `Order ${params.orderId}${place ? ` · ${place}` : ''}.`,
      params.audience ? `Target: ${params.audience}` : '',
      params.content ? `Ad content: ${params.content}` : '',
      merchant ? `Merchant email: ${merchant}` : 'Merchant email was not on file.',
      'Open this order in FinderB Admin and move it to review after you check the video.',
    ].filter(Boolean).join('\n'),
  });

  await Promise.all(messages.map(async (message) => {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [message.to],
          subject: message.subject,
          text: message.text,
        }),
      });
    } catch {
      // Payment is already recorded. A missed email must not undo it.
    }
  }));
}
