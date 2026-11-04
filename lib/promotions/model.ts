export const VERIFICATION_STATUSES = [
  'not_submitted',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'resubmission_required',
] as const;

export const CAMPAIGN_STATUSES = [
  'payment_pending',
  'payment_successful',
  'under_review',
  'editing',
  'video_ready',
  'ad_active',
  'completed',
  'rejected',
  'cancelled',
  'refund_pending',
  'refunded',
] as const;

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const DOCUMENT_TYPES = [
  { id: 'gst', label: 'GST Certificate' },
  { id: 'udyam', label: 'Udyam Certificate' },
  { id: 'shop_license', label: 'Shop License' },
  { id: 'aadhaar_pan_bill', label: 'Aadhaar or PAN with a recent electricity bill' },
] as const;

export const DECLARATION =
  'I certify that my shop and services are genuine. I understand that I am personally and legally responsible for financial transactions or advance payments made with customers. FinderB is a business discovery platform.';

export const CAMPAIGN_LABEL: Record<CampaignStatus, string> = {
  payment_pending: 'Payment pending',
  payment_successful: 'Payment successful',
  under_review: 'Under review',
  editing: 'Editing',
  video_ready: 'Video ready',
  ad_active: 'Ad active',
  completed: 'Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  refund_pending: 'Refund pending',
  refunded: 'Refunded',
};

const FORWARD: Record<string, CampaignStatus[]> = {
  payment_successful: ['under_review', 'rejected', 'cancelled', 'refund_pending'],
  under_review: ['editing', 'video_ready', 'rejected', 'cancelled', 'refund_pending'],
  editing: ['video_ready', 'under_review', 'rejected'],
  video_ready: ['ad_active', 'editing', 'rejected'],
  ad_active: ['completed'],
  refund_pending: ['refunded', 'cancelled'],
};

export function canMoveCampaign(from: string, to: string): boolean {
  if (from === to) return true;
  return (FORWARD[from] || []).includes(to as CampaignStatus);
}

export function discountPercent(price: number, reference: number): number {
  if (reference <= price || reference <= 0) return 0;
  return Math.round(((reference - price) / reference) * 100);
}

export function inr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

/** India bounding box. Rejects 0,0 and coordinates outside the country FinderB serves. */
export function validIndiaCoordinate(latitude: number, longitude: number): boolean {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  if (Math.abs(latitude) < 0.01 && Math.abs(longitude) < 0.01) return false;
  return latitude >= 6.5 && latitude <= 37.2 && longitude >= 68.1 && longitude <= 97.5;
}

export function validPincode(value: string): boolean {
  return /^[1-9][0-9]{5}$/.test(value.trim());
}
