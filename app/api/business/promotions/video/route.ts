import { promotionBusinessId } from '@/lib/promotions/auth';
import { attachPromotionVideo, commitPromotionVideo, issuePromotionVideoUpload } from '@/lib/promotions/service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  const businessId = await promotionBusinessId(request);
  if (!businessId) {
    return Response.json({ success: false, error: 'Please log in again.' }, { status: 401 });
  }
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = (await request.json().catch(() => null)) as {
      intent?: string;
      orderId?: string;
      publicId?: string;
      format?: string;
      duration?: number;
      width?: number;
      height?: number;
      bytes?: number;
    } | null;
    const orderId = String(body?.orderId || '');
    const result = body?.intent === 'ticket'
      ? await issuePromotionVideoUpload(businessId, orderId)
      : await commitPromotionVideo(businessId, orderId, {
          publicId: String(body?.publicId || ''),
          format: body?.format,
          duration: body?.duration,
          width: body?.width,
          height: body?.height,
          bytes: body?.bytes,
        });
    return Response.json(result, { status: result.success ? 200 : 400 });
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
