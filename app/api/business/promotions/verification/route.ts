import { promotionBusinessId } from '@/lib/promotions/auth';
import { submitVerification } from '@/lib/promotions/service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  const businessId = await promotionBusinessId(request);
  if (!businessId) {
    return Response.json({ success: false, error: 'Please log in again.' }, { status: 401 });
  }
  const form = await request.formData();
  const result = await submitVerification(businessId, form);
  return Response.json(result, { status: result.success ? 200 : 400 });
}
