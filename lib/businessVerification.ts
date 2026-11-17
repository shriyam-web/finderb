/** Listing visibility — admin approval for appearing on FinderB search & public URLs. */
export function isListingLive(status?: string | null): boolean {
  return (status || '').trim().toLowerCase() === 'active';
}

export function getListingStatusLabel(status?: string | null): string {
  const normalized = (status || 'Pending').trim().toLowerCase();
  if (normalized === 'active') return 'Live on FinderB';
  if (normalized === 'pending') return 'Pending admin review';
  if (normalized === 'rejected') return 'Listing rejected';
  if (normalized === 'inactive') return 'Listing inactive';
  return status || 'Pending admin review';
}

/** Identity KYC — separate from listing approval. Set by a matching PAN or Udyam check. */
export function isKycVerified(kycStatus?: string | null): boolean {
  const status = (kycStatus || 'pending').toLowerCase();
  return status === 'approved' || status === 'verified';
}

export function isKycInReview(kycStatus?: string | null): boolean {
  return (kycStatus || '').toLowerCase() === 'submitted';
}

/**
 * Public trust badge (profile tick / “FinderB Verified”).
 * Must NOT use admin listing approval (`isVerified` or `status`).
 */
export function hasPublicTrustBadge(business: {
  isFinderBVerified?: boolean | null;
  hasVerifiedBadge?: boolean | null;
}): boolean {
  return Boolean(business.isFinderBVerified || business.hasVerifiedBadge);
}

export const KYC_OUTSOURCED_MESSAGE =
  'Verify this business with the owner PAN or the Udyam registration number. The name must match the listing. GSTIN is optional and can be added later.';
