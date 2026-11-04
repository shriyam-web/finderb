import { promotionBusinessId } from '@/lib/promotions/auth';
import { attachPromotionVideo } from '@/lib/promotions/service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  const businessId = await promotionBusinessId(request);
  if (!businessId) {
    return Response.json({ success: false, error: 'Please log in again.' }, { status: 401 });
  }
  const form = await request.formData();
  const orderId = String(form.get('orderId') || '');
  const file = form.get('video');
  if (!(file instanceof File)) {
    return Response.json({ success: false, error: 'Choose a promotional video.' }, { status: 400 });
  }
  const result = await attachPromotionVideo(businessId, orderId, file);
  return Response.json(result, { status: result.success ? 200 : 400 });
}
