import 'server-only';

import { recordMerchantNotification } from '@/lib/merchantAlert.server';
import { createServiceClient } from '@/lib/supabase/service';
import { queueBusinessPush } from '@/lib/userNotifications.server';

const FROM = () => process.env.EMAIL_FROM?.trim() || 'FinderB <support@finderb.com>';

async function sendApprovalEmail(to: string, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key || !to) return false;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM(), to: [to], subject, text }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function notifyAdApproved(orderId: string): Promise<{ success: boolean; skipped?: boolean; reason?: string }> {
  const id = orderId.trim();
  const supabase = createServiceClient();
  if (!supabase || !id) return { success: false, reason: 'That ad was not found.' };

  const { data } = await supabase.from('promotion_orders').select('*').eq('id', id).maybeSingle();
  const row = data as Record<string, unknown> | null;
  if (!row) return { success: false, reason: 'That ad was not found.' };
  if (String(row.ad_review_status || '') !== 'approved') return { success: false, reason: 'This ad is not approved.' };
  if (String(row.payment_status || '') === 'paid') return { success: true, skipped: true };

  const businessId = String(row.business_id || '');
  const { data: prior } = await supabase
    .from('merchant_notifications')
    .select('metadata')
    .eq('business_id', businessId)
    .eq('type', 'ad_approved')
    .order('created_at', { ascending: false })
    .limit(30);
  const already = (prior || []).some((item) => {
    const meta = item.metadata as Record<string, unknown> | null;
    return String(meta?.orderId || '') === id;
  });
  if (already) return { success: true, skipped: true };

  const { data: business } = await supabase
    .from('Business')
    .select('businessName, email')
    .eq('id', businessId)
    .maybeSingle();
  const snap = (row.package_snapshot && typeof row.package_snapshot === 'object'
    ? row.package_snapshot
    : {}) as Record<string, unknown>;
  const packageName = String(snap.name || 'Your ad');
  const amount = Number(row.amount_inr) || 0;
  const amountLabel = `₹${amount.toLocaleString('en-IN')}`;
  const businessName = String(business?.businessName || 'your business');
  const email = String(business?.email || '').trim();
  const payPath = `/business/promote?order=${encodeURIComponent(id)}`;
  const payUrl = `https://finderb.com${payPath}`;
  const title = 'Your ad is approved';
  const body = `${packageName} is approved. Pay ${amountLabel} to start running this ad.`;

  const emailed = await sendApprovalEmail(
    email,
    `Your ad is approved · ${packageName}`,
    [
      `${packageName} for ${businessName} is approved.`,
      `Pay ${amountLabel} to start running this ad.`,
      `Open it here: ${payUrl}`,
    ].join('\n'),
  );

  const notificationId = await recordMerchantNotification({
    businessId,
    type: 'ad_approved',
    title,
    body,
    metadata: { orderId: id, amountInr: amount, packageName, url: payPath },
  });

  if (notificationId) {
    queueBusinessPush({
      businessId,
      type: 'promotion',
      title,
      body,
      url: payPath,
      notificationId,
    });
  }

  if (!emailed && !notificationId) {
    return { success: false, reason: 'The approval notice could not be sent.' };
  }
  return { success: true };
}
