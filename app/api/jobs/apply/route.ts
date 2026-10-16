import { NextResponse } from 'next/server';
import { submitJobApplication } from '@/app/actions/job';
import { mobileGetUserFromToken } from '@/lib/auth/mobileAuth.server';
import { getBearerToken } from '@/lib/auth/mobileToken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function fieldsOf(request: Request): Promise<{
  jobId: string;
  businessId: string;
  jobTitle: string;
  fullName: string;
  email: string;
  phone: string;
  message: string;
  cv: { filename: string; bytes: Buffer } | null;
}> {
  const type = request.headers.get('content-type') || '';
  if (type.includes('multipart/form-data')) {
    const form = await request.formData();
    const file = form.get('cv');
    let cv: { filename: string; bytes: Buffer } | null = null;
    if (file instanceof File && file.size > 0) {
      cv = { filename: file.name, bytes: Buffer.from(await file.arrayBuffer()) };
    }
    return {
      jobId: String(form.get('jobId') || ''),
      businessId: String(form.get('businessId') || ''),
      jobTitle: String(form.get('jobTitle') || ''),
      fullName: String(form.get('fullName') || ''),
      email: String(form.get('email') || ''),
      phone: String(form.get('phone') || ''),
      message: String(form.get('message') || ''),
      cv,
    };
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  return {
    jobId: String(body?.jobId || ''),
    businessId: String(body?.businessId || ''),
    jobTitle: String(body?.jobTitle || ''),
    fullName: String(body?.fullName || ''),
    email: String(body?.email || ''),
    phone: String(body?.phone || ''),
    message: String(body?.message || ''),
    cv: null,
  };
}

export async function POST(request: Request) {
  try {
    const token = getBearerToken(request);
    const user = token ? await mobileGetUserFromToken(token) : null;
    if (!user) {
      return NextResponse.json({ success: false, error: 'Sign in to apply.' }, { status: 401 });
    }

    const fields = await fieldsOf(request);
    const fullName = fields.fullName.trim();
    const email = fields.email.trim();
    const phone = fields.phone.trim();
    if (!fields.jobId || !fields.businessId || !fullName || !email || !phone) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and phone are required' },
        { status: 400 },
      );
    }

    const result = await submitJobApplication({
      jobId: fields.jobId,
      businessId: fields.businessId,
      jobTitle: fields.jobTitle || undefined,
      fullName: fullName.slice(0, 120),
      email: email.slice(0, 200),
      phone: phone.slice(0, 20),
      message: fields.message ? fields.message.slice(0, 2000) : undefined,
      userId: user.id,
      cv: fields.cv,
    });
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('[mobile job application]', error);
    return NextResponse.json(
      { success: false, error: 'Could not submit application. Please try again.' },
      { status: 500 },
    );
  }
}
