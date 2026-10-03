import { sendBusinessWelcomeEmail } from '@/lib/email/sendBusinessWelcomeEmail';
import { mobileApiJson, mobileApiOptions } from '@/lib/mobileApiCors';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function OPTIONS() {
  return mobileApiOptions();
}

/** Sends the registration welcome letter. Rate-limited so it cannot be used as a mailer. */
export async function POST(request: Request) {
  const limit = await enforceRateLimit('authEmail', 'welcome-preview');
  if (!limit.ok) {
    return mobileApiJson({ success: false, error: limit.error }, 429);
  }

  try {
    const body = (await request.json()) as {
      email?: string;
      ownerName?: string;
      businessName?: string;
      city?: string;
    };
    const email = String(body.email || '').trim().toLowerCase();
    if (!email.includes('@')) {
      return mobileApiJson({ success: false, error: 'Enter a valid email address.' }, 400);
    }
    const sent = await sendBusinessWelcomeEmail({
      to: email,
      ownerName: String(body.ownerName || 'there'),
      businessName: String(body.businessName || 'your business'),
      city: body.city,
    });
    if (!sent) {
      return mobileApiJson({ success: false, error: 'Could not send the welcome email.' }, 500);
    }
    return mobileApiJson({ success: true, message: 'Welcome email sent.' });
  } catch (error) {
    console.error('[welcome preview]', error);
    return mobileApiJson({ success: false, error: 'Could not send the welcome email.' }, 500);
  }
}
