import 'server-only';

import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/service';
import { isPromoteBusinessOnlineEnabled } from '@/lib/siteConfig';
import { createRazorpayAmountOrder, verifyRazorpayPaymentSignature } from '@/lib/razorpay/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rateLimit';
import {
  CAMPAIGN_LABEL,
  DECLARATION,
  DOCUMENT_TYPES,
  type CampaignStatus,
  type VerificationStatus,
  canMoveCampaign,
  discountPercent,
  validIndiaCoordinate,
  validPincode,
} from '@/lib/promotions/model';
import { readRemoteMp4Facts } from '@/lib/promotions/mp4Facts';
import {
  destroyPrivateAsset,
  privateDownloadUrl,
  publicVideoPreset,
  readPrivateVideo,
  signPrivateUpload,
  uploadPrivateFile,
  type StoredAsset,
} from '@/lib/promotions/privateMedia';

type Fail = { success: false; error: string; code?: string };
type Ok<T> = { success: true } & T;

const VIDEO_MAX = 60 * 1024 * 1024;
const DOC_MAX = 8 * 1024 * 1024;
const PHOTO_MAX = 8 * 1024 * 1024;

function fail(error: string, code?: string): Fail {
  return { success: false, error, code };
}

function db() {
  return createServiceClient();
}

export type PromotionPackage = {
  id: string;
  name: string;
  durationDays: number;
  coverage: string;
  priceInr: number;
  referenceInr: number;
  discountPercent: number;
  reach: string;
  views: string;
  visits: string;
  popular: boolean;
  active: boolean;
  sortOrder: number;
  estimateNote: string;
};

function mapPackage(row: Record<string, unknown>): PromotionPackage {
  const price = Number(row.price_inr) || 0;
  const reference = Number(row.reference_inr) || 0;
  return {
    id: String(row.id),
    name: String(row.name || ''),
    durationDays: Number(row.duration_days) || 0,
    coverage: String(row.coverage_label || ''),
    priceInr: price,
    referenceInr: reference,
    discountPercent: discountPercent(price, reference),
    reach: String(row.reach_label || ''),
    views: String(row.views_label || ''),
    visits: String(row.visits_label || ''),
    popular: Boolean(row.popular),
    active: row.active !== false,
    sortOrder: Number(row.sort_order) || 0,
    estimateNote: 'Estimated reach. Not a guaranteed result.',
  };
}

async function audit(entry: {
  orderId?: string | null;
  verificationId?: string | null;
  businessId?: string | null;
  adminId?: string | null;
  action: string;
  from?: string | null;
  to?: string | null;
  note?: string | null;
  metrics?: Record<string, unknown> | null;
}) {
  const supabase = db();
  if (!supabase) return;
  await supabase.from('promotion_audit').insert({
    order_id: entry.orderId || null,
    verification_id: entry.verificationId || null,
    business_id: entry.businessId || null,
    actor_admin_id: entry.adminId || null,
    action: entry.action,
    from_status: entry.from || null,
    to_status: entry.to || null,
    note: entry.note || null,
    metrics: entry.metrics || null,
  });
}

export async function listPackages(includeInactive = false): Promise<PromotionPackage[] | Fail> {
  const supabase = db();
  if (!supabase) return fail('Promotions are not available right now.');
  let query = supabase.from('promotion_packages').select('*').order('sort_order', { ascending: true });
  if (!includeInactive) query = query.eq('active', true);
  const { data, error } = await query;
  if (error) return fail('Promotion packages could not be loaded.');
  return (data || []).map((row) => mapPackage(row as Record<string, unknown>));
}

async function latestVerification(businessId: string) {
  const supabase = db();
  if (!supabase) return null;
  const { data } = await supabase
    .from('business_verifications')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as Record<string, unknown> | null;
}

function publicVerification(row: Record<string, unknown> | null) {
  if (!row) {
    return {
      status: 'not_submitted' as VerificationStatus,
      submittedAt: null as string | null,
      reviewedAt: null as string | null,
      rejectionReason: null as string | null,
      documentType: null as string | null,
      declaration: DECLARATION,
    };
  }
  return {
    status: String(row.status || 'submitted') as VerificationStatus,
    submittedAt: (row.submitted_at as string) || null,
    reviewedAt: (row.reviewed_at as string) || null,
    rejectionReason: (row.rejection_reason as string) || null,
    documentType: (row.document_type as string) || null,
    declaration: DECLARATION,
  };
}

function adReviewStatus(row: Record<string, unknown>): 'none' | 'pending' | 'approved' | 'denied' {
  const stored = String(row.ad_review_status || '');
  if (stored === 'pending' || stored === 'approved' || stored === 'denied') return stored;
  const video = Boolean(row.video_public_id || (typeof row.video_url === 'string' && row.video_url.startsWith('https://')));
  const unpaid = String(row.payment_status || 'pending') !== 'paid';
  const closed = ['rejected', 'cancelled', 'refund_pending', 'refunded', 'completed'].includes(String(row.campaign_status || ''));
  if (video && unpaid && !closed) return 'pending';
  return 'none';
}

function publicOrder(row: Record<string, unknown>) {
  const snap = (row.package_snapshot && typeof row.package_snapshot === 'object'
    ? row.package_snapshot
    : {}) as Record<string, unknown>;
  const status = String(row.campaign_status || 'payment_pending') as CampaignStatus;
  const completed = status === 'completed';
  const paid = String(row.payment_status || 'pending') === 'paid';
  const review = adReviewStatus(row);
  const campaignLabel = !paid
    ? review === 'denied'
      ? 'Needs a change'
      : review === 'approved'
        ? 'Approved · payment is open'
        : review === 'pending'
          ? 'With FinderB'
          : 'Draft'
    : (CAMPAIGN_LABEL[status] || status);
  return {
    id: String(row.id),
    packageId: String(row.package_id || ''),
    packageName: String(snap.name || row.package_id || ''),
    durationDays: Number(snap.durationDays || 0),
    coverage: String(row.target_coverage || snap.coverage || ''),
    priceInr: Number(row.amount_inr) || 0,
    referenceInr: Number(snap.referenceInr || 0),
    paymentStatus: String(row.payment_status || 'pending'),
    campaignStatus: status,
    campaignLabel,
    adReviewStatus: review,
    adReviewReason: String(row.ad_review_reason || ''),
    targetPincode: String(row.target_pincode || ''),
    targetArea: String(row.target_area || ''),
    audience: String(snap.audience || ''),
    content: String(snap.content || ''),
    videoReady: Boolean(row.video_public_id || (typeof row.video_url === 'string' && row.video_url.startsWith('https://'))),
    videoUrl: (typeof row.video_url === 'string' && row.video_url.startsWith('https://') ? row.video_url : null)
      || (row.video_public_id
        ? privateDownloadUrl({
            publicId: String(row.video_public_id),
            resource: 'video',
            format: String(row.video_format || ''),
          })
        : null),
    createdAt: (row.created_at as string) || null,
    startedAt: (row.campaign_started_at as string) || null,
    endedAt: (row.campaign_ended_at as string) || null,
    rejectionReason: !paid && review === 'denied'
      ? String(row.ad_review_reason || '') || null
      : (row.rejection_reason as string) || null,
    report: completed && row.actual_reach != null
      ? {
          reach: Number(row.actual_reach),
          views: Number(row.actual_views ?? 0),
          visits: Number(row.actual_visits ?? 0),
        }
      : null,
  };
}

async function requireEnabled(): Promise<Fail | null> {
  if (await isPromoteBusinessOnlineEnabled()) return null;
  return fail('Promote Your Business Online is turned off.', 'hidden');
}

export async function merchantDesk(businessId: string): Promise<Ok<{
  verification: ReturnType<typeof publicVerification>;
  packages: PromotionPackage[];
  orders: ReturnType<typeof publicOrder>[];
  customRequest: ReturnType<typeof publicCustom> | null;
  declaration: string;
}> | Fail> {
  const hidden = await requireEnabled();
  if (hidden) return hidden;
  const supabase = db();
  if (!supabase) return fail('Promotions are not available right now.');
  const [packages, verification, ordersResult, customResult] = await Promise.all([
    listPackages(false),
    latestVerification(businessId),
    supabase
      .from('promotion_orders')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('promotion_custom_requests')
      .select('id, status, budget_inr, duration_days, created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (!Array.isArray(packages)) return packages;
  const { data, error } = ordersResult;
  if (error) return fail('Your promotions could not be loaded.');
  return {
    success: true,
    verification: publicVerification(verification),
    packages,
    orders: (data || []).map((row) => publicOrder(row as Record<string, unknown>)),
    customRequest: customResult.data ? publicCustom(customResult.data as Record<string, unknown>) : null,
    declaration: DECLARATION,
  };
}

function publicCustom(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    status: String(row.status || 'received'),
    budgetInr: Number(row.budget_inr) || 0,
    durationDays: Number(row.duration_days) || 0,
    createdAt: (row.created_at as string) || null,
  };
}

function indianMobile(value: string) {
  const digits = value.replace(/\D/g, '');
  const local = digits.length === 12 && digits.startsWith('91')
    ? digits.slice(2)
    : digits.length === 11 && digits.startsWith('0')
      ? digits.slice(1)
      : digits;
  return /^[6-9]\d{9}$/.test(local) ? local : '';
}

export async function submitCustomPromotion(businessId: string, input: {
  budgetInr: number;
  durationDays: number;
  coverage: string;
  pincode: string;
  area: string;
  goal: string;
  phone: string;
  note?: string;
}): Promise<Ok<{ requestId: string }> | Fail> {
  const hidden = await requireEnabled();
  if (hidden) return hidden;
  const limited = checkRateLimit(`promo-custom:${businessId}`, RATE_LIMITS.write);
  if (!limited.allowed) return fail('Too many custom requests. Wait and try again.');
  const budget = Math.round(Number(input.budgetInr));
  const days = Math.round(Number(input.durationDays));
  const coverage = input.coverage.trim().slice(0, 80);
  const area = input.area.trim().slice(0, 120);
  const goal = input.goal.trim().slice(0, 400);
  const note = (input.note || '').trim().slice(0, 400);
  const phone = indianMobile(input.phone);
  if (!Number.isFinite(budget) || budget < 100 || budget > 5000000) return fail('Enter a budget between ₹100 and ₹50,00,000.');
  if (!Number.isFinite(days) || days < 1 || days > 90) return fail('Enter how many days the ads should run, from 1 to 90.');
  if (coverage.length < 2) return fail('Say how far the ads should go.');
  if (!validPincode(input.pincode)) return fail('Enter a 6-digit Indian pincode.');
  if (area.length < 2) return fail('Enter the locality you want to reach.');
  if (goal.length < 8) return fail('Tell FinderB what the ad should promote.');
  if (!phone) return fail('Enter a 10-digit mobile number for the ad.');
  const supabase = db();
  if (!supabase) return fail('The request could not be sent.');
  const id = `FC${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const { error } = await supabase.from('promotion_custom_requests').insert({
    id,
    business_id: businessId,
    budget_inr: budget,
    duration_days: days,
    coverage,
    pincode: input.pincode.trim(),
    area,
    goal,
    phone,
    note: note || null,
    status: 'received',
  });
  if (error) return fail('The custom plan could not be sent. Try again.');
  const { data: business } = await supabase
    .from('Business')
    .select('businessName')
    .eq('id', businessId)
    .maybeSingle();
  const { sendCustomPlanRequestEmail } = await import('@/lib/email/sendPromotionPaidEmail');
  await sendCustomPlanRequestEmail({
    businessName: String((business as { businessName?: string } | null)?.businessName || ''),
    requestId: id,
    budgetInr: budget,
    durationDays: days,
    coverage,
    area,
    pincode: input.pincode.trim(),
    phone,
    goal,
  });
  return { success: true, requestId: id };
}

export async function merchantOrder(businessId: string, orderId: string) {
  const desk = await merchantDesk(businessId);
  if (!desk.success) return desk;
  const order = desk.orders.find((item) => item.id === orderId);
  if (!order) return fail('That promotion was not found.');
  return { success: true as const, order, verification: desk.verification };
}

export async function submitVerification(businessId: string, form: FormData): Promise<Ok<{ status: VerificationStatus }> | Fail> {
  const hidden = await requireEnabled();
  if (hidden) return hidden;
  const limited = checkRateLimit(`promo-verify:${businessId}`, RATE_LIMITS.write);
  if (!limited.allowed) return fail('Too many verification attempts. Wait and try again.');
  const current = await latestVerification(businessId);
  const status = String(current?.status || 'not_submitted');
  if (status === 'approved') {
    return fail('This verification is already approved. A change starts a new review, which you can send from resubmission after the team asks for it.');
  }
  const declared = String(form.get('declaration') || '') === 'yes';
  if (!declared) return fail('Accept the legal declaration before submitting.');
  const documentType = String(form.get('documentType') || '');
  if (!DOCUMENT_TYPES.some((item) => item.id === documentType)) return fail('Choose a permitted document type.');
  const latitude = Number(form.get('latitude'));
  const longitude = Number(form.get('longitude'));
  const accuracy = Number(form.get('accuracy'));
  if (!validIndiaCoordinate(latitude, longitude)) {
    return fail('The shop location could not be confirmed in India. Turn on location and take the photos again.');
  }
  const photo = form.get('shopPhoto');
  if (!(photo instanceof File) || photo.size < 1) return fail('Take a selfie with the live camera. A saved photo is not accepted.');
  if (photo.size > PHOTO_MAX) return fail('The selfie is larger than 8 MB. Take it again.');
  if (!/^image\/(jpeg|png|webp)$/.test(photo.type)) return fail('The selfie must come from the live camera.');
  const docs = form.getAll('documents').filter((item): item is File => item instanceof File && item.size > 0);
  if (!docs.length) return fail('Photograph the certificate with the live camera. A saved photo is not accepted.');
  if (docs.length > 3) return fail('Photograph one certificate.');
  for (const doc of docs) {
    if (doc.size > DOC_MAX) return fail('The certificate photo is larger than 8 MB. Take it again.');
    if (!/^image\/(jpeg|png|webp)$/.test(doc.type)) {
      return fail('Photograph the certificate with the live camera.');
    }
  }
  const shop = await uploadPrivateFile(photo, 'image', 'finderb-private/verification');
  if (!shop.success) return shop;
  const documents: StoredAsset[] = [];
  for (const doc of docs) {
    const saved = await uploadPrivateFile(doc, doc.type === 'application/pdf' ? 'raw' : 'image', 'finderb-private/verification');
    if (!saved.success) {
      await destroyPrivateAsset(shop.asset);
      await Promise.all(documents.map((asset) => destroyPrivateAsset(asset)));
      return saved;
    }
    documents.push(saved.asset);
  }
  const supabase = db();
  if (!supabase) {
    await destroyPrivateAsset(shop.asset);
    await Promise.all(documents.map((asset) => destroyPrivateAsset(asset)));
    return fail('Verification could not be saved.');
  }
  const id = `ver_${crypto.randomBytes(8).toString('hex')}`;
  const now = new Date().toISOString();
  const { error } = await supabase.from('business_verifications').insert({
    id,
    business_id: businessId,
    status: 'submitted',
    shop_photo_url: shop.deliveryUrl,
    shop_photo_public_id: shop.asset.publicId,
    shop_photo_format: shop.asset.format,
    latitude,
    longitude,
    accuracy_m: Number.isFinite(accuracy) ? accuracy : null,
    document_type: documentType,
    document_urls: documents,
    declaration_accepted: true,
    submitted_at: now,
    updated_at: now,
  });
  if (error) {
    await destroyPrivateAsset(shop.asset);
    await Promise.all(documents.map((asset) => destroyPrivateAsset(asset)));
    return fail('Verification could not be saved.');
  }
  await audit({ verificationId: id, businessId, action: 'verification_submitted', to: 'submitted' });
  return { success: true, status: 'submitted' };
}

export const AD_AUDIENCES = [
  'More views',
  'More calls',
  'More shop visits',
  'More messages',
  'Informative',
  'Awareness',
] as const;

export async function createPromotionOrder(businessId: string, input: {
  packageId: string;
  pincode: string;
  area: string;
  audience?: string;
  content?: string;
}): Promise<Ok<{ orderId: string }> | Fail> {
  const hidden = await requireEnabled();
  if (hidden) return hidden;
  const limited = checkRateLimit(`promo-order:${businessId}`, RATE_LIMITS.payment);
  if (!limited.allowed) return fail('Too many promotion orders. Wait and try again.');
  const verification = await latestVerification(businessId);
  if (String(verification?.status) !== 'approved') {
    return fail('Approve your business verification before buying a promotion.', 'unverified');
  }
  const packages = await listPackages(false);
  if (!Array.isArray(packages)) return packages;
  const pack = packages.find((item) => item.id === input.packageId);
  if (!pack) return fail('That package is not available.');
  if (!validPincode(input.pincode)) return fail('Enter a 6-digit Indian pincode.');
  const area = input.area.trim().slice(0, 120);
  if (area.length < 2) return fail('Enter the shop locality.');
  const picked = (input.audience || '').split(',').map((item) => item.trim()).filter(Boolean).slice(0, 4);
  const content = (input.content || '').trim().slice(0, 400);
  if (picked.length || content) {
    if (!picked.length || picked.length > 3 || picked.some((item) => !(AD_AUDIENCES as readonly string[]).includes(item))) {
      return fail(picked.length > 3 ? 'Choose up to 3 targets.' : 'Choose the target of this ad.');
    }
    if (content.length < 8) return fail('Write what the ad should say.');
  }
  const audience = picked.join(', ');
  const supabase = db();
  if (!supabase) return fail('The order could not be created.');
  const id = `FP${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const snapshot = {
    name: pack.name,
    durationDays: pack.durationDays,
    coverage: pack.coverage,
    priceInr: pack.priceInr,
    referenceInr: pack.referenceInr,
    reach: pack.reach,
    views: pack.views,
    visits: pack.visits,
    ...(audience ? { audience, targets: picked, content } : {}),
  };
  const { error } = await supabase.from('promotion_orders').insert({
    id,
    business_id: businessId,
    package_id: pack.id,
    package_snapshot: snapshot,
    target_pincode: input.pincode.trim(),
    target_area: area,
    target_coverage: pack.coverage,
    amount_inr: pack.priceInr,
    payment_status: 'pending',
    campaign_status: 'payment_pending',
  });
  if (error) return fail('The order could not be created.');
  await audit({ orderId: id, businessId, action: 'order_created', to: 'payment_pending' });
  return { success: true, orderId: id };
}

const VIDEO_RULES = 'Choose an MP4 or MOV that is already vertical (about 9:16), between 15 and 45 seconds, and under 60 MB.';
const VIDEO_FOLDER = 'finderb-private/promotions';

function describeVideo(input: { duration?: number; width?: number; height?: number; bytes?: number; format?: string }) {
  const format = String(input.format || '').toLowerCase();
  if (format && !/^(mp4|mov|qt|quicktime)$/.test(format)) {
    return `This file is not an MP4 or MOV. ${VIDEO_RULES}`;
  }
  if (input.bytes != null && Number.isFinite(input.bytes) && input.bytes > VIDEO_MAX) {
    return `This video is larger than 60 MB. ${VIDEO_RULES}`;
  }
  const duration = Number(input.duration);
  const width = Number(input.width);
  const height = Number(input.height);
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(width) || width < 1 || !Number.isFinite(height) || height < 1) {
    return `FinderB could not read the length or shape of this video. ${VIDEO_RULES}`;
  }
  if (duration < 15 || duration > 45) {
    return `This video is ${Math.round(duration)} seconds. It must be between 15 and 45 seconds.`;
  }
  const ratio = height / width;
  if (ratio < 1.5 || ratio > 2.05) {
    return 'This video is not vertical. Choose one that is about 9:16.';
  }
  return null;
}

async function ownPromotionOrder(businessId: string, orderId: string) {
  const supabase = db();
  if (!supabase) return { error: 'The video could not be saved.' as const, row: null, supabase: null };
  const { data } = await supabase.from('promotion_orders').select('*').eq('id', orderId).eq('business_id', businessId).maybeSingle();
  if (!data) return { error: 'That promotion was not found.' as const, row: null, supabase };
  const row = data as Record<string, unknown>;
  if (row.payment_status === 'paid') return { error: 'The video is already locked to a paid order.' as const, row: null, supabase };
  return { error: null, row, supabase };
}

export async function issuePromotionVideoUpload(businessId: string, orderId: string) {
  const hidden = await requireEnabled();
  if (hidden) return hidden;
  const limited = checkRateLimit(`promo-video:${businessId}`, RATE_LIMITS.write);
  if (!limited.allowed) return fail('Too many video uploads. Wait and try again.');
  const owned = await ownPromotionOrder(businessId, orderId);
  if (owned.error || !owned.row) return fail(owned.error || 'That promotion was not found.');
  const ticket = signPrivateUpload(VIDEO_FOLDER);
  if (ticket) return { success: true as const, mode: 'signed' as const, orderId, ...ticket, rules: VIDEO_RULES };
  const preset = publicVideoPreset();
  if (!preset) return fail('Video upload is not available right now.');
  return { success: true as const, mode: 'preset' as const, orderId, ...preset, rules: VIDEO_RULES };
}

async function hostedVideoFacts(publicId: string, formatHint: string): Promise<
  | { ok: true; deliveryUrl: string | null; meta: { duration: number; width: number; height: number; bytes: number; format: string } }
  | { ok: false; error: string }
> {
  const extension = /mov|qt|quicktime/i.test(formatHint) ? 'mov' : 'mp4';
  if (publicId.startsWith(`${VIDEO_FOLDER}/`)) {
    const looked = await readPrivateVideo(publicId);
    if (looked && Number.isFinite(looked.duration) && looked.width > 0 && looked.height > 0) {
      return {
        ok: true,
        deliveryUrl: null,
        meta: {
          duration: looked.duration,
          width: looked.width,
          height: looked.height,
          bytes: looked.bytes,
          format: looked.format || extension,
        },
      };
    }
  }
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() || '';
  if (!cloudName) return { ok: false, error: 'Video upload is not available right now.' };
  const deliveryUrl = `https://res.cloudinary.com/${cloudName}/video/upload/${publicId}.${extension}`;
  const head = await fetch(deliveryUrl, { method: 'HEAD' }).catch(() => null);
  const type = head?.headers.get('content-type') || '';
  const bytes = Number(head?.headers.get('content-length') || 0);
  if (!head?.ok || !type.startsWith('video/') || !Number.isFinite(bytes) || bytes < 1) {
    return { ok: false, error: `FinderB could not open this video. ${VIDEO_RULES}` };
  }
  const facts = await readRemoteMp4Facts(deliveryUrl, bytes).catch(() => null);
  if (!facts) return { ok: false, error: `FinderB could not read the length or shape of this video. ${VIDEO_RULES}` };
  return { ok: true, deliveryUrl, meta: { ...facts, bytes, format: extension } };
}

export async function commitPromotionVideo(businessId: string, orderId: string, input: {
  publicId: string;
  format?: string;
  duration?: number;
  width?: number;
  height?: number;
  bytes?: number;
}): Promise<Ok<{ orderId: string }> | Fail> {
  const hidden = await requireEnabled();
  if (hidden) return hidden;
  const publicId = String(input.publicId || '');
  if (!/^[A-Za-z0-9][A-Za-z0-9_./-]{0,180}$/.test(publicId) || publicId.includes('..')) {
    return fail('That video could not be accepted.');
  }
  const owned = await ownPromotionOrder(businessId, orderId);
  if (owned.error || !owned.row || !owned.supabase) return fail(owned.error || 'That promotion was not found.');
  const checked = await hostedVideoFacts(publicId, String(input.format || ''));
  if (!checked.ok) return fail(checked.error);
  const problem = describeVideo(checked.meta);
  const asset = { publicId, resource: 'video' as const, format: checked.meta.format || '' };
  if (problem) {
    await destroyPrivateAsset(asset);
    return fail(problem);
  }
  const previous = owned.row.video_public_id
    ? { publicId: String(owned.row.video_public_id), resource: 'video' as const, format: String(owned.row.video_format || '') }
    : null;
  const { error } = await owned.supabase.from('promotion_orders').update({
    video_url: checked.deliveryUrl,
    video_public_id: publicId,
    video_format: asset.format,
    video_duration_sec: checked.meta.duration,
    video_width: checked.meta.width,
    video_height: checked.meta.height,
    ad_review_status: 'pending',
    ad_review_reason: null,
    ad_reviewed_at: null,
    updated_at: new Date().toISOString(),
  }).eq('id', orderId).eq('business_id', businessId);
  if (error) {
    await destroyPrivateAsset(asset);
    return fail('The video could not be saved.');
  }
  if (previous && previous.publicId !== publicId) await destroyPrivateAsset(previous);
  await audit({ orderId, businessId, action: 'ad_sent_for_review', to: 'pending' });
  return { success: true, orderId };
}

export async function attachPromotionVideo(businessId: string, orderId: string, file: File): Promise<Ok<{ orderId: string }> | Fail> {
  const hidden = await requireEnabled();
  if (hidden) return hidden;
  const limited = checkRateLimit(`promo-video:${businessId}`, RATE_LIMITS.write);
  if (!limited.allowed) return fail('Too many video uploads. Wait and try again.');
  const owned = await ownPromotionOrder(businessId, orderId);
  if (owned.error || !owned.row || !owned.supabase) return fail(owned.error || 'That promotion was not found.');
  const row = owned.row;
  const supabase = owned.supabase;
  if (!file || file.size < 1) return fail(`Choose a promotional video. ${VIDEO_RULES}`);
  if (file.size > VIDEO_MAX) return fail(`This video is larger than 60 MB. ${VIDEO_RULES}`);
  if (!/^video\/(mp4|quicktime)$/.test(file.type)) return fail(`This file is not an MP4 or MOV. ${VIDEO_RULES}`);
  const uploaded = await uploadPrivateFile(file, 'video', VIDEO_FOLDER);
  if (!uploaded.success) return uploaded;
  const problem = describeVideo({
    duration: uploaded.duration,
    width: uploaded.width,
    height: uploaded.height,
    bytes: file.size,
    format: uploaded.asset.format || (file.type === 'video/quicktime' ? 'mov' : 'mp4'),
  });
  if (problem) {
    await destroyPrivateAsset(uploaded.asset);
    return fail(problem);
  }
  const duration = Number(uploaded.duration);
  const width = Number(uploaded.width);
  const height = Number(uploaded.height);
  const previous = row.video_public_id
    ? { publicId: String(row.video_public_id), resource: 'video' as const, format: String(row.video_format || '') }
    : null;
  const { error } = await supabase.from('promotion_orders').update({
    video_url: null,
    video_public_id: uploaded.asset.publicId,
    video_format: uploaded.asset.format,
    video_duration_sec: duration,
    video_width: width,
    video_height: height,
    ad_review_status: 'pending',
    ad_review_reason: null,
    ad_reviewed_at: null,
    updated_at: new Date().toISOString(),
  }).eq('id', orderId).eq('business_id', businessId);
  if (error) {
    await destroyPrivateAsset(uploaded.asset);
    return fail('The video could not be saved.');
  }
  if (previous && previous.publicId !== uploaded.asset.publicId) await destroyPrivateAsset(previous);
  await audit({ orderId, businessId, action: 'ad_sent_for_review', to: 'pending' });
  return { success: true, orderId };
}

export async function startPromotionPayment(businessId: string, orderId: string) {
  const hidden = await requireEnabled();
  if (hidden) return hidden;
  const limited = checkRateLimit(`promo-pay:${businessId}`, RATE_LIMITS.payment);
  if (!limited.allowed) return fail('Too many payment attempts. Wait and try again.');
  const supabase = db();
  if (!supabase) return fail('Payment is not available right now.');
  const { data: order } = await supabase.from('promotion_orders').select('*').eq('id', orderId).eq('business_id', businessId).maybeSingle();
  if (!order) return fail('That promotion was not found.');
  const row = order as Record<string, unknown>;
  if (row.payment_status === 'paid') return fail('This promotion is already paid.');
  if (!row.video_public_id && !(typeof row.video_url === 'string' && row.video_url.startsWith('https://'))) {
    return fail('Upload the promotional video before paying.');
  }
  const review = adReviewStatus(row);
  if (review !== 'approved') {
    return fail(review === 'denied'
      ? 'This ad needs a change before payment.'
      : 'FinderB checks this ad before payment.');
  }
  const verification = await latestVerification(businessId);
  if (String(verification?.status) !== 'approved') return fail('Business verification is no longer approved.');
  const amount = Number(row.amount_inr) || 0;
  const created = await createRazorpayAmountOrder({
    amountPaise: amount * 100,
    receipt: `promo_${orderId}`,
    notes: { purpose: 'promotion', businessId, orderId, packageId: String(row.package_id || '') },
  });
  if (!created.success) return created;
  const { error } = await supabase.from('promotion_orders').update({
    razorpay_order_id: created.order.id,
    updated_at: new Date().toISOString(),
  }).eq('id', orderId).eq('business_id', businessId).eq('payment_status', 'pending');
  if (error) return fail('Payment could not be started.');
  const { data: business } = await supabase
    .from('Business')
    .select('businessName, fullName, workEmail, email, mobile')
    .eq('id', businessId)
    .maybeSingle();
  const biz = (business || {}) as Record<string, unknown>;
  return {
    success: true as const,
    checkoutMode: 'order' as const,
    order: created.order,
    keyId: created.keyId,
    orderId,
    business: {
      businessName: String(biz.businessName || ''),
      fullName: String(biz.fullName || ''),
      email: String(biz.workEmail || biz.email || ''),
      mobile: String(biz.mobile || ''),
    },
  };
}

export async function confirmPromotionPayment(input: {
  businessId?: string;
  orderId: string;
  razorpayOrderId: string;
  paymentId: string;
  signature?: string;
  source: 'client' | 'webhook';
  amountPaise?: number;
}): Promise<Ok<{ alreadyCompleted: boolean; orderId: string }> | Fail> {
  if (input.source === 'client') {
    if (!input.signature || !verifyRazorpayPaymentSignature({
      orderId: input.razorpayOrderId,
      paymentId: input.paymentId,
      signature: input.signature,
    })) {
      return fail('Payment could not be verified.');
    }
  }
  const supabase = db();
  if (!supabase) return fail('Payment could not be recorded.');
  const { data: existingPayment } = await supabase
    .from('promotion_orders')
    .select('id, business_id')
    .eq('razorpay_payment_id', input.paymentId)
    .maybeSingle();
  if (existingPayment) {
    const paid = existingPayment as { id: string; business_id: string };
    if (input.businessId && paid.business_id !== input.businessId) return fail('This payment is already used.');
    return { success: true, alreadyCompleted: true, orderId: paid.id };
  }
  let query = supabase.from('promotion_orders').select('*').eq('razorpay_order_id', input.razorpayOrderId);
  if (input.orderId) query = query.eq('id', input.orderId);
  const { data } = await query.maybeSingle();
  if (!data) return fail('The promotion order for this payment was not found.');
  const row = data as Record<string, unknown>;
  if (input.businessId && String(row.business_id) !== input.businessId) return fail('This payment does not belong to your business.');
  if (row.payment_status === 'paid') return { success: true, alreadyCompleted: true, orderId: String(row.id) };
  if (adReviewStatus(row) !== 'approved') return fail('FinderB checks this ad before payment.');
  const expectedPaise = Number(row.amount_inr) * 100;
  if (input.amountPaise != null && input.amountPaise !== expectedPaise) {
    return fail('Payment amount does not match this promotion.');
  }
  if (input.source === 'client' && expectedPaise < 100) return fail('This order amount is not payable.');
  const now = new Date().toISOString();
  const { error } = await supabase.from('promotion_orders').update({
    payment_status: 'paid',
    campaign_status: 'payment_successful',
    razorpay_payment_id: input.paymentId,
    updated_at: now,
  }).eq('id', row.id).eq('payment_status', 'pending');
  if (error) {
    const { data: raced } = await supabase.from('promotion_orders').select('id, payment_status').eq('id', row.id).maybeSingle();
    if (raced && (raced as { payment_status?: string }).payment_status === 'paid') {
      return { success: true, alreadyCompleted: true, orderId: String(row.id) };
    }
    return fail('Payment could not be recorded.');
  }
  await audit({
    orderId: String(row.id),
    businessId: String(row.business_id),
    action: 'payment_verified',
    from: 'payment_pending',
    to: 'payment_successful',
    note: input.source,
  });
  const snapshot = (row.package_snapshot || {}) as { name?: string; audience?: string; content?: string };
  const { data: business } = await supabase
    .from('Business')
    .select('businessName, workEmail, email')
    .eq('id', String(row.business_id))
    .maybeSingle();
  const biz = (business || {}) as Record<string, unknown>;
  const { sendPromotionPaidEmails } = await import('@/lib/email/sendPromotionPaidEmail');
  await sendPromotionPaidEmails({
    merchantEmail: String(biz.workEmail || biz.email || ''),
    businessName: String(biz.businessName || ''),
    orderId: String(row.id),
    packageName: String(snapshot.name || row.package_id || 'promotion'),
    amountInr: Number(row.amount_inr) || 0,
    area: String(row.target_area || ''),
    pincode: String(row.target_pincode || ''),
    audience: snapshot.audience || '',
    content: snapshot.content || '',
  });
  return { success: true, alreadyCompleted: false, orderId: String(row.id) };
}

export { canMoveCampaign };
